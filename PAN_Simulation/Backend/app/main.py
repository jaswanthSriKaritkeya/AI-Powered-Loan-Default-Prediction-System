from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes.pan import router as pan_router


app = FastAPI(
    title="Simulated PAN Provider",
    description="Simulated external customer information provider",
    version="1.0.0"
)


# Allow requests from React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(pan_router)


@app.get("/")
def home():
    return {
        "message": "Simulated PAN Provider is running"
    }