import React from 'react';

const RiskDistribution = ({ riskCounts, activeFilter, onFilterSelect }) => {
  if (!riskCounts) return null;

  const getRiskColor = (risk) => {
    switch (risk) {
      case 'Low Risk': return 'text-green-400 border-green-500/50 bg-green-900/20';
      case 'Moderate Risk': return 'text-yellow-400 border-yellow-500/50 bg-yellow-900/20';
      case 'High Risk': return 'text-orange-400 border-orange-500/50 bg-orange-900/20';
      case 'Critical': return 'text-red-400 border-red-500/50 bg-red-900/20';
      default: return 'text-gray-400 border-gray-600 bg-gray-800';
    }
  };

  const risks = ['Low Risk', 'Moderate Risk', 'High Risk', 'Critical'];

  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700 p-6 shadow-sm mb-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-white">Risk Distribution</h2>
        <button 
          onClick={() => onFilterSelect(null)}
          className={`text-sm ${!activeFilter ? 'text-blue-400 font-medium' : 'text-gray-400 hover:text-white'} transition-colors`}
        >
          All Applicants
        </button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {risks.map((risk) => {
          const count = riskCounts[risk] || 0;
          const isActive = activeFilter === risk;
          return (
            <div 
              key={risk}
              onClick={() => onFilterSelect(risk)}
              className={`p-4 rounded-lg border cursor-pointer transition-all ${getRiskColor(risk)} ${isActive ? 'ring-2 ring-white scale-[1.02]' : 'hover:scale-[1.02] opacity-80 hover:opacity-100'}`}
            >
              <div className="text-sm font-medium mb-1">{risk}</div>
              <div className="text-2xl font-bold">{count}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RiskDistribution;
