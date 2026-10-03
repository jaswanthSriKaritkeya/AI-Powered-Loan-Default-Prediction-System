import React from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine
} from 'recharts';

// ---------------------------------------------------------------------------
// Risk colour helper (shared with tooltip)
// ---------------------------------------------------------------------------
const riskColor = (risk) => {
  if (risk === 'Critical')      return '#f87171'; // red-400
  if (risk === 'High Risk')     return '#fb923c'; // orange-400
  if (risk === 'Moderate Risk') return '#facc15'; // yellow-400
  return '#4ade80';                                // green-400
};

// ---------------------------------------------------------------------------
// Custom Tooltip
// ---------------------------------------------------------------------------
const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload || !payload.length) return null;

  const d = payload[0].payload;
  return (
    <div className="bg-gray-800 border border-gray-600 p-3 rounded-lg shadow-xl text-xs z-50 min-w-[160px]">
      <p className="text-gray-200 font-semibold mb-2">{d.label}</p>
      <div className="space-y-1">
        <p className="text-white">
          Probability:{' '}
          <span className="font-mono text-blue-300">
            {((d.probability || 0) * 100).toFixed(1)}%
          </span>
        </p>
        {d.risk && (
          <p style={{ color: riskColor(d.risk) }}>
            Risk: {d.risk}
          </p>
        )}
        {d.date && (
          <p className="text-gray-400">Date: {d.date}</p>
        )}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Dynamic dot colour based on risk bucket
// ---------------------------------------------------------------------------
const RiskDot = (props) => {
  const { cx, cy, payload } = props;
  const fill = riskColor(payload.risk);
  return (
    <circle
      cx={cx}
      cy={cy}
      r={5}
      fill={fill}
      stroke="#1f2937"
      strokeWidth={2}
    />
  );
};

// ---------------------------------------------------------------------------
// MonthProbabilityGraph
//
// Props:
//   history  – array of history records from GET /dashboard/loans/{loan_id}/history
//              Each record: { assessment_type, date, risk_bucket, default_probability, ... }
// ---------------------------------------------------------------------------
const MonthProbabilityGraph = ({ history }) => {
  if (!history || history.length === 0) {
    return (
      <div className="text-center text-sm text-gray-500 py-8 border border-dashed border-gray-700 rounded-lg">
        No monitoring history available to display graph.
      </div>
    );
  }

  // Build graph data from the same history array used by the history cards.
  // We track a separate counter for periodic (monitoring) assessments.
  let monitoringCount = 0;

  const graphData = history.map((h) => {
    const isInitial = h.assessment_type === 'initial' || h.assessment_type === 'pre_loan';
    const label = isInitial
      ? 'Initial'
      : `Month ${++monitoringCount}`;

    const dateStr = h.date
      ? new Date(h.date).toLocaleDateString('en-GB', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        })
      : null;

    return {
      label,
      probability: h.default_probability ?? 0,
      risk:        h.risk_bucket || 'Unknown',
      date:        dateStr,
    };
  });

  // Y-axis domain: pad slightly above max probability
  const maxProb = Math.max(...graphData.map(d => d.probability), 0.1);
  const yMax    = Math.min(Math.ceil(maxProb * 10) / 10 + 0.1, 1);

  return (
    <div className="w-full h-64 mt-4">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={graphData}
          margin={{ top: 10, right: 16, left: -10, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
          <XAxis
            dataKey="label"
            stroke="#6b7280"
            fontSize={11}
            tickLine={false}
            axisLine={false}
            dy={8}
          />
          <YAxis
            stroke="#6b7280"
            fontSize={11}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => `${(v * 100).toFixed(0)}%`}
            domain={[0, yMax]}
            tickCount={6}
          />
          <Tooltip content={<CustomTooltip />} />
          {/* 50% reference line — common risk threshold */}
          <ReferenceLine
            y={0.5}
            stroke="#6b7280"
            strokeDasharray="4 4"
            label={{ value: '50%', position: 'right', fill: '#6b7280', fontSize: 10 }}
          />
          <Line
            type="monotone"
            dataKey="probability"
            stroke="#3b82f6"
            strokeWidth={2.5}
            dot={<RiskDot />}
            activeDot={{ r: 7, fill: '#60a5fa', stroke: '#1f2937', strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default MonthProbabilityGraph;
