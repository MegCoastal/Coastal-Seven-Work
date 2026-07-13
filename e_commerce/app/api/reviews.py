from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.auth import get_current_user
from app.models.users import User
from app.models.reviews import Review
from app.models.products import Product
from app.schemas.reviews import ReviewCreate, ReviewResponse
from app.celery_app import moderate_review_task

router = APIRouter(
    prefix="/products/{product_id}/reviews",
    tags=["Reviews"]
)

@router.get("", response_model=List[ReviewResponse])
def get_approved_reviews(
    product_id: int,
    db: Session = Depends(get_db)
):
    # Verify product exists
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(
            status_code=404,
            detail="Product not found"
        )
        
    return (
        db.query(Review)
        .filter(Review.product_id == product_id, Review.status == "approved")
        .all()
    )

@router.post("", response_model=ReviewResponse, status_code=status.HTTP_201_CREATED)
def create_review(
    product_id: int,
    review_data: ReviewCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Verify product exists
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(
            status_code=404,
            detail="Product not found"
        )

    # Check if user already submitted a review
    existing = (
        db.query(Review)
        .filter(Review.product_id == product_id, Review.user_id == current_user.id)
        .first()
    )
    if existing:
        raise HTTPException(
            status_code=400,
            detail="You have already submitted a review for this product."
        )

    new_review = Review(
        product_id=product_id,
        user_id=current_user.id,
        rating=review_data.rating,
        comment=review_data.comment,
        status="pending_moderation"
    )
    
    db.add(new_review)
    db.commit()
    db.refresh(new_review)

    # Trigger async AI content moderation Celery task
    try:
        moderate_review_task.delay(new_review.id)
    except Exception as e:
        # If Redis/Celery is down, fallback to synchronous moderation or print notice
        print(f"Celery queue warning: {e}. Falling back to default approval status.")
        new_review.status = "approved"
        db.commit()
        db.refresh(new_review)

    return new_review
