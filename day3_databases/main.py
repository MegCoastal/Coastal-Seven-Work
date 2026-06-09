from fastapi import FastAPI
from fastapi import Depends
from fastapi import HTTPException

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from database import engine
from database import SessionLocal

from models import Base
from models import User

from schemas import UserCreate
from schemas import UserResponse
from schemas import UserUpdate

from dependency import get_db


app = FastAPI()

@app.on_event("startup")
async def startup():

    async with engine.begin() as conn:
        await conn.run_sync(
            Base.metadata.create_all
        )

@app.post(
    "/users",
    response_model = UserResponse
)
async def create_user(
    user: UserCreate,
    db: AsyncSession = Depends(get_db)
):
    
    new_user = User(
        name = user.name,
        email=user.email
    )

    db.add(new_user)

    await db.commit()

    await db.refresh(new_user)

    return new_user

@app.get(
    "/users",
    response_model=list[UserResponse]
)
async def get_users(
    db: AsyncSession = Depends(get_db)
):

    result = await db.execute(
        select(User)
    )

    users = result.scalars().all()

    return users

@app.get(
    "/users/{user_id}",
    response_model=UserResponse
)
async def get_user(
    user_id: int,
    db: AsyncSession = Depends(get_db)
):

    result = await db.execute(
        select(User).where(
            User.id == user_id
        )
    )

    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    return user

@app.put(
    "/users/{user_id}",
    response_model=UserResponse
)
async def update_user(
    user_id: int,
    updated_user: UserUpdate,
    db: AsyncSession = Depends(get_db)
):

    result = await db.execute(
        select(User).where(
            User.id == user_id
        )
    )

    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    user.name = updated_user.name
    user.email = updated_user.email

    await db.commit()

    await db.refresh(user)

    return user

@app.delete(
    "/users/{user_id}"
)
async def delete_user(
    user_id: int,
    db: AsyncSession = Depends(get_db)
):

    result = await db.execute(
        select(User).where(
            User.id == user_id
        )
    )

    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    await db.delete(user)

    await db.commit()

    return {
        "message": "User deleted"
    }



