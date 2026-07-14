from sqlalchemy.orm import DeclarativeBase

class Base(DeclarativeBase):
    pass

class User(Base):

    __tablename__ = "users"

    id: Mapped[int] = mapped_column(
        primary_key=True
    )

    name: Mapped[str]

#Async operations

#Engine

from sqlalchemy.ext.asyncio import (
    create_async_engine
)

engine = create_async_engine(
    DATABASE_URL
)

#Session

from sqlalchemy.ext.asyncio import (
    AsyncSession
)



