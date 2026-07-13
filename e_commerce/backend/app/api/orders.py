from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import redis
import asyncio

from app.database import get_db
from app.auth import get_current_user, get_current_admin_user
from app.config import settings

from app.models.users import User
from app.models.products import Product
from app.models.orders import Order
from app.models.order_items import OrderItem

from app.schemas.orders import (
    OrderResponse, 
    OrderDetailResponse, 
    OrderItemResponse, 
    OrderStatusUpdate,
    CheckoutRequest
)
from app.celery_app import send_confirmation_email_task
from app.websocket import manager

router = APIRouter(
    prefix="/orders",
    tags=["Orders"]
)

# Connect to Redis
redis_client = redis.from_url(settings.REDIS_URL, decode_responses=True)

@router.post("", response_model=OrderResponse)
def create_order(
    checkout: CheckoutRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    key = f"cart:{current_user.id}"
    cart_data = redis_client.hgetall(key)

    if not cart_data:
        raise HTTPException(
            status_code=400,
            detail="Cart is empty"
        )

    # Validate stock for all items first
    products_to_update = []
    total_amount = 0

    for prod_id_str, qty_str in cart_data.items():
        try:
            prod_id = int(prod_id_str)
            qty = int(qty_str)
        except ValueError:
            continue

        product = (
            db.query(Product)
            .filter(Product.id == prod_id)
            .first()
        )

        if not product:
            raise HTTPException(
                status_code=404,
                detail=f"Product with ID {prod_id} not found"
            )

        if product.stock < qty:
            raise HTTPException(
                status_code=400,
                detail=f"Insufficient stock for '{product.name}'. Available: {product.stock}"
            )

        total_amount += product.price * qty
        products_to_update.append((product, qty))

    # Decrement stock
    for product, qty in products_to_update:
        product.stock -= qty

    order = Order(
        user_id=current_user.id,
        total_amount=total_amount,
        status="Pending",
        shipping_address=checkout.shipping_address,
        shipping_phone=checkout.shipping_phone,
        payment_method=checkout.payment_method
    )

    db.add(order)
    db.commit()
    db.refresh(order)

    # Create OrderItems
    for prod_id_str, qty_str in cart_data.items():
        prod_id = int(prod_id_str)
        qty = int(qty_str)
        product = db.query(Product).filter(Product.id == prod_id).first()

        order_item = OrderItem(
            order_id=order.id,
            product_id=product.id,
            quantity=qty,
            price=product.price
        )
        db.add(order_item)

    db.commit()

    # Clear active Redis cart key
    redis_client.delete(key)

    # Trigger Celery background email task
    try:
        send_confirmation_email_task.delay(order.id, current_user.email, total_amount)
    except Exception:
        pass  # Prevent crash if Celery broker is down

    return order

@router.get("", response_model=list[OrderResponse])
def get_my_orders(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return (
        db.query(Order)
        .filter(Order.user_id == current_user.id)
        .order_by(Order.id.desc())
        .all()
    )

@router.get("/all", response_model=list[OrderResponse])
def get_all_orders_admin(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    return db.query(Order).order_by(Order.id.desc()).all()

@router.get("/{order_id}", response_model=OrderDetailResponse)
def get_order_details(
    order_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    order = (
        db.query(Order)
        .filter(Order.id == order_id)
        .first()
    )

    if not order:
        raise HTTPException(
            status_code=404,
            detail="Order not found"
        )

    if order.user_id != current_user.id and not current_user.is_admin:
        raise HTTPException(
            status_code=403,
            detail="Access denied to this order"
        )

    items_data = (
        db.query(OrderItem, Product.name)
        .join(Product, OrderItem.product_id == Product.id)
        .filter(OrderItem.order_id == order_id)
        .all()
    )

    response_items = []
    for item, product_name in items_data:
        response_items.append(
            OrderItemResponse(
                id=item.id,
                order_id=item.order_id,
                product_id=item.product_id,
                quantity=item.quantity,
                price=item.price,
                product_name=product_name
            )
        )

    return OrderDetailResponse(
        id=order.id,
        user_id=order.user_id,
        total_amount=order.total_amount,
        status=order.status,
        shipping_address=order.shipping_address,
        shipping_phone=order.shipping_phone,
        payment_method=order.payment_method,
        items=response_items
    )

@router.patch("/{order_id}", response_model=OrderResponse)
async def update_order_status(
    order_id: int,
    status_update: OrderStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    order = (
        db.query(Order)
        .filter(Order.id == order_id)
        .first()
    )

    if not order:
        raise HTTPException(
            status_code=404,
            detail="Order not found"
        )

    order.status = status_update.status
    db.commit()
    db.refresh(order)

    # Push real-time status update alert via WebSockets
    await manager.send_personal_message(
        {
            "order_id": order.id,
            "status": order.status,
            "message": f"Your order #{order.id} status has been updated to {order.status}!"
        }, 
        order.user_id
    )

    return order