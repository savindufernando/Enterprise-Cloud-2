import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Plane, Mail, Lock, User, ArrowRight, Shield, Radio, UserCheck, Sparkles, Terminal } from 'lucide-react';

export default function LoginPage() {
  const { login, register, loginAs } = useAuth();
  const navigate = useNavigate();

  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isRegister) {
        await register(email, password, firstName, lastName);
      } else {
        await login(email, password);
      }
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = (role: string) => {
    loginAs(role);
    if (role === 'passenger') navigate('/');
    else if (role === 'ground_staff') navigate('/agent');
    else if (role === 'airline_operator') navigate('/operations');
    else if (role === 'admin') navigate('/admin');
  };

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-900">
      {/* Left — High-Tech Aviation Branding Panel */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-blue-600 via-indigo-600 to-blue-800 text-white flex-col justify-between p-12 overflow-hidden border-r border-slate-200 shadow-xl">
        {/* Glow Effects */}
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <div className="absolute top-20 left-10 w-80 h-80 bg-white rounded-full blur-[100px] animate-pulse" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-cyan-200 rounded-full blur-[120px]" />
        </div>

        <div className="relative z-10">
          <div className="flex items-center space-x-3 mb-16">
            <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center shadow-[0_4px_12px_rgba(255,255,255,0.15)]">
              <Plane className="w-6 h-6 rotate-45 text-white" />
            </div>
            <span className="text-2xl font-bold tracking-wider font-sans uppercase">AeroLink</span>
          </div>

          <div className="inline-flex items-center space-x-2 bg-white/10 border border-white/25 px-3.5 py-1.5 rounded-full text-xs font-bold text-white mb-6 uppercase tracking-wider font-mono">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Distributed Operations v4.2</span>
          </div>

          <h1 className="text-5xl font-black leading-tight mb-6 tracking-tight text-white drop-shadow-md">
            Cloud-Native<br />Aviation Platform
          </h1>
          
          <p className="text-blue-100 text-base max-w-md leading-relaxed opacity-90">
            A secure distributed microservices architecture orchestrating passenger manifests, baggage logistics, and flight operations in real-time.
          </p>
        </div>

        <div className="relative z-10 grid grid-cols-3 gap-4 text-center font-mono">
          <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-xl p-4 shadow-[0_4px_20px_rgba(0,0,0,0.15)]">
            <div className="text-3xl font-extrabold text-white">6</div>
            <div className="text-[10px] text-blue-100 mt-1 uppercase font-bold tracking-wider">Microservices</div>
          </div>
          <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-xl p-4 shadow-[0_4px_20px_rgba(0,0,0,0.15)]">
            <div className="text-3xl font-extrabold text-white">4</div>
            <div className="text-[10px] text-blue-100 mt-1 uppercase font-bold tracking-wider">User Roles</div>
          </div>
          <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-xl p-4 shadow-[0_4px_20px_rgba(0,0,0,0.15)]">
            <div className="text-3xl font-extrabold text-white">AWS</div>
            <div className="text-[10px] text-blue-100 mt-1 uppercase font-bold tracking-wider">EKS Cluster</div>
          </div>
        </div>
      </div>

      {/* Right — Auth Card Panel */}
      <div className="flex-1 flex items-center justify-center p-8 bg-slate-50">
        <div className="w-full max-w-md space-y-8 glass-panel-neon p-8 sm:p-10 rounded-2xl border border-slate-200 shadow-2xl relative">
          
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center justify-center space-x-2 mb-6">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-lg flex items-center justify-center text-white">
              <Plane className="w-5 h-5 rotate-45" />
            </div>
            <span className="text-xl font-bold tracking-wider text-slate-800 uppercase">AeroLink</span>
          </div>

          <div>
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center">
              {isRegister ? 'Manifest Registration' : 'Operations Gate'}
            </h2>
            <p className="mt-1.5 text-xs text-slate-500 font-mono">
              {isRegister
                ? 'PROVIDE SECURE PROFILE DETAILS'
                : 'ENTER SYSTEM AUTH CLEARANCE CREDENTIALS'}
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2.5 rounded-lg text-xs font-mono">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegister && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">First Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      value={firstName}
                      onChange={e => setFirstName(e.target.value)}
                      required
                      placeholder="Jane"
                      className="w-full pl-10 pr-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white text-slate-800 text-sm font-semibold"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Last Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      value={lastName}
                      onChange={e => setLastName(e.target.value)}
                      required
                      placeholder="Doe"
                      className="w-full pl-10 pr-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white text-slate-800 text-sm font-semibold"
                    />
                  </div>
                </div>
              </div>
            )}

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Operations Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  placeholder="you@aerolink.io"
                  className="w-full pl-10 pr-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white text-slate-800 text-sm font-semibold font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Authorization Code</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white text-slate-800 text-sm font-semibold"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 rounded-lg shadow-md transition-all flex items-center justify-center space-x-2 disabled:opacity-50 text-xs uppercase tracking-wider cursor-pointer mt-6"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
              ) : (
                <>
                  <span>{isRegister ? 'Authorize Account' : 'Gateway Verification'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>

          <div className="text-center mt-4">
            <button
              onClick={() => { setIsRegister(!isRegister); setError(''); }}
              className="text-blue-600 hover:text-blue-500 text-xs font-bold font-mono transition-colors cursor-pointer"
            >
              {isRegister ? 'ALREADY REGISTERED? ENTER OPERATIONS GATEWAY' : "NEW USER? REGISTER AS A PASSENGER"}
            </button>
          </div>

          {/* Quick Demo Staff logins (Professor Bypass Console) */}
          <div className="border-t border-slate-200 pt-6 mt-6">
            <div className="flex items-center justify-center space-x-1.5 text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-4 font-mono">
              <Terminal className="w-3.5 h-3.5 text-cyan-600" />
              <span>Demonstration Bypass Console</span>
            </div>
            
            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => handleDemoLogin('admin')}
                className="flex flex-col items-center p-3 border border-slate-200 hover:border-blue-500/30 rounded-xl hover:bg-blue-50/50 transition-all group cursor-pointer shadow-[0_2px_8px_rgba(0,0,0,0.02)]"
              >
                <Shield className="w-5 h-5 text-slate-400 group-hover:text-blue-600 mb-1" />
                <span className="text-[10px] font-bold text-slate-500 group-hover:text-blue-600 font-mono">ADMIN</span>
              </button>
              <button
                onClick={() => handleDemoLogin('airline_operator')}
                className="flex flex-col items-center p-3 border border-slate-200 hover:border-blue-500/30 rounded-xl hover:bg-blue-50/50 transition-all group cursor-pointer shadow-[0_2px_8px_rgba(0,0,0,0.02)]"
              >
                <Radio className="w-5 h-5 text-slate-400 group-hover:text-blue-600 mb-1" />
                <span className="text-[10px] font-bold text-slate-500 group-hover:text-blue-600 font-mono">OPERATOR</span>
              </button>
              <button
                onClick={() => handleDemoLogin('ground_staff')}
                className="flex flex-col items-center p-3 border border-slate-200 hover:border-blue-500/30 rounded-xl hover:bg-blue-50/50 transition-all group cursor-pointer shadow-[0_2px_8px_rgba(0,0,0,0.02)]"
              >
                <UserCheck className="w-5 h-5 text-slate-400 group-hover:text-blue-600 mb-1" />
                <span className="text-[10px] font-bold text-slate-500 group-hover:text-blue-600 font-mono">STAFF</span>
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
