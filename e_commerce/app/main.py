from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.staticfiles import StaticFiles
from jose import jwt, JWTError
import os
import json

from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from app.limiter import limiter

from app.database import Base, engine, SessionLocal
from app.models.products import Product
from app.models.users import User
from app.models.orders import Order
from app.models.order_items import OrderItem
from app.models.chat import ChatMessage
from app.models.product_embeddings import ProductEmbedding
from app.models.reviews import Review
from app.config import settings
from app.websocket import manager, chat_manager

from app.api.products import router as product_router
from app.api.users import router as user_router
from app.api.cart import router as cart_router
from app.api.orders import router as order_router
from app.api.chat import router as chat_router
from app.api.rag import router as rag_router
from app.api.reviews import router as reviews_router

# Autocreate DB tables
Base.metadata.create_all(bind=engine)

app = FastAPI()
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Response Compression
app.add_middleware(GZipMiddleware, minimum_size=1000)

# Mount Static Uploads directory
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
app.mount("/static", StaticFiles(directory="static"), name="static")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(product_router)
app.include_router(user_router)
app.include_router(cart_router)
app.include_router(order_router)
app.include_router(chat_router)
app.include_router(rag_router)
app.include_router(reviews_router)

@app.get("/")
def home():
    return {
        "message": "E-Commerce API"
    }

@app.websocket("/ws/orders")
async def websocket_orders_endpoint(
    websocket: WebSocket,
    token: str = Query(...)
):
    try:
        # Authenticate client via JWT
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        email = payload.get("sub")
        if not email:
            await websocket.close(code=1008)
            return

        db = SessionLocal()
        user = db.query(User).filter(User.email == email).first()
        db.close()

        if not user:
            await websocket.close(code=1008)
            return

        user_id = user.id
    except JWTError:
        await websocket.close(code=1008)
        return

    await manager.connect(user_id, websocket)
    try:
        while True:
            # Keep socket connection open
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(user_id, websocket)


@app.websocket("/ws/chat")
async def websocket_chat_endpoint(
    websocket: WebSocket,
    token: str = Query(...)
):
    try:
        # Authenticate client
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        email = payload.get("sub")
        if not email:
            await websocket.close(code=1008)
            return

        db = SessionLocal()
        user = db.query(User).filter(User.email == email).first()
        db.close()

        if not user:
            await websocket.close(code=1008)
            return

        user_id = user.id
        is_admin = user.is_admin
    except JWTError:
        await websocket.close(code=1008)
        return

    if is_admin:
        await chat_manager.connect_admin(websocket)
    else:
        await chat_manager.connect_user(user_id, websocket)

    try:
        while True:
            # Receive JSON payload from client
            # Expected format: {"message": "hello"} (customer) or {"message": "hi", "target_user_id": X} (admin)
            data = await websocket.receive_json()
            message_text = data.get("message")
            
            if not message_text:
                continue

            db = SessionLocal()
            
            if is_admin:
                target_user_id = data.get("target_user_id")
                if not target_user_id:
                    db.close()
                    continue
                # Chat thread belongs to target customer, sender is admin
                chat_msg = ChatMessage(
                    user_id=target_user_id,
                    sender_id=user_id,
                    message=message_text
                )
            else:
                # Chat thread belongs to customer, sender is customer
                chat_msg = ChatMessage(
                    user_id=user_id,
                    sender_id=user_id,
                    message=message_text
                )

            db.add(chat_msg)
            db.commit()
            db.refresh(chat_msg)

            # Build serializable payload
            payload_data = {
                "id": chat_msg.id,
                "user_id": chat_msg.user_id,
                "sender_id": chat_msg.sender_id,
                "message": chat_msg.message,
                "created_at": chat_msg.created_at.isoformat()
            }
            db.close()

            # Route message to customer AND all admins
            await chat_manager.broadcast_to_user(chat_msg.user_id, payload_data)
            await chat_manager.broadcast_to_admins(payload_data)

    except WebSocketDisconnect:
        if is_admin:
            chat_manager.disconnect_admin(websocket)
        else:
            chat_manager.disconnect_user(user_id, websocket)