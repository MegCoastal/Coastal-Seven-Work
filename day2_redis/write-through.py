async def update_product(product_id, data):
    await update_db(product_id, data)

    key = f"product:{product_id}"

    await redis_client.set(key, json.dumps(data))