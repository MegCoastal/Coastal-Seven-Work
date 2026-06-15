from pydantic import BaseModel


class CartCreate(BaseModel):
    product_id: int
    quantity: int


class CartResponse(BaseModel):
    id: int
    user_id: int
    product_id: int
    quantity: int

    class Config:
        from_attributes = True