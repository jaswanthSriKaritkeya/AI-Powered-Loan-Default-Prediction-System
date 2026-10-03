import React, { useState } from 'react';
import api from '../api/client';
import { useNavigate } from 'react-router-dom';

const Customers = () => {
  const [pan, setPan] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [customer, setCustomer] = useState(null);
  const [assessment, setAssessment] = useState(null);
  
  const [loanData, setLoanData] = useState({
    LoanAmount: 500000,
    InterestRate: 10.5,
    LoanTerm: 60,
    LoanPurpose: 'Personal',
    HasCoSigner: 'No'
  });
  
  const [assessing, setAssessing] = useState(false);
  const [creating, setCreating] = useState(false);
  const navigate = useNavigate();

  const handleFetchCustomer = async (e) => {
    e.preventDefault();
    if (!pan) return;
    
    setLoading(true);
    setError(null);
    setCustomer(null);
    setAssessment(null);
    
    try {
      const formattedPan = pan.toUpperCase().trim();
      const res = await api.post(`/customers/fetch-pan?pan=${formattedPan}`);
      setCustomer(res.data.customer || res.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to fetch customer. PAN service may be unavailable.');
    } finally {
      setLoading(false);
    }
  };

  const handleAssess = async (e) => {
    e.preventDefault();
    setAssessing(true);
    setError(null);
    
    try {
      const res = await api.post(`/customers/assess-by-pan?pan=${customer.pan}`, loanData);
      setAssessment(res.data.assessment);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to assess risk.');
    } finally {
      setAssessing(false);
    }
  };

  const handleCreateLoan = async () => {
    setCreating(true);
    setError(null);
    try {
      const res = await api.post('/loans/', {
        pan: customer.pan,
        loan_amount: Number(loanData.LoanAmount),
        interest_rate: Number(loanData.InterestRate),
        loan_term: Number(loanData.LoanTerm),
        loan_purpose: loanData.LoanPurpose,
        has_cosigner: loanData.HasCoSigner
      });
      navigate(`/loans/${res.data.loan._id || res.data.loan.loan_id || res.data.loan.id}`);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create loan.');
      setCreating(false);
    }
  };

  const renderRiskBadge = (risk) => {
    const colors = {
      'Low Risk': 'bg-green-900/50 text-green-400 border-green-500/50',
      'Moderate Risk': 'bg-yellow-900/50 text-yellow-400 border-yellow-500/50',
      'High Risk': 'bg-orange-900/50 text-orange-400 border-orange-500/50',
      'Critical': 'bg-red-900/50 text-red-400 border-red-500/50'
    };
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${colors[risk] || 'bg-gray-800 text-gray-300'}`}>
        {risk}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white tracking-tight">Customers</h1>

      <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 shadow-sm max-w-xl">
        <form onSubmit={handleFetchCustomer}>
          <label className="block text-sm font-medium text-gray-300 mb-2">Fetch Customer Using PAN</label>
          <div className="flex space-x-3">
            <input
              type="text"
              value={pan}
              onChange={(e) => setPan(e.target.value)}
              placeholder="e.g. ABCDE1234F"
              className="flex-1 bg-gray-900 border border-gray-700 rounded-md px-4 py-2 text-white focus:outline-none focus:ring-1 focus:ring-gray-500 uppercase"
              required
            />
            <button
              type="submit"
              disabled={loading || !pan}
              className="bg-white text-black px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-200 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Fetching...' : 'Fetch Customer'}
            </button>
          </div>
        </form>
        {error && <div className="mt-4 text-sm text-red-400 bg-red-900/20 p-3 rounded border border-red-800">{error}</div>}
      </div>

      {customer && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 shadow-sm">
            <h2 className="text-lg font-medium text-white mb-4 border-b border-gray-700 pb-2">Customer Information</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-gray-400">Name</span><span className="text-white font-medium">{customer.name || 'N/A'}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">PAN</span><span className="text-white font-medium">{customer.pan}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">ID</span><span className="text-white font-mono text-xs">{customer._id}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Credit Score</span><span className="text-white font-medium">{customer.credit_score || 'N/A'}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Income</span><span className="text-white font-medium">₹{customer.income?.toLocaleString() || 'N/A'}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Employment</span><span className="text-white font-medium">{customer.employment_type || 'N/A'}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Months Employed</span><span className="text-white font-medium">{customer.months_employed || 'N/A'}</span></div>
            </div>
          </div>

          <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 shadow-sm">
            <h2 className="text-lg font-medium text-white mb-4 border-b border-gray-700 pb-2">Assess Loan Risk</h2>
            <form onSubmit={handleAssess} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Loan Amount</label>
                  <input type="number" value={loanData.LoanAmount} onChange={e => setLoanData({...loanData, LoanAmount: e.target.value})} className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-1.5 text-white text-sm focus:outline-none" required />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Interest Rate (%)</label>
                  <input type="number" step="0.1" value={loanData.InterestRate} onChange={e => setLoanData({...loanData, InterestRate: e.target.value})} className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-1.5 text-white text-sm focus:outline-none" required />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Loan Term (months)</label>
                  <input type="number" value={loanData.LoanTerm} onChange={e => setLoanData({...loanData, LoanTerm: e.target.value})} className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-1.5 text-white text-sm focus:outline-none" required />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Loan Purpose</label>
                  <select value={loanData.LoanPurpose} onChange={e => setLoanData({...loanData, LoanPurpose: e.target.value})} className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-1.5 text-white text-sm focus:outline-none">
                    <option value="Personal">Personal</option>
                    <option value="Auto">Auto</option>
                    <option value="Home">Home</option>
                    <option value="Education">Education</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Has Co-signer</label>
                  <select value={loanData.HasCoSigner} onChange={e => setLoanData({...loanData, HasCoSigner: e.target.value})} className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-1.5 text-white text-sm focus:outline-none">
                    <option value="No">No</option>
                    <option value="Yes">Yes</option>
                  </select>
                </div>
              </div>
              <button type="submit" disabled={assessing} className="w-full bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-md text-sm font-medium transition-colors disabled:opacity-50">
                {assessing ? 'Assessing Risk...' : 'Run Pre-Loan Assessment'}
              </button>
            </form>

            {assessment && (
              <div className="mt-6 bg-gray-900 p-4 rounded border border-gray-700">
                <h3 className="text-sm font-semibold text-gray-300 mb-3 uppercase tracking-wider">AI Risk Assessment</h3>
                <div className="flex justify-between items-center mb-4">
                  <span className="text-gray-400 text-sm">Risk Bucket</span>
                  {renderRiskBadge(assessment.risk_bucket)}
                </div>
                <div className="flex justify-between items-center mb-4">
                  <span className="text-gray-400 text-sm">Default Probability</span>
                  <span className="text-white font-medium text-lg">{(assessment.default_probability * 100).toFixed(1)}%</span>
                </div>
                
                {assessment.explanations && assessment.explanations.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wider">Why this risk?</h4>
                    <ul className="text-sm text-gray-300 space-y-1 list-disc pl-4">
                      {assessment.explanations.map((exp, i) => (
                        <li key={i}>{exp}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                <button 
                  onClick={handleCreateLoan} 
                  disabled={creating}
                  className="w-full bg-white text-black py-2 rounded-md text-sm font-medium hover:bg-gray-200 transition-colors disabled:opacity-50 mt-2"
                >
                  {creating ? 'Creating...' : 'Create Loan Application'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Customers;
