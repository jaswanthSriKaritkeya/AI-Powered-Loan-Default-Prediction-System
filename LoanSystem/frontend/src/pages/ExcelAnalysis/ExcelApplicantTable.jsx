import React from 'react';
import { FiAlertCircle } from 'react-icons/fi';
import { addExcelRecordToLoanList } from '../../api/excel';

const ExcelApplicantTable = ({ records, onView, onAddSuccess }) => {
  const [addingId, setAddingId] = React.useState(null);

  if (!records || records.length === 0) {
    return (
      <div className="bg-gray-800 rounded-lg border border-gray-700 p-8 text-center text-gray-400 shadow-sm">
        No applicants found.
      </div>
    );
  }

  const handleAdd = async (record) => {
    setAddingId(record._id);
    try {
      const res = await addExcelRecordToLoanList(record._id);
      onAddSuccess(record._id, res.data.loan_id);
    } catch (err) {
      alert(err.response?.data?.detail?.message || err.response?.data?.detail || 'Applicant could not be added to Loan List.');
    } finally {
      setAddingId(null);
    }
  };

  const renderRiskBadge = (risk) => {
    if (!risk) return null;
    const colors = {
      'Low Risk': 'bg-green-900/50 text-green-400 border-green-500/50',
      'Moderate Risk': 'bg-yellow-900/50 text-yellow-400 border-yellow-500/50',
      'High Risk': 'bg-orange-900/50 text-orange-400 border-orange-500/50',
      'Critical': 'bg-red-900/50 text-red-400 border-red-500/50',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${colors[risk] || 'bg-gray-800 text-gray-300 border-gray-600'}`}>
        {risk}
      </span>
    );
  };

  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700 shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-900/50 text-gray-400 text-xs uppercase tracking-wider border-b border-gray-700">
              <th className="px-6 py-4 font-medium">Applicant / PAN</th>
              <th className="px-6 py-4 font-medium">Loan Details</th>
              <th className="px-6 py-4 font-medium">Risk Assessment</th>
              <th className="px-6 py-4 font-medium">Status</th>
              <th className="px-6 py-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {records.map((record) => (
              <tr key={record._id} className="hover:bg-gray-750 transition-colors">
                <td className="px-6 py-4">
                  <div className="text-sm font-medium text-white">{record.pan || 'N/A'}</div>
                  {record.status === 'invalid' && record.errors && record.errors.length > 0 && (
                    <div className="flex items-center gap-1 mt-1 text-xs text-red-400">
                      <FiAlertCircle size={12} />
                      <span className="truncate max-w-[150px]" title={record.errors.join(', ')}>
                        {record.errors[0]}
                      </span>
                    </div>
                  )}
                </td>
                
                <td className="px-6 py-4 text-sm text-gray-300">
                  {record.loan_amount ? `₹${(record.loan_amount).toLocaleString()}` : 'N/A'}
                  <br />
                  <span className="text-xs text-gray-500">
                    {record.loan_term ? `${record.loan_term} mos` : ''} 
                    {record.interest_rate ? ` @ ${record.interest_rate}%` : ''}
                  </span>
                </td>

                <td className="px-6 py-4">
                  {renderRiskBadge(record.risk_bucket)}
                  {record.default_probability !== undefined && record.default_probability !== null && (
                    <div className="text-xs text-gray-500 mt-1">
                      {(record.default_probability * 100).toFixed(1)}% prob
                    </div>
                  )}
                </td>

                <td className="px-6 py-4">
                  {record.added_to_loan_list ? (
                    <div>
                      <span className="text-xs font-semibold text-blue-400 uppercase">Added to Loan List</span>
                      <div className="text-xs font-mono text-gray-400 mt-1">ID: {record.loan_id}</div>
                    </div>
                  ) : record.status === 'valid' ? (
                    <span className="text-xs font-semibold text-green-400 uppercase">Valid</span>
                  ) : (
                    <span className="text-xs font-semibold text-red-400 uppercase">Invalid</span>
                  )}
                </td>

                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-3">
                    <button
                      onClick={() => onView(record._id)}
                      className="text-sm text-gray-400 hover:text-white transition-colors"
                    >
                      View
                    </button>
                    {record.status === 'valid' && !record.added_to_loan_list && (
                      <button
                        onClick={() => handleAdd(record)}
                        disabled={addingId === record._id}
                        className="text-sm bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded transition-colors disabled:opacity-50"
                      >
                        {addingId === record._id ? 'Adding...' : 'Add to List'}
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ExcelApplicantTable;
