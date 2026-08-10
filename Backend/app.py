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

    explanation_df = get_shap_explainer(loan_data)

    explanations = explanation_df[
        ["Feature", "Borrower Value", "Shap Values"]
    ].to_dict(orient="records")

    return {
        "prediction": prediction_res["prediction"],
        "default_probability": prob,
        "risk_bucket": risk,
        "explanations": explanations
    }


