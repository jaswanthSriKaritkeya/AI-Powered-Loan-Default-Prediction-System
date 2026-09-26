import React, { useState } from 'react';
import PANSearch from '../components/PANSearch';
import CustomerSummary from '../components/CustomerSummary';
import CustomerDetails from '../components/CustomerDetails';
import CustomerEditForm from '../components/CustomerEditForm';
import { getCustomerByPAN, updateCustomerByPAN } from '../services/api';

const PANSimulation = () => {
  const [customer, setCustomer] = useState(null);
  const [viewMode, setViewMode] = useState('search'); // 'search', 'details', 'edit'
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleSearch = async (pan) => {
    setLoading(true);
    setError('');
    setSuccessMsg('');
    try {
      const data = await getCustomerByPAN(pan);
      setCustomer(data);
      setViewMode('details'); // Show details right after finding or we can show summary + details
      // The requirement says: "After successful search, show a customer summary card." 
      // And then "Do NOT immediately open the edit form."
      // Let's set it to 'summary' first or just show the summary with action buttons on top
    } catch (err) {
      setError(err.message);
      setCustomer(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (changedFields) => {
    if (!customer) return;
    setSaving(true);
    setError('');
    setSuccessMsg('');
    try {
      await updateCustomerByPAN(customer.pan, changedFields);
      // Fetch fresh data after successful update
      const updatedData = await getCustomerByPAN(customer.pan);
      setCustomer(updatedData);
      setViewMode('details');
      setSuccessMsg('Customer information updated successfully.');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="container">
      <header className="page-header">
        <h1>Simulated PAN Provider</h1>
        <p className="subtitle">Search and manage simulated customer information</p>
      </header>

      {error && <div className="alert alert-error">{error}</div>}
      {successMsg && <div className="alert alert-success">{successMsg}</div>}

      {!customer || viewMode === 'search' ? (
        <PANSearch onSearch={handleSearch} isLoading={loading} />
      ) : (
        <div className="customer-workspace">
          <div className="search-again-container">
             <button className="btn btn-text btn-sm" onClick={() => { setCustomer(null); setError(''); setSuccessMsg(''); }}>
               &larr; Search another PAN
             </button>
          </div>
          
          <CustomerSummary 
            customer={customer} 
            setViewMode={setViewMode} 
          />

          {viewMode === 'details' && (
            <CustomerDetails 
              customer={customer} 
              setViewMode={setViewMode} 
            />
          )}

          {viewMode === 'edit' && (
            <CustomerEditForm 
              customer={customer} 
              onSave={handleSave}
              onCancel={() => setViewMode('details')}
              isSaving={saving}
            />
          )}
        </div>
      )}
    </div>
  );
};

export default PANSimulation;
