from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import inspect, text
from sqlalchemy.exc import SQLAlchemyError

from . import models
from .database import engine
from .config import settings
from .routers import (
    auth_routes,
    resume_routes,
    admin_routes,
)
from .auth import hash_password


# ---------------------------------------------------------
# Database initialization
# ---------------------------------------------------------

models.Base.metadata.create_all(bind=engine)


def _run_lightweight_migrations():

    inspector = inspect(engine)

    tables = inspector.get_table_names()

    if "resumes" in tables:

        existing_columns = {
            column["name"]
            for column in inspector.get_columns("resumes")
        }

        with engine.begin() as conn:

            if "template" not in existing_columns:
                conn.execute(
                    text(
                        """
                        ALTER TABLE resumes
                        ADD COLUMN template VARCHAR
                        NOT NULL DEFAULT 'classic'
                        """
                    )
                )

            if "color" not in existing_columns:
                conn.execute(
                    text(
                        """
                        ALTER TABLE resumes
                        ADD COLUMN color VARCHAR
                        NOT NULL DEFAULT 'violet'
                        """
                    )
                )

            if "section_order" not in existing_columns:
                conn.execute(
                    text(
                        """
                        ALTER TABLE resumes
                        ADD COLUMN section_order JSON
                        """
                    )
                )

                conn.execute(
                    text(
                        """
                        UPDATE resumes
                        SET section_order =
                        '["summary","experience","education","skills","projects"]'
                        WHERE section_order IS NULL
                        """
                    )
                )

    if "users" in tables:

        users_columns = {
            column["name"]
            for column in inspector.get_columns("users")
        }

        if "is_admin" not in users_columns:

            with engine.begin() as conn:
                conn.execute(
                    text(
                        """
                        ALTER TABLE users
                        ADD COLUMN is_admin INTEGER
                        NOT NULL DEFAULT 0
                        """
                    )
                )

        if "is_active" not in users_columns:

            with engine.begin() as conn:
                conn.execute(
                    text(
                        """
                        ALTER TABLE users
                        ADD COLUMN is_active INTEGER
                        NOT NULL DEFAULT 1
                        """
                    )
                )


_run_lightweight_migrations()


# ---------------------------------------------------------
# Admin bootstrap
# ---------------------------------------------------------

def _bootstrap_admin():

    if not settings.admin_email:
        return

    from .database import SessionLocal

    db = SessionLocal()

    try:

        user = (
            db.query(models.User)
            .filter(
                models.User.email == settings.admin_email
            )
            .first()
        )

        if user:

            if not user.is_admin:
                user.is_admin = 1
                db.commit()

            return

        if not settings.admin_password:

            print(
                "[admin] ADMIN_EMAIL is set but "
                "ADMIN_PASSWORD is empty."
            )

            return

        user = models.User(
            name="Administrator",
            email=settings.admin_email,
            hashed_password=hash_password(
                settings.admin_password
            ),
            is_admin=1,
        )

        db.add(user)
        db.commit()

        print(
            f"[admin] Created admin account: "
            f"{settings.admin_email}"
        )

    except Exception as exc:

        db.rollback()

        print(
            f"[admin] Bootstrap failed: {exc!r}"
        )

    finally:
        db.close()


_bootstrap_admin()


# ---------------------------------------------------------
# FastAPI
# ---------------------------------------------------------

app = FastAPI(
    title="Resume Builder API",
    version="1.0.0",
)


# ---------------------------------------------------------
# CORS
# ---------------------------------------------------------

app.add_middleware(
    CORSMiddleware,

    allow_origins=settings.cors_origin_list,

    allow_credentials=True,

    allow_methods=["*"],

    allow_headers=["*"],
)


# ---------------------------------------------------------
# Routes
# ---------------------------------------------------------

app.include_router(auth_routes.router)

app.include_router(resume_routes.router)

app.include_router(admin_routes.router)


# ---------------------------------------------------------
# Basic test endpoint
# ---------------------------------------------------------

@app.get("/")
def root():

    return {
        "status": "ok",
        "message": "Resume Builder API is running",
    }


# ---------------------------------------------------------
# Vercel API routing test
# ---------------------------------------------------------

@app.get("/api-test")
def api_test():

    return {
        "status": "ok",
        "message": "Vercel API routing works",
    }


# ---------------------------------------------------------
# Database health check
# ---------------------------------------------------------

@app.get("/health")
def health():

    try:

        with engine.connect() as connection:

            connection.execute(
                text("SELECT 1")
            )

        return {
            "status": "healthy",
            "database": "connected",
        }

    except SQLAlchemyError as exc:

        print(
            f"[health] Database error: {exc!r}"
        )

        raise HTTPException(
            status_code=503,
            detail=(
                "Database connection failed. "
                "Check DATABASE_URL and Supabase."
            ),
        )