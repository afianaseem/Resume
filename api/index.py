import os
import sys

# Allow Vercel to import the FastAPI backend.
sys.path.insert(
    0,
    os.path.join(os.path.dirname(__file__), "..", "backend")
)

from app.main import app as fastapi_app


async def app(scope, receive, send):
    """
    Vercel Python entry point.

    Vercel sends /api/... requests here.
    FastAPI routes are defined without the /api prefix,
    so remove /api before passing the request to FastAPI.
    """

    if scope.get("type") == "http":
        path = scope.get("path", "")

        if path == "/api":
            scope = dict(scope)
            scope["path"] = "/"

        elif path.startswith("/api/"):
            scope = dict(scope)
            scope["path"] = path[4:]

    await fastapi_app(scope, receive, send)