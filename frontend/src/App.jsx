import React, { useState } from 'react';
import Header from './components/Header';
import LoanForm from './components/LoanForm';
import PredictionCard from './components/PredictionCard';
import RiskFactors from './components/RiskFactors';
import { assessRisk } from './services/api';
import './App.css';

function App() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleAssessRisk = async (borrowerData) => {
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const data = await assessRisk(borrowerData);
      setResult(data);
    } catch (err) {
      setError(err.message || 'Unable to assess risk. Please check your information and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="app-container">
      <Header />
      
      <main className="main-content">
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <div className="dashboard-grid">
          <div className="dashboard-left">
            <LoanForm onSubmit={handleAssessRisk} isLoading={isLoading} />
          </div>
          
          <div className="dashboard-right">
            {result ? (
              <>
                <PredictionCard result={result} />
                <RiskFactors explanations={result.explanations} />
              </>
            ) : (
              <div className="card">
                <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
                  <p>Enter borrower information and click "Assess Risk" to see the prediction results.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
