import pandas as pd

from model_loader import explainer,preprocessor

def get_shap_explainer(loan_data):
    df = pd.DataFrame([loan_data])

    preprocessor_df = preprocessor.transform(df)

    shap_values = explainer(preprocessor_df)

    features = preprocessor.get_feature_names_out()

    features = list(map( lambda x : x.replace("num__","").replace("cat__",""),features))

    explainer_df = pd.DataFrame({
        "Feature" : features,
        "Shap Values" : shap_values.values[0],
        "Borrower Value" : preprocessor_df[0]
    })

    # Sorting based on Impact of Each feature 

    explainer_df["Impact"] = explainer_df["Shap Values"].abs()

    explainer_df = explainer_df.sort_values("Impact", ascending=False)

    explainer_df["Impact"] = explainer_df["Shap Value"].apply(
    lambda x: "Increases Risk" if x > 0 else "Reduces Risk"
)

    return explainer_df.head(10)
