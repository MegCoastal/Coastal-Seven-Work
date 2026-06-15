from fastapi import FastAPI

from app.database import Base
from app.database import engine

from app.models.products import Product
from app.models.users import User
from app.models.cart import CartItem
from app.models.orders import Order
from app.models.order_items import OrderItem

from app.api.products import router as product_router
from app.api.users import router as user_router
from app.api.cart import router as cart_router
from app.api.orders import router as order_router




Base.metadata.create_all(bind=engine)

app = FastAPI()

app.include_router(product_router)
app.include_router(user_router)
app.include_router(cart_router)
app.include_router(order_router)


@app.get("/")
def home():
    return {
        "message": "E-Commerce API"
    }