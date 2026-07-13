from pydantic import BaseModel
from datetime import datetime

class ChatMessageResponse(BaseModel):
    id: int
    user_id: int
    sender_id: int
    message: str
    created_at: datetime

    class Config:
        from_attributes = True

class ActiveChatUser(BaseModel):
    user_id: int
    username: str
    email: str
    last_message: str | None = None
    last_message_time: datetime | None = None

    class Config:
        from_attributes = True
