from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.database.connection import get_db

app = FastAPI(
    title="CodeMRI API",
    description="Automated architectural scanner & code intelligence API",
    version="1.0.0"
)

# Enable CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {
        "app": "CodeMRI API",
        "status": "online",
        "version": "1.0.0"
    }

@app.get("/health")
def health(db: Session = Depends(get_db)):
    try:
        result = db.execute(text("SELECT 1 as connected, current_database() as db")).mappings().first()
        return {
            "status": "healthy",
            "database": result["db"] if result else "unknown",
            "connection": "connected"
        }
    except Exception as e:
        return {
            "status": "degraded",
            "database": "error",
            "error": str(e)
        }
