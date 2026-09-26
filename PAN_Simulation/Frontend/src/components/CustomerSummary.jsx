import React from 'react';
import { User, Calendar, CreditCard, Edit, Eye } from 'lucide-react';

const CustomerSummary = ({ customer, setViewMode }) => {
  return (
    <div className="card summary-card">
      <div className="summary-header">
        <div className="avatar">
          <User size={32} />
        </div>
        <div className="summary-info">
          <h2>{customer.name}</h2>
          <div className="summary-meta">
            <span><CreditCard size={14} /> PAN: {customer.pan}</span>
            <span><Calendar size={14} /> DOB: {customer.dob}</span>
          </div>
        </div>
      </div>
      
      <div className="summary-actions">
        <button 
          className="btn btn-outline" 
          onClick={() => setViewMode('details')}
        >
          <Eye size={16} /> View Details
        </button>
        <button 
          className="btn btn-primary" 
          onClick={() => setViewMode('edit')}
        >
          <Edit size={16} /> Edit Details
        </button>
      </div>
    </div>
  );
};

export default CustomerSummary;
