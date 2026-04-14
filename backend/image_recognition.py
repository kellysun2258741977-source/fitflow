
import time
import requests
import base64
from backend.config import settings

_token_cache = {"token": None, "exp": 0.0}


def get_access_token():
    if not settings.BAIDU_API_KEY or not settings.BAIDU_SECRET_KEY:
        return None

    now = time.time()
    token = _token_cache["token"]
    exp = _token_cache["exp"]
    if token and exp - now > 60:
        return token

    url = "https://aip.baidubce.com/oauth/2.0/token"
    params = {
        "grant_type": "client_credentials",
        "client_id": settings.BAIDU_API_KEY,
        "client_secret": settings.BAIDU_SECRET_KEY
    }
    try:
        response = requests.post(url, params=params, timeout=10)
        response.raise_for_status()
        data = response.json() or {}
        token = data.get("access_token")
        expires_in = float(data.get("expires_in") or 0)
        if token:
            _token_cache["token"] = token
            _token_cache["exp"] = now + expires_in
        return token
    except requests.exceptions.RequestException as e:
        print(f"Error getting access token: {e}")
        return None

# 调用百度 AI 菜品识别 API
def recognize_dish(image_base64: str) -> dict:
    access_token = get_access_token()
    if not access_token:
        return {"error": "Baidu credentials not configured or failed to get access token"}

    request_url = "https://aip.baidubce.com/rest/2.0/image-classify/v2/dish"
    params = {"access_token": access_token}
    headers = {'Content-Type': 'application/x-www-form-urlencoded'}
    data = {
        'image': image_base64,
        'top_num': int(settings.BAIDU_DISH_TOP_NUM),
        'filter_threshold': float(settings.BAIDU_DISH_FILTER_THRESHOLD),
    }

    try:
        response = requests.post(request_url, headers=headers, params=params, data=data, timeout=30)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f"Error recognizing dish: {e}")
        return {"error": f"Failed to recognize dish: {e}"}


def recognize_advanced_general(image_base64: str) -> dict:
    access_token = get_access_token()
    if not access_token:
        return {"error": "Baidu credentials not configured or failed to get access token"}

    request_url = "https://aip.baidubce.com/rest/2.0/image-classify/v2/advanced_general"
    params = {"access_token": access_token}
    headers = {'Content-Type': 'application/x-www-form-urlencoded'}
    data = {'image': image_base64, 'baike_num': 0}

    try:
        response = requests.post(request_url, headers=headers, params=params, data=data, timeout=30)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f"Error in advanced_general: {e}")
        return {"error": f"Failed advanced_general: {e}"}
