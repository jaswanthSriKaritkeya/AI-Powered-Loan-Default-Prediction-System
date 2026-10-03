import React, { useContext } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import { AuthContext } from '../context/AuthContext';

const Layout = () => {
  const { user } = useContext(AuthContext);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex bg-gray-900 min-h-screen text-gray-100 font-sans">
      <Sidebar />
      <main className="flex-1 overflow-x-hidden overflow-y-auto">
        <div className="max-w-7xl mx-auto p-6 md:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout;
