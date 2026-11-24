import React from 'react';

const StatCard = ({ title, value, className = '' }) => (
  <div className={`bg-gray-800 rounded-lg border border-gray-700 p-6 shadow-sm ${className}`}>
    <h3 className="text-gray-400 text-sm font-medium mb-2">{title}</h3>
    <div className="text-2xl font-bold text-white">{value}</div>
  </div>
);

const ExcelDashboard = ({ dashboardData }) => {
  if (!dashboardData) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <StatCard title="TOTAL APPLICANTS" value={dashboardData.total_applicants} />
      <StatCard title="VALID APPLICANTS" value={dashboardData.valid_applicants} />
      <StatCard title="INVALID APPLICANTS" value={dashboardData.invalid_applicants} />
      <StatCard title="ADDED TO LOAN LIST" value={dashboardData.added_to_loan_list} className="border-l-4 border-l-blue-500" />
    </div>
  );
};

export default ExcelDashboard;
