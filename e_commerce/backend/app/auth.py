import bcrypt

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))
    except Exception:
        return False

from jose import jwt
from datetime import datetime, timedelta

from app.config import settings

SECRET_KEY = settings.SECRET_KEY
ALGORITHM = settings.ALGORITHM
ACCESS_TOKEN_EXPIRE_MINUTES = settings.ACCESS_TOKEN_EXPIRE_MINUTES

def create_access_token(data: dict):
    
    to_encode = data.copy()

    expire = datetime.utcnow() + timedelta(
        minutes=ACCESS_TOKEN_EXPIRE_MINUTES
    )

    to_encode.update(
        {"exp": expire}
    )

    return jwt.encode(
        to_encode,
        SECRET_KEY,
        algorithm=ALGORITHM
    )

from fastapi.security import OAuth2PasswordBearer

oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl="/users/login"
)

from jose import JWTError
from fastapi import HTTPException
from fastapi import status
from fastapi import Depends

def verify_token(token: str):

    try:

        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM]
        )

        email = payload.get("sub")

        if email is None:
            raise HTTPException(
                status_code=401,
                detail="Invalid token"
            )

        return email

    except JWTError:

        raise HTTPException(
            status_code=401,
            detail="Invalid token"
        )
    
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.users import User

def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
):

    email = verify_token(token)

    user = (
        db.query(User)
        .filter(User.email == email)
        .first()
    )

    if not user:
        raise HTTPException(
            status_code=401,
            detail="User not found"
        )

    return user

from app.models.users import User
from fastapi import HTTPException


def get_current_admin_user(
    current_user: User = Depends(
        get_current_user
    )
):

    if not current_user.is_admin:

        raise HTTPException(
            status_code=403,
            detail="Admin access required"
        )

    return current_user


def get_current_vendor_or_admin_user(
    current_user: User = Depends(get_current_user)
):
    if not (current_user.is_admin or current_user.is_vendor):
        raise HTTPException(
            status_code=403,
            detail="Vendor or Admin access required"
        )
    return current_user