from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime

from app.database import get_db
from app.auth import get_current_user, get_current_admin_user
from app.models.users import User
from app.models.chat import ChatMessage
from app.schemas.chat import ChatMessageResponse, ActiveChatUser

router = APIRouter(
    prefix="/chat",
    tags=["Chat"]
)

@router.get("/history", response_model=list[ChatMessageResponse])
def get_my_chat_history(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return (
        db.query(ChatMessage)
        .filter(ChatMessage.user_id == current_user.id)
        .order_by(ChatMessage.created_at.asc())
        .all()
    )

@router.get("/history/{user_id}", response_model=list[ChatMessageResponse])
def get_user_chat_history_admin(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    return (
        db.query(ChatMessage)
        .filter(ChatMessage.user_id == user_id)
        .order_by(ChatMessage.created_at.asc())
        .all()
    )

@router.get("/active-users", response_model=list[ActiveChatUser])
def get_active_chat_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    # Get distinct user IDs that have chats
    user_ids = db.query(ChatMessage.user_id).distinct().all()
    ids = [uid[0] for uid in user_ids]

    if not ids:
        return []

    users = db.query(User).filter(User.id.in_(ids)).all()

    active_users = []
    for user in users:
        last_msg = (
            db.query(ChatMessage)
            .filter(ChatMessage.user_id == user.id)
            .order_by(ChatMessage.created_at.desc())
            .first()
        )
        active_users.append(
            ActiveChatUser(
                user_id=user.id,
                username=user.username,
                email=user.email,
                last_message=last_msg.message if last_msg else None,
                last_message_time=last_msg.created_at if last_msg else None
            )
        )

    # Sort so users with the most recent messages appear first
    active_users.sort(
        key=lambda x: x.last_message_time or datetime.min, 
        reverse=True
    )

    return active_users
