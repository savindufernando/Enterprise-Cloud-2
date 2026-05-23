import { useState, useEffect } from 'react';
import { Plane, Lock, ShieldCheck, Eye, EyeOff } from 'lucide-react';

// Access code stored as base64 — works on both HTTP and HTTPS
const GATE_CODE = atob('MDc2ODA5NDczNjA3MTIxNDk2NjU=');
const SESSION_KEY = 'aerolink_demo_access';

export default function DemoGate({ children }: { children: React.ReactNode }) {
  const [unlocked, setUnlocked] = useState(false);
  const [input, setInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (sessionStorage.getItem(SESSION_KEY) === 'true') {
      setUnlocked(true);
    } else {
      // Gate not unlocked yet — clear any persisted auth so the login page
      // always appears after entering the access code
      localStorage.removeItem('aerolink_token');
      localStorage.removeItem('aerolink_user');
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() === GATE_CODE) {
      sessionStorage.setItem(SESSION_KEY, 'true');
      setUnlocked(true);
    } else {
      setError('Incorrect access code. Contact the demo administrator.');
      setInput('');
    }
  };

  if (unlocked) return <>{children}</>;

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-900">
      {/* Left branding panel — matches LoginPage style */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-blue-600 via-indigo-600 to-blue-800 text-white flex-col justify-between p-12 overflow-hidden border-r border-slate-200 shadow-xl">
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <div className="absolute top-20 left-10 w-80 h-80 bg-white rounded-full blur-[100px] animate-pulse" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-cyan-200 rounded-full blur-[120px]" />
        </div>

        <div className="relative z-10">
          <div className="flex items-center space-x-3 mb-16">
            <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center">
              <Plane className="w-6 h-6 rotate-45 text-white" />
            </div>
            <span className="text-2xl font-bold tracking-wider uppercase">AeroLink</span>
          </div>

          <h1 className="text-4xl font-extrabold leading-tight mb-6">
            Enterprise Aviation<br />Platform
          </h1>
          <p className="text-blue-100 text-lg leading-relaxed max-w-sm">
            This is a restricted demo environment. An access code is required to proceed.
          </p>
        </div>

        <div className="relative z-10 flex items-center space-x-3 text-blue-200">
          <ShieldCheck className="w-5 h-5" />
          <span className="text-sm">Protected Demo Environment</span>
        </div>
      </div>

      {/* Right — access code form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex items-center space-x-3 mb-10 lg:hidden">
            <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center">
              <Plane className="w-5 h-5 rotate-45 text-white" />
            </div>
            <span className="text-xl font-bold tracking-wider uppercase text-slate-800">AeroLink</span>
          </div>

          <div className="mb-8">
            <div className="w-12 h-12 bg-blue-50 border border-blue-100 rounded-2xl flex items-center justify-center mb-4">
              <Lock className="w-6 h-6 text-blue-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900">Demo Access</h2>
            <p className="text-slate-500 mt-1 text-sm">Enter the access code to view this demo.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Access Code
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  placeholder="Enter access code"
                  required
                  autoFocus
                  className="w-full px-4 py-3 pr-11 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={!input}
              className="w-full py-3 px-6 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold rounded-xl transition-all duration-200 flex items-center justify-center space-x-2"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Unlock Demo</span>
            </button>
          </form>

          <p className="mt-8 text-center text-xs text-slate-400">
            AeroLink Enterprise · Restricted Demo Environment
          </p>
        </div>
      </div>
    </div>
  );
}
