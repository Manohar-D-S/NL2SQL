"""Database models"""

from sqlalchemy import Column, Integer, String, Text, DateTime, Float, Date, ForeignKey, Index
from sqlalchemy.orm import relationship
from datetime import datetime
from app.db.database import Base


class Student(Base):
    """Student model for students_db"""
    __tablename__ = "students"
    __table_args__ = (
        Index("idx_students_subject_marks", "subject", "marks"),
    )
    
    id = Column(Integer, primary_key=True)
    roll_no = Column(String(16), unique=True, nullable=False)
    name = Column(Text, nullable=False)
    department = Column(Text)
    year = Column(Integer)
    subject = Column(Text)
    marks = Column(Integer)
    dob = Column(Date)


class Customer(Base):
    """Customer model for retail_db"""
    __tablename__ = "customers"
    
    id = Column(Integer, primary_key=True)
    name = Column(Text)
    email = Column(Text, unique=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    orders = relationship("Order", back_populates="customer")


class Product(Base):
    """Product model for retail_db"""
    __tablename__ = "products"
    
    id = Column(Integer, primary_key=True)
    name = Column(Text)
    category = Column(Text)
    price = Column(Float)
    
    order_items = relationship("OrderItem", back_populates="product")


class Order(Base):
    """Order model for retail_db"""
    __tablename__ = "orders"
    __table_args__ = (
        Index("idx_orders_customer", "customer_id"),
    )
    
    id = Column(Integer, primary_key=True)
    customer_id = Column(Integer, ForeignKey("customers.id"))
    order_date = Column(DateTime)
    total = Column(Float)
    
    customer = relationship("Customer", back_populates="orders")
    order_items = relationship("OrderItem", back_populates="order")


class OrderItem(Base):
    """Order item model for retail_db"""
    __tablename__ = "order_items"
    
    id = Column(Integer, primary_key=True)
    order_id = Column(Integer, ForeignKey("orders.id"))
    product_id = Column(Integer, ForeignKey("products.id"))
    qty = Column(Integer)
    price = Column(Float)
    
    order = relationship("Order", back_populates="order_items")
    product = relationship("Product", back_populates="order_items")


class QueryFeedback(Base):
    """Query feedback model for learning"""
    __tablename__ = "query_feedback"
    
    id = Column(Integer, primary_key=True)
    query_id = Column(String(64), unique=True)
    natural_language = Column(Text)
    generated_sql = Column(Text)
    user_feedback = Column(Text)
    rating = Column(Integer)  # 1-5
    created_at = Column(DateTime, default=datetime.utcnow)
