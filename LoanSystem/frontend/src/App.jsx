import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Header from './components/Header';
import LoanForm from './components/LoanForm';
import PredictionCard from './components/PredictionCard';
import RiskFactors from './components/RiskFactors';
import { assessRisk } from './services/api';
import './App.css';

const LoanPredictionPage = () => {
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
      // User requirement: "Unable to connect to the prediction service. Please make sure the FastAPI backend is running."
      // If error is network error or validation error, we show this message as a fallback if it fails completely.
      // We also handle 422 errors specifically if needed.
      if (err.message.includes('Network Error') || err.message.includes('Unable to assess risk') || !err.response) {
        setError('Unable to connect to the prediction service. Please make sure the FastAPI backend is running.');
      } else {
        setError('Unable to connect to the prediction service. Please make sure the FastAPI backend is running.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="main-content">
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <div className="dashboard-grid">
        <div className="dashboard-left">
          {/* User requirement: "Analyzing Loan Risk..." loading state */}
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
                <p>Enter borrower information and click "Predict Risk" to see the prediction results.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
};

const HomePage = () => {
  return (
    <main className="main-content">
      <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
        <h2>Welcome to Loan Default Prediction System</h2>
        <p style={{ marginTop: '1rem', marginBottom: '2rem' }}>
          Evaluate borrower risk profiles using our AI-powered model.
        </p>
        <Link to="/loan-prediction">
          <button className="btn-primary" style={{ width: 'auto' }}>
            Go to Loan Prediction
          </button>
        </Link>
      </div>
    </main>
  );
};

function App() {
  return (
    <Router>
      <div className="app-container">
        <Header />
        
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/loan-prediction" element={<LoanPredictionPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
