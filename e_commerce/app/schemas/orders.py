from pydantic import BaseModel

class OrderItemResponse(BaseModel):
    id: int
    order_id: int
    product_id: int
    quantity: int
    price: float
    product_name: str | None = None

    class Config:
        from_attributes = True

class OrderResponse(BaseModel):
    id: int
    user_id: int
    total_amount: float
    status: str
    shipping_address: str | None = None
    shipping_phone: str | None = None
    payment_method: str | None = None

    class Config:
        from_attributes = True

class OrderDetailResponse(BaseModel):
    id: int
    user_id: int
    total_amount: float
    status: str
    shipping_address: str | None = None
    shipping_phone: str | None = None
    payment_method: str | None = None
    items: list[OrderItemResponse]

    class Config:
        from_attributes = True

class OrderStatusUpdate(BaseModel):
    status: str

class CheckoutRequest(BaseModel):
    shipping_address: str
    shipping_phone: str
    payment_method: str
