import os

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # Keep local development convenient, but never silently use SQLite on Vercel.
    secret_key: str = "insecure-dev-key-change-me"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 1440

    database_url: str = "sqlite:///./resume_builder.db"
    cors_origins: str = "http://localhost:5173"

    # Email
    smtp_host: str = ""
    smtp_port: int = 587
    smtp_user: str = ""
    smtp_password: str = ""
    smtp_from_email: str = ""
    smtp_from_name: str = "ResumeForge"
    smtp_use_tls: bool = True

    # Admin
    admin_email: str = ""
    admin_password: str = ""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    @property
    def cors_origin_list(self):
        return [
            origin.strip()
            for origin in self.cors_origins.split(",")
            if origin.strip()
        ]

    @property
    def is_vercel(self) -> bool:
        return os.getenv("VERCEL") == "1"

    @property
    def is_sqlite(self) -> bool:
        return self.database_url.lower().startswith("sqlite")

    @property
    def is_postgres(self) -> bool:
        url = self.database_url.lower()
        return url.startswith(("postgresql://", "postgres://", "postgresql+psycopg2://"))

    def validate_runtime_configuration(self) -> None:
        """Fail early with a useful message when Vercel is misconfigured."""
        if self.is_vercel:
            if self.is_sqlite:
                raise RuntimeError(
                    "DATABASE_URL is not configured for Vercel. "
                    "Set DATABASE_URL to your hosted PostgreSQL connection string "
                    "in Vercel Project Settings → Environment Variables."
                )
            if not self.is_postgres:
                raise RuntimeError(
                    "DATABASE_URL must be a PostgreSQL URL on Vercel "
                    "(for example postgresql://...)."
                )
            if self.secret_key == "insecure-dev-key-change-me":
                raise RuntimeError(
                    "SECRET_KEY is using the development default. "
                    "Set a strong random SECRET_KEY in Vercel Environment Variables."
                )


settings = Settings()
settings.validate_runtime_configuration()
