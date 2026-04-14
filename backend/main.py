from fastapi import FastAPI, Depends, HTTPException, File, UploadFile, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.responses import StreamingResponse
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date, timedelta, datetime
import base64, io
import json
import os
import uuid
import csv
import tempfile
from jose import JWTError, jwt

from . import crud, models, schemas
from .database import SessionLocal, engine
from .config import settings
from .image_recognition import recognize_dish, recognize_advanced_general


try:
    models.Base.metadata.create_all(bind=engine)
except Exception:
    pass

# Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


app = FastAPI()

is_vercel = os.getenv("VERCEL") == "1"

if is_vercel:
    uploads_dir = os.path.join(tempfile.gettempdir(), "fit-flow-uploads")
else:
    uploads_dir = os.path.join(os.path.dirname(__file__), "uploads")

try:
    os.makedirs(uploads_dir, exist_ok=True)
except OSError:
    pass

if not is_vercel:
    app.mount("/static/uploads", StaticFiles(directory=uploads_dir), name="uploads")

app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=settings.CORS_ALLOW_ORIGIN_REGEX,
    allow_credentials=settings.CORS_ALLOW_CREDENTIALS,
    allow_methods=["*"],
    allow_headers=["*"],
)


oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")


def create_access_token(
    data: dict, expires_delta: Optional[timedelta] = None
):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt


async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
        token_data = schemas.TokenData(email=email)
    except JWTError:
        raise credentials_exception
    user = crud.get_user_by_email(db, email=token_data.email)
    if user is None:
        raise credentials_exception
    return user


async def get_current_active_user(current_user: schemas.User = Depends(get_current_user)):
    return current_user


