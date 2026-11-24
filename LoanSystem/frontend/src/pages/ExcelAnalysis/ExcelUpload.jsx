import React, { useState, useRef } from 'react';
import { FiUploadCloud, FiFile } from 'react-icons/fi';
import { uploadExcel } from '../../api/excel';

const ExcelUpload = ({ onUploadSuccess }) => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected) {
      setFile(selected);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    try {
      const res = await uploadExcel(file);
      onUploadSuccess(res.data);
    } catch (err) {
      const msg = err.response?.data?.detail?.message || err.response?.data?.detail || err.message || 'Unable to analyze Excel file.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700 p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-white mb-4">Upload Excel File</h2>
      <p className="text-sm text-gray-400 mb-6">Supported formats: .xlsx, .xls</p>
      
      <div className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center bg-gray-900/50 hover:bg-gray-750 transition-colors cursor-pointer" onClick={() => !loading && fileInputRef.current.click()}>
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileChange} 
          accept=".xlsx, .xls" 
          className="hidden" 
        />
        {file ? (
          <div className="flex flex-col items-center">
            <FiFile className="text-blue-400 text-4xl mb-3" />
            <p className="text-white font-medium">{file.name}</p>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <FiUploadCloud className="text-gray-400 text-4xl mb-3" />
            <p className="text-gray-300">Click to select a file</p>
          </div>
        )}
      </div>

      {error && <div className="mt-4 text-red-400 text-sm">{typeof error === 'object' ? JSON.stringify(error) : error}</div>}

      <div className="mt-6 flex justify-end">
        <button
          onClick={handleUpload}
          disabled={!file || loading}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          {loading ? 'Analyzing applications...' : 'Analyze Excel'}
        </button>
      </div>
    </div>
  );
};

export default ExcelUpload;
