import React, { useEffect, useState } from 'react';
import api from '../api/client';
import { FiCheck } from 'react-icons/fi';

const Alerts = () => {
  const [alertsData, setAlertsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAlerts();
  }, []);

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const res = await api.get('/dashboard/alerts');
      setAlertsData(res.data);
      setError(null);
    } catch (err) {
      setError('Failed to load alerts.');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (alertId) => {
    try {
      await api.put(`/dashboard/alerts/${alertId}/read`);
      fetchAlerts();
    } catch (err) {
      alert('Failed to mark alert as read');
    }
  };

  const renderRiskBadge = (risk) => {
    const colors = {
      'Low Risk': 'text-green-400',
      'Moderate Risk': 'text-yellow-400',
      'High Risk': 'text-orange-500 font-bold',
      'Critical': 'text-red-500 font-bold'
    };
    return (
      <span className={`text-sm ${colors[risk] || 'text-gray-300'}`}>
        {risk || 'Unknown'}
      </span>
    );
  };

  if (loading && !alertsData) return <div className="text-gray-400">Loading alerts...</div>;
  if (error) return <div className="text-red-400">{error}</div>;

  const alerts = alertsData?.alerts || [];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-white tracking-tight">System Alerts</h1>
        <button onClick={fetchAlerts} className="text-sm text-gray-400 hover:text-white transition-colors">
          Refresh
        </button>
      </div>

      <div className="bg-gray-800 rounded-lg border border-gray-700 shadow-sm overflow-hidden">
        {alerts.length === 0 ? (
          <div className="p-8 text-center text-gray-400">No alerts found</div>
        ) : (
          <div className="divide-y divide-gray-700">
            {alerts.map((alert) => (
              <div key={alert.alert_id || alert._id} className={`p-6 ${alert.status === 'unread' ? 'bg-gray-800' : 'bg-gray-900/50'}`}>
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center space-x-3 mb-2">
                      <span className={`px-2 py-0.5 rounded text-xs font-bold ${alert.risk_bucket === 'Critical' ? 'bg-red-900/80 text-red-200' : 'bg-orange-900/80 text-orange-200'}`}>
                        {alert.alert_type}
                      </span>
                      {alert.status === 'unread' && <span className="w-2 h-2 rounded-full bg-blue-500"></span>}
                      <span className="text-xs text-gray-400">{new Date(alert.created_at).toLocaleString()}</span>
                    </div>
                    <p className="text-white text-sm font-medium mb-1">{alert.message}</p>
                    <div className="text-sm text-gray-400 mb-3 space-x-4 flex flex-wrap gap-y-2">
                      <span>Loan: <span className="text-gray-300 font-medium font-mono">{alert.loan_id}</span></span>
                      <span>PAN: <span className="text-gray-300 font-medium">{alert.pan}</span></span>
                      <span>Probability: <span className="text-gray-300 font-medium">{((alert.default_probability || 0) * 100).toFixed(1)}%</span></span>
                      <span>Risk: {renderRiskBadge(alert.risk_bucket)}</span>
                      {alert.previous_risk_bucket && <span>Prev: {renderRiskBadge(alert.previous_risk_bucket)}</span>}
                    </div>
                    {alert.reasons && alert.reasons.length > 0 && (
                      <div className="mt-3 bg-gray-900 p-3 rounded text-xs text-gray-300">
                        <p className="font-semibold text-gray-400 mb-1">Key Factors:</p>
                        <ul className="list-disc pl-4 space-y-1">
                          {alert.reasons.map((reason, i) => (
                            <li key={i}>{reason}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                  
                  {alert.status === 'unread' && (
                    <button
                      onClick={() => handleMarkAsRead(alert.alert_id || alert._id)}
                      className="flex items-center space-x-1 text-sm text-blue-400 hover:text-blue-300 transition-colors border border-blue-900/50 px-3 py-1 rounded bg-blue-900/20"
                    >
                      <FiCheck size={14} />
                      <span>Mark as Read</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Alerts;
