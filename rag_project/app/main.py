from fastapi import FastAPI
from app.routes import router

app = FastAPI(
    title="Academic Research Assistant"
)

app.include_router(router)