import React from 'react';

const PredictionCard = ({ result }) => {
  if (!result) return null;

  const { prediction, default_probability, risk_bucket } = result;
  
  const isDefault = prediction === 1;
  const probabilityPercent = (default_probability * 100).toFixed(2);

  return (
    <div className="card prediction-card">
      <h2 className="card-title">Risk Assessment Result</h2>
      
      <div className="prediction-summary">
        <div className="summary-item">
          <span className="summary-label">Prediction</span>
          <span className="summary-value">{isDefault ? 'Default' : 'No Default'}</span>
        </div>
        
        <div className="summary-item">
          <span className="summary-label">Default Probability</span>
          <span className="summary-value">{probabilityPercent}%</span>
        </div>

        <div className="summary-item highlight">
          <span className="summary-label">Risk Bucket</span>
          <span className={`summary-value risk-${risk_bucket.toLowerCase().replace(' ', '-')}`}>
            {risk_bucket}
          </span>
        </div>
      </div>
    </div>
  );
};

export default PredictionCard;
