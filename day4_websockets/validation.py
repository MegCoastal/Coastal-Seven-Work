@app.post("/upload")
async def upload(file: UploadFile = File(...)):
    if file.content_type not in ["image/jpeg", "image/png"]:
        return {"error": "Invalid file type"}

    content = await file.read()

    if len(content) > 2 * 1024 * 1024:
        return {"error": "File too large"}

    return {"size": len(content)}