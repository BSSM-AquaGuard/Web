from datetime import timedelta
from pydantic import Field
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    app_name: str = "Aqua-Quad API"
    secret_key: str = Field("super-secret-change-me", env="AQUA_SECRET_KEY")
    access_token_expire_minutes: int = Field(60 * 24, env="AQUA_TOKEN_EXPIRE_MIN")
    sqlite_path: str = Field("backend/aqua_quad.db", env="AQUA_SQLITE_PATH")
    cors_origins: str = Field("http://localhost:5173,http://127.0.0.1:5173", env="AQUA_CORS_ORIGINS")
    admin_email: str = Field("admin@aqua.local", env="AQUA_ADMIN_EMAIL")
    admin_password: str = Field("admin1234", env="AQUA_ADMIN_PASSWORD")

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]

    @property
    def access_token_expire(self) -> timedelta:
        return timedelta(minutes=self.access_token_expire_minutes)


settings = Settings()
