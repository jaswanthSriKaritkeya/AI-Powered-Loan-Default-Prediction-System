
import React, { useState, useEffect } from 'react';
import { getLoans } from '../api/dashboard';
import RiskBadge from '../components/RiskBadge';
import { useNavigate } from 'react-router-dom';

const RiskMonitoring = () => {
    const [loans, setLoans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const fetchMonitored = async () => {
            try {
                const res = await getLoans();
                const all = Array.isArray(res.data) ? res.data : res.data.loans || [];
                setLoans(all.filter(l => l.monitoring_status === 'active'));
            } catch {
                setError('Unable to load monitored loans.');
            } finally {
                setLoading(false);
            }
        };
        fetchMonitored();
    }, []);

    if (loading) return <div>Loading risk monitoring...</div>;
    if (error) return <div className="text-red-500">{error}</div>;

    return (
        <div>
            <h1 className="text-2xl font-bold mb-6">Continuous Risk Monitoring</h1>
            {loans.length === 0 ? (
                <div className="text-gray-400">No active monitoring.</div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="min-w-full bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
                        <thead className="bg-gray-800 text-gray-400">
                            <tr>
                                <th className="py-3 px-4 text-left font-medium">Customer</th>
                                <th className="py-3 px-4 text-left font-medium">Current Risk</th>
                                <th className="py-3 px-4 text-left font-medium">Probability</th>
                                <th className="py-3 px-4 text-left font-medium">Monitoring Status</th>
                                <th className="py-3 px-4 text-left font-medium">Last Assessment</th>
                                <th className="py-3 px-4 text-left font-medium">Next Assessment</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800">
                            {loans.map(loan => {
                                const isHigh = loan.current_risk === 'High Risk' || loan.current_risk === 'Critical';
                                return (
                                    <tr 
                                        key={loan.loan_id || loan._id} 
                                        onClick={() => navigate(`/loans/${loan.loan_id || loan._id}`)}
                                        className={`cursor-pointer transition-colors ${isHigh ? 'bg-red-900/20 hover:bg-red-900/30' : 'hover:bg-gray-800'}`}
                                    >
                                        <td className="py-3 px-4">{loan.customer_name || loan.pan}</td>
                                        <td className="py-3 px-4"><RiskBadge risk={loan.current_risk} /></td>
                                        <td className={`py-3 px-4 ${isHigh ? 'text-red-400 font-bold' : ''}`}>
                                            {((loan.default_probability || 0) * 100).toFixed(1)}%
                                        </td>
                                        <td className="py-3 px-4 text-green-500 flex items-center">
                                            <span className="w-2 h-2 rounded-full bg-green-500 mr-2"></span>
                                            Active
                                        </td>
                                        <td className="py-3 px-4">{new Date(loan.last_assessment_date).toLocaleDateString()}</td>
                                        <td className="py-3 px-4">{new Date(loan.next_assessment_date).toLocaleDateString()}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};
export default RiskMonitoring;
