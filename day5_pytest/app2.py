from fastapi import FastAPI, HTTPException, Depends
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm

app = FastAPI()

users = {}

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

@app.post("/register")
def register(user: dict):
    username = user["username"]

    if username in users:
        raise HTTPException(
            status_code=400,
            detail="User already exists"
        )

    users[username] = user["password"]

    return {"message": "Registered successfully"}

@app.post("/login")
def login(
    form_data: OAuth2PasswordRequestForm = Depends()
):
    username = form_data.username
    password = form_data.password

    if users.get(username) != password:
        raise HTTPException(
            status_code=401,
            detail="Invalid credentials"
        )

    return {
        "access_token": username,
        "token_type": "bearer"
    }

@app.get("/profile")
def profile(token: str = Depends(oauth2_scheme)):

    if token not in users:
        raise HTTPException(
            status_code=401,
            detail="Invalid token"
        )

    return {
        "username": token
    }