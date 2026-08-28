from fastapi import FastAPI

from schemas import LoanRequest
from predictor import loanPredict
from risk_buckets import risk_bucket
from shap_utils import get_shap_explainer

app = FastAPI()

@app.get('/')
def home():
    return {
        "message" : "Loan Default Prediction System"
    }

@app.post('/predict')
def predict(request : LoanRequest):

    loan_data = request.model_dump()

    prediction_res = loanPredict(loan_data)

    prob = prediction_res["probability"]

    risk = risk_bucket(probablity=prob)

    explanations = get_shap_explainer(loan_data)

    return {
        "prediction": prediction_res["prediction"],
        "default_probability": prob,
        "risk_bucket": risk,
        "explanations": explanations
    }


