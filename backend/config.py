import os

from pydantic import BaseSettings


def _load_env_file(path: str) -> None:
    try:
        with open(path, "r", encoding="utf-8") as f:
            for raw in f:
                line = raw.strip()
                if not line or line.startswith("#"):
                    continue
                if "=" not in line:
                    continue
                k, v = line.split("=", 1)
                k = k.strip()
                v = v.strip().strip("'").strip('"')
                if not k:
                    continue
                if k not in os.environ:
                    os.environ[k] = v
    except FileNotFoundError:
        return


_ROOT_ENV = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".env"))
_load_env_file(_ROOT_ENV)


class Settings(BaseSettings):
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./backend/sql_app.db")

    CORS_ALLOW_ORIGIN_REGEX: str = os.getenv("CORS_ALLOW_ORIGIN_REGEX", r"^https?://(localhost|127\.0\.0\.1)(:\d+)?$")
    CORS_ALLOW_CREDENTIALS: bool = os.getenv("CORS_ALLOW_CREDENTIALS", "0") == "1"

    BAIDU_API_KEY: str = os.getenv("BAIDU_API_KEY", "")
    BAIDU_SECRET_KEY: str = os.getenv("BAIDU_SECRET_KEY", "")
    BAIDU_DISH_TOP_NUM: int = int(os.getenv("BAIDU_DISH_TOP_NUM", "10"))
    BAIDU_DISH_FILTER_THRESHOLD: float = float(os.getenv("BAIDU_DISH_FILTER_THRESHOLD", "0.0"))
    BAIDU_DISH_FALLBACK_THRESHOLD: float = float(os.getenv("BAIDU_DISH_FALLBACK_THRESHOLD", "0.2"))
    BAIDU_GENERAL_APPLE_THRESHOLD: float = float(os.getenv("BAIDU_GENERAL_APPLE_THRESHOLD", "0.3"))

    MAX_UPLOAD_BYTES: int = int(os.getenv("MAX_UPLOAD_BYTES", "5242880"))

    SECRET_KEY: str = os.getenv("SECRET_KEY", "change-me")
    ALGORITHM: str = os.getenv("ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))

    FATSECRET_CLIENT_KEY: str = os.getenv("FATSECRET_CLIENT_KEY", "")
    FATSECRET_CLIENT_SECRET: str = os.getenv("FATSECRET_CLIENT_SECRET", "")


settings = Settings()
