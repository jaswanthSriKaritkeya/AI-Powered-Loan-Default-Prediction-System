import React from 'react';

// ---------------------------------------------------------------------------
// SHAP Explanation Component
//
// Accepts the exact explanations structure returned by the backend:
//   {
//     Risk_Increasing: [{ Feature, "Shap Value", Impact, Borrower }, ...],
//     Risk_Decreasing: [{ Feature, "Shap Value", Impact, Borrower }, ...]
//   }
//
// Also handles legacy string-array format.
// ---------------------------------------------------------------------------

const ShapBar = ({ factors, colorClass, barColorClass, sign }) => {
  if (!factors || factors.length === 0) {
    return <p className="text-xs text-gray-500 italic mt-2">None identified.</p>;
  }

  // Compute max absolute SHAP value for proportional bar widths
  const maxVal = Math.max(
    ...factors.map(f => Math.abs(f['Shap Value'] || 0)),
    0.001 // prevent division-by-zero
  );

  return (
    <div className="space-y-3 mt-3">
      {factors.map((f, i) => {
        const absVal = Math.abs(f['Shap Value'] || 0);
        const pct    = Math.min((absVal / maxVal) * 100, 100);
        // Format feature name: remove underscores, keep camelCase spacing
        const featureName = (f.Feature || '')
          .replace(/_/g, ' ')
          .replace(/([a-z])([A-Z])/g, '$1 $2');

        return (
          <div key={i} className="text-xs">
            {/* Feature name + value + SHAP score */}
            <div className="flex justify-between items-baseline mb-1 gap-2">
              <span className="text-gray-300 font-medium truncate flex-1" title={featureName}>
                {featureName}
              </span>
              <span className="text-gray-500 shrink-0">
                {f.Borrower !== null && f.Borrower !== undefined ? String(f.Borrower) : '—'}
              </span>
              <span className={`${colorClass} font-mono shrink-0`}>
                {sign}{absVal.toFixed(4)}
              </span>
            </div>
            {/* Horizontal bar */}
            <div className="w-full bg-gray-800 rounded-sm h-1.5 overflow-hidden">
              <div
                className={`h-full ${barColorClass} rounded-sm transition-all`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};

const ShapExplanation = ({ explanations, title = 'Why did the model give this risk?' }) => {
  // ── No data ─────────────────────────────────────────────────────────────
  if (!explanations) {
    return (
      <div className="text-sm text-gray-500 italic py-2">
        Explainability data unavailable for this assessment.
      </div>
    );
  }

  // ── Dict format (primary backend format) ─────────────────────────────────
  const hasDictFormat =
    explanations.Risk_Increasing !== undefined ||
    explanations.Risk_Decreasing !== undefined;

  if (hasDictFormat) {
    const increasing = explanations.Risk_Increasing || [];
    const decreasing = explanations.Risk_Decreasing || [];

    if (increasing.length === 0 && decreasing.length === 0) {
      return (
        <div className="text-sm text-gray-500 italic py-2">
          No key factors identified.
        </div>
      );
    }

    return (
      <div className="mt-3 border border-gray-700 bg-gray-900/60 rounded-lg p-4">
        {/* Header */}
        <h4 className="text-xs font-semibold text-gray-300 uppercase tracking-wider mb-4 border-b border-gray-700 pb-2 flex items-center gap-2">
          <span className="text-blue-400">✦</span>
          {title}
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Risk-Increasing */}
          <div>
            <h5 className="text-xs font-semibold text-red-400 uppercase tracking-widest flex items-center gap-1">
              <span className="text-base leading-none">↑</span> Risk Increasing Factors
            </h5>
            <div className="w-full h-px bg-gray-700 mt-1" />
            <ShapBar
              factors={increasing}
              colorClass="text-red-400"
              barColorClass="bg-red-500"
              sign="+"
            />
          </div>

          {/* Risk-Decreasing */}
          <div>
            <h5 className="text-xs font-semibold text-green-400 uppercase tracking-widest flex items-center gap-1">
              <span className="text-base leading-none">↓</span> Risk Reducing Factors
            </h5>
            <div className="w-full h-px bg-gray-700 mt-1" />
            <ShapBar
              factors={decreasing}
              colorClass="text-green-400"
              barColorClass="bg-green-500"
              sign="-"
            />
          </div>
        </div>

        {/* Column legend */}
        <div className="mt-4 pt-3 border-t border-gray-800 flex gap-4 text-xs text-gray-600">
          <span>Feature</span>
          <span className="ml-auto">Borrower Value</span>
          <span>SHAP Score</span>
        </div>
      </div>
    );
  }

  // ── Legacy string-array format ────────────────────────────────────────────
  if (Array.isArray(explanations)) {
    if (explanations.length === 0) {
      return (
        <div className="text-sm text-gray-500 italic py-2">No key factors identified.</div>
      );
    }
    return (
      <div className="mt-3 text-xs text-gray-400 bg-gray-900/60 p-4 rounded-lg border border-gray-700">
        <h4 className="font-semibold text-gray-300 uppercase tracking-wider mb-2">Key Factors</h4>
        <ul className="list-disc pl-4 space-y-1">
          {explanations.map((exp, j) => (
            <li key={j}>{typeof exp === 'string' ? exp : JSON.stringify(exp)}</li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <div className="text-sm text-gray-500 italic py-2">
      Explainability data format unrecognized.
    </div>
  );
};

export default ShapExplanation;
