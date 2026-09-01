from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError

from .config import settings
from .database import engine, ensure_schema

from .routers import (
    auth_routes,
    resume_routes,
    admin_routes,
)


# ---------------------------------------------------------
# FastAPI
# ---------------------------------------------------------

app = FastAPI(
    title="Resume Builder API",
    version="1.0.0",
)


@app.on_event("startup")
def upgrade_database_schema():
    ensure_schema()


# ---------------------------------------------------------
# CORS
# ---------------------------------------------------------

app.add_middleware(
    CORSMiddleware,

    allow_origins=settings.cors_origin_list,

    allow_credentials=True,

    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],

    allow_headers=["Authorization", "Content-Type", "Accept"],
)


# ---------------------------------------------------------
# Routes
# ---------------------------------------------------------

app.include_router(
    auth_routes.router
)

app.include_router(
    resume_routes.router
)

app.include_router(
    admin_routes.router
)


# ---------------------------------------------------------
# Root
# ---------------------------------------------------------

@app.get("/")
def root():

    return {
        "status": "ok",
        "message": "Resume Builder API is running",
    }


# ---------------------------------------------------------
# API test
# ---------------------------------------------------------

@app.get("/api-test")
def api_test():

    return {
        "status": "ok",
        "message": "Vercel API routing works",
    }


# ---------------------------------------------------------
# Database health
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
