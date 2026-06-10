import asyncio
import time

async def fetch_users():
    await asyncio.sleep(2)

async def fetch_posts():
    await asyncio.sleep(2)

async def fetch_comments():
    await asyncio.sleep(2)

async def task1():
    await fetch_users()
    await fetch_posts()
    await fetch_comments()

async def task2():
    await asyncio.gather(
        fetch_users(),
        fetch_posts(),
        fetch_comments()
    )

async def main():
    start = time.perf_counter()
    await task1()
    print("Sequential:", time.perf_counter() - start)

    start = time.perf_counter()
    await task2()
    print("Concurrent:", time.perf_counter() - start)

asyncio.run(main())