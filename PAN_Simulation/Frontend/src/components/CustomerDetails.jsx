import React from 'react';

const CustomerDetails = ({ customer, setViewMode }) => {
  return (
    <div className="card details-card">
      <div className="card-header">
        <h2>Customer Details</h2>
        <button className="btn btn-outline btn-sm" onClick={() => setViewMode('edit')}>
          Edit Details
        </button>
      </div>

      <div className="details-grid">
        <div className="details-section">
          <h3>Personal Information</h3>
          <div className="field-group">
            <span className="field-label">Name</span>
            <span className="field-value">{customer.name}</span>
          </div>
          <div className="field-group">
            <span className="field-label">PAN</span>
            <span className="field-value">{customer.pan}</span>
          </div>
          <div className="field-group">
            <span className="field-label">Date of Birth</span>
            <span className="field-value">{customer.dob}</span>
          </div>
          <div className="field-group">
            <span className="field-label">Gender</span>
            <span className="field-value">{customer.gender || 'N/A'}</span>
          </div>
          <div className="field-group">
            <span className="field-label">Phone</span>
            <span className="field-value">{customer.phone || 'N/A'}</span>
          </div>
          <div className="field-group">
            <span className="field-label">Email</span>
            <span className="field-value">{customer.email || 'N/A'}</span>
          </div>
        </div>

        <div className="details-section">
          <h3>Financial Information</h3>
          <div className="field-group">
            <span className="field-label">Income</span>
            <span className="field-value">₹{customer.income?.toLocaleString()}</span>
          </div>
          <div className="field-group">
            <span className="field-label">Credit Score</span>
            <span className="field-value">{customer.credit_score}</span>
          </div>
          <div className="field-group">
            <span className="field-label">Months Employed</span>
            <span className="field-value">{customer.months_employed}</span>
          </div>
          <div className="field-group">
            <span className="field-label">Number of Credit Lines</span>
            <span className="field-value">{customer.num_credit_lines}</span>
          </div>
          <div className="field-group">
            <span className="field-label">DTI Ratio</span>
            <span className="field-value">{customer.dti_ratio}</span>
          </div>
        </div>

        <div className="details-section">
          <h3>Employment / Profile</h3>
          <div className="field-group">
            <span className="field-label">Education</span>
            <span className="field-value">{customer.education}</span>
          </div>
          <div className="field-group">
            <span className="field-label">Employment Type</span>
            <span className="field-value">{customer.employment_type}</span>
          </div>
          <div className="field-group">
            <span className="field-label">Marital Status</span>
            <span className="field-value">{customer.marital_status}</span>
          </div>
          <div className="field-group">
            <span className="field-label">Has Mortgage</span>
            <span className="field-value">{customer.has_mortgage}</span>
          </div>
          <div className="field-group">
            <span className="field-label">Has Dependents</span>
            <span className="field-value">{customer.has_dependents}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerDetails;
