import { Trash2 } from 'lucide-react';

interface DeleteAccountProps {
  deleteConfirm: boolean;
  gdprLoading: boolean;
  setDeleteConfirm: (confirm: boolean) => void;
  onDelete: () => void;
}

export default function DeleteAccount({
  deleteConfirm,
  gdprLoading,
  setDeleteConfirm,
  onDelete
}: DeleteAccountProps) {
  return (
    <div className="glass-panel p-6 rounded-xl border border-red-950 bg-red-950/5 flex flex-col space-y-4">
      <div className="flex justify-between items-start space-x-6">
        <div className="space-y-2 flex-1">
          <h4 className="text-sm font-bold text-red-400 flex items-center">
            <Trash2 className="w-4.5 h-4.5 mr-2 text-red-500" />
            GDPR Article 17: Right to Erasure
          </h4>
          <p className="text-red-300/50 text-xs leading-relaxed">
            Wipe your personal details (email, name, passport ID) permanently from EKS databases. This operation anonymizes payment histories and terminates authentication.
          </p>
        </div>
        {!deleteConfirm && (
          <button 
            onClick={() => setDeleteConfirm(true)} 
            className="bg-red-950/40 border border-red-500/20 hover:border-red-500/40 text-red-400 font-bold text-xs px-4 py-2 rounded-lg transition-all cursor-pointer whitespace-nowrap"
          >
            <Trash2 className="w-3.5 h-3.5 mr-1 inline" />
            <span>Wipe Profile</span>
          </button>
        )}
      </div>

      {deleteConfirm && (
        <div className="bg-slate-950/60 border border-red-900/30 rounded-lg p-4 space-y-3 animate-slide-up">
          <p className="text-red-400 text-xs font-mono">⚠️ WARNING: Erasure is absolute and immediate. All flight itineraries and bag tokens will be permanently scrubbed.</p>
          <div className="flex space-x-3 text-xs">
            <button 
              onClick={onDelete} 
              disabled={gdprLoading} 
              className="bg-red-600 hover:bg-red-500 text-white font-bold px-3 py-1.5 rounded cursor-pointer"
            >
              {gdprLoading ? "Wiping Database..." : "Yes, Delete Accounts"}
            </button>
            <button 
              onClick={() => setDeleteConfirm(false)} 
              className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold px-3 py-1.5 rounded cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
