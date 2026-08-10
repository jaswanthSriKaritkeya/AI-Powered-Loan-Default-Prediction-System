

def risk_bucket(probablity):
    if(probablity < 0.25):
        return "Low Risk"
    elif(probablity < 0.5):
        return "Modrate Risk"
    elif(probablity < 0.75):
        return "High Risk"
    else:
        return "Critical"

print(risk_bucket(0.12))  # Low Risk
print(risk_bucket(0.32))  # Moderate Risk
print(risk_bucket(0.63))  # High Risk
print(risk_bucket(0.81))  # Critical