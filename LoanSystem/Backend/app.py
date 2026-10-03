from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from apscheduler.schedulers.asyncio import AsyncIOScheduler

from schemas import LoanRequest
from predictor import loanPredict
from risk_buckets import risk_bucket
from shap_utils import get_shap_explainer

from auth_router import router as auth_router
from customers_router import router as customers_router
from loans_router import router as loans_router
from dashboard_router import router as dashboard_router

from monitoring_service import monitor_due_loans


# =========================================================
# SCHEDULER
# =========================================================

scheduler = AsyncIOScheduler()


async def run_monitoring():

    print("Starting loan risk monitoring...")

    results = await monitor_due_loans()

    print("Loan risk monitoring completed.")

    for result in results:
        print(result)


@asynccontextmanager
async def lifespan(app: FastAPI):

    # Check once every day for loans
    # whose 30-day assessment is due.
    scheduler.add_job(
        run_monitoring,
        trigger="interval",
        days=1,
        id="loan_risk_monitoring",
        replace_existing=True,
        max_instances=1,
        coalesce=True
    )

    scheduler.start()

    print("Loan risk monitoring scheduler started.")

    yield

    scheduler.shutdown(wait=False)

    print("Loan risk monitoring scheduler stopped.")


# =========================================================
# FASTAPI APP
# =========================================================

app = FastAPI(
    title="AI-Powered Loan Underwriting System",
    description="Loan Default Prediction and Risk Monitoring Platform",
    version="1.0.0",
    lifespan=lifespan
)


# =========================================================
# ROUTERS
# =========================================================

app.include_router(auth_router)
app.include_router(customers_router)
app.include_router(loans_router)
app.include_router(dashboard_router)


# =========================================================
# CORS
# =========================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)


# =========================================================
# HOME
# =========================================================

@app.get("/")
def home():

    return {
        "message": "Loan Default Prediction System"
    }


# =========================================================
# PREDICTION
# =========================================================

@app.post("/predict")
def predict(request: LoanRequest):

    loan_data = request.model_dump()

    prediction_res = loanPredict(loan_data)

    prob = prediction_res["probability"]

    risk = risk_bucket(
        probablity=prob
    )

    explanations = get_shap_explainer(
        loan_data
    )

    return {
        "prediction": prediction_res["prediction"],
        "default_probability": prob,
        "risk_bucket": risk,
        "explanations": explanations
    }