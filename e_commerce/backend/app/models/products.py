from sqlalchemy import Column, Integer, String, Float, ForeignKey
from sqlalchemy.orm import relationship

from app.database import Base


class Product(Base):
    __tablename__ = "products"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    name = Column(
        String,
        nullable=False
    )

    description = Column(
        String,
        nullable=True
    )

    price = Column(
        Float,
        nullable=False
    )

    stock = Column(
        Integer,
        nullable=False
    )

    image_url = Column(
        String,
        nullable=True
    )

    category = Column(
        String,
        nullable=True
    )

    vendor_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True
    )

    vendor = relationship("User", backref="products")

    @property
    def vendor_name(self) -> str:
        return self.vendor.username if self.vendor else "WaveMart"