import React from 'react';

const About = () => {
  return (
    <div className="space-y-6 max-w-3xl">
      <h1 className="text-2xl font-bold text-white tracking-tight">About System</h1>
      
      <div className="bg-gray-800 p-8 rounded-lg border border-gray-700 shadow-sm space-y-8 text-gray-300 leading-relaxed text-sm">
        
        <section>
          <h2 className="text-lg font-medium text-white mb-3">What the system does</h2>
          <p>AI-powered loan underwriting and continuous risk monitoring.</p>
        </section>

        <section>
          <h2 className="text-lg font-medium text-white mb-3">Problem</h2>
          <p>Traditional loan assessment can depend heavily on static credit information, manual review, and fixed rules. It lacks real-time insights and proactive risk management once a loan is approved.</p>
        </section>

        <section>
          <h2 className="text-lg font-medium text-white mb-3">Solution</h2>
          <p>The system combines borrower information with proposed loan terms and uses an ML model to estimate default probability. This provides an objective, data-driven approach to initial underwriting.</p>
        </section>

        <section>
          <h2 className="text-lg font-medium text-white mb-3">Risk Buckets</h2>
          <div className="grid grid-cols-2 gap-4 max-w-md">
            <div className="bg-gray-900 p-3 rounded border-l-2 border-green-500">
              <span className="font-bold text-green-500 block mb-1">Low Risk</span>
              <span className="text-xs text-gray-400">&lt; 25%</span>
            </div>
            <div className="bg-gray-900 p-3 rounded border-l-2 border-yellow-500">
              <span className="font-bold text-yellow-500 block mb-1">Moderate Risk</span>
              <span className="text-xs text-gray-400">25–49.99%</span>
            </div>
            <div className="bg-gray-900 p-3 rounded border-l-2 border-orange-500">
              <span className="font-bold text-orange-500 block mb-1">High Risk</span>
              <span className="text-xs text-gray-400">50–74.99%</span>
            </div>
            <div className="bg-gray-900 p-3 rounded border-l-2 border-red-500">
              <span className="font-bold text-red-500 block mb-1">Critical</span>
              <span className="text-xs text-gray-400">&ge; 75%</span>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-lg font-medium text-white mb-3">Explainable AI</h2>
          <p>SHAP explanations show factors contributing to the prediction, providing transparency into the AI's decision-making process.</p>
        </section>

        <section>
          <h2 className="text-lg font-medium text-white mb-3">Continuous Monitoring</h2>
          <div className="bg-gray-900 p-4 rounded text-xs font-mono mb-4 text-gray-400 whitespace-pre">
{`Every 30 days
      ↓
Latest PAN Simulator data
      ↓
ML reassessment
      ↓
Risk update
      ↓
Risk history
      ↓
High/Critical alert`}
          </div>
          <p className="border-l-4 border-gray-600 pl-4 py-1 italic">
            The monitoring service reassesses the approved loan using the latest borrower information retrieved from the PAN Simulator while keeping the approved loan terms unchanged.
          </p>
        </section>

      </div>
    </div>
  );
};

export default About;
