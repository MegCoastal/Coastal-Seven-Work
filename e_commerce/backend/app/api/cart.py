from fastapi import APIRouter, Depends, HTTPException, status
import redis
from app.config import settings
from app.auth import get_current_user
from app.models.users import User
from app.schemas.cart import CartCreate, CartResponse

router = APIRouter(
    prefix="/cart",
    tags=["Cart"]
)

# Connect to Redis
redis_client = redis.from_url(settings.REDIS_URL, decode_responses=True)

def get_cart_key(user_id: int) -> str:
    return f"cart:{user_id}"

@router.post("", response_model=CartResponse)
def add_to_cart(
    cart: CartCreate,
    current_user: User = Depends(get_current_user)
):
    key = get_cart_key(current_user.id)
    # Increment quantity in Redis Hash Map
    new_qty = redis_client.hincrby(key, str(cart.product_id), cart.quantity)
    
    return CartResponse(
        id=cart.product_id,  # Use product_id as the cart item ID for compatibility
        user_id=current_user.id,
        product_id=cart.product_id,
        quantity=new_qty
    )

@router.get("", response_model=list[CartResponse])
def get_cart(
    current_user: User = Depends(get_current_user)
):
    key = get_cart_key(current_user.id)
    cart_data = redis_client.hgetall(key)
    
    responses = []
    for prod_id_str, qty_str in cart_data.items():
        try:
            prod_id = int(prod_id_str)
            qty = int(qty_str)
            responses.append(
                CartResponse(
                    id=prod_id,  # Use product_id as item ID
                    user_id=current_user.id,
                    product_id=prod_id,
                    quantity=qty
                )
            )
        except ValueError:
            continue
            
    return responses

@router.put("/{cart_item_id}", response_model=CartResponse)
def update_cart_item(
    cart_item_id: int,  # Maps to product_id
    quantity: int,
    current_user: User = Depends(get_current_user)
):
    key = get_cart_key(current_user.id)
    
    if quantity <= 0:
        redis_client.hdel(key, str(cart_item_id))
        return CartResponse(
            id=cart_item_id,
            user_id=current_user.id,
            product_id=cart_item_id,
            quantity=0
        )
        
    redis_client.hset(key, str(cart_item_id), str(quantity))
    
    return CartResponse(
        id=cart_item_id,
        user_id=current_user.id,
        product_id=cart_item_id,
        quantity=quantity
    )

@router.delete("/{cart_item_id}")
def delete_cart_item(
    cart_item_id: int,  # Maps to product_id
    current_user: User = Depends(get_current_user)
):
    key = get_cart_key(current_user.id)
    deleted = redis_client.hdel(key, str(cart_item_id))
    
    if not deleted:
        raise HTTPException(
            status_code=404,
            detail="Item not found in cart"
        )
        
    return {"message": "Item removed from cart"}

@router.delete("")
def clear_cart(
    current_user: User = Depends(get_current_user)
):
    key = get_cart_key(current_user.id)
    redis_client.delete(key)
    return {"message": "Cart cleared"}