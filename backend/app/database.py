from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from sqlalchemy.pool import QueuePool, StaticPool

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
# Connection settings
# ---------------------------------------------------------

connect_args = {}


if database_url.startswith("sqlite"):

    connect_args = {
        "check_same_thread": False
    }


elif database_url.startswith("postgresql+psycopg2://"):

    connect_args = {
        "sslmode": "require",
        "connect_timeout": 5,
        "application_name": "resumeforge",
    }


# ---------------------------------------------------------
# SQLAlchemy engine
# ---------------------------------------------------------

engine_kwargs = {
    "pool_pre_ping": True,
}


if database_url.startswith("postgresql+psycopg2://"):

    # IMPORTANT FOR VERCEL
    #
    # Reuse a small connection pool on warm serverless
    # instances instead of creating a new PostgreSQL
    # connection for every request.
    engine_kwargs.update({
        "poolclass": QueuePool,
        "pool_size": 1,
        "max_overflow": 0,
        "pool_timeout": 5,
        "pool_recycle": 300,
    })


elif database_url.startswith("sqlite"):

    engine_kwargs["poolclass"] = StaticPool


engine = create_engine(
    database_url,
    connect_args=connect_args,
    **engine_kwargs,
)


# ---------------------------------------------------------
# Session
# ---------------------------------------------------------

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    expire_on_commit=False,
    bind=engine,
)


Base = declarative_base()


# ---------------------------------------------------------
# Database dependency
# ---------------------------------------------------------

def get_db():

    db = SessionLocal()

    try:

        yield db

    finally:

        db.close()
