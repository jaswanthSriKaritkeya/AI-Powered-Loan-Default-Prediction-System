import React, { useState } from 'react';

const INITIAL_STATE = {
  Age: '',
  Income: '',
  LoanAmount: '',
  CreditScore: '',
  MonthsEmployed: '',
  NumCreditLines: '',
  InterestRate: '',
  LoanTerm: '',
  DTIRatio: '',
  Education: '',
  EmploymentType: '',
  MaritalStatus: '',
  HasMortgage: '',
  HasDependents: '',
  LoanPurpose: '',
  HasCoSigner: ''
};

const LoanForm = ({ onSubmit, isLoading }) => {
  const [formData, setFormData] = useState(INITIAL_STATE);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Parse numeric values before submission
    const parsedData = {
      ...formData,
      Age: Number(formData.Age),
      Income: Number(formData.Income),
      LoanAmount: Number(formData.LoanAmount),
      CreditScore: Number(formData.CreditScore),
      MonthsEmployed: Number(formData.MonthsEmployed),
      NumCreditLines: Number(formData.NumCreditLines),
      InterestRate: Number(formData.InterestRate),
      LoanTerm: Number(formData.LoanTerm),
      DTIRatio: Number(formData.DTIRatio),
    };
    
    onSubmit(parsedData);
  };

  return (
    <div className="card">
      <h2 className="card-title">Borrower Information</h2>
      <form onSubmit={handleSubmit} className="form-grid">
        <div className="form-group">
          <label htmlFor="Age">Age</label>
          <input type="number" id="Age" name="Age" min="18" value={formData.Age} onChange={handleChange} required placeholder="e.g. 28" />
        </div>

        <div className="form-group">
          <label htmlFor="Income">Annual Income ($)</label>
          <input type="number" id="Income" name="Income" min="1" value={formData.Income} onChange={handleChange} required placeholder="e.g. 50000" />
        </div>

        <div className="form-group">
          <label htmlFor="LoanAmount">Loan Amount ($)</label>
          <input type="number" id="LoanAmount" name="LoanAmount" min="1" value={formData.LoanAmount} onChange={handleChange} required placeholder="e.g. 15000" />
        </div>

        <div className="form-group">
          <label htmlFor="CreditScore">Credit Score</label>
          <input type="number" id="CreditScore" name="CreditScore" min="300" max="850" value={formData.CreditScore} onChange={handleChange} required placeholder="e.g. 720" />
        </div>

        <div className="form-group">
          <label htmlFor="MonthsEmployed">Months Employed</label>
          <input type="number" id="MonthsEmployed" name="MonthsEmployed" min="0" value={formData.MonthsEmployed} onChange={handleChange} required placeholder="e.g. 24" />
        </div>

        <div className="form-group">
          <label htmlFor="NumCreditLines">Number of Credit Lines</label>
          <input type="number" id="NumCreditLines" name="NumCreditLines" min="0" value={formData.NumCreditLines} onChange={handleChange} required placeholder="e.g. 4" />
        </div>

        <div className="form-group">
          <label htmlFor="InterestRate">Interest Rate (%)</label>
          <input type="number" id="InterestRate" name="InterestRate" min="0.1" step="0.1" value={formData.InterestRate} onChange={handleChange} required placeholder="e.g. 5.5" />
        </div>

        <div className="form-group">
          <label htmlFor="LoanTerm">Loan Term (Months)</label>
          <input type="number" id="LoanTerm" name="LoanTerm" min="1" value={formData.LoanTerm} onChange={handleChange} required placeholder="e.g. 60" />
        </div>

        <div className="form-group">
          <label htmlFor="DTIRatio">Debt-to-Income Ratio</label>
          <input type="number" id="DTIRatio" name="DTIRatio" min="0" max="1" step="0.01" value={formData.DTIRatio} onChange={handleChange} required placeholder="e.g. 0.35" />
        </div>

        <div className="form-group">
          <label htmlFor="Education">Education</label>
          <select id="Education" name="Education" value={formData.Education} onChange={handleChange} required>
            <option value="" disabled>Select Education</option>
            <option value="High School">High School</option>
            <option value="Bachelor's">Bachelor's</option>
            <option value="Master's">Master's</option>
            <option value="PhD">PhD</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="EmploymentType">Employment Type</label>
          <select id="EmploymentType" name="EmploymentType" value={formData.EmploymentType} onChange={handleChange} required>
            <option value="" disabled>Select Employment Type</option>
            <option value="Full-time">Full-time</option>
            <option value="Part-time">Part-time</option>
            <option value="Self-employed">Self-employed</option>
            <option value="Unemployed">Unemployed</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="MaritalStatus">Marital Status</label>
          <select id="MaritalStatus" name="MaritalStatus" value={formData.MaritalStatus} onChange={handleChange} required>
            <option value="" disabled>Select Marital Status</option>
            <option value="Single">Single</option>
            <option value="Married">Married</option>
            <option value="Divorced">Divorced</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="HasMortgage">Has Mortgage</label>
          <select id="HasMortgage" name="HasMortgage" value={formData.HasMortgage} onChange={handleChange} required>
            <option value="" disabled>Select Option</option>
            <option value="Yes">Yes</option>
            <option value="No">No</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="HasDependents">Has Dependents</label>
          <select id="HasDependents" name="HasDependents" value={formData.HasDependents} onChange={handleChange} required>
            <option value="" disabled>Select Option</option>
            <option value="Yes">Yes</option>
            <option value="No">No</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="LoanPurpose">Loan Purpose</label>
          <select id="LoanPurpose" name="LoanPurpose" value={formData.LoanPurpose} onChange={handleChange} required>
            <option value="" disabled>Select Purpose</option>
            <option value="Auto">Auto</option>
            <option value="Business">Business</option>
            <option value="Education">Education</option>
            <option value="Home">Home</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="HasCoSigner">Has Co-Signer</label>
          <select id="HasCoSigner" name="HasCoSigner" value={formData.HasCoSigner} onChange={handleChange} required>
            <option value="" disabled>Select Option</option>
            <option value="Yes">Yes</option>
            <option value="No">No</option>
          </select>
        </div>

        <div className="form-actions">
          <button type="submit" className="btn-primary" disabled={isLoading}>
            {isLoading ? 'Analyzing Loan Risk...' : 'Predict Risk'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default LoanForm;
