from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.auth import get_current_user

from app.models.users import User
from app.models.cart import CartItem
from app.models.products import Product
from app.models.orders import Order
from app.models.order_items import OrderItem

router = APIRouter(
    prefix="/orders",
    tags=["Orders"]
)

@router.post("")
def create_order(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    cart_items = (
        db.query(CartItem)
        .filter(
            CartItem.user_id == current_user.id
        )
        .all()
    )

    if not cart_items:
        raise HTTPException(
            status_code=400,
            detail="Cart is empty"
        )

    total_amount = 0

    for item in cart_items:

        product = (
            db.query(Product)
            .filter(
                Product.id == item.product_id
            )
            .first()
        )

        total_amount += (
            product.price * item.quantity
        )

    order = Order(
        user_id=current_user.id,
        total_amount=total_amount,
        status="Pending"
    )

    db.add(order)
    db.commit()
    db.refresh(order)

    for item in cart_items:

        product = (
            db.query(Product)
            .filter(
                Product.id == item.product_id
            )
            .first()
        )

        order_item = OrderItem(
            order_id=order.id,
            product_id=product.id,
            quantity=item.quantity,
            price=product.price
        )

        db.add(order_item)

    db.commit()

    for item in cart_items:
        db.delete(item)

    db.commit()

    return {
        "order_id": order.id,
        "total_amount": total_amount,
        "status": order.status
    }