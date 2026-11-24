import React, { useEffect, useState } from 'react';
import { FiX } from 'react-icons/fi';
import { getExcelRecord } from '../../api/excel';
import ShapExplanation from '../../components/ShapExplanation';

const DetailSection = ({ title, children }) => (
  <div className="mb-6">
    <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3 pb-2 border-b border-gray-700">
      {title}
    </h3>
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {children}
    </div>
  </div>
);

const DetailItem = ({ label, value }) => (
  <div>
    <div className="text-xs text-gray-500 mb-1">{label}</div>
    <div className="text-sm font-medium text-white">{value !== null && value !== undefined ? value : 'N/A'}</div>
  </div>
);

const ExcelApplicantDetails = ({ recordId, onClose }) => {
  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchRecord = async () => {
      try {
        setLoading(true);
        const res = await getExcelRecord(recordId);
        setRecord(res.data.record);
      } catch (err) {
        setError(err.response?.data?.detail || 'Failed to load applicant details.');
      } finally {
        setLoading(false);
      }
    };
    if (recordId) fetchRecord();
  }, [recordId]);

  if (!recordId) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm transition-opacity">
      <div className="w-full max-w-2xl bg-gray-900 border-l border-gray-700 h-full flex flex-col shadow-2xl animate-slide-in-right">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-800 flex justify-between items-center bg-gray-900 sticky top-0 z-10">
          <h2 className="text-xl font-bold text-white">Applicant Details</h2>
          <button 
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-full transition-colors"
          >
            <FiX size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="text-center text-gray-400 py-10">Loading applicant details...</div>
          ) : error ? (
            <div className="text-center text-red-400 py-10">{error}</div>
          ) : !record ? (
            <div className="text-center text-gray-400 py-10">Applicant not found.</div>
          ) : (
            <div className="space-y-2">
              
              <div className="mb-6 flex gap-3">
                <span className={`px-3 py-1 text-xs font-semibold uppercase rounded-full ${record.status === 'valid' ? 'bg-green-900/50 text-green-400 border border-green-500/50' : 'bg-red-900/50 text-red-400 border border-red-500/50'}`}>
                  {record.status}
                </span>
                {record.added_to_loan_list && (
                  <span className="px-3 py-1 text-xs font-semibold uppercase rounded-full bg-blue-900/50 text-blue-400 border border-blue-500/50">
                    Added: {record.loan_id}
                  </span>
                )}
              </div>

              {record.status === 'invalid' && record.errors && record.errors.length > 0 && (
                <div className="mb-6 p-4 bg-red-900/20 border border-red-500/30 rounded-lg">
                  <h4 className="text-sm font-semibold text-red-400 mb-2">Validation Errors</h4>
                  <ul className="list-disc pl-5 text-sm text-gray-300 space-y-1">
                    {record.errors.map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}

              <DetailSection title="Applicant Information">
                <DetailItem label="PAN" value={record.pan} />
                {record.loan_data && (
                  <>
                    <DetailItem label="Age" value={record.loan_data.Age} />
                    <DetailItem label="Income" value={record.loan_data.Income ? `₹${record.loan_data.Income.toLocaleString()}` : 'N/A'} />
                    <DetailItem label="Credit Score" value={record.loan_data.CreditScore} />
                    <DetailItem label="Employment" value={`${record.loan_data.MonthsEmployed} mos`} />
                    <DetailItem label="DTI Ratio" value={record.loan_data.DTIRatio} />
                  </>
                )}
              </DetailSection>

              <DetailSection title="Loan Information">
                <DetailItem label="Loan Amount" value={record.loan_amount ? `₹${record.loan_amount.toLocaleString()}` : 'N/A'} />
                <DetailItem label="Interest Rate" value={record.interest_rate ? `${record.interest_rate}%` : 'N/A'} />
                <DetailItem label="Loan Term" value={record.loan_term ? `${record.loan_term} months` : 'N/A'} />
                <DetailItem label="Purpose" value={record.loan_purpose} />
                <DetailItem label="Co-Signer" value={record.has_cosigner} />
              </DetailSection>

              {record.status === 'valid' && (
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3 pb-2 border-b border-gray-700">
                    AI Assessment
                  </h3>
                  <div className="bg-gray-800 p-5 rounded-lg border border-gray-700 flex flex-wrap gap-8 items-center">
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Risk Bucket</div>
                      <div className="text-lg font-bold text-white">{record.risk_bucket || 'N/A'}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Default Probability</div>
                      <div className="text-lg font-bold text-white">
                        {record.default_probability !== undefined && record.default_probability !== null 
                          ? `${(record.default_probability * 100).toFixed(1)}%` 
                          : 'N/A'}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Prediction</div>
                      <div className="text-sm font-medium text-white">{record.prediction === 1 ? 'Default' : record.prediction === 0 ? 'Repay' : 'N/A'}</div>
                    </div>
                  </div>
                </div>
              )}

              {record.explanations && (
                <div className="mb-6">
                  <ShapExplanation explanations={record.explanations} />
                </div>
              )}

            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExcelApplicantDetails;
