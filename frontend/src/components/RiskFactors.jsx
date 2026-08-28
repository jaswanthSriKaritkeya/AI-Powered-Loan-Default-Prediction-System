import React from 'react';

const FactorList = ({ title, factors, isIncreasing }) => {
  if (!factors || factors.length === 0) return null;

  return (
    <div className={`factor-section ${isIncreasing ? 'risk-increasing' : 'risk-decreasing'}`}>
      <h3 className="factor-title">{title}</h3>
      <div className="factor-list">
        {factors.map((factor, index) => {
          // Format the feature name to be more readable (e.g. "InterestRate" -> "Interest Rate")
          const featureName = factor.Feature.replace(/([A-Z])/g, ' $1').trim().replace(/_/g, ' ');
          
          return (
            <div key={index} className="factor-item card">
              <h4 className="factor-name">{featureName}</h4>
              <div className="factor-details">
                <div className="detail-row">
                  <span className="detail-label">Borrower Value:</span>
                  <span className="detail-value">{factor.Borrower}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Impact:</span>
                  <span className="detail-value impact-text">{factor.Impact}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">SHAP Value:</span>
                  <span className="detail-value">{Number(factor['Shap Value']).toFixed(4)}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const RiskFactors = ({ explanations }) => {
  if (!explanations) return null;

  const { Risk_Increasing, Risk_Decreasing } = explanations;

  return (
    <div className="risk-factors">
      <FactorList 
        title="RISK INCREASING FACTORS" 
        factors={Risk_Increasing} 
        isIncreasing={true} 
      />
      
      <FactorList 
        title="RISK REDUCING FACTORS" 
        factors={Risk_Decreasing} 
        isIncreasing={false} 
      />
    </div>
  );
};

export default RiskFactors;
