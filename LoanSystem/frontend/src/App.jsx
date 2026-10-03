import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Loans from './pages/Loans';
import Customers from './pages/Customers';
import LoanDetails from './pages/LoanDetails';
import Alerts from './pages/Alerts';
import About from './pages/About';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Layout />}>
            <Route index element={<Navigate to="/dashboard" />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="customers" element={<Customers />} />
            <Route path="loans" element={<Loans />} />
            <Route path="loans/:loanId" element={<LoanDetails />} />
            <Route path="alerts" element={<Alerts />} />
            <Route path="about" element={<About />} />
          </Route>
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
