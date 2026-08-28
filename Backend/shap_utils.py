import pandas as pd

from model_loader import explainer,preprocessor

def get_original_value(feature, loan_data):

    # Normal numerical feature
    if feature in loan_data:
        return loan_data[feature]

    # One-hot encoded feature
    if "_" in feature:
        original_feature, category = feature.split("_", 1)

        if original_feature in loan_data:
            actual_value = loan_data[original_feature]

            if actual_value == category:
                return actual_value

            return f"Not {category}"

    return None
def get_shap_explainer(loan_data):
    df = pd.DataFrame([loan_data])

    preprocessor_df = preprocessor.transform(df)

    shap_values = explainer(preprocessor_df)

    features = preprocessor.get_feature_names_out()

    features = list(map( lambda x : x.replace("num__","").replace("cat__",""),features))

    explainer_df = pd.DataFrame({
        "Feature" : features,
        "Shap Value" : shap_values.values[0]
    })

    # Sorting based on Impact of Each feature 

    explainer_df["Impact"] = explainer_df["Shap Value"].abs()

    explainer_df = explainer_df.sort_values("Impact", ascending=False)

    explainer_df["Borrower"] = explainer_df["Feature"].apply(
        lambda feature : get_original_value(feature,loan_data)
    )
    # Keep numerical features and active categorical features
    # explainer_df = explanation_df[
    #     ~(
    #         explanation_df["Feature"].str.contains("_") &
    #         (explanation_df["Borrower"].astype(str).str.startswith("Not "))
    #     )
    # ]
    # explanation_df["Impact"] = explanation_df["Shap Value"].abs()

    # explanation_df = explanation_df.sort_values(
    #     "Impact",
    #     ascending=False
    # )

    explainer_df = explainer_df[
        ~(
            explainer_df["Feature"].str.contains("_") & 
            (explainer_df["Borrower"].astype(str).str.startswith("Not "))
        )
    ]
    explainer_df["Impact"] = explainer_df["Shap Value"].abs()

    explainer_df = explainer_df.sort_values(
        "Impact",
        ascending = False
    )
    explainer_df["Impact"] = explainer_df["Shap Value"].apply(
        lambda x : "Risk Increase" if(x > 0) else "Risk Reduce"
    )

    risk_increasing = explainer_df[
        explainer_df["Shap Value"] > 0
    ].head(5)

    risk_decreasing = explainer_df[
        explainer_df["Shap Value"] < 0   
    ].head(5)

    return {
        "Risk_Increasing" : risk_increasing.to_dict(orient = "records"),
        "Risk_Decreasing" : risk_decreasing.to_dict(orient = "records")
    }
