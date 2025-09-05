from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .chat_router import router as chat_router
from .google_oauth_router import router as oauth_router
from .actions_router import router as actions_router
from .suggestions_router import router as suggestions_router


app = FastAPI(
    title="Aadee Inc Backend - AI Business Operations Copilot",
    description="Backend API for Aadee Chat AI Business Operations Copilot",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(chat_router, prefix="/api/chat", tags=["chat"])
app.include_router(oauth_router, prefix="/api/oauth", tags=["oauth"])
app.include_router(actions_router, prefix="/api", tags=["actions"]) 
app.include_router(suggestions_router, prefix="/api", tags=["suggestions"])


@app.get("/health")
def health():
    """Health check endpoint"""
    return {"status": "ok", "service": "aadee-backend", "version": "1.0.0"}

@app.get("/")
def root():
    """Root endpoint with API information"""
    return {
        "message": "Aadee Inc AI Business Operations Copilot API",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/health"
    }
