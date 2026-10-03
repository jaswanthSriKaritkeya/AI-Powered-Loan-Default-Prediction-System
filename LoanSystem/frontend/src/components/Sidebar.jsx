import React, { useContext } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { FiGrid, FiUsers, FiFileText, FiBell, FiInfo, FiLogOut } from 'react-icons/fi';

const Sidebar = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navClass = ({ isActive }) =>
    `flex items-center space-x-3 px-4 py-3 rounded-md transition-colors ${
      isActive ? 'bg-gray-800 text-white font-medium' : 'text-gray-400 hover:bg-gray-800 hover:text-white'
    }`;

  return (
    <div className="w-64 bg-black border-r border-gray-800 flex flex-col h-screen sticky top-0">
      <div className="p-6">
        <h1 className="text-xl font-bold text-white tracking-wide">Risk<span className="text-gray-500">Console</span></h1>
      </div>

      <nav className="flex-1 px-4 space-y-2 overflow-y-auto">
        <NavLink to="/dashboard" className={navClass}>
          <FiGrid size={18} />
          <span>Dashboard</span>
        </NavLink>
        <NavLink to="/customers" className={navClass}>
          <FiUsers size={18} />
          <span>Customers</span>
        </NavLink>
        <NavLink to="/loans" className={navClass}>
          <FiFileText size={18} />
          <span>Loans</span>
        </NavLink>
        <NavLink to="/alerts" className={navClass}>
          <FiBell size={18} />
          <span>Alerts</span>
        </NavLink>
        <NavLink to="/about" className={navClass}>
          <FiInfo size={18} />
          <span>About</span>
        </NavLink>
      </nav>

      <div className="p-4 border-t border-gray-800">
        <div className="mb-4 px-2">
          <p className="text-sm font-medium text-white">{user?.name || 'User'}</p>
          <p className="text-xs text-gray-400 truncate">{user?.email}</p>
          <p className="text-xs text-gray-500 uppercase mt-1 tracking-wider">{user?.role}</p>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center space-x-3 px-4 py-2 text-sm text-gray-400 hover:text-white hover:bg-gray-800 rounded-md transition-colors"
        >
          <FiLogOut size={16} />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
