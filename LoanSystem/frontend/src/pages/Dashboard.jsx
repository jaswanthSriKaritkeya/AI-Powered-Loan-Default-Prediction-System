import React, { useEffect, useState } from 'react';
import api from '../api/client';
import { FiUsers, FiFileText, FiCheckCircle, FiBell } from 'react-icons/fi';

const Dashboard = () => {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchSummary();
  }, []);

  const fetchSummary = async () => {
    try {
      setLoading(true);
      const res = await api.get('/dashboard/summary');
      setSummary(res.data);
      setError(null);
    } catch (err) {
      setError('Failed to load dashboard summary.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="text-gray-400">Loading dashboard...</div>;
  if (error) return <div className="text-red-400">{error}</div>;
  if (!summary) return null;

  const stats = [
    { name: 'Total Customers', value: summary.total_customers, icon: FiUsers },
    { name: 'Total Loans', value: summary.total_loans, icon: FiFileText },
    { name: 'Approved Loans', value: summary.approved_loans, icon: FiCheckCircle },
    { name: 'Unread Alerts', value: summary.unread_alerts, icon: FiBell, color: summary.unread_alerts > 0 ? 'text-red-500' : 'text-gray-400' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-white tracking-tight">Dashboard Overview</h1>
        <button onClick={fetchSummary} className="text-sm text-gray-400 hover:text-white transition-colors">
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.name} className="bg-gray-800 p-6 rounded-lg border border-gray-700 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-400">{stat.name}</p>
              <p className="mt-2 text-3xl font-semibold text-white">{stat.value}</p>
            </div>
            <div className={`p-3 bg-gray-900 rounded-md ${stat.color || 'text-gray-300'}`}>
              <stat.icon size={24} />
            </div>
          </div>
        ))}
      </div>

      <div className="bg-gray-800 rounded-lg border border-gray-700 p-6 shadow-sm">
        <h2 className="text-lg font-medium text-white mb-6">Risk Distribution</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gray-900 p-4 rounded-md border-t-2 border-green-500 text-center">
            <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Low Risk</p>
            <p className="text-2xl font-bold text-green-500">{summary.risk_distribution?.low || 0}</p>
          </div>
          <div className="bg-gray-900 p-4 rounded-md border-t-2 border-yellow-500 text-center">
            <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Moderate Risk</p>
            <p className="text-2xl font-bold text-yellow-500">{summary.risk_distribution?.moderate || 0}</p>
          </div>
          <div className="bg-gray-900 p-4 rounded-md border-t-2 border-orange-500 text-center">
            <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">High Risk</p>
            <p className="text-2xl font-bold text-orange-500">{summary.risk_distribution?.high || 0}</p>
          </div>
          <div className="bg-gray-900 p-4 rounded-md border-t-2 border-red-500 text-center">
            <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Critical</p>
            <p className="text-2xl font-bold text-red-500">{summary.risk_distribution?.critical || 0}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
