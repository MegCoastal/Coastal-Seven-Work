import httpx
import json
import logging
import math
import asyncio
from sqlalchemy.orm import Session

from app.config import settings
from app.models.products import Product
from app.models.product_embeddings import ProductEmbedding

logger = logging.getLogger(__name__)

# Standard cosine similarity calculation in pure python
def cosine_similarity(v1, v2):
    if len(v1) != len(v2):
        return 0.0
    dot_product = sum(a * b for a, b in zip(v1, v2))
    norm_a = math.sqrt(sum(a * a for a in v1))
    norm_b = math.sqrt(sum(b * b for b in v2))
    if not norm_a or not norm_b:
        return 0.0
    return dot_product / (norm_a * norm_b)

# Fallback: Deterministic mock vector generation if Hugging Face token is not set
def generate_mock_vector(text: str, dimensions=384) -> list[float]:
    import hashlib
    vector = []
    # Seed hashing to generate stable mock numbers
    seed = int(hashlib.md5(text.encode('utf-8')).hexdigest(), 16)
    for i in range(dimensions):
        # Generate floating points between -1.0 and 1.0
        seed = (seed * 1103515245 + 12345) & 0xffffffff
        val = (seed / 4294967295.0) * 2.0 - 1.0
        vector.append(val)
        
    # Normalize mock vector
    norm = math.sqrt(sum(x * x for x in vector))
    if norm:
        vector = [x / norm for x in vector]
    return vector

# Fetch vector embedding from Hugging Face Inference API
async def get_embedding(text: str) -> list[float]:
    if not settings.HF_API_KEY or settings.HF_API_KEY == "your_huggingface_key_here":
        logger.warning("HF_API_KEY is not configured. Falling back to mock vector index.")
        return generate_mock_vector(text)

    url = "https://api-inference.huggingface.co/models/sentence-transformers/all-MiniLM-L6-v2"
    headers = {"Authorization": f"Bearer {settings.HF_API_KEY}"}

    # Retry pipeline for serverless loading (model spin-ups)
    for attempt in range(3):
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(url, headers=headers, json={"inputs": text})
                if response.status_code == 200:
                    result = response.json()
                    # Hugging Face can return a list or list of lists
                    if isinstance(result, list):
                        if isinstance(result[0], list):
                            return result[0]
                        return result
                    raise Exception(f"Unexpected response format: {result}")
                elif response.status_code == 503:
                    # Model is loading - wait and retry
                    logger.info(f"Hugging Face model is loading. Retrying in 5 seconds...")
                    await asyncio.sleep(5)
                else:
                    logger.error(f"HF Error status {response.status_code}: {response.text}")
                    break
        except Exception as e:
            logger.warning(f"Error calling Hugging Face Inference API: {e}")
            if attempt == 2:
                break
            await asyncio.sleep(2)

    logger.warning("Hugging Face API failed. Falling back to mock vector generator.")
    return generate_mock_vector(text)

# Re-index all database products into embeddings table
async def index_all_products(db: Session):
    logger.info("Initializing vector indexing for products...")
    products = db.query(Product).all()
    
    indexed_count = 0
    for p in products:
        # Build text description payload for semantic matching
        text_payload = f"Category: {p.category}. Product: {p.name}. Description: {p.description or ''}"
        vector = await get_embedding(text_payload)
        
        # Check if embedding already exists
        existing = db.query(ProductEmbedding).filter(ProductEmbedding.product_id == p.id).first()
        if existing:
            existing.vector = json.dumps(vector)
        else:
            new_embedding = ProductEmbedding(
                product_id=p.id,
                vector=json.dumps(vector)
            )
            db.add(new_embedding)
            
        indexed_count += 1
        
    db.commit()
    logger.info(f"Indexing complete! Indexed {indexed_count} products.")

# Semantic Similarity Product Search
async def search_similar_products(query: str, db: Session, k=3) -> list[tuple[Product, float]]:
    if not query.strip():
        return []

    # Check if we should use local text overlap matching (no HF API configured)
    is_hf_configured = settings.HF_API_KEY and settings.HF_API_KEY != "your_huggingface_key_here"
    
    if not is_hf_configured:
        logger.warning("HF_API_KEY is not configured. Using high-quality local text matching fallback.")
        query_words = set(query.lower().split())
        if not query_words:
            return []
            
        products = db.query(Product).all()
        scored_products = []
        for p in products:
            doc_text = f"{p.name} {p.category} {p.description or ''}".lower()
            # Calculate intersection
            matches = sum(1 for word in query_words if word in doc_text)
            
            # Boost if any query word appears in the product name
            title_boost = 0.5 if any(word in p.name.lower() for word in query_words) else 0.0
            
            score = (matches / len(query_words)) + title_boost
            if score > 0:
                scored_products.append((p, score))
                
        scored_products.sort(key=lambda x: x[1], reverse=True)
        return scored_products[:k]

    # Standard high-dimensional vector search
    query_vector = await get_embedding(query)
    embeddings = db.query(ProductEmbedding).all()
    
    scored_products = []
    for emb in embeddings:
        product = db.query(Product).filter(Product.id == emb.product_id).first()
        if not product:
            continue
            
        try:
            prod_vector = json.loads(emb.vector)
            similarity = cosine_similarity(query_vector, prod_vector)
            scored_products.append((product, similarity))
        except Exception as e:
            logger.error(f"Failed calculating cosine similarity for product {emb.product_id}: {e}")
            
    # Sort descending by similarity
    scored_products.sort(key=lambda x: x[1], reverse=True)
    return scored_products[:k]
