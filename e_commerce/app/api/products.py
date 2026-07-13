from fastapi import APIRouter, Depends, HTTPException, status, File, UploadFile, Form
from sqlalchemy.orm import Session
from sqlalchemy import func
import os
import shutil
import redis
import json

from app.database import get_db
from app.models.products import Product
from app.schemas.products import ProductResponse, ProductUpdate
from app.auth import get_current_admin_user, get_current_user, get_current_vendor_or_admin_user
from app.models.users import User
from app.config import settings
from app.celery_app import generate_product_description_task

router = APIRouter(
    prefix="/products",
    tags=["Products"]
)

# Connect to Redis
redis_client = redis.from_url(settings.REDIS_URL, decode_responses=True)
CACHE_KEY = "products:all"

def invalidate_products_cache():
    try:
        redis_client.delete(CACHE_KEY)
    except Exception:
        pass  # Fail silently if Redis is down

@router.post("", response_model=ProductResponse)
def create_product(
    name: str = Form(...),
    description: str = Form(""),
    price: float = Form(...),
    stock: int = Form(...),
    category: str = Form(None),
    image: UploadFile = File(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_vendor_or_admin_user)
):
    image_url = None
    if image:
        # Create upload directory if not exists
        os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
        file_path = os.path.join(settings.UPLOAD_DIR, image.filename)
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(image.file, buffer)
        image_url = f"/static/uploads/{image.filename}"

    db_product = Product(
        name=name,
        description=description,
        price=price,
        stock=stock,
        category=category,
        image_url=image_url,
        vendor_id=current_user.id if current_user.is_vendor else None
    )

    db.add(db_product)
    db.commit()
    db.refresh(db_product)
    
    # Trigger description generation task if empty
    if not description or not description.strip():
        try:
            generate_product_description_task.delay(db_product.id)
        except Exception:
            pass

    # Invalidate cache
    invalidate_products_cache()

    return db_product

@router.post("/upload-image")
def upload_product_image(
    image: UploadFile = File(...),
    current_user: User = Depends(get_current_vendor_or_admin_user)
):
    # Create upload directory if not exists
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    file_path = os.path.join(settings.UPLOAD_DIR, image.filename)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(image.file, buffer)
    return {"image_url": f"/static/uploads/{image.filename}"}

@router.get("", response_model=list[ProductResponse])
def get_products(
    page: int = 1,
    limit: int = 40,
    search: str | None = None,
    category: str | None = None,
    min_price: float | None = None,
    max_price: float | None = None,
    vendor_id: int | None = None,
    db: Session = Depends(get_db)
):
    # Check cache if no search filters/pagination/category are applied
    is_default_query = (page == 1 and limit == 40 and search is None and category is None and min_price is None and max_price is None and vendor_id is None)
    
    if is_default_query:
        try:
            cached_data = redis_client.get(CACHE_KEY)
            if cached_data:
                return json.loads(cached_data)
        except Exception:
            pass  # Fallback to database if Redis is down

    query = db.query(Product)

    if vendor_id is not None:
        query = query.filter(Product.vendor_id == vendor_id)

    if search:
        query = query.filter(
            (func.word_similarity(search, Product.name) > 0.4) | 
            (func.word_similarity(search, Product.description) > 0.3) |
            Product.name.ilike(f"%{search}%") | 
            Product.description.ilike(f"%{search}%")
        ).order_by(
            func.word_similarity(search, Product.name).desc(),
            func.word_similarity(search, Product.description).desc()
        )
    if category:
        query = query.filter(Product.category == category)
    if min_price is not None:
        query = query.filter(Product.price >= min_price)
    if max_price is not None:
        query = query.filter(Product.price <= max_price)

    products = query.offset((page - 1) * limit).limit(limit).all()

    # Populate cache if default query
    if is_default_query:
        try:
            # Serialize model list to json
            serialized = []
            for p in products:
                serialized.append({
                    "id": p.id,
                    "name": p.name,
                    "description": p.description,
                    "price": p.price,
                    "stock": p.stock,
                    "image_url": p.image_url,
                    "category": p.category
                })
            redis_client.setex(CACHE_KEY, 3600, json.dumps(serialized))
        except Exception:
            pass

    return products

