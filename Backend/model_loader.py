import joblib
import numpy as np 
import shap

model = joblib.load("models/loan_model.pkl")

preprocessor = model.named_steps["preprocessor"]
classifier = model.named_steps["classifier"]



backeground = np.load("models/background.npy")

explainer = shap.LinearExplainer(
    classifier,
    backeground
)