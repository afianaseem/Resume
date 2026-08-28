import os
import sys


# ---------------------------------------------------------
# Make the backend package importable
# ---------------------------------------------------------

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

BACKEND_DIR = os.path.join(
    ROOT_DIR,
    "backend",
)

if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)


# ---------------------------------------------------------
# Import FastAPI application
# ---------------------------------------------------------

from app.main import app as fastapi_app


# ---------------------------------------------------------
# Vercel ASGI entry point
# ---------------------------------------------------------

async def app(scope, receive, send):

    if scope.get("type") == "http":

        path = scope.get("path", "")

        # Vercel sends:
        #
        # /api/auth/signup
        #
        # FastAPI expects:
        #
        # /auth/signup

        if path == "/api":

            scope = dict(scope)

            scope["path"] = "/"

        elif path.startswith("/api/"):

            scope = dict(scope)

            scope["path"] = path[4:]


    await fastapi_app(
        scope,
        receive,
        send,
    )