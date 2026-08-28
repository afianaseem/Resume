from sqlalchemy import inspect, text
from sqlalchemy.exc import SQLAlchemyError
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from . import models
from .database import engine
from .config import settings
from .routers import auth_routes, resume_routes, admin_routes
from .auth import hash_password

# Creates the SQLite tables automatically on first run. For a production
# app you'd normally use a migration tool (Alembic), but this keeps the
# MVP simple and free to run anywhere.
models.Base.metadata.create_all(bind=engine)


def _run_lightweight_migrations():
    """
    create_all() only creates missing tables — it never alters an
    existing table. Since a resume_builder.db may already exist from
    before the `template` column was added, patch it in here so
    existing installs / data don't need to be wiped.
    """
    inspector = inspect(engine)
    if "resumes" not in inspector.get_table_names():
        return

    existing_columns = {col["name"] for col in inspector.get_columns("resumes")}
    with engine.begin() as conn:
        if "template" not in existing_columns:
            conn.execute(text("ALTER TABLE resumes ADD COLUMN template VARCHAR NOT NULL DEFAULT 'classic'"))
        if "color" not in existing_columns:
            conn.execute(text("ALTER TABLE resumes ADD COLUMN color VARCHAR NOT NULL DEFAULT 'violet'"))
        if "section_order" not in existing_columns:
            conn.execute(text("ALTER TABLE resumes ADD COLUMN section_order JSON"))
            conn.execute(text("""UPDATE resumes SET section_order='["summary","experience","education","skills","projects"]' WHERE section_order IS NULL"""))

    users_columns = {col["name"] for col in inspector.get_columns("users")}
    if "is_admin" not in users_columns:
        with engine.begin() as conn:
            conn.execute(text("ALTER TABLE users ADD COLUMN is_admin INTEGER NOT NULL DEFAULT 0"))
    if "is_active" not in users_columns:
        with engine.begin() as conn:
            conn.execute(text("ALTER TABLE users ADD COLUMN is_active INTEGER NOT NULL DEFAULT 1"))


_run_lightweight_migrations()


def _bootstrap_admin():
    if not settings.admin_email:
        return
    from .database import SessionLocal
    db = SessionLocal()
    try:
        user = db.query(models.User).filter(models.User.email == settings.admin_email).first()
        if user:
            if not user.is_admin:
                user.is_admin = 1
                db.commit()
            return
        if not settings.admin_password:
            print("[admin] ADMIN_EMAIL is set but ADMIN_PASSWORD is empty; admin account was not created.")
            return
        user = models.User(name="Administrator", email=settings.admin_email,
                           hashed_password=hash_password(settings.admin_password), is_admin=1)
        db.add(user)
        db.commit()
        print(f"[admin] Created admin account: {settings.admin_email}")
    finally:
        db.close()

_bootstrap_admin()

app = FastAPI(title="Resume Builder API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_routes.router)
app.include_router(resume_routes.router)
app.include_router(admin_routes.router)


@app.get("/")
def root():
    return {"status": "ok", "message": "Resume Builder API is running"}


@app.get("/health")
def health():
    """Health endpoint that also verifies the database connection."""
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
        return {"status": "healthy", "database": "connected"}
    except SQLAlchemyError:
        return {"status": "degraded", "database": "unavailable"}
