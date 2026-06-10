import asyncio

async def api1():
    await asyncio.sleep(2)

async def api2():
    await asyncio.sleep(2)

async def main():
    await api1()
    await api2()

asyncio.run(main())