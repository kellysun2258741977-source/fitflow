from sqlalchemy import Column, Integer, String, Float, ForeignKey, Date, UniqueConstraint
from sqlalchemy.orm import relationship
from .database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String, nullable=False)
    height = Column(Float)
    weight = Column(Float)
    age = Column(Integer)
    gender = Column(String)
    activity_level_factor = Column(Float, default=1.2)

    meals = relationship("Meal", back_populates="owner")
    activities = relationship("Activity", back_populates="owner")

class Meal(Base):
    __tablename__ = "meals"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    calories = Column(Float)
    proteins = Column(Float)
    carbohydrates = Column(Float)
    fats = Column(Float)
    image_url = Column(String, nullable=True)
    activity_date = Column(Date)
    owner_id = Column(Integer, ForeignKey("users.id"))

    owner = relationship("User", back_populates="meals")

class Activity(Base):
    __tablename__ = "activities"

    id = Column(Integer, primary_key=True, index=True)
    activity_type = Column(String, index=True)
    duration_minutes = Column(Float)
    intensity = Column(String)
    calories_burned = Column(Float, default=0.0)
    activity_date = Column(Date)
    owner_id = Column(Integer, ForeignKey("users.id"))

    owner = relationship("User", back_populates="activities")


class DailyTarget(Base):
    __tablename__ = "daily_targets"

    id = Column(Integer, primary_key=True, index=True)
    target_date = Column(Date, nullable=False)
    target_deficit_kcal = Column(Integer, nullable=False, default=500)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    owner = relationship("User")

    __table_args__ = (UniqueConstraint("owner_id", "target_date", name="uq_daily_target_owner_date"),)
