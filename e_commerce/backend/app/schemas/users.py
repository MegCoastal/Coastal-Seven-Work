from pydantic import BaseModel
from pydantic import EmailStr


class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str
    is_vendor: bool = False


class UserResponse(BaseModel):
    id: int
    username: str
    email: EmailStr
    is_vendor: bool

    class Config:
        from_attributes = True

class LoginRequest(BaseModel):
    email: str
    password: str