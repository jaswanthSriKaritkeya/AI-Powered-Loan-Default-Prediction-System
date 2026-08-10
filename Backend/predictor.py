import pandas as pd

from model_loader import model

def loanPredict(loan_data):
    df = pd.DataFrame([loan_data])

    probalilty = model.predict_proba(df)[0][1]

    prediction = model.predict(df)[0]

    return {
        "prediction" : int(prediction),
        "probability" : float(probalilty)
    }