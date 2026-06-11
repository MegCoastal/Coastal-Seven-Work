import time

async def is_allowed(user_id):
    key = f"rate:{user_id}"
    now = int(time.time())

    window = 60
    limit = 5

    await redis_client.zadd(key, {now: now})

    await redis_client.zremrangebyscore(key, 0, now - window)

    count = await redis_client.zcard(key)

    await redis_client.expire(key, window)

    return count <= limit