from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from sqlalchemy.pool import NullPool

from .config import settings


database_url = settings.database_url.strip()

# Some providers still display the legacy postgres:// scheme. Normalize it so
# SQLAlchemy consistently uses the installed psycopg2 driver.
if database_url.startswith("postgres://"):
    database_url = "postgresql+psycopg2://" + database_url[len("postgres://") :]

connect_args = {}
if database_url.startswith("sqlite"):
    connect_args = {"check_same_thread": False}
elif database_url.startswith(("postgresql://", "postgresql+psycopg2://")):
    # Hosted PostgreSQL providers generally require TLS. Do not override an
    # explicit sslmode supplied by the provider's connection string.
    if "sslmode=" not in database_url.lower() and settings.is_vercel:
        connect_args["sslmode"] = "require"
    connect_args["connect_timeout"] = 10

# Vercel functions are short-lived. Avoid holding a SQLAlchemy connection pool
# across invocations; this also reduces stale-connection problems with hosted
# PostgreSQL services such as Neon/Supabase.
engine_kwargs = {
    "pool_pre_ping": True,
}
if database_url.startswith(("postgresql://", "postgresql+psycopg2://")) and settings.is_vercel:
    engine_kwargs["poolclass"] = NullPool

engine = create_engine(database_url, connect_args=connect_args, **engine_kwargs)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
