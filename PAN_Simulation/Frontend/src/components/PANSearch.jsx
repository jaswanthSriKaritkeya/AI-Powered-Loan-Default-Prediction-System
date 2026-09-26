import React, { useState } from 'react';
import { Search } from 'lucide-react';

const PANSearch = ({ onSearch, isLoading }) => {
  const [pan, setPan] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (pan.trim()) {
      onSearch(pan.trim().toUpperCase());
    }
  };

  return (
    <div className="card search-card">
      <h2>Search Customer</h2>
      <p>Enter the customer's PAN to retrieve their simulated records.</p>
      <form onSubmit={handleSubmit} className="search-form">
        <div className="input-group">
          <input
            type="text"
            placeholder="Enter PAN (e.g. ABCDE1234F)"
            value={pan}
            onChange={(e) => setPan(e.target.value)}
            disabled={isLoading}
            maxLength={10}
            className="uppercase-input"
          />
          <button type="submit" disabled={isLoading || !pan.trim()} className="btn btn-primary">
            {isLoading ? 'Searching...' : (
              <>
                <Search size={18} /> Search
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PANSearch;
