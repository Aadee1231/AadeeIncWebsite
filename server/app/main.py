# backend/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Aadee Inc. API", version="0.1.0")

# CORS (adjust to your Vercel domain in prod)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # tighten later
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Optional routers you may already have
try:
    from chat_router import router as chat_router
    app.include_router(chat_router, prefix="/chat", tags=["chat"])
except Exception as e:
    print("chat_router not loaded:", e)

try:
    from google_oauth_router import router as google_oauth_router
    app.include_router(google_oauth_router, prefix="/oauth", tags=["oauth"])
except Exception as e:
    print("google_oauth_router not loaded:", e)

# New routers
from actions_router import router as actions_router
from actions_router import auth_router

app.include_router(auth_router, prefix="/auth", tags=["auth"])
app.include_router(actions_router, prefix="/actions", tags=["actions"])

@app.get("/")
def root():
    return {"ok": True, "service": "Aadee Inc. API"}
