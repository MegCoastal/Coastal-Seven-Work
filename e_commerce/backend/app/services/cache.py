import redis.asyncio as aioredis
import hashlib
import json
from app.config import settings

# Initialize asynchronous Redis client
redis_client = aioredis.from_url(settings.REDIS_URL, decode_responses=True)

def generate_cache_key(prefix: str, payload_dict: dict) -> str:
    """
    Generates a unique, stable cache key by hashing the sorted JSON representation of the payload.
    """
    serialized = json.dumps(payload_dict, sort_keys=True)
    hash_val = hashlib.sha256(serialized.encode("utf-8")).hexdigest()
    return f"{prefix}:{hash_val}"
