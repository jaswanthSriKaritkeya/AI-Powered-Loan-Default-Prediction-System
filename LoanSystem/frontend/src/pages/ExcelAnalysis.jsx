import React, { useState, useEffect } from 'react';
import { FiTrash2 } from 'react-icons/fi';
import ExcelUpload from './ExcelAnalysis/ExcelUpload';
import ExcelDashboard from './ExcelAnalysis/ExcelDashboard';
import RiskDistribution from './ExcelAnalysis/RiskDistribution';
import ExcelApplicantTable from './ExcelAnalysis/ExcelApplicantTable';
import ExcelApplicantDetails from './ExcelAnalysis/ExcelApplicantDetails';
import { getExcelDashboard, getExcelRecords, getExcelImports, getExcelRiskDistribution, deleteExcelImport } from '../api/excel';

const ExcelAnalysis = () => {
  const [importId, setImportId] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // History
  const [importHistory, setImportHistory] = useState([]);
  const [isDeleting, setIsDeleting] = useState(false);

  // Filters
  const [statusFilter, setStatusFilter] = useState('all'); // all, valid, invalid
  const [riskFilter, setRiskFilter] = useState(null);

  // View state
  const [viewRecordId, setViewRecordId] = useState(null);

  useEffect(() => {
    fetchImports();
  }, []);

  // const fetchImports = async () => {
  //   try {
  //     const res = await getExcelImports();
  //     const imports = res.data.imports || [];
  //     setImportHistory(imports);
  //     if (imports.length > 0 && !importId) {
  //       handleUploadSuccess({ import_id: imports[0].import_id });
  //     }
  //   } catch (err) {
  //     console.error(err);
  //   }
  // };


  // const handleUploadSuccess = (data) => {
  //   setImportId(data.import_id);
  //   setRiskFilter(null);
  //   setStatusFilter('all');
  //   fetchDashboard(data.import_id);
  //   fetchRecords(data.import_id, 'all', null);
  //   fetchImports(); // Refresh history
  // };

  // 1) Load the history list only. Never select anything.
  const fetchImports = async () => {
    try {
      const res = await getExcelImports();
      setImportHistory(res.data.imports || []);
    } catch (err) {
      console.error(err);
    }
  };

  // 2) Select a file: load its dashboard and records.
  const selectImport = (id) => {
    setImportId(id);
    setRiskFilter(null);
    setStatusFilter('all');
    fetchDashboard(id);
    fetchRecords(id, 'all', null);
  };

  // 3) After a new upload: select it and refresh the list once.
  const handleUploadSuccess = (data) => {
    selectImport(data.import_id);
    fetchImports();
  };

  
  const fetchDashboard = async (id) => {
    try {
      const res = await getExcelDashboard(id);
      setDashboardData(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchRecords = async (id, status, risk) => {
    try {
      setLoading(true);
      if (risk) {
        // use risk endpoint
        const res = await getExcelRiskDistribution(id, risk);
        setRecords(res.data.records);
      } else {
        const params = {};
        if (status && status !== 'all') {
          params.status = status;
        }
        const res = await getExcelRecords(id, params);
        setRecords(res.data.records);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusFilter = (status) => {
    setStatusFilter(status);
    setRiskFilter(null);
    fetchRecords(importId, status, null);
  };

  const handleRiskFilter = (risk) => {
    if (riskFilter === risk) {
      setRiskFilter(null);
      fetchRecords(importId, statusFilter, null);
    } else {
      setRiskFilter(risk);
      fetchRecords(importId, null, risk);
    }
  };

  const handleAddSuccess = (recordId, loanId) => {
    // update record in local state
    setRecords((prev) => 
      prev.map(r => r._id === recordId ? { ...r, added_to_loan_list: true, loan_id: loanId } : r)
    );
    // update dashboard
    if (importId) fetchDashboard(importId);
  };

  const handleDeleteImport = async (idToDelete) => {
    if (!window.confirm('Are you sure you want to delete this Excel analysis?')) {
      return;
    }
    
    setIsDeleting(true);
    try {
      await deleteExcelImport(idToDelete);
      
      // Update history state
      setImportHistory((prev) => prev.filter(imp => imp.import_id !== idToDelete));
      
      // If we just deleted the active import, clear the dashboard
      if (importId === idToDelete) {
        setImportId(null);
        setDashboardData(null);
        setRecords([]);
        
        // Try to load the latest one if it exists
        const remaining = importHistory.filter(imp => imp.import_id !== idToDelete);
        if (remaining.length > 0) {
          handleUploadSuccess({ import_id: remaining[0].import_id });
        }
      }
      
      alert('Excel analysis deleted successfully.');
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to delete Excel analysis.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Excel Analysis</h1>
          <p className="text-sm text-gray-400 mt-1">Analyze multiple loan applications using AI-powered risk assessment.</p>
        </div>
      </div>

      <ExcelUpload onUploadSuccess={handleUploadSuccess} />

      {importHistory && importHistory.length > 0 && (
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Previous Analyses</h2>
          <div className="space-y-2 pr-2">
            {importHistory.map((imp) => (
              <div 
                key={imp.import_id} 
                className={`flex justify-between items-center p-3 rounded-md border transition-colors ${importId === imp.import_id ? 'bg-gray-750 border-blue-500/50' : 'bg-gray-900/50 border-gray-700 hover:border-gray-500'}`}
              >
                <div 
                  className="flex-1 cursor-pointer"
                  onClick={() => handleUploadSuccess({ import_id: imp.import_id })}
                >
                  <p className="text-sm font-medium text-white">{imp.filename || 'Unnamed File'}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(imp.created_at).toLocaleString()} • {imp.total_rows} applicants
                  </p>
                </div>
                <button
                  onClick={() => handleDeleteImport(imp.import_id)}
                  disabled={isDeleting}
                  title="Delete Analysis"
                  className="p-2 text-gray-500 hover:text-red-400 hover:bg-gray-800 rounded-md transition-colors disabled:opacity-50"
                >
                  <FiTrash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {importId && dashboardData && (
        <>
          <ExcelDashboard dashboardData={dashboardData} />
          
          <RiskDistribution 
            riskCounts={dashboardData.risk_counts} 
            activeFilter={riskFilter} 
            onFilterSelect={handleRiskFilter} 
          />

          {/* Table section */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold text-white">Applicant List</h2>
              
              {/* Status Filters */}
              {!riskFilter && (
                <div className="flex bg-gray-800 rounded-lg p-1 border border-gray-700">
                  <button 
                    onClick={() => handleStatusFilter('all')}
                    className={`px-4 py-1.5 text-sm rounded-md transition-colors ${statusFilter === 'all' ? 'bg-gray-700 text-white shadow-sm' : 'text-gray-400 hover:text-white'}`}
                  >
                    All
                  </button>
                  <button 
                    onClick={() => handleStatusFilter('valid')}
                    className={`px-4 py-1.5 text-sm rounded-md transition-colors ${statusFilter === 'valid' ? 'bg-gray-700 text-white shadow-sm' : 'text-gray-400 hover:text-white'}`}
                  >
                    Valid
                  </button>
                  <button 
                    onClick={() => handleStatusFilter('invalid')}
                    className={`px-4 py-1.5 text-sm rounded-md transition-colors ${statusFilter === 'invalid' ? 'bg-gray-700 text-white shadow-sm' : 'text-gray-400 hover:text-white'}`}
                  >
                    Invalid
                  </button>
                </div>
              )}
            </div>

            {loading ? (
              <div className="bg-gray-800 rounded-lg border border-gray-700 p-8 text-center text-gray-400">Loading applicants...</div>
            ) : (
              <ExcelApplicantTable 
                records={records} 
                onView={setViewRecordId} 
                onAddSuccess={handleAddSuccess}
              />
            )}
          </div>
        </>
      )}

      {viewRecordId && (
        <ExcelApplicantDetails 
          recordId={viewRecordId} 
          onClose={() => setViewRecordId(null)} 
        />
      )}
    </div>
  );
};

export default ExcelAnalysis;
