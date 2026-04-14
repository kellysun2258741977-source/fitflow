from sqlalchemy.orm import Session
from datetime import date
from passlib.context import CryptContext

from . import models, schemas

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

# Activity Level Factors (Mifflin-St Jeor)
# These are common multipliers for BMR to estimate TDEE
ACTIVITY_LEVEL_SEDENTARY = 1.2  # little or no exercise
ACTIVITY_LEVEL_LIGHT = 1.375    # light exercise/sports 1-3 days/week
ACTIVITY_LEVEL_MODERATE = 1.55  # moderate exercise/sports 3-5 days/week
ACTIVITY_LEVEL_HEAVY = 1.725    # hard exercise/sports 6-7 days/week
ACTIVITY_LEVEL_VERY_HEAVY = 1.9 # very hard exercise/physical job/training twice per day

def calculate_bmr(user: schemas.User) -> float:
    # Mifflin-St Jeor Equation
    if user.gender.lower() == "male":
        bmr = (10 * user.weight) + (6.25 * user.height) - (5 * user.age) + 5
    elif user.gender.lower() == "female":
        bmr = (10 * user.weight) + (6.25 * user.height) - (5 * user.age) - 161
    else:
        raise ValueError("Invalid gender for BMR calculation")
    return bmr

def calculate_tdee(user: schemas.User) -> float:
    bmr = calculate_bmr(user)
    return bmr * user.activity_level_factor

def get_user(db: Session, user_id: int):
    return db.query(models.User).filter(models.User.id == user_id).first()

def get_user_by_email(db: Session, email: str):
    return db.query(models.User).filter(models.User.email == email).first()

def create_user(db: Session, user: schemas.UserCreate):
    hashed_password = get_password_hash(user.password)
    db_user = models.User(email=user.email, hashed_password=hashed_password,
                          height=user.height, weight=user.weight, age=user.age, gender=user.gender, activity_level_factor=user.activity_level_factor)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def authenticate_user(db: Session, email: str, password: str):
    user = get_user_by_email(db, email)
    if not user:
        return False
    if not verify_password(password, user.hashed_password):
        return False
    return user

def create_user_meal(db: Session, meal: schemas.MealCreate, user_id: int):
    db_meal = models.Meal(**meal.dict(), owner_id=user_id)
    db.add(db_meal)
    db.commit()
    db.refresh(db_meal)
    return db_meal

def get_meals(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Meal).offset(skip).limit(limit).all()

def get_meals_by_user_and_date(db: Session, user_id: int, target_date: date):
    return db.query(models.Meal).filter(
        models.Meal.owner_id == user_id,
        models.Meal.activity_date == target_date
    ).all()


def get_meal_by_id(db: Session, user_id: int, meal_id: int):
    return db.query(models.Meal).filter(models.Meal.owner_id == user_id, models.Meal.id == meal_id).first()


def update_meal(db: Session, user_id: int, meal_id: int, patch: schemas.MealUpdate):
    meal = get_meal_by_id(db, user_id, meal_id)
    if not meal:
        return None
    data = patch.dict(exclude_unset=True)
    for k, v in data.items():
        setattr(meal, k, v)
    db.add(meal)
    db.commit()
    db.refresh(meal)
    return meal


def delete_meal(db: Session, user_id: int, meal_id: int) -> bool:
    meal = get_meal_by_id(db, user_id, meal_id)
    if not meal:
        return False
    db.delete(meal)
    db.commit()
    return True

def create_user_activity(db: Session, activity: schemas.ActivityCreate, user_id: int):
    db_activity = models.Activity(**activity.dict(), owner_id=user_id)
    db.add(db_activity)
    db.commit()
    db.refresh(db_activity)
    return db_activity

def get_activities(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Activity).offset(skip).limit(limit).all()

def get_activities_by_user_and_date(db: Session, user_id: int, target_date: date):
    return db.query(models.Activity).filter(
        models.Activity.owner_id == user_id,
        models.Activity.activity_date == target_date
    ).all()


def get_activity_by_id(db: Session, user_id: int, activity_id: int):
    return db.query(models.Activity).filter(models.Activity.owner_id == user_id, models.Activity.id == activity_id).first()


def update_activity(db: Session, user_id: int, activity_id: int, patch: schemas.ActivityUpdate):
    activity = get_activity_by_id(db, user_id, activity_id)
    if not activity:
        return None
    data = patch.dict(exclude_unset=True)
    for k, v in data.items():
        setattr(activity, k, v)
    db.add(activity)
    db.commit()
    db.refresh(activity)
    return activity


def delete_activity(db: Session, user_id: int, activity_id: int) -> bool:
    activity = get_activity_by_id(db, user_id, activity_id)
    if not activity:
        return False
    db.delete(activity)
    db.commit()
    return True


def get_daily_target(db: Session, user_id: int, target_date: date):
    return db.query(models.DailyTarget).filter(models.DailyTarget.owner_id == user_id, models.DailyTarget.target_date == target_date).first()


def upsert_daily_target(db: Session, user_id: int, payload: schemas.DailyTargetUpsert):
    existing = get_daily_target(db, user_id, payload.target_date)
    if existing:
        existing.target_deficit_kcal = payload.target_deficit_kcal
        db.add(existing)
        db.commit()
        db.refresh(existing)
        return existing
    row = models.DailyTarget(owner_id=user_id, target_date=payload.target_date, target_deficit_kcal=payload.target_deficit_kcal)
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


def estimate_activity_calories(activity_type: str, duration_minutes: float, intensity: str, weight_kg: float) -> float:
    base = (activity_type or "").strip().lower()
    intensity_key = (intensity or "medium").strip().lower()
    mets_table = {
        "running": {"low": 7.0, "medium": 9.8, "high": 11.5},
        "run": {"low": 7.0, "medium": 9.8, "high": 11.5},
        "walking": {"low": 2.8, "medium": 3.3, "high": 4.3},
        "walk": {"low": 2.8, "medium": 3.3, "high": 4.3},
        "cycling": {"low": 4.0, "medium": 6.8, "high": 8.5},
        "bike": {"low": 4.0, "medium": 6.8, "high": 8.5},
        "swimming": {"low": 4.8, "medium": 5.8, "high": 6.8},
        "strength": {"low": 2.5, "medium": 3.5, "high": 6.0},
        "weights": {"low": 2.5, "medium": 3.5, "high": 6.0},
        "yoga": {"low": 2.0, "medium": 2.5, "high": 3.0},
        "hiit": {"low": 6.0, "medium": 8.0, "high": 10.0},
    }
    fallback_mets = {"low": 3.0, "medium": 4.0, "high": 6.0}
    met = mets_table.get(base, fallback_mets).get(intensity_key, fallback_mets["medium"]) if isinstance(mets_table.get(base, None), dict) else fallback_mets.get(intensity_key, 4.0)
    hours = max(duration_minutes, 0.0) / 60.0
    kcal = met * max(weight_kg, 0.0) * hours
    return float(round(kcal, 2))
