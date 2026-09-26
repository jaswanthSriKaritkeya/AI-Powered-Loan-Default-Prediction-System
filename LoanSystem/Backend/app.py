from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from schemas import LoanRequest
from predictor import loanPredict
from risk_buckets import risk_bucket
from shap_utils import get_shap_explainer

from auth_router import router as auth_router
from admin_router import router as admin_router


app = FastAPI(
    title="AI-Powered Loan Underwriting System",
    description="Loan Default Prediction and Risk Monitoring Platform",
    version="1.0.0"
)


# =========================================================
# ROUTERS
# =========================================================

app.include_router(auth_router)
app.include_router(admin_router)


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