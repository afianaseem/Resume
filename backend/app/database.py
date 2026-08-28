from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from sqlalchemy.pool import NullPool

from .config import settings


database_url = settings.database_url.strip()


# ---------------------------------------------------------
# Normalize PostgreSQL URLs
# ---------------------------------------------------------

if database_url.startswith("postgres://"):
    database_url = (
        "postgresql+psycopg2://"
        + database_url[len("postgres://"):]
    )

elif database_url.startswith("postgresql://"):
    database_url = (
        "postgresql+psycopg2://"
        + database_url[len("postgresql://"):]
    )


# ---------------------------------------------------------
# Database connection settings
# ---------------------------------------------------------

connect_args = {}

if database_url.startswith("sqlite"):
    connect_args = {
        "check_same_thread": False
    }

elif database_url.startswith("postgresql+psycopg2://"):

    # Supabase requires SSL.
    if "sslmode=" not in database_url.lower():
        connect_args["sslmode"] = "require"

    # Don't let a dead database connection hang a Vercel function.
    connect_args["connect_timeout"] = 10


# ---------------------------------------------------------
# SQLAlchemy engine
# ---------------------------------------------------------

engine_kwargs = {
    "pool_pre_ping": True,
}


# Vercel functions are short-lived.
# NullPool prevents stale connections between invocations.
if (
    database_url.startswith("postgresql+psycopg2://")
    and settings.is_vercel
):
    engine_kwargs["poolclass"] = NullPool


engine = create_engine(
    database_url,
    connect_args=connect_args,
    **engine_kwargs,
)


SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)


Base = declarative_base()


def get_db():
    db = SessionLocal()

    try:
        yield db

    finally:
        db.close()