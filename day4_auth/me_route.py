from fastapi import FastAPI, Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
from jose import jwt

from hashing import (
    hash_password,
    verify_password
)

app = FastAPI()

SECRET_KEY = "mysecretkey"
ALGORITHM = "HS256"

oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl="login"
)

fake_users = {
    "john": {
        "id": 1,
        "username": "john",
        "hashed_password": hash_password("1234"),
        "role": "user"
    },
    "admin": {
        "id": 2,
        "username": "admin",
        "hashed_password": hash_password("admin123"),
        "role": "admin"
    }
}


def create_access_token(data: dict):
    return jwt.encode(
        data,
        SECRET_KEY,
        algorithm=ALGORITHM
    )


def get_current_user(
    token: str = Depends(oauth2_scheme)
):
    try:
        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM]
        )

        user_id = payload.get("sub")

        if user_id is None:
            raise HTTPException(
                status_code=401,
                detail="Invalid token"
            )

        return payload

    except Exception:
        raise HTTPException(
            status_code=401,
            detail="Invalid token"
        )


@app.post("/login")
def login(
    username: str,
    password: str
):
    user = fake_users.get(username)

    if not user:
        raise HTTPException(
            status_code=401,
            detail="Invalid username"
        )

    if not verify_password(
        password,
        user["hashed_password"]
    ):
        raise HTTPException(
            status_code=401,
            detail="Invalid password"
        )

    token = create_access_token(
        {
            "sub": str(user["id"]),
            "role": user["role"]
        }
    )

    return {
        "access_token": token,
        "token_type": "bearer"
    }


@app.get("/me")
def me(
    current_user=Depends(get_current_user)
):
    return current_user