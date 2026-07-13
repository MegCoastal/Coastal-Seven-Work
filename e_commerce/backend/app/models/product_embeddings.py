from sqlalchemy import Column, Integer, ForeignKey, String
from app.database import Base

class ProductEmbedding(Base):
    __tablename__ = "product_embeddings"
    
    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="CASCADE"), unique=True)
    vector = Column(String) # Store vector list as JSON serialized string
