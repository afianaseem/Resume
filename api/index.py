import os
import sys

# Make backend/app importable when Vercel executes this file from /api.
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "backend"))

from app.main import app  # noqa: E402
