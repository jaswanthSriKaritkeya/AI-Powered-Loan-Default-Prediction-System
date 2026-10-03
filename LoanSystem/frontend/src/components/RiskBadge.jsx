
import React from 'react';

const RiskBadge = ({ risk }) => {
    let colorClass = 'bg-gray-700 text-gray-300';
    if (risk === 'Low Risk') colorClass = 'bg-green-900 text-green-300';
    else if (risk === 'Moderate Risk') colorClass = 'bg-yellow-900 text-yellow-300';
    else if (risk === 'High Risk') colorClass = 'bg-orange-900 text-orange-300';
    else if (risk === 'Critical') colorClass = 'bg-red-900 text-red-300';

    return (
        <span className={`px-2 py-1 rounded text-xs font-semibold ${colorClass}`}>
            {risk || 'Unknown'}
        </span>
    );
};
export default RiskBadge;
