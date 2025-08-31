from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .chat_router import router as chat_router

app = FastAPI(title="Aadee Inc Backend")

ALLOWED_ORIGINS = [
    "https://YOUR-PROJECT.vercel.app",
    "https://aadeeinc.com",       
    "https://www.aadeeinc.com",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(chat_router, prefix="/api/chat", tags=["chat"])

@app.get("/health")
def health():
    return {"status": "ok"}
