from fastapi import APIRouter
from fastapi import Depends

from sqlalchemy.orm import Session

from app.database import get_db
from app.auth import get_current_user

from app.models.cart import CartItem
from app.models.users import User

from app.schemas.cart import (
    CartCreate,
    CartResponse
)

router = APIRouter(
    prefix="/cart",
    tags=["Cart"]
)

@router.post(
    "",
    response_model=CartResponse
)
def add_to_cart(
    cart: CartCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        get_current_user
    )
):

    cart_item = CartItem(
        user_id=current_user.id,
        product_id=cart.product_id,
        quantity=cart.quantity
    )

    db.add(cart_item)

    db.commit()

    db.refresh(cart_item)

    return cart_item

@router.get(
    "",
    response_model=list[CartResponse]
)
def get_cart(
    db: Session = Depends(get_db),
    current_user: User = Depends(
        get_current_user
    )
):

    return (
        db.query(CartItem)
        .filter(
            CartItem.user_id == current_user.id
        )
        .all()
    )