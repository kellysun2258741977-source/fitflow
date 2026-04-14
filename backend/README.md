# fit flow Backend API Documentation

This document provides an overview of the backend API for the smart daily diet and exercise calorie management tool.

## Base URL

The API is served at `http://localhost:8000` when running locally with Uvicorn.

## Authentication

该项目使用 JWT 进行认证：
- `POST /users/` 注册
- `POST /token` 登录获取 `access_token`
- 带认证的接口需在请求头携带 `Authorization: Bearer <token>`

## Endpoints

### 1. User Management

#### `POST /users/`
Creates a new user.

- **Request Body:** `schemas.UserCreate`
    ```json
    {
      "email": "user@example.com",
      "password": "securepassword",
      "height": 170.5,
      "weight": 65.2,
      "age": 30,
      "gender": "female",
      "activity_level_factor": 1.375
    }
    ```
- **Response:** `schemas.User`
    ```json
    {
      "id": 1,
      "email": "user@example.com",
      "height": 170.5,
      "weight": 65.2,
      "age": 30,
      "gender": "female",
      "activity_level_factor": 1.375,
      "meals": [],
      "activities": []
    }
    ```
- **Error:** `400 Bad Request` if email already registered.

#### `GET /users/{user_id}`
Retrieves user details by ID.

- **Path Parameters:**
    - `user_id`: `int` (The ID of the user)
- **Response:** `schemas.User`
- **Error:** `404 Not Found` if user does not exist.

### 2. Meal Management

#### `POST /users/{user_id}/meals/`
Adds a meal for a specific user.

- **Path Parameters:**
    - `user_id`: `int` (The ID of the user)
- **Request Body:** `schemas.MealCreate`
    ```json
    {
      "name": "Breakfast Oatmeal",
      "calories": 350.0,
      "proteins": 15.0,
      "carbohydrates": 50.0,
      "fats": 10.0,
      "meal_date": "2024-04-11"
    }
    ```
- **Response:** `schemas.Meal`

### 3. Activity Management

#### `POST /users/{user_id}/activities/`
Adds an activity for a specific user.

- **Path Parameters:**
    - `user_id`: `int` (The ID of the user)
- **Request Body:** `schemas.ActivityCreate`
    ```json
    {
      "name": "Morning Run",
      "calories_burned": 300.0,
      "duration_minutes": 30,
      "intensity": "moderate",
      "activity_date": "2024-04-11"
    }
    ```
- **Response:** `schemas.Activity`

### 4. Reporting

#### `GET /users/{user_id}/calorie-report/{report_date}`
Generates a daily calorie report for a user.

- **Path Parameters:**
    - `user_id`: `int` (The ID of the user)
    - `report_date`: `date` (The date for the report, e.g., `2024-04-11`)
- **Response:** `JSON` object containing:
    - `report_date`: `date`
    - `user_id`: `int`
    - `bmr`: `float` (Basal Metabolic Rate)
    - `tdee`: `float` (Total Daily Energy Expenditure)
    - `total_intake_calories`: `float` (Total calories from meals)
    - `total_activity_calories_burned`: `float` (Total calories burned from activities)
    - `calorie_balance`: `float` (Total intake calories - TDEE. Positive means surplus, negative means deficit)
    - `meals`: `List[schemas.Meal]` (List of meals for the day)
    - `activities`: `List[schemas.Activity]` (List of activities for the day)
- **Error:** `404 Not Found` if user does not exist.

### 5. Image Recognition

#### `POST /recognize-food/`
Recognizes food from an uploaded image and returns candidates.

- **Request Body:** `UploadFile` (multipart/form-data)
    - `file`: The image file (e.g., `food.jpg`)
- **Response:** `JSON` object containing:
    ```json
    {
      "image_url": "http://localhost:8000/static/uploads/<uuid>.jpg",
      "candidates": [
        {"name": "生煎包", "calories_per_100g": 248.0, "confidence": 0.74}
      ]
    }
    ```
- **Error:** `404 Not Found` if food is not recognized. `500 Internal Server Error` if there's an issue with the AI service.

### 6. My Daily Summary / Reports

#### `GET /me/summary?summary_date=YYYY-MM-DD`
返回当日摄入、运动消耗、BMR、总消耗、净值、缺口与目标。

#### `GET /me/reports?from_date=YYYY-MM-DD&to_date=YYYY-MM-DD`
返回按天序列，用于趋势图。

#### `GET /me/reports.csv?from_date=YYYY-MM-DD&to_date=YYYY-MM-DD`
导出 CSV。

## Development Setup

1.  **Clone the repository:**
    ```bash
    git clone <repository_url>
    cd <repo>/backend
    ```
2.  **Install dependencies:**
    ```bash
    pip install -r requirements.txt
    ```
3.  **Set environment variables:**
    Create a `.env` file or set environment variables for:
    - `BAIDU_API_KEY`
    - `BAIDU_SECRET_KEY`
    - `SECRET_KEY`
    (These are configured in `backend/config.py`).

4.  **Run the application:**
    ```bash
    python3 -m uvicorn backend.main:app --reload
    ```
    The API will be available at `http://localhost:8000`.

## Database

The application uses SQLite (`sql_app.db`) for local development. The database schema is defined in `backend/models.py` and is automatically created/updated on application startup if the file does not exist. If schema changes are made, you may need to delete `sql_app.db` and restart the server to apply them.
