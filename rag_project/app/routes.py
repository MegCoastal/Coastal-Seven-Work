from fastapi import APIRouter
from fastapi import UploadFile
from fastapi import File

import os

from app.pdf_utils import (
    extract_text,
    chunk_text
)

from app.vector_store import (
    add_chunks
)

from app.rag import (
    ask_rag
)

router = APIRouter()

UPLOAD_DIR = "uploads"

os.makedirs(
    UPLOAD_DIR,
    exist_ok=True
)


@router.get("/")
def home():
    return {
        "message":
        "Academic Research Assistant Running"
    }


@router.post("/upload")
async def upload_pdf(
    file: UploadFile = File(...)
):

    file_path = os.path.join(
        UPLOAD_DIR,
        file.filename
    )

    with open(
        file_path,
        "wb"
    ) as f:

        f.write(
            await file.read()
        )

    text = extract_text(
        file_path
    )

    chunks = chunk_text(
        text
    )

    add_chunks(
        chunks
    )

    return {
        "filename": file.filename,
        "chunks": len(chunks)
    }


@router.post("/ask")
def ask(
    question: str
):

    answer = ask_rag(
        question
    )

    return {
        "question": question,
        "answer": answer
    }