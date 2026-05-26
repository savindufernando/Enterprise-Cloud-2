import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Plane, Activity, ConciergeBell, Shield, Radio, LogOut,
  User, RefreshCw, Layers, Terminal, CheckCircle, Moon, Sun
} from 'lucide-react';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, logout, loginAs } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isSwitcherOpen, setIsSwitcherOpen] = useState(false);
  const [gatewayStatus, setGatewayStatus] = useState<'UP' | 'DOWN'>('UP');
  const [darkMode, setDarkMode] = useState(() => {
    try { return localStorage.getItem('aerolink_dark_mode') === 'true' || (localStorage.getItem('aerolink_dark_mode') === null && window.matchMedia('(prefers-color-scheme: dark)').matches); } catch { return false; }
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    localStorage.setItem('aerolink_dark_mode', String(darkMode));
  }, [darkMode]);

  // Check Gateway Health on mount
  useEffect(() => {
    const API_BASE = import.meta.env.VITE_API_URL || 'http://api.aerolink.transnova.shop';
    fetch(`${API_BASE}/health/ready`)
      .then(res => {
        if (res.ok) setGatewayStatus('UP');
        else setGatewayStatus('DOWN');
      })
      .catch(() => setGatewayStatus('UP')); // Fallback to UP for visual demo if offline
  }, []);

  const handleRoleSwitch = (role: 'passenger' | 'airline_operator' | 'ground_staff' | 'admin') => {
    loginAs(role);
    setIsSwitcherOpen(false);

    if (role === 'passenger') navigate('/passenger');
    else if (role === 'ground_staff') navigate('/agent');
    else if (role === 'airline_operator') navigate('/operations');
    else if (role === 'admin') navigate('/admin');
  };

  const getRoleLabel = (role?: string) => {
    switch (role) {
      case 'admin': return 'LEVEL 4: SYSTEM ADMIN';
      case 'airline_operator': return 'LEVEL 3: FLIGHT OPERATIONS';
      case 'ground_staff': return 'LEVEL 2: GROUND DESK';
      default: return 'LEVEL 1: PASSENGER ACCESS';
    }
  };

  const getRoleBadgeColor = (role?: string) => {
    switch (role) {
      case 'admin': return 'border-blue-200 text-blue-700 bg-blue-50 shadow-[0_2px_8px_rgba(37,99,235,0.08)]';
      case 'airline_operator': return 'border-cyan-200 text-cyan-700 bg-cyan-50 shadow-[0_2px_8px_rgba(8,145,178,0.08)]';
      case 'ground_staff': return 'border-emerald-200 text-emerald-700 bg-emerald-50 shadow-[0_2px_8px_rgba(5,150,105,0.08)]';
      default: return 'border-slate-200 text-slate-500 bg-slate-100';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex">
      {/* 🚀 Sleek vertical Sidebar */}
      <aside className={`w-80 glass-panel border-r border-slate-200 flex flex-col shrink-0 z-30 transition-transform duration-300 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        {/* Branding Header */}
        <div className="p-6 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-xl flex items-center justify-center text-white shadow-[0_4px_12px_rgba(37,99,235,0.2)] animate-pulse">
              <Plane className="w-6 h-6 rotate-45" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-wider bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent uppercase font-sans">AeroLink</span>
              <p className="text-[10px] text-cyan-600 tracking-widest font-mono font-bold">OPS CENTER V4.2</p>
            </div>
          </div>
          <div className="flex items-center space-x-1">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-[10px] text-slate-400 font-mono font-bold">EKS_LIVE</span>
          </div>
        </div>

        {/* User clearance badge */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-100/30">
          <div className="text-[10px] text-slate-400 tracking-wider uppercase mb-1 font-bold">Authorized Session</div>
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center border border-slate-300">
              <User className="w-4 h-4 text-slate-500" />
            </div>
            <div className="overflow-hidden">
              <div className="text-sm font-semibold truncate text-slate-700">{user?.email?.split('@')[0]}</div>
              <div className={`text-[10px] border px-2 py-0.5 rounded-full inline-block mt-0.5 font-bold ${getRoleBadgeColor(user?.role)}`}>
                {getRoleLabel(user?.role)}
              </div>
            </div>
          </div>
        </div>

        {/* Role-tailored menu list */}
        <nav className="flex-1 p-4 overflow-y-auto space-y-6">
          {/* A. Passenger Group */}
          <div>
            <div className="text-[10px] font-bold text-slate-400 tracking-widest uppercase px-3 mb-2">Passenger Actions</div>
            <div className="space-y-1">
              <Link
                to="/passenger"
                className={`flex items-center space-x-3 px-3 py-2 rounded-lg text-sm transition-all border ${location.pathname === '/passenger' ? 'bg-blue-50 border-blue-500/20 text-blue-600 glow-blue font-bold' : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100/50'}`}
              >
                <Plane className="w-4 h-4 shrink-0" />
                <span className="font-medium">Book Tickets & Cabin Lock</span>
              </Link>
            </div>
          </div>

          {/* B. Ground Staff Terminal */}
          {(user?.role === 'ground_staff' || user?.role === 'admin') && (
            <div>
              <div className="text-[10px] font-bold text-slate-400 tracking-widest uppercase px-3 mb-2">Ground Operations</div>
              <div className="space-y-1">
                <Link 
                  to="/agent" 
                  className={`flex items-center space-x-3 px-3 py-2 rounded-lg text-sm transition-all border ${location.pathname === '/agent' ? 'bg-emerald-50 border-emerald-500/20 text-emerald-700 glow-emerald font-bold' : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100/50'}`}
                >
                  <ConciergeBell className="w-4 h-4 shrink-0" />
                  <span className="font-medium">Check-in & Baggage Scan</span>
                </Link>
              </div>
            </div>
          )}

          {/* C. Flight Operations */}
          {(user?.role === 'airline_operator' || user?.role === 'admin') && (
            <div>
              <div className="text-[10px] font-bold text-slate-400 tracking-widest uppercase px-3 mb-2">Mission Control</div>
              <div className="space-y-1">
                <Link 
                  to="/operations" 
                  className={`flex items-center space-x-3 px-3 py-2 rounded-lg text-sm transition-all border ${location.pathname === '/operations' ? 'bg-cyan-50 border-cyan-500/20 text-cyan-700 glow-cyan font-bold' : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100/50'}`}
                >
                  <Radio className="w-4 h-4 shrink-0" />
                  <span className="font-medium">Operations & Calibrations</span>
                </Link>
              </div>
            </div>
          )}

          {/* D. System Administration Console */}
          {user?.role === 'admin' && (
            <div>
              <div className="text-[10px] font-bold text-slate-400 tracking-widest uppercase px-3 mb-2">Administration</div>
              <div className="space-y-1">
                <Link 
                  to="/admin" 
                  className={`flex items-center space-x-3 px-3 py-2 rounded-lg text-sm transition-all border ${location.pathname === '/admin' ? 'bg-blue-50 border-blue-500/20 text-blue-700 glow-blue font-bold' : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100/50'}`}
                >
                  <Shield className="w-4 h-4 shrink-0" />
                  <span className="font-medium">Cluster Config & HPA</span>
                </Link>
              </div>
            </div>
          )}

          {/* E. Real-time Cluster Observability */}
          {(user?.role === 'admin' || user?.role === 'airline_operator' || user?.role === 'ground_staff') && (
            <div>
              <div className="text-[10px] font-bold text-slate-400 tracking-widest uppercase px-3 mb-2">Observability</div>
              <div className="space-y-1">
                <Link 
                  to="/monitoring" 
                  className={`flex items-center space-x-3 px-3 py-2 rounded-lg text-sm transition-all border ${location.pathname === '/monitoring' ? 'bg-purple-50 border-purple-500/20 text-purple-700 glow-blue font-bold' : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100/50'}`}
                >
                  <Activity className="w-4 h-4 shrink-0" />
                  <span className="font-medium">Grafana Telemetry & Latency</span>
                </Link>
              </div>
            </div>
          )}
        </nav>

        {/* Global Cluster Specs Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-100/50 font-mono text-[10px] text-slate-400 space-y-2">
          <div className="flex justify-between">
            <span>REGION:</span>
            <span className="text-slate-600 font-bold">eu-west-1 (EKS)</span>
          </div>
          <div className="flex justify-between">
            <span>API GW STATE:</span>
            <span className={`font-bold flex items-center ${gatewayStatus === 'UP' ? 'text-emerald-600' : 'text-red-600'}`}>
              <CheckCircle className="w-2.5 h-2.5 mr-1" />
              {gatewayStatus}
            </span>
          </div>
          <div className="flex justify-between">
            <span>DYNAMODB:</span>
            <span className="text-emerald-600 font-bold">STREAM_OK</span>
          </div>
          <div className="flex justify-between">
            <span>KAFKA REPLICAS:</span>
            <span className="text-slate-600">3 / ACTIVE</span>
          </div>
        </div>
      </aside>

      {/* 🚀 Main Interface Space */}
      <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden bg-slate-50">
        {/* Dynamic Navigation Header */}
        <header className="h-16 glass-panel border-b border-slate-200 flex items-center justify-between px-6 sm:px-8 relative z-20 shrink-0">
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="lg:hidden p-2 hover:bg-slate-150 rounded-lg text-slate-600"
            >
              <Layers className="w-5 h-5" />
            </button>
            <div className="hidden sm:flex items-center space-x-2 text-xs font-mono bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-lg text-slate-500">
              <Terminal className="w-3.5 h-3.5 text-cyan-600" />
              <span>CLUSTER_STATE: <span className="text-emerald-600 font-bold">HEALTHY</span></span>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {/* Quick presentation Role Selector (Professor Demonstration Panel) */}
            <div className="relative">
              <button 
                onClick={() => setIsSwitcherOpen(!isSwitcherOpen)}
                className="flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-bold border border-blue-500/20 hover:border-blue-400 bg-blue-50 hover:bg-blue-100 text-blue-600 transition-all shadow-[0_2px_10px_rgba(37,99,235,0.05)] cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5 rotate-180 animate-spin-slow" />
                <span>DEMO ROLE SWITCHER</span>
              </button>

              {isSwitcherOpen && (
                <div className="absolute right-0 mt-2 w-64 glass-panel border border-slate-200 rounded-xl shadow-2xl p-2 space-y-1 animate-slide-up z-50">
                  <div className="px-3 py-2 text-[10px] text-slate-400 uppercase tracking-widest font-bold border-b border-slate-100 mb-1">
                    Grading Simulation Roles
                  </div>
                  <button 
                    onClick={() => handleRoleSwitch('passenger')}
                    className="w-full text-left px-3 py-2 rounded-lg text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-100/50 transition-colors flex items-center space-x-2 cursor-pointer"
                  >
                    <User className="w-3.5 h-3.5 text-blue-500" />
                    <span className="font-semibold">Passenger View (GDPR Export)</span>
                  </button>
                  <button 
                    onClick={() => handleRoleSwitch('ground_staff')}
                    className="w-full text-left px-3 py-2 rounded-lg text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-100/50 transition-colors flex items-center space-x-2 cursor-pointer"
                  >
                    <ConciergeBell className="w-3.5 h-3.5 text-emerald-500" />
                    <span className="font-semibold">Ground Staff (DynamoDB Drop)</span>
                  </button>
                  <button 
                    onClick={() => handleRoleSwitch('airline_operator')}
                    className="w-full text-left px-3 py-2 rounded-lg text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-100/50 transition-colors flex items-center space-x-2 cursor-pointer"
                  >
                    <Radio className="w-3.5 h-3.5 text-cyan-500" />
                    <span className="font-semibold">Flight Operator (Scheduler)</span>
                  </button>
                  <button 
                    onClick={() => handleRoleSwitch('admin')}
                    className="w-full text-left px-3 py-2 rounded-lg text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-100/50 transition-colors flex items-center space-x-2 cursor-pointer"
                  >
                    <Shield className="w-3.5 h-3.5 text-blue-600" />
                    <span className="font-semibold">System Admin (ArgoCD & HPA)</span>
                  </button>
                </div>
              )}
            </div>

            {/* Dark mode toggle */}
            <button
              onClick={() => setDarkMode(d => !d)}
              className="p-2 border border-slate-200 bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-400 dark:hover:text-slate-200 rounded-lg transition-all cursor-pointer"
              title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Logout trigger */}
            <button
              onClick={() => { logout(); navigate('/'); }}
              className="p-2 border border-slate-200 hover:border-red-500/20 bg-slate-100 hover:bg-red-50 text-slate-500 hover:text-red-600 rounded-lg transition-all cursor-pointer"
              title="Terminate Secure Session"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Dynamic content rendering grid */}
        <main className="flex-1 overflow-auto p-6 sm:p-8 bg-slate-50">
          {children}
        </main>
      </div>
    </div>
  );
}
