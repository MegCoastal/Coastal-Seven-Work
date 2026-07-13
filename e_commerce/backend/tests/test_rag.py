import pytest
import json
from unittest.mock import AsyncMock, patch, MagicMock
from fastapi import status
from app.models.users import User
from app.auth import create_access_token
from app.services.cache import generate_cache_key

# Helper to mock stream chunks
class MockDelta:
    def __init__(self, content):
        self.content = content

class MockChoice:
    def __init__(self, content):
        self.delta = MockDelta(content)

class MockChunk:
    def __init__(self, content):
        self.choices = [MockChoice(content)]

class MockStream:
    def __init__(self, chunks):
        self.chunks = chunks
        self.idx = 0

    def __aiter__(self):
        return self

    async def __anext__(self):
        if self.idx < len(self.chunks):
            chunk = MockChunk(self.chunks[self.idx])
            self.idx += 1
            return chunk
        raise StopAsyncIteration

@pytest.fixture
def auth_headers(db_session):
    # Ensure test user exists in DB
    user = db_session.query(User).filter(User.email == "test_rag_user@example.com").first()
    if not user:
        user = User(
            username="rag_tester",
            email="test_rag_user@example.com",
            hashed_password="fake_hashed_password_string",
            is_admin=False
        )
        db_session.add(user)
        db_session.commit()
        db_session.refresh(user)
    
    token = create_access_token({"sub": user.email})
    return {"Authorization": f"Bearer {token}"}

@pytest.mark.asyncio
async def test_rag_chat_success(client, auth_headers):
    """
    Test success path for /ai/rag/chat. Mocks semantic retrieval and OpenAI.
    """
    from app.models.products import Product
    mock_product = Product(id=101, name="Test Surfboard", price=12000.0, category="Surfboards", description="A cool board")
    mock_retrieved_items = [(mock_product, 0.95)]

    mock_chunks = ["RAG", " ", "response"]
    mock_stream = MockStream(mock_chunks)

    with patch("app.api.rag.search_similar_products", new_callable=AsyncMock) as mock_retrieval, \
         patch("app.api.rag.AsyncOpenAI") as mock_openai_class, \
         patch("app.api.rag.redis_client", new_callable=AsyncMock) as mock_redis:

        mock_retrieval.return_value = mock_retrieved_items
        mock_redis.get.return_value = None
        
        mock_client = MagicMock()
        mock_completions = AsyncMock()
        mock_completions.create.return_value = mock_stream
        mock_client.chat.completions = mock_completions
        mock_openai_class.return_value = mock_client

        response = await client.post(
            "/ai/rag/chat",
            json={"messages": [{"role": "user", "content": "surfboard recommendations"}]},
            headers=auth_headers
        )

        assert response.status_code == status.HTTP_200_OK
        
        # Parse citations chunk and text chunk
        body_text = response.text
        lines = [line for line in body_text.split("\n") if line.startswith("data: ")]
        
        citations_data = None
        parsed_tokens = []
        for line in lines:
            data = json.loads(line[6:])
            if "citations" in data:
                citations_data = data["citations"]
            if "text" in data:
                parsed_tokens.append(data["text"])

        assert citations_data is not None
        assert citations_data[0]["name"] == "Test Surfboard"
        assert "".join(parsed_tokens) == "RAG response"

@pytest.mark.asyncio
async def test_rag_chat_cache_hit(client, auth_headers):
    """
    Test cached RAG chat path. Ensures cached RAG response payload (with citations and text)
    is served immediately from Redis without hitting the DB or LLM.
    """
    cached_payload = {
        "citations": [{"id": 102, "name": "Cached Board", "price": 9999.0, "category": "Surfboards", "description": ""}],
        "text": "Cached RAG response"
    }

    with patch("app.api.rag.redis_client", new_callable=AsyncMock) as mock_redis, \
         patch("app.api.rag.AsyncOpenAI", side_effect=Exception("Should not be called!")):

        mock_redis.get.return_value = json.dumps(cached_payload)

        response = await client.post(
            "/ai/rag/chat",
            json={"messages": [{"role": "user", "content": "surfboard recommendations"}]},
            headers=auth_headers
        )

        assert response.status_code == status.HTTP_200_OK
        body_text = response.text
        assert "Cached Board" in body_text
        assert "Cached RAG response" in body_text

@pytest.mark.asyncio
async def test_rag_chat_provider_fallback(client, auth_headers):
    """
    Test fallback logic for /ai/rag/chat: if the primary provider fails,
    it should fall back to trying subsequent configured providers.
    """
    mock_chunks = ["Fallback", " ", "RAG", " ", "active"]
    mock_stream = MockStream(mock_chunks)

    completions_mock = AsyncMock()
    completions_mock.create.side_effect = [
        Exception("Primary LLM provider failed"), # Primary fails
        mock_stream                              # Secondary succeeds
    ]

    with patch("app.api.rag.search_similar_products", new_callable=AsyncMock) as mock_retrieval, \
         patch("app.api.rag.AsyncOpenAI") as mock_openai_class, \
         patch("app.api.rag.redis_client", new_callable=AsyncMock) as mock_redis, \
         patch("app.api.rag.settings.LLM_API_KEY", "fake_primary_key"), \
         patch("app.api.rag.settings.GEMINI_API_KEY", "fake_gemini_key"):

        mock_retrieval.return_value = []
        mock_redis.get.return_value = None
        
        mock_client = MagicMock()
        mock_client.chat.completions = completions_mock
        mock_openai_class.return_value = mock_client

        response = await client.post(
            "/ai/rag/chat",
            json={"messages": [{"role": "user", "content": "hello"}]},
            headers=auth_headers
        )

        assert response.status_code == status.HTTP_200_OK
        body_text = response.text
        lines = [line for line in body_text.split("\n") if line.startswith("data: ")]
        parsed_tokens = []
        for line in lines:
            data = json.loads(line[6:])
            if "text" in data:
                parsed_tokens.append(data["text"])
        
        assert "".join(parsed_tokens) == "Fallback RAG active"
        assert completions_mock.create.call_count >= 2

@pytest.mark.asyncio
async def test_rag_chat_rate_limit(client, auth_headers):
    """
    Test slowapi rate limiting for RAG chat.
    """
    from app.limiter import limiter
    limiter.enabled = True
    
    responses = []
    try:
        for _ in range(15):
            with patch("app.api.rag.search_similar_products", new_callable=AsyncMock) as mock_retrieval, \
                 patch("app.api.rag.AsyncOpenAI") as mock_openai_class, \
                 patch("app.api.rag.redis_client", new_callable=AsyncMock) as mock_redis:
                
                mock_retrieval.return_value = []
                mock_redis.get.return_value = None
                mock_client = MagicMock()
                mock_completions = AsyncMock()
                mock_completions.create.return_value = MockStream(["Ok"])
                mock_client.chat.completions = mock_completions
                mock_openai_class.return_value = mock_client

                res = await client.post(
                    "/ai/rag/chat",
                    json={"messages": [{"role": "user", "content": "hello"}]},
                    headers=auth_headers
                )
                responses.append(res.status_code)
    finally:
        limiter.enabled = False

    assert 429 in responses
