"""
AI Code Assistant -- FastAPI backend entrypoint.

Run locally with:
    cd backend
    pip install -r requirements.txt
    uvicorn main:app --reload --port 8000

The frontend (in ../frontend) talks to this API. By default it expects the
API at http://localhost:8000 -- see frontend/js/api.js to change that.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager

from database import init_db
from routes import chat, code, history


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield


app = FastAPI(
    title="AI Code Assistant API",
    description="Backend for the AI Code Assistant -- code generation, "
    "debugging, optimization, explanation, complexity analysis, "
    "conversion, docs, and security scanning.",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # tighten this to your real frontend origin in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(chat.router)
app.include_router(code.router)
app.include_router(history.router)


@app.get("/", tags=["Status"])
def api_status():
    """Simple health/status endpoint the frontend's top-nav polls."""
    return {"status": "online", "service": "AI Code Assistant API", "version": "1.0.0"}


# Optionally serve the static frontend directly from FastAPI so the whole
# app can run from a single process during local development:
#   uncomment the two lines below once you've built/placed the frontend.
#
# app.mount("/uploads", StaticFiles(directory="../uploads"), name="uploads")
# app.mount("/", StaticFiles(directory="../frontend", html=True), name="frontend")
