import React, { useState } from 'react';
import { createLoan } from '../api/loans';
import { assessByPan } from '../api/customers';
import RiskBadge from './RiskBadge';
import ShapExplanation from './ShapExplanation';
import { useNavigate } from 'react-router-dom';

const NewLoanModal = ({ customer, onClose }) => {
    const [loanAmount, setLoanAmount] = useState(500000);
    const [interestRate, setInterestRate] = useState(10.5);
    const [loanTerm, setLoanTerm] = useState(60);
    const [loanPurpose, setLoanPurpose] = useState('Personal');
    const [hasCoSigner, setHasCoSigner] = useState('No');
    
    const [assessment, setAssessment] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleAssess = async () => {
        setLoading(true);
        setError('');
        try {
            const data = {
                LoanAmount: Number(loanAmount),
                InterestRate: Number(interestRate),
                LoanTerm: Number(loanTerm),
                LoanPurpose: loanPurpose,
                HasCoSigner: hasCoSigner
            };
            const res = await assessByPan(customer.pan, data);
            setAssessment(res.data.assessment);
        } catch (err) {
            setError(err.response?.data?.detail || 'Assessment failed.');
        } finally {
            setLoading(false);
        }
    };

    const handleApply = async () => {
        setLoading(true);
        setError('');
        try {
            const data = {
                pan: customer.pan,
                loan_amount: Number(loanAmount),
                interest_rate: Number(interestRate),
                loan_term: Number(loanTerm),
                loan_purpose: loanPurpose,
                has_cosigner: hasCoSigner
            };
            const res = await createLoan(data);
            onClose();
            // Always navigate using the business loan_id, never _id
            navigate(`/loans/${res.data.loan.loan_id}`);
        } catch (err) {
            setError(err.response?.data?.detail || 'Loan creation failed.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-900 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-gray-800 flex flex-col shadow-2xl">
                <div className="p-6 border-b border-gray-800 flex justify-between items-center bg-gray-800">
                    <h2 className="text-xl font-bold">New Loan Application</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl leading-none">&times;</button>
                </div>
                
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Customer Info (Read Only) */}
                    <div>
                        <h3 className="text-lg font-bold mb-4 text-gray-300 border-b border-gray-800 pb-2">Customer Information</h3>
                        <div className="space-y-3 text-sm">
                            <div><label className="text-gray-500">PAN:</label> <span className="font-medium">{customer.pan}</span></div>
                            <div><label className="text-gray-500">Name:</label> <span className="font-medium">{customer.name}</span></div>
                            <div><label className="text-gray-500">Credit Score:</label> <span className="font-medium">{customer.credit_score}</span></div>
                            <div><label className="text-gray-500">Income:</label> <span className="font-medium">${customer.income?.toLocaleString()}</span></div>
                            <div><label className="text-gray-500">Employment:</label> <span className="font-medium">{customer.employment_type} ({customer.months_employed} mos)</span></div>
                            <div><label className="text-gray-500">DTI Ratio:</label> <span className="font-medium">{customer.dti_ratio}</span></div>
                        </div>
                    </div>
                    
                    {/* Loan Details Form */}
                    <div>
                        <h3 className="text-lg font-bold mb-4 text-gray-300 border-b border-gray-800 pb-2">Loan Details</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-gray-400 text-xs font-bold mb-1">Loan Amount</label>
                                <input type="number" value={loanAmount} onChange={e => setLoanAmount(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded p-2 text-white" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-gray-400 text-xs font-bold mb-1">Interest Rate (%)</label>
                                    <input type="number" step="0.1" value={interestRate} onChange={e => setInterestRate(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded p-2 text-white" />
                                </div>
                                <div>
                                    <label className="block text-gray-400 text-xs font-bold mb-1">Loan Term (months)</label>
                                    <input type="number" value={loanTerm} onChange={e => setLoanTerm(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded p-2 text-white" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-gray-400 text-xs font-bold mb-1">Loan Purpose</label>
                                    <select value={loanPurpose} onChange={e => setLoanPurpose(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded p-2 text-white">
                                        <option>Personal</option>
                                        <option>Home</option>
                                        <option>Auto</option>
                                        <option>Education</option>
                                        <option>Business</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-gray-400 text-xs font-bold mb-1">Co-Signer</label>
                                    <select value={hasCoSigner} onChange={e => setHasCoSigner(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded p-2 text-white">
                                        <option>No</option>
                                        <option>Yes</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                        
                        {error && <div className="mt-4 text-red-500 text-sm">{error}</div>}
                        
                        <div className="mt-6 flex space-x-3">
                            <button onClick={handleAssess} disabled={loading} className="flex-1 bg-gray-700 hover:bg-gray-600 p-2 rounded text-white transition-colors disabled:opacity-50">
                                Assess Risk First
                            </button>
                            <button onClick={handleApply} disabled={loading} className="flex-1 bg-blue-600 hover:bg-blue-700 p-2 rounded text-white font-bold transition-colors disabled:opacity-50">
                                Submit Application
                            </button>
                        </div>
                    </div>
                </div>

                {assessment && (
                    <div className="p-6 bg-gray-800 border-t border-gray-700 rounded-b-lg">
                        <h3 className="text-lg font-bold mb-4 text-center tracking-wide uppercase text-gray-200">
                            AI Risk Assessment
                        </h3>

                        {/* Risk summary row */}
                        <div className="flex flex-col md:flex-row justify-center items-center gap-8 mb-6 py-4 bg-gray-900/50 rounded-lg border border-gray-700">
                            <div className="text-center">
                                <span className="text-gray-400 text-xs uppercase tracking-widest block mb-2">Risk Classification</span>
                                <RiskBadge risk={assessment.risk_bucket} />
                            </div>
                            <div className="text-center">
                                <span className="text-gray-400 text-xs uppercase tracking-widest block mb-1">Default Probability</span>
                                <span className="text-3xl font-bold text-white">
                                    {((assessment.default_probability || 0) * 100).toFixed(1)}%
                                </span>
                            </div>
                            <div className="text-center">
                                <span className="text-gray-400 text-xs uppercase tracking-widest block mb-1">Prediction</span>
                                <span className={`font-bold text-sm ${assessment.prediction === 1 ? 'text-red-400' : 'text-green-400'}`}>
                                    {assessment.prediction === 1 ? 'Potential Default' : 'Likely No Default'}
                                </span>
                            </div>
                        </div>

                        {/* SHAP Explanation — uses actual backend structure */}
                        <ShapExplanation
                            explanations={assessment.explanations}
                            title="What factors influenced this pre-loan risk assessment?"
                        />
                    </div>
                )}
            </div>
        </div>
    );
};
export default NewLoanModal;

