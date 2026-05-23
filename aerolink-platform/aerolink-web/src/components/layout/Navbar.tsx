import { Plane, Activity, ConciergeBell, LogOut, User } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const roleLabels: Record<string, string> = {
  admin: 'System Admin',
  airline_operator: 'Flight Operator',
  ground_staff: 'Ground Staff',
  passenger: 'Passenger',
};

const Navbar = () => {
  const location = useLocation();
  const { user, logout, isAuthenticated } = useAuth();

  if (!isAuthenticated) return null; // Hide navbar on login page

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-panel border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded bg-blue-600 flex items-center justify-center text-white">
              <Plane className="w-5 h-5" />
            </div>
            <span className="text-xl font-bold text-slate-900 tracking-tight">AeroLink</span>
          </Link>

          <div className="hidden md:flex items-center space-x-6">
            {/* Passenger always visible */}
            <Link
              to="/"
              className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                location.pathname === '/'
                  ? 'text-blue-600 bg-blue-50'
                  : 'text-slate-600 hover:text-blue-600 hover:bg-slate-50'
              }`}
            >
              <Plane className="w-4 h-4" />
              <span>Flights</span>
            </Link>

            {/* Agent — only for ground_staff or admin */}
            {(user?.role === 'ground_staff' || user?.role === 'admin') && (
              <Link
                to="/agent"
                className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  location.pathname === '/agent'
                    ? 'text-blue-600 bg-blue-50'
                    : 'text-slate-600 hover:text-blue-600 hover:bg-slate-50'
                }`}
              >
                <ConciergeBell className="w-4 h-4" />
                <span>Gate Desk</span>
              </Link>
            )}

            {/* Operations — only for airline_operator or admin */}
            {(user?.role === 'airline_operator' || user?.role === 'admin') && (
              <Link
                to="/operations"
                className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  location.pathname === '/operations'
                    ? 'text-blue-600 bg-blue-50'
                    : 'text-slate-600 hover:text-blue-600 hover:bg-slate-50'
                }`}
              >
                <Activity className="w-4 h-4" />
                <span>Operations</span>
              </Link>
            )}
          </div>

          {/* User badge + logout */}
          <div className="flex items-center space-x-4">
            <div className="hidden sm:flex items-center space-x-2 bg-slate-100 px-3 py-1.5 rounded-full">
              <User className="w-4 h-4 text-slate-500" />
              <span className="text-sm font-medium text-slate-700">{user?.email?.split('@')[0]}</span>
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-semibold uppercase">
                {roleLabels[user?.role || ''] || user?.role}
              </span>
            </div>
            <button
              onClick={logout}
              className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Sign out"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
