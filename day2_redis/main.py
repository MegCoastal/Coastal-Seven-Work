import os
from dotenv import load_dotenv
import redis.asyncio as redis

load_dotenv()

REDIS_URL = os.getenv("REDIS_URL")
print("REDIS_URL =", repr(REDIS_URL))
redis_client = redis.from_url(
    REDIS_URL,
    decode_responses=True
)

import json

async def get_products():
    key = "products:all"

    cached = await redis_client.get(key)

    if cached:
        return {"source": "cache", "data": json.loads(cached)}

    # simulate DB call
    products = [
        {"id": 1, "name": "Phone"},
        {"id": 2, "name": "Laptop"}
    ]

    await redis_client.set(
        key,
        json.dumps(products),
        ex=60)

    return {"source": "db", "data": products}

import asyncio

async def main():
    result = await get_products()
    print(REDIS_URL)
    print(result)

if __name__ == "__main__":
    asyncio.run(main())