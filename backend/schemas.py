from pydantic import BaseModel
from typing import List, Optional
from datetime import date

class UserBase(BaseModel):
    email: str

class UserCreate(UserBase):
    password: str
    height: float
    weight: float
    age: int
    gender: str
    activity_level_factor: float = 1.2

class MealBase(BaseModel):
    name: str
    calories: float
    proteins: float
    carbohydrates: float
    fats: float
    image_url: Optional[str] = None
    activity_date: date

class MealCreate(MealBase):
    pass


class MealUpdate(BaseModel):
    name: Optional[str] = None
    calories: Optional[float] = None
    proteins: Optional[float] = None
    carbohydrates: Optional[float] = None
    fats: Optional[float] = None
    image_url: Optional[str] = None
    activity_date: Optional[date] = None

class Meal(MealBase):
    id: int
    owner_id: int

    class Config:
        orm_mode = True

class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    email: Optional[str] = None


class User(UserBase):
    id: int
    height: float
    weight: float
    age: int
    gender: str
    activity_level_factor: float
    meals: List[Meal] = []
    activities: List['Activity'] = []

    class Config:
        orm_mode = True

class ActivityBase(BaseModel):
    activity_type: str
    duration_minutes: float
    intensity: str
    activity_date: date

class ActivityCreate(ActivityBase):
    calories_burned: Optional[float] = None


class ActivityBaseOut(ActivityBase):
    calories_burned: float


class ActivityUpdate(BaseModel):
    activity_type: Optional[str] = None
    duration_minutes: Optional[float] = None
    intensity: Optional[str] = None
    calories_burned: Optional[float] = None
    activity_date: Optional[date] = None

class Activity(ActivityBaseOut):
    id: int
    owner_id: int

    class Config:
        orm_mode = True


class DailyTargetBase(BaseModel):
    target_date: date
    target_deficit_kcal: int


class DailyTargetUpsert(DailyTargetBase):
    pass


class DailyTarget(DailyTargetBase):
    id: int
    owner_id: int

    class Config:
        orm_mode = True


class FoodRecognitionCandidate(BaseModel):
    name: str
    calories_per_100g: float
    confidence: Optional[float] = None


class FoodRecognitionResponse(BaseModel):
    image_url: Optional[str] = None
    candidates: List[FoodRecognitionCandidate]


class DailySummary(BaseModel):
    summary_date: date
    intake_kcal: float
    activity_burn_kcal: float
    bmr_kcal: float
    total_burn_kcal: float
    net_kcal: float
    deficit_kcal: float
    target_deficit_kcal: int
    deficit_delta_kcal: float


User.update_forward_refs(Activity=Activity)
