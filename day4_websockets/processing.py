from PIL import Image
import io

@app.post("/resize")
async def resize(file: UploadFile = File(...)):
    image = Image.open(io.BytesIO(await file.read()))

    image = image.resize((300, 300))

    buffer = io.BytesIO()
    image.save(buffer, format="JPEG")

    return {"message": "image resized"}