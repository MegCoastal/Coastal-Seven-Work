from pydantic import BaseModel

class ProductCreate(BaseModel):
    name: str
    description: str
    price: float
    stock: int
    image_url: str | None = None
    category: str | None = None

class ProductResponse(BaseModel):
    id: int
    name: str
    description: str
    price: float
    stock: int
    image_url: str | None = None
    category: str | None = None
    vendor_id: int | None = None
    vendor_name: str | None = None

    class Config:
        from_attributes = True

class ProductUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    price: float | None = None
    stock: int | None = None
    image_url: str | None = None
    category: str | None = None