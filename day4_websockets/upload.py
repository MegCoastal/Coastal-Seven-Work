from fastapi import FastAPI, UploadFile, File

app = FastAPI()

@app.post("/upload")
async def upload(file: UploadFile = File(...)):
    content = await file.read()
    
    with open(f"uploads/{file.filename}", "wb") as f:
        f.write(content)

    return {"filename": file.filename}