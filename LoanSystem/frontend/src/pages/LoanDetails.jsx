import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/client';
import ShapExplanation from '../components/ShapExplanation';
import MonthProbabilityGraph from '../components/MonthProbabilityGraph';

// ---------------------------------------------------------------------------
// Shared risk-badge renderer
// ---------------------------------------------------------------------------
const riskColors = {
  'Low Risk':     'bg-green-900/50 text-green-400 border-green-500/50',
  'Moderate Risk':'bg-yellow-900/50 text-yellow-400 border-yellow-500/50',
  'High Risk':    'bg-orange-900/50 text-orange-400 border-orange-500/50',
  'Critical':     'bg-red-900/50 text-red-400 border-red-500/50',
};

const RiskBadge = ({ risk }) => (
  <span className={`px-3 py-1 rounded-full text-sm font-medium border ${riskColors[risk] || 'bg-gray-800 text-gray-300 border-gray-600'}`}>
    {risk || 'Unknown'}
  </span>
);

// ---------------------------------------------------------------------------
// Info row helper
// ---------------------------------------------------------------------------
const InfoRow = ({ label, value, mono = false }) => (
  <div className="flex justify-between items-center text-sm py-0.5">
    <span className="text-gray-400">{label}</span>
    <span className={`text-white font-medium ${mono ? 'font-mono text-xs' : ''}`}>{value ?? '—'}</span>
  </div>
);

// ---------------------------------------------------------------------------
// LoanDetails page
// ---------------------------------------------------------------------------
const LoanDetails = () => {
  const { loanId } = useParams();
  const navigate   = useNavigate();

  const [loan, setLoan]     = useState(null);
  const [history, setHistory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  const [actionLoading, setActionLoading]             = useState(false);
  const [expandedAssessments, setExpandedAssessments] = useState({});

  // Reassess Now state (separate from approve actionLoading)
  const [reassessLoading, setReassessLoading] = useState(false);
  const [reassessSuccess, setReassessSuccess] = useState(false);
  const [reassessError,   setReassessError]   = useState(null);

  const toggleExplanation = (index) => {
    setExpandedAssessments(prev => ({ ...prev, [index]: !prev[index] }));
  };

  useEffect(() => {
    fetchLoanAndHistory();
  }, [loanId]);

  const fetchLoanAndHistory = async () => {
    try {
      setLoading(true);

      // Fetch all loans and find this one by business loan_id
      const resLoans = await api.get('/dashboard/loans');
      const loans    = resLoans.data.loans || resLoans.data;
      const foundLoan = loans.find(l => l.loan_id === loanId);

      if (!foundLoan) {
        setError('Loan not found');
        return;
      }
      setLoan(foundLoan);

      // Fetch history using business loan_id
      try {
        const resHistory = await api.get(`/dashboard/loans/${loanId}/history`);
        setHistory(resHistory.data);
      } catch {
        // history fetch failed – loan data still available
      }
    } catch {
      setError('Failed to fetch loan details.');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!window.confirm('Are you sure you want to approve this loan?')) return;
    setActionLoading(true);
    try {
      await api.put(`/loans/${loanId}/approve`);
      await fetchLoanAndHistory();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to approve loan');
    } finally {
      setActionLoading(false);
    }
  };

  // Reassess Now — calls POST /loans/{business_loan_id}/test-monitor
  // Uses loanId from URL params which is always the business loan_id (e.g. LN-2026-000002)
  const handleReassess = async () => {
    setReassessLoading(true);
    setReassessSuccess(false);
    setReassessError(null);
    try {
      await api.post(`/loans/${loanId}/test-monitor`);
      // Fetch latest data from backend — the source of truth for all fields:
      // current_risk, default_probability, risk_history, SHAP, monitoring dates
      await fetchLoanAndHistory();
      setReassessSuccess(true);
      // Auto-dismiss the success banner after 4 seconds
      setTimeout(() => setReassessSuccess(false), 4000);
    } catch (err) {
      setReassessError(
        err.response?.data?.detail || 'Unable to reassess this loan. Please try again.'
      );
    } finally {
      setReassessLoading(false);
    }
  };

  // ── Loading / Error ──────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-gray-400 text-sm">Loading loan details…</div>
      </div>
    );
  }
  if (error) return <div className="text-red-400 p-4">{error}</div>;
  if (!loan)  return null;

  // ── History classification ───────────────────────────────────────────────
  //
  // Backend assessment_type values:
  //   "initial"   — saved when loan is created (pre-loan / initial assessment)
  //   "pre_loan"  — saved by the separate assess-by-pan endpoint
  //   "periodic"  — saved by the scheduler / test-monitor endpoint
  //
  const historyRecords = history?.history || [];

  const preLoanRecord = historyRecords.find(
    h => h.assessment_type === 'initial' || h.assessment_type === 'pre_loan'
  );

  // Fallback: if no history record, use loan-level fields
  const preLoanAssessment = preLoanRecord || {
    default_probability: loan.initial_default_probability,
    risk_bucket:         loan.initial_risk,
    explanations:        null,
  };

  const periodicAssessments = historyRecords.filter(
    h => h.assessment_type !== 'initial' && h.assessment_type !== 'pre_loan'
  );

  // ── Date formatter ───────────────────────────────────────────────────────
  const fmtDate = (d) =>
    d ? new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Loan Details</h1>
          <p className="text-sm text-gray-500 font-mono mt-0.5">{loan.loan_id}</p>
        </div>
        <button
          onClick={() => navigate(-1)}
          className="text-sm text-gray-400 hover:text-white transition-colors"
        >
          ← Back
        </button>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          Left column  |  Right column
          ═══════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* ── LEFT COLUMN ─────────────────────────────────────────────── */}
        <div className="space-y-6">

          {/* ── Loan Information ──────────────────────────────────────── */}
          <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 shadow-sm">
            <h2 className="text-lg font-medium text-white mb-4 border-b border-gray-700 pb-2">
              Loan Information
            </h2>
            <div className="space-y-2">
              <InfoRow label="Loan ID"        value={loan.loan_id} mono />
              <InfoRow label="PAN"            value={loan.pan} />
              <InfoRow label="Customer Name"  value={loan.customer_name || 'N/A'} />
              <InfoRow label="Loan Amount"    value={`₹${(loan.loan_amount || 0).toLocaleString()}`} />
              <InfoRow label="Interest Rate"  value={`${loan.interest_rate}%`} />
              <InfoRow label="Loan Term"      value={`${loan.loan_term} months`} />
              <InfoRow label="Loan Purpose"   value={loan.loan_purpose} />
              <InfoRow label="Created At"     value={fmtDate(loan.created_at)} />
              {loan.approved_at && (
                <InfoRow label="Approved At"  value={fmtDate(loan.approved_at)} />
              )}
              <div className="flex justify-between items-center text-sm pt-2 border-t border-gray-700 mt-2">
                <span className="text-gray-400">Status</span>
                <span className={`font-bold uppercase text-sm ${loan.status === 'approved' ? 'text-green-400' : 'text-blue-400'}`}>
                  {loan.status}
                </span>
              </div>
            </div>

            {loan.status === 'application' && (
              <button
                onClick={handleApprove}
                disabled={actionLoading}
                className="mt-6 w-full bg-green-600 hover:bg-green-500 text-white font-medium py-2 rounded-md transition-colors disabled:opacity-50"
              >
                {actionLoading ? 'Processing…' : 'Approve Loan'}
              </button>
            )}
          </div>

          {/* ── Pre-Loan Assessment (SHAP) ────────────────────────────── */}
          <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 shadow-sm">
            <h2 className="text-lg font-medium text-white mb-1">Pre-Loan Assessment</h2>
            <p className="text-xs text-gray-500 mb-4">
              What factors influenced the <em>initial</em> risk assessment?
            </p>

            {/* Initial risk summary */}
            <div className="flex justify-between items-center bg-gray-900/60 p-4 rounded-lg border border-gray-700 mb-4">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Initial Risk</p>
                <RiskBadge risk={preLoanAssessment.risk_bucket} />
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Default Probability</p>
                <p className="text-2xl font-bold text-white">
                  {((preLoanAssessment.default_probability || 0) * 100).toFixed(1)}%
                </p>
              </div>
            </div>

            {/* SHAP explanation */}
            <ShapExplanation
              explanations={preLoanAssessment.explanations}
              title="What factors influenced the initial risk assessment?"
            />
          </div>
        </div>

        {/* ── RIGHT COLUMN ────────────────────────────────────────────── */}
        <div className="space-y-6">

          {/* ── Risk Assessment ───────────────────────────────────────── */}
          <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 shadow-sm">
            <h2 className="text-lg font-medium text-white mb-4 border-b border-gray-700 pb-2">
              Risk Information
            </h2>

            {/* Initial */}
            <div className="mb-5 pb-5 border-b border-gray-700">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">Initial Risk</h3>
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-400 text-sm">Risk Bucket</span>
                <RiskBadge risk={loan.initial_risk} />
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400 text-sm">Default Probability</span>
                <span className="text-white font-medium">
                  {((loan.initial_default_probability || 0) * 100).toFixed(1)}%
                </span>
              </div>
            </div>

            {/* Current */}
            <div>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">Current Risk</h3>
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-400 text-sm">Risk Bucket</span>
                <RiskBadge risk={loan.current_risk} />
              </div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-400 text-sm">Default Probability</span>
                <span className="text-white font-medium">
                  {((loan.default_probability || 0) * 100).toFixed(1)}%
                </span>
              </div>
              {loan.next_assessment_date && (
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-400">Next Monitoring</span>
                  <span className="text-white">{fmtDate(loan.next_assessment_date)}</span>
                </div>
              )}
            </div>

            {/* ── Reassess Now ─────────────────────────────────────── */}
            {loan.status === 'approved' && (
              <div className="mt-5 pt-4 border-t border-gray-700">
                {/* Success banner */}
                {reassessSuccess && (
                  <div className="flex items-center gap-2 text-xs text-green-400 bg-green-900/30 border border-green-700/50 rounded-md px-3 py-2 mb-3">
                    <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Loan reassessed successfully.
                  </div>
                )}
                {/* Error banner */}
                {reassessError && (
                  <div className="flex items-start gap-2 text-xs text-red-400 bg-red-900/30 border border-red-700/50 rounded-md px-3 py-2 mb-3">
                    <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    {reassessError}
                  </div>
                )}
                <button
                  onClick={handleReassess}
                  disabled={reassessLoading}
                  className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-md transition-colors text-sm"
                >
                  {reassessLoading ? (
                    <>
                      <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                      </svg>
                      Reassessing…
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Reassess Now
                    </>
                  )}
                </button>
                {!reassessLoading && (
                  <p className="text-xs text-gray-600 text-center mt-1.5">
                    Runs a full ML prediction + SHAP analysis using the latest PAN data
                  </p>
                )}

              </div>
            )}
          </div>

          {/* ── Monitoring ────────────────────────────────────────────── */}
          <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 shadow-sm">
            <h2 className="text-lg font-medium text-white mb-4 border-b border-gray-700 pb-2">
              Monitoring
            </h2>

            {/* Business Loan ID */}
            <div className="flex justify-between items-center mb-3 text-sm">
              <span className="text-gray-400">Loan</span>
              <span className="font-mono text-xs text-gray-200 bg-gray-900/70 px-2 py-1 rounded border border-gray-700">
                {loan.loan_id}
              </span>
            </div>

            {/* Monitoring status */}
            <div className="flex justify-between items-center mb-3 text-sm">
              <span className="text-gray-400">Status</span>
              <span className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${loan.monitoring_status === 'active' ? 'bg-green-400' : 'bg-gray-500'}`} />
                <span className={`font-semibold capitalize ${loan.monitoring_status === 'active' ? 'text-green-400' : 'text-gray-500'}`}>
                  {loan.monitoring_status || 'Inactive'}
                </span>
              </span>
            </div>

            {loan.last_assessment_date && (
              <div className="flex justify-between items-center mb-2 text-sm">
                <span className="text-gray-400">Last Assessment</span>
                <span className="text-white">{fmtDate(loan.last_assessment_date)}</span>
              </div>
            )}
            {loan.next_assessment_date && (
              <div className="flex justify-between items-center mb-4 text-sm">
                <span className="text-gray-400">Next Assessment</span>
                <span className="text-white">{fmtDate(loan.next_assessment_date)}</span>
              </div>
            )}

          </div>

          {/* ── Risk Trend Graph ──────────────────────────────────────── */}
          <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 shadow-sm">
            <h2 className="text-lg font-medium text-white mb-1">Risk Trend</h2>
            <p className="text-xs text-gray-500 mb-1">Default Probability over time</p>
            {/* Dot legend */}
            <div className="flex gap-4 text-xs text-gray-500 mb-2 flex-wrap">
              {[
                { label: 'Low Risk',      color: '#4ade80' },
                { label: 'Moderate Risk', color: '#facc15' },
                { label: 'High Risk',     color: '#fb923c' },
                { label: 'Critical',      color: '#f87171' },
              ].map(({ label, color }) => (
                <span key={label} className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: color }} />
                  {label}
                </span>
              ))}
            </div>
            {/* Graph uses the same historyRecords array */}
            <MonthProbabilityGraph history={historyRecords} />
          </div>

          {/* ── Monitoring History (Periodic Assessments) ─────────────── */}
          <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 shadow-sm">
            <h2 className="text-lg font-medium text-white mb-1">Monitoring History</h2>
            <p className="text-xs text-gray-500 mb-4 border-b border-gray-700 pb-3">
              What factors are influencing the customer's current risk?
            </p>

            {periodicAssessments.length === 0 ? (
              <div className="text-sm text-gray-500 text-center py-6 border border-dashed border-gray-700 rounded-lg">
                No monitoring history available.
              </div>
            ) : (
              <div className="space-y-4">
                {periodicAssessments.map((h, i) => {
                  const monthNum   = i + 1;
                  const dateStr    = fmtDate(h.date || h.created_at);
                  const isExpanded = !!expandedAssessments[i];

                  return (
                    <div
                      key={h.assessment_id || i}
                      className="border border-gray-700 bg-gray-900/40 rounded-lg overflow-hidden"
                    >
                      {/* Assessment header */}
                      <div className="flex justify-between items-start p-4">
                        <div>
                          <div className="text-xs text-gray-400 mb-1.5">
                            Month {monthNum} &middot; {dateStr}
                          </div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <RiskBadge risk={h.risk_bucket} />
                            {h.previous_risk_bucket && (
                              <>
                                <span className="text-xs text-gray-600">←</span>
                                <span className="text-xs text-gray-500">{h.previous_risk_bucket}</span>
                              </>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-gray-500 uppercase tracking-widest mb-0.5">
                            Default Probability
                          </div>
                          <div className="text-xl font-bold text-white">
                            {((h.default_probability || 0) * 100).toFixed(1)}%
                          </div>
                        </div>
                      </div>

                      {/* Toggle SHAP */}
                      <div className="px-4 pb-3">
                        <button
                          onClick={() => toggleExplanation(i)}
                          className="text-xs text-blue-400 hover:text-blue-300 transition-colors underline decoration-blue-900 underline-offset-2"
                        >
                          {isExpanded ? 'Hide Explanation' : 'View Explanation'}
                        </button>
                      </div>

                      {/* SHAP explanation for this specific assessment */}
                      {isExpanded && (
                        <div className="px-4 pb-4">
                          <ShapExplanation
                            explanations={h.explanations}
                            title={`Month ${monthNum} — What factors influenced this risk?`}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoanDetails;