@router.get("/{product_id}", response_model=ProductResponse)
def get_product(
    product_id: int,
    db: Session = Depends(get_db)
):
    product = (
        db.query(Product)
        .filter(Product.id == product_id)
        .first()
    )

    if not product:
        raise HTTPException(
            status_code=404,
            detail="Product not found"
        )

    return product

@router.delete("/{product_id}")
def delete_product(
    product_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_vendor_or_admin_user)
):
    product = (
        db.query(Product)
        .filter(Product.id == product_id)
        .first()
    )

    if not product:
        raise HTTPException(
            status_code=404,
            detail="Product not found"
        )

    # Check permission: Only admin or the product's vendor owner
    if not current_user.is_admin and product.vendor_id != current_user.id:
        raise HTTPException(
            status_code=403,
            detail="You do not have permission to delete this product"
        )

    db.delete(product)
    db.commit()
    
    # Invalidate cache
    invalidate_products_cache()

    return {
        "message": "Product deleted"
    }

@router.put("/{product_id}", response_model=ProductResponse)
def update_product(
    product_id: int,
    product_update: ProductUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_vendor_or_admin_user)
):
    product = (
        db.query(Product)
        .filter(Product.id == product_id)
        .first()
    )

    if not product:
        raise HTTPException(
            status_code=404,
            detail="Product not found"
        )

    # Check permission: Only admin or the product's vendor owner
    if not current_user.is_admin and product.vendor_id != current_user.id:
        raise HTTPException(
            status_code=403,
            detail="You do not have permission to modify this product"
        )

    update_data = product_update.model_dump(
        exclude_unset=True
    )

    for field, value in update_data.items():
        setattr(product, field, value)

    db.commit()
    db.refresh(product)
    
    # Trigger description generation task if description was updated to empty
    if "description" in update_data and (not product.description or not product.description.strip()):
        try:
            generate_product_description_task.delay(product.id)
        except Exception:
            pass

    # Invalidate cache
    invalidate_products_cache()

    return product

@router.get("/recommendations")
async def get_purchase_recommendations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    from app.models.orders import Order
    from app.models.order_items import OrderItem
    from openai import AsyncOpenAI
    import os

    # 1. Fetch user's order items
    user_orders = db.query(Order).filter(Order.user_id == current_user.id).all()
    order_ids = [o.id for o in user_orders]

    purchased_names = []
    if order_ids:
        items = db.query(OrderItem, Product.name).join(Product, OrderItem.product_id == Product.id).filter(OrderItem.order_id.in_(order_ids)).all()
        purchased_names = [name for item, name in items]

    # If no purchase history, give default recommendations
    history_str = ", ".join(purchased_names) if purchased_names else "No purchase history yet (new user)."

    # Setup LLM client failover chain
    providers = [
        (settings.LLM_API_KEY, settings.LLM_BASE_URL, settings.LLM_MODEL),
        (os.getenv("GEMINI_API_KEY"), "https://generativelanguage.googleapis.com/v1beta/openai/", "gemini-1.5-flash"),
        (os.getenv("MISTRAL_API_KEY"), "https://api.mistral.ai/v1", "mistral-small-latest")
    ]
    active_providers = [p for p in providers if p[0] and p[0] != "your_key_here" and p[0].strip()]

    if not active_providers:
         return {"recommendations": "Add items to your cart or purchase your first products to receive custom AI suggestions!"}

    prompt = (
        "You are the WaveMart AI Assistant. Based on the customer's purchase history, recommend 3 tailored types of products "
        "they might like next from our catalog (Categories: Electronics, Clothing, Home & Kitchen, Books, Fitness).\n\n"
        f"Customer Purchase History: {history_str}\n\n"
        "Instructions:\n"
        "1. Write 3 short, friendly recommendations.\n"
        "2. Explain why they would like each item in 1 sentence based on their history.\n"
        "3. Keep the output formatted as clear, concise bullet points."
    )

    last_exception = None
    response_text = ""

    for api_key, base_url, model in active_providers:
        try:
            client = AsyncOpenAI(api_key=api_key, base_url=base_url)
            completion = await client.chat.completions.create(
                model=model,
                messages=[{"role": "user", "content": prompt}],
                max_tokens=300
            )
            response_text = completion.choices[0].message.content
            break
        except Exception as e:
            last_exception = e

    if not response_text:
        return {"recommendations": f"AI Recommendations temporarily offline: {last_exception}"}

    return {"recommendations": response_text}