import { FileDown, Loader2 } from 'lucide-react';

interface User {
  id: string;
  email: string;
  role: string;
}

interface GDPRExportProps {
  user: User | null;
  gdprLoading: boolean;
  onExport: () => void;
}

export default function GDPRExport({ user, gdprLoading, onExport }: GDPRExportProps) {
  return (
    <div className="space-y-6">
      {/* Session Details */}
      <div className="glass-panel p-6 rounded-xl border border-slate-800 bg-[#111827]/30">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Active Profile</h3>
        <div className="space-y-4 font-mono text-xs">
          <div>
            <span className="text-[10px] text-slate-500 font-bold block uppercase tracking-wider">Account Email</span>
            <span className="text-slate-200 mt-0.5 block truncate">{user?.email}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-500 font-bold block uppercase tracking-wider">Access Token Role</span>
            <span className="text-xs font-bold uppercase tracking-wider text-cyan-400 bg-cyan-950/40 border border-cyan-900/40 px-2 py-0.5 rounded-full inline-block mt-1">
              {user?.role}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-slate-500 font-bold block uppercase tracking-wider">Distributed User ID</span>
            <span className="text-[10px] bg-slate-950/60 border border-slate-900 p-2 rounded text-cyan-500/80 block mt-1 break-all select-all">
              {user?.id}
            </span>
          </div>
        </div>
      </div>

      {/* Article 20 Portability Card */}
      <div className="glass-panel p-6 rounded-xl border border-slate-800 bg-[#111827]/20 flex justify-between items-start space-x-6">
        <div className="space-y-2 flex-1">
          <h4 className="text-sm font-bold text-slate-200 flex items-center">
            <FileDown className="w-4.5 h-4.5 mr-2 text-cyan-400" />
            GDPR Article 20: Data Portability
          </h4>
          <p className="text-slate-400 text-xs leading-relaxed">
            Export your passenger details, seat reservations, baggage tracker schedules, and payment transactional audit records in a standard structured JSON payload.
          </p>
        </div>
        <button 
          onClick={onExport} 
          disabled={gdprLoading} 
          className="bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs px-4 py-2 rounded-lg flex items-center space-x-1.5 transition-colors disabled:opacity-40 cursor-pointer"
        >
          {gdprLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileDown className="w-3.5 h-3.5" />}
          <span>Export JSON</span>
        </button>
      </div>
    </div>
  );
}
