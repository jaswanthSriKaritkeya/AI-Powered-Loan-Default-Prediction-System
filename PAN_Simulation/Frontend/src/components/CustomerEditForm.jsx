import React, { useState } from 'react';

const CustomerEditForm = ({ customer, onSave, onCancel, isSaving }) => {
  const [formData, setFormData] = useState({
    income: customer.income,
    credit_score: customer.credit_score,
    months_employed: customer.months_employed,
    num_credit_lines: customer.num_credit_lines,
    dti_ratio: customer.dti_ratio,
    employment_type: customer.employment_type
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    let parsedValue = value;
    
    // Parse numeric fields appropriately
    if (['income', 'dti_ratio'].includes(name)) {
      parsedValue = value !== '' ? parseFloat(value) : '';
    } else if (['credit_score', 'months_employed', 'num_credit_lines'].includes(name)) {
      parsedValue = value !== '' ? parseInt(value, 10) : '';
    }

    setFormData(prev => ({
      ...prev,
      [name]: parsedValue
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Compute diff
    const changedFields = {};
    for (const key in formData) {
      if (formData[key] !== customer[key] && formData[key] !== '') {
        changedFields[key] = formData[key];
      }
    }
    
    if (Object.keys(changedFields).length > 0) {
      onSave(changedFields);
    } else {
      // No changes, just cancel
      onCancel();
    }
  };

  return (
    <div className="card edit-card">
      <div className="card-header">
        <h2>Edit Financial Details</h2>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="edit-grid">
          {/* Read-only reference fields */}
          <div className="form-group read-only">
            <label>PAN</label>
            <input type="text" value={customer.pan} disabled />
          </div>
          <div className="form-group read-only">
            <label>Name</label>
            <input type="text" value={customer.name} disabled />
          </div>

          {/* Editable fields */}
          <div className="form-group">
            <label htmlFor="income">Income (₹)</label>
            <input
              type="number"
              id="income"
              name="income"
              value={formData.income}
              onChange={handleChange}
              min="0"
              step="0.01"
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="credit_score">Credit Score</label>
            <input
              type="number"
              id="credit_score"
              name="credit_score"
              value={formData.credit_score}
              onChange={handleChange}
              min="300"
              max="900"
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="months_employed">Months Employed</label>
            <input
              type="number"
              id="months_employed"
              name="months_employed"
              value={formData.months_employed}
              onChange={handleChange}
              min="0"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="num_credit_lines">Number of Credit Lines</label>
            <input
              type="number"
              id="num_credit_lines"
              name="num_credit_lines"
              value={formData.num_credit_lines}
              onChange={handleChange}
              min="0"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="dti_ratio">DTI Ratio</label>
            <input
              type="number"
              id="dti_ratio"
              name="dti_ratio"
              value={formData.dti_ratio}
              onChange={handleChange}
              min="0"
              max="2"
              step="0.01"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="employment_type">Employment Type</label>
            <select
              id="employment_type"
              name="employment_type"
              value={formData.employment_type}
              onChange={handleChange}
              required
            >
              <option value="Salaried">Salaried</option>
              <option value="Self-Employed">Self-Employed</option>
              <option value="Unemployed">Unemployed</option>
              <option value="Business">Business</option>
            </select>
          </div>
        </div>

        <div className="form-actions">
          <button type="button" className="btn btn-outline" onClick={onCancel} disabled={isSaving}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CustomerEditForm;
