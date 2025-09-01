from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .chat_router import router as chat_router
from .google_oauth_router import router as oauth_router

app = FastAPI(title="Aadee Inc Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # tighten to your domain later
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(chat_router, prefix="/api/chat", tags=["chat"])
app.include_router(oauth_router, prefix="/api/oauth", tags=["oauth"])

@app.get("/health")
def health():
    return {"status": "ok"}
