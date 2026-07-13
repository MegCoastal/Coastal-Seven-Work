from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import List
import json
import logging
import asyncio
import os
from sqlalchemy.orm import Session
from openai import AsyncOpenAI

from app.database import get_db
from app.config import settings
from app.auth import get_current_user
from app.models.users import User
from app.services.vector_store import search_similar_products
from app.limiter import limiter
from app.services.cache import redis_client, generate_cache_key

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/ai/rag",
    tags=["RAG Assistant"]
)

class MessageItem(BaseModel):
    role: str
    content: str

class RAGChatRequest(BaseModel):
    messages: List[MessageItem]

@router.post("/chat")
@limiter.limit("10/minute")
async def stream_rag_chat(
    request: Request,
    payload: RAGChatRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    payload_dict = payload.dict()
    cache_key = generate_cache_key("ai_rag_chat", payload_dict)
    
    # Check cache
    cached_data = await redis_client.get(cache_key)

    async def event_generator():
        if cached_data:
            logger.info(f"CACHE HIT for key: {cache_key}")
            try:
                parsed = json.loads(cached_data)
                # First chunk: Yield the structured product citations list
                yield f"data: {json.dumps({'citations': parsed.get('citations', [])})}\n\n"
                
                # Stream the cached response text in one chunk
                text = parsed.get("text", "")
                yield f"data: {json.dumps({'text': text})}\n\n"
                return
            except Exception as e:
                logger.error(f"Error reading cached data: {e}")

        # Retrieve the last user message to query vector database
        user_messages = [m for m in payload.messages if m.role == "user"]
        query_text = user_messages[-1].content if user_messages else ""

        # Check if query is a simple greeting
        greetings = {"hello", "hi", "hey", "aloha", "yo", "good morning", "good afternoon", "greetings"}
        is_greeting = query_text.lower().strip("?!. ") in greetings

        # Perform semantic product retrieval (Top 3 matches) if not a greeting
        retrieved_items = []
        if not is_greeting and query_text:
            retrieved_items = await search_similar_products(query_text, db, k=3)
        
        # Extract products and format context
        cited_products = []
        context_str = ""
        
        if retrieved_items:
            cited_products = [item[0] for item in retrieved_items]
            for idx, (p, score) in enumerate(retrieved_items, 1):
                context_str += (
                    f"Product {idx}: {p.name}\n"
                    f"Category: {p.category}\n"
                    f"Price: Rs.{p.price}\n"
                    f"Description: {p.description or ''}\n"
                    f"Source Citation: [Source: {p.name}]\n\n"
                )
        else:
            # Fallback catalog overview so the chatbot is always aware of store inventory
            from app.models.products import Product
            categories = [r[0] for r in db.query(Product.category).distinct().all() if r[0]]
            context_str = "Our store sells products in the following categories: " + ", ".join(categories) + ".\n"
            
            if is_greeting:
                # Do not show visual product citations for simple greetings
                cited_products = []
            else:
                # For general queries, show featured products context
                featured = db.query(Product).limit(5).all()
                cited_products = featured
                context_str += "Here are some of our popular products from our catalog:\n\n"
                for idx, p in enumerate(featured, 1):
                    context_str += (
                        f"Product {idx}: {p.name}\n"
                        f"Category: {p.category}\n"
                        f"Price: Rs.{p.price}\n"
                        f"Description: {p.description or ''}\n"
                        f"Source Citation: [Source: {p.name}]\n\n"
                    )

        # First chunk: Yield the structured product citations list to the React UI
        citations_data = [
            {
                "id": p.id,
                "name": p.name,
                "price": p.price,
                "category": p.category,
                "description": p.description
            } for p in cited_products
        ]
        yield f"data: {json.dumps({'citations': citations_data})}\n\n"

        # Providers fallback list
        providers = [
            (settings.LLM_API_KEY, settings.LLM_BASE_URL, settings.LLM_MODEL, "Primary (Configured)"),
            (settings.GEMINI_API_KEY, settings.GEMINI_BASE_URL, settings.GEMINI_MODEL, "Gemini Fallback"),
            (settings.MISTRAL_API_KEY, settings.MISTRAL_BASE_URL, settings.MISTRAL_MODEL, "Mistral Fallback")
        ]

        active_providers = []
        for api_key, base_url, model, name in providers:
            if api_key and api_key.strip() and not api_key.lower().startswith("your_"):
                active_providers.append((api_key, base_url, model, name))

        if not active_providers:
            logger.error("No LLM API keys configured or all are placeholders.")
            yield f"data: {json.dumps({'error': 'No LLM API keys configured. Please configure LLM_API_KEY or fallback keys.'})}\n\n"
            return

        logger.info(f"Active LLM providers: {[p[3] for p in active_providers]}")

        # System Prompt Setup injecting semantic retrieval context
        system_prompt = {
            "role": "system",
            "content": (
                "You are the WaveMart AI Assistant, an intelligent support assistant for our e-commerce store. "
                "You answer customer questions about our products, orders, and services. "
                "You will be provided with some retrieved context from our catalog:\n\n"
                f"{context_str}\n"
                "Instructions:\n"
                "1. Answer the query in a helpful, friendly, and conversational manner.\n"
                "2. When recommending or referencing any of the retrieved products, mention them by their names and include citations like '[Source: Product Name]'.\n"
                "3. If the user asks for more details or general questions about a product (such as how to use it, material properties, or general advice) that are not fully detailed in the retrieved context, use your own broad general knowledge to provide a comprehensive answer.\n"
                "4. You can speak generally and intelligently using your own knowledge, but do not make up fake products, prices, or store policies that are not supported by the context."
            )
        }

        formatted_messages = [system_prompt]
        for msg in payload.messages:
            formatted_messages.append({"role": msg.role, "content": msg.content})

        last_exception = None
        stream = None

        # Cycle through LLM providers
        for api_key, base_url, model, name in active_providers:
            logger.info(f"Attempting LLM stream with provider: {name} ({base_url}) using model {model}")
            for attempt in range(3):
                try:
                    client = AsyncOpenAI(api_key=api_key, base_url=base_url)
                    stream = await client.chat.completions.create(
                        model=model,
                        messages=formatted_messages,
                        stream=True,
                        max_tokens=600
                    )
                    logger.info(f"Successfully initiated stream with provider: {name}")
                    break
                except Exception as e:
                    last_exception = e
                    error_msg = str(e).lower()
                    logger.warning(f"Error on provider {name} (attempt {attempt+1}/3): {e}")
                    if "429" in error_msg or "rate limit" in error_msg or "50" in error_msg:
                        backoff = 2 ** attempt
                        logger.info(f"Retrying in {backoff} seconds...")
                        await asyncio.sleep(backoff)
                    else:
                        break
            if stream:
                break
            else:
                logger.error(f"Provider {name} failed completely. Falling back to next available provider.")

        if not stream:
            error_message = str(last_exception)
            logger.error(f"All LLM providers failed. Last exception: {error_message}")
            if "429" in error_message or "rate limit" in error_message.lower():
                error_message = "LLM rate limit reached. Please wait a moment and try again."
            else:
                error_message = f"AI Error: {error_message}"
            yield f"data: {json.dumps({'error': error_message})}\n\n"
            return

        # Stream LLM tokens
        full_response_text = ""
        try:
            async for chunk in stream:
                if chunk.choices and chunk.choices[0].delta.content:
                    text_delta = chunk.choices[0].delta.content
                    full_response_text += text_delta
                    yield f"data: {json.dumps({'text': text_delta})}\n\n"
            
            if full_response_text:
                cache_payload = {
                    "citations": citations_data,
                    "text": full_response_text
                }
                await redis_client.setex(cache_key, 3600, json.dumps(cache_payload))
        except Exception as e:
            logger.error(f"RAG Stream read error: {e}")
            yield f"data: {json.dumps({'error': f'Stream interrupted: {e}'})}\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")
