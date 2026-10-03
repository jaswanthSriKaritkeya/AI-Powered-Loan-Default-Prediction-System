import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import { FiChevronRight, FiSearch } from 'react-icons/fi';

const Loans = () => {
  const [loans, setLoans]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchLoans();
  }, []);

  const fetchLoans = async () => {
    try {
      setLoading(true);
      const res = await api.get('/dashboard/loans');
      setLoans(res.data.loans || res.data);
      setError(null);
    } catch {
      setError('Failed to load loans.');
    } finally {
      setLoading(false);
    }
  };

  const renderRiskBadge = (risk) => {
    const colors = {
      'Low Risk':     'bg-green-900/50 text-green-400 border-green-500/50',
      'Moderate Risk':'bg-yellow-900/50 text-yellow-400 border-yellow-500/50',
      'High Risk':    'bg-orange-900/50 text-orange-400 border-orange-500/50',
      'Critical':     'bg-red-900/50 text-red-400 border-red-500/50',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${colors[risk] || 'bg-gray-800 text-gray-300 border-gray-600'}`}>
        {risk || 'Unknown'}
      </span>
    );
  };

  const fmtDate = (d) =>
    d ? new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : null;

  // Search across PAN, loan_id, status and current_risk
  const filteredLoans = loans.filter(loan =>
    (loan.pan        || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (loan.loan_id    || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (loan.status     || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (loan.current_risk || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header + search */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-white tracking-tight">Loans</h1>
        <div className="relative">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            placeholder="Search PAN, Loan ID, risk, status…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded-md pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-gray-500 w-72"
          />
        </div>
      </div>

      <div className="bg-gray-800 rounded-lg border border-gray-700 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400">Loading loans…</div>
        ) : error ? (
          <div className="p-8 text-center text-red-400">{error}</div>
        ) : filteredLoans.length === 0 ? (
          <div className="p-8 text-center text-gray-400">No loans found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-900/50 text-gray-400 text-xs uppercase tracking-wider border-b border-gray-700">
                  <th className="px-6 py-4 font-medium">PAN / Customer</th>
                  <th className="px-6 py-4 font-medium">Loan ID</th>
                  <th className="px-6 py-4 font-medium">Amount</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium">Current Risk</th>
                  <th className="px-6 py-4 font-medium">Monitoring</th>
                  <th className="px-6 py-4 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {filteredLoans.map((loan) => (
                  <tr key={loan.loan_id} className="hover:bg-gray-750 transition-colors">
                    {/* PAN / Customer */}
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-white">{loan.pan}</div>
                      {loan.customer_name && (
                        <div className="text-xs text-gray-500">{loan.customer_name}</div>
                      )}
                    </td>

                    {/* Loan ID — always business loan_id */}
                    <td className="px-6 py-4">
                      <span className="font-mono text-xs text-gray-200 bg-gray-900/60 px-2 py-1 rounded border border-gray-700">
                        {loan.loan_id}
                      </span>
                    </td>

                    {/* Amount */}
                    <td className="px-6 py-4 text-sm text-gray-300">
                      ₹{(loan.loan_amount || 0).toLocaleString()}
                      <br />
                      <span className="text-xs text-gray-500">
                        {loan.loan_term} mos @ {loan.interest_rate}%
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4">
                      <span className={`text-xs font-semibold uppercase ${loan.status === 'approved' ? 'text-green-400' : 'text-blue-400'}`}>
                        {loan.status}
                      </span>
                    </td>

                    {/* Current Risk */}
                    <td className="px-6 py-4">
                      {renderRiskBadge(loan.current_risk)}
                      <div className="text-xs text-gray-500 mt-1">
                        {((loan.default_probability || 0) * 100).toFixed(1)}% prob
                      </div>
                    </td>

                    {/* Monitoring — business loan_id + status + next date */}
                    <td className="px-6 py-4">
                      <div className="text-xs text-gray-500 uppercase tracking-widest mb-1">Monitoring</div>
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${loan.monitoring_status === 'active' ? 'bg-green-400' : 'bg-gray-600'}`} />
                        <span className={`text-xs capitalize ${loan.monitoring_status === 'active' ? 'text-green-400' : 'text-gray-500'}`}>
                          {loan.monitoring_status || 'Inactive'}
                        </span>
                      </div>
                      {loan.next_assessment_date && (
                        <div className="text-xs text-gray-500">
                          Next: {fmtDate(loan.next_assessment_date)}
                        </div>
                      )}
                    </td>

                    {/* Action */}
                    <td className="px-6 py-4 text-right">
                      <Link
                        to={`/loans/${loan.loan_id}`}
                        className="inline-flex items-center text-sm text-gray-400 hover:text-white transition-colors"
                      >
                        View <FiChevronRight className="ml-1" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Loans;
