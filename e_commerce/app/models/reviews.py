from sqlalchemy import Column, Integer, String, ForeignKey
from app.database import Base

class Review(Base):
    __tablename__ = "reviews"
    
    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    rating = Column(Integer, nullable=False) # 1 to 5 rating scale
    comment = Column(String, nullable=False)
    status = Column(String, default="pending_moderation") # pending_moderation, approved, flagged