@app.post("/token", response_model=schemas.Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = crud.authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

# Dependency


@app.get("/")
def read_root():
    return {"message": "Welcome to fit flow API"}


@app.get("/healthz")
def healthz():
    return {"ok": True, "baidu_configured": bool(settings.BAIDU_API_KEY and settings.BAIDU_SECRET_KEY)}

@app.post("/users/", response_model=schemas.User)
def create_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = crud.get_user_by_email(db, email=user.email)
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    return crud.create_user(db=db, user=user)

@app.get("/users/me", response_model=schemas.User)
async def read_users_me(current_user: schemas.User = Depends(get_current_active_user)):
    return current_user

@app.get("/users/{user_id}", response_model=schemas.User)
def read_user(user_id: int, db: Session = Depends(get_db), current_user: schemas.User = Depends(get_current_active_user)):
    if user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Forbidden")
    db_user = crud.get_user(db, user_id=user_id)
    if db_user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return db_user

@app.post("/users/{user_id}/meals/", response_model=schemas.Meal)
async def create_meal_for_user(
    user_id: int, meal: schemas.MealCreate, db: Session = Depends(get_db), current_user: schemas.User = Depends(get_current_active_user)
):
    if user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Forbidden")
    return crud.create_user_meal(db=db, meal=meal, user_id=user_id)

@app.post("/users/{user_id}/activities/", response_model=schemas.Activity)
async def create_activity_for_user(
    user_id: int, activity: schemas.ActivityCreate, db: Session = Depends(get_db), current_user: schemas.User = Depends(get_current_active_user)
):
    if user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Forbidden")
    calories_burned = activity.calories_burned
    if not calories_burned or calories_burned <= 0:
        user = crud.get_user(db, user_id=user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        calories_burned = crud.estimate_activity_calories(activity.activity_type, activity.duration_minutes, activity.intensity, float(user.weight or 0))
    payload = schemas.ActivityCreate(
        activity_type=activity.activity_type,
        duration_minutes=activity.duration_minutes,
        intensity=activity.intensity,
        calories_burned=calories_burned,
        activity_date=activity.activity_date,
    )
    return crud.create_user_activity(db=db, activity=payload, user_id=user_id)

@app.get("/users/{user_id}/calorie-report/{report_date}")
def get_calorie_report(
    user_id: int, report_date: date, db: Session = Depends(get_db), current_user: schemas.User = Depends(get_current_active_user)
):
    if user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Forbidden")
    user = crud.get_user(db, user_id=user_id)
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")

    # Calculate BMR and TDEE using user's stored activity_level_factor
    bmr = crud.calculate_bmr(user)
    tdee = crud.calculate_tdee(user)

    # Get total calorie intake from meals
    meals_today = crud.get_meals_by_user_and_date(db, user_id, report_date)
    total_intake_calories = sum([meal.calories for meal in meals_today])

    # Get total calorie burned from activities
    activities_today = crud.get_activities_by_user_and_date(db, user_id, report_date)
    total_activity_calories_burned = sum([activity.calories_burned for activity in activities_today])

    # Calculate calorie balance
    # Total expenditure is primarily TDEE (which includes BMR and estimated activity).
    # If total_activity_calories_burned represents *additional* activity beyond what's factored into TDEE,
    # it should be added. However, for simplicity and to avoid double counting for now,
    # let's assume TDEE represents the total daily expenditure.
    # The `total_activity_calories_burned` can be returned as an informational metric.
    
    # Let's adjust calorie_deficit definition: positive means surplus, negative means deficit
    calorie_balance = total_intake_calories - tdee

    return {
        "report_date": report_date,
        "user_id": user.id,
        "bmr": bmr,
        "tdee": tdee,
        "total_intake_calories": total_intake_calories,
        "total_activity_calories_burned": total_activity_calories_burned, # Still return this for information
        "calorie_balance": calorie_balance, # Changed from calorie_deficit for clarity
        "meals": meals_today,
        "activities": activities_today
    }


@app.post("/recognize-food/", response_model=schemas.FoodRecognitionResponse)
async def recognize_food(request: Request, file: UploadFile = File(...), current_user: schemas.User = Depends(get_current_active_user)):
    content_type = (file.content_type or "").lower()
    if not content_type.startswith("image/"):
        raise HTTPException(status_code=415, detail="Unsupported media type")
    image_bytes = await file.read()
    if len(image_bytes) > int(settings.MAX_UPLOAD_BYTES):
        raise HTTPException(status_code=413, detail="File too large")
    image_base64_str = base64.b64encode(image_bytes).decode("utf-8")

    image_url = None
    if not is_vercel:
        ext = os.path.splitext(file.filename or "")[1].lower() or ".jpg"
        safe_name = f"{uuid.uuid4().hex}{ext}"
        save_path = os.path.join(uploads_dir, safe_name)
        with open(save_path, "wb") as f:
            f.write(image_bytes)
        base = str(request.base_url).rstrip("/")
        image_url = f"{base}/static/uploads/{safe_name}"

    if not settings.BAIDU_API_KEY or not settings.BAIDU_SECRET_KEY:
        candidates = [
            schemas.FoodRecognitionCandidate(name="示例：鸡胸肉", calories_per_100g=165.0, confidence=0.1),
            schemas.FoodRecognitionCandidate(name="示例：米饭", calories_per_100g=116.0, confidence=0.08),
            schemas.FoodRecognitionCandidate(name="示例：沙拉", calories_per_100g=55.0, confidence=0.06),
        ]
        return schemas.FoodRecognitionResponse(image_url=image_url, candidates=candidates)

    recognition_result = recognize_dish(image_base64_str)
    if "error" in recognition_result:
        raise HTTPException(status_code=500, detail=recognition_result["error"])

    raw = recognition_result.get("result", []) or []
    if not raw:
        raise HTTPException(status_code=404, detail="No recognition result")

    try:
        top_prob = raw[0].get("probability")
        top_prob = float(top_prob) if top_prob is not None else None
    except Exception:
        top_prob = None

    apple_candidate = None
    if top_prob is None or top_prob < float(settings.BAIDU_DISH_FALLBACK_THRESHOLD):
        general = recognize_advanced_general(image_base64_str)
        if isinstance(general, dict) and "error" not in general:
            for it in (general.get("result") or [])[:10]:
                kw = str(it.get("keyword") or "").strip().lower()
                score = it.get("score")
                try:
                    score = float(score) if score is not None else None
                except Exception:
                    score = None
                if not kw or score is None:
                    continue
                if ("apple" in kw) or ("苹果" in kw):
                    if score >= float(settings.BAIDU_GENERAL_APPLE_THRESHOLD):
                        apple_candidate = schemas.FoodRecognitionCandidate(
                            name="苹果",
                            calories_per_100g=52.0,
                            confidence=score,
                        )
                        break

    candidates: List[schemas.FoodRecognitionCandidate] = []
    if apple_candidate is not None:
        candidates.append(apple_candidate)
    for item in raw[:5]:
        try:
            name = item.get("name") or "Unknown"
            calories_per_100g = float(item.get("calorie") or 0)
            confidence = item.get("probability")
            if confidence is not None:
                confidence = float(confidence)
            candidates.append(
                schemas.FoodRecognitionCandidate(
                    name=name,
                    calories_per_100g=calories_per_100g,
                    confidence=confidence,
                )
            )
        except Exception:
            continue

    if not candidates:
        raise HTTPException(status_code=404, detail="No valid candidates")
    return schemas.FoodRecognitionResponse(image_url=image_url, candidates=candidates)


@app.get("/me/summary", response_model=schemas.DailySummary)
def get_my_daily_summary(summary_date: date = date.today(), db: Session = Depends(get_db), current_user: schemas.User = Depends(get_current_active_user)):
    meals_today = crud.get_meals_by_user_and_date(db, current_user.id, summary_date)
    activities_today = crud.get_activities_by_user_and_date(db, current_user.id, summary_date)

    intake_kcal = float(sum([m.calories for m in meals_today]))
    activity_burn_kcal = float(sum([a.calories_burned for a in activities_today]))
    bmr_kcal = float(crud.calculate_bmr(current_user))
    total_burn_kcal = bmr_kcal + activity_burn_kcal
    net_kcal = intake_kcal - total_burn_kcal
    deficit_kcal = total_burn_kcal - intake_kcal

    target_row = crud.get_daily_target(db, current_user.id, summary_date)
    target_deficit_kcal = int(target_row.target_deficit_kcal) if target_row else 500
    deficit_delta_kcal = deficit_kcal - float(target_deficit_kcal)

    return schemas.DailySummary(
        summary_date=summary_date,
        intake_kcal=round(intake_kcal, 2),
        activity_burn_kcal=round(activity_burn_kcal, 2),
        bmr_kcal=round(bmr_kcal, 2),
        total_burn_kcal=round(total_burn_kcal, 2),
        net_kcal=round(net_kcal, 2),
        deficit_kcal=round(deficit_kcal, 2),
        target_deficit_kcal=target_deficit_kcal,
        deficit_delta_kcal=round(deficit_delta_kcal, 2),
    )


@app.get("/me/meals", response_model=List[schemas.Meal])
def list_my_meals(meal_date: date = date.today(), db: Session = Depends(get_db), current_user: schemas.User = Depends(get_current_active_user)):
    return crud.get_meals_by_user_and_date(db, current_user.id, meal_date)


@app.post("/me/meals", response_model=schemas.Meal)
def create_my_meal(meal: schemas.MealCreate, db: Session = Depends(get_db), current_user: schemas.User = Depends(get_current_active_user)):
    return crud.create_user_meal(db=db, meal=meal, user_id=current_user.id)


@app.put("/me/meals/{meal_id}", response_model=schemas.Meal)
def update_my_meal(meal_id: int, patch: schemas.MealUpdate, db: Session = Depends(get_db), current_user: schemas.User = Depends(get_current_active_user)):
    updated = crud.update_meal(db, current_user.id, meal_id, patch)
    if not updated:
        raise HTTPException(status_code=404, detail="Meal not found")
    return updated


@app.delete("/me/meals/{meal_id}")
def delete_my_meal(meal_id: int, db: Session = Depends(get_db), current_user: schemas.User = Depends(get_current_active_user)):
    ok = crud.delete_meal(db, current_user.id, meal_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Meal not found")
    return {"ok": True}


@app.get("/me/activities", response_model=List[schemas.Activity])
def list_my_activities(activity_date: date = date.today(), db: Session = Depends(get_db), current_user: schemas.User = Depends(get_current_active_user)):
    return crud.get_activities_by_user_and_date(db, current_user.id, activity_date)


@app.post("/me/activities", response_model=schemas.Activity)
def create_my_activity(activity: schemas.ActivityCreate, db: Session = Depends(get_db), current_user: schemas.User = Depends(get_current_active_user)):
    calories_burned = activity.calories_burned
    if not calories_burned or calories_burned <= 0:
        calories_burned = crud.estimate_activity_calories(activity.activity_type, activity.duration_minutes, activity.intensity, float(current_user.weight or 0))
    payload = schemas.ActivityCreate(
        activity_type=activity.activity_type,
        duration_minutes=activity.duration_minutes,
        intensity=activity.intensity,
        calories_burned=calories_burned,
        activity_date=activity.activity_date,
    )
    return crud.create_user_activity(db=db, activity=payload, user_id=current_user.id)


@app.post("/me/activities/estimate")
def estimate_my_activity(activity_type: str, duration_minutes: float, intensity: str = "medium", weight_kg: Optional[float] = None, db: Session = Depends(get_db), current_user: schemas.User = Depends(get_current_active_user)):
    w = float(weight_kg) if weight_kg is not None else float(current_user.weight or 0)
    kcal = crud.estimate_activity_calories(activity_type, duration_minutes, intensity, w)
    return {"calories_burned": kcal}


@app.put("/me/activities/{activity_id}", response_model=schemas.Activity)
def update_my_activity(activity_id: int, patch: schemas.ActivityUpdate, db: Session = Depends(get_db), current_user: schemas.User = Depends(get_current_active_user)):
    updated = crud.update_activity(db, current_user.id, activity_id, patch)
    if not updated:
        raise HTTPException(status_code=404, detail="Activity not found")
    return updated


@app.delete("/me/activities/{activity_id}")
def delete_my_activity(activity_id: int, db: Session = Depends(get_db), current_user: schemas.User = Depends(get_current_active_user)):
    ok = crud.delete_activity(db, current_user.id, activity_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Activity not found")
    return {"ok": True}


@app.get("/me/target", response_model=schemas.DailyTarget)
def get_my_target(target_date: date = date.today(), db: Session = Depends(get_db), current_user: schemas.User = Depends(get_current_active_user)):
    row = crud.get_daily_target(db, current_user.id, target_date)
    if not row:
        raise HTTPException(status_code=404, detail="Target not set")
    return row


@app.put("/me/target", response_model=schemas.DailyTarget)
def upsert_my_target(payload: schemas.DailyTargetUpsert, db: Session = Depends(get_db), current_user: schemas.User = Depends(get_current_active_user)):
    if payload.target_deficit_kcal < 0 or payload.target_deficit_kcal > 2000:
        raise HTTPException(status_code=400, detail="Invalid target_deficit_kcal")
    return crud.upsert_daily_target(db, current_user.id, payload)


@app.get("/me/reports")
def get_my_reports(from_date: date, to_date: date, db: Session = Depends(get_db), current_user: schemas.User = Depends(get_current_active_user)):
    if to_date < from_date:
        raise HTTPException(status_code=400, detail="Invalid range")
    days = (to_date - from_date).days
    if days > 366:
        raise HTTPException(status_code=400, detail="Range too large")

    series = []
    d = from_date
    while d <= to_date:
        meals_d = crud.get_meals_by_user_and_date(db, current_user.id, d)
        acts_d = crud.get_activities_by_user_and_date(db, current_user.id, d)

        intake_kcal = float(sum([m.calories for m in meals_d]))
        activity_burn_kcal = float(sum([a.calories_burned for a in acts_d]))
        bmr_kcal = float(crud.calculate_bmr(current_user))
        total_burn_kcal = bmr_kcal + activity_burn_kcal
        net_kcal = intake_kcal - total_burn_kcal
        deficit_kcal = total_burn_kcal - intake_kcal

        target_row = crud.get_daily_target(db, current_user.id, d)
        target_deficit_kcal = int(target_row.target_deficit_kcal) if target_row else 500

        series.append(
            {
                "date": d.isoformat(),
                "intake_kcal": round(intake_kcal, 2),
                "activity_burn_kcal": round(activity_burn_kcal, 2),
                "bmr_kcal": round(bmr_kcal, 2),
                "total_burn_kcal": round(total_burn_kcal, 2),
                "net_kcal": round(net_kcal, 2),
                "deficit_kcal": round(deficit_kcal, 2),
                "target_deficit_kcal": target_deficit_kcal,
            }
        )
        d = d + timedelta(days=1)

    return {"from": from_date.isoformat(), "to": to_date.isoformat(), "series": series}


@app.get("/me/reports.csv")
def export_my_reports_csv(from_date: date, to_date: date, db: Session = Depends(get_db), current_user: schemas.User = Depends(get_current_active_user)):
    data = get_my_reports(from_date, to_date, db, current_user)
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["date", "intake_kcal", "activity_burn_kcal", "bmr_kcal", "total_burn_kcal", "net_kcal", "deficit_kcal", "target_deficit_kcal"])
    for row in data["series"]:
        writer.writerow([
            row["date"],
            row["intake_kcal"],
            row["activity_burn_kcal"],
            row["bmr_kcal"],
            row["total_burn_kcal"],
            row["net_kcal"],
            row["deficit_kcal"],
            row["target_deficit_kcal"],
        ])
    output.seek(0)
    filename = f"calorie-report_{from_date.isoformat()}_{to_date.isoformat()}.csv"
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )
