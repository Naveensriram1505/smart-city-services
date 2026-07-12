from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config.settings import settings
from app.database.database import Base, engine
from app.routers import ai, auth, complaints, services

app = FastAPI(title="Smart City Services API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

Base.metadata.create_all(bind=engine)

app.include_router(auth.router)
app.include_router(complaints.router)
app.include_router(services.router)
app.include_router(ai.router)


@app.get("/health")
def health():
    return {"status": "ok"}
