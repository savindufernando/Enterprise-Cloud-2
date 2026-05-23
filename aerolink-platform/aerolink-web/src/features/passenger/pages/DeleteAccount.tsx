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
    <div className="glass-panel p-6 rounded-xl border border-red-200 bg-red-50/30 flex flex-col space-y-4 shadow-sm">
      <div className="flex justify-between items-start space-x-6">
        <div className="space-y-2 flex-1">
          <h4 className="text-sm font-bold text-red-600 flex items-center">
            <Trash2 className="w-4.5 h-4.5 mr-2 text-red-600" />
            GDPR Article 17: Right to Erasure
          </h4>
          <p className="text-red-700/80 text-xs leading-relaxed font-medium">
            Wipe your personal details (email, name, passport ID) permanently from EKS databases. This operation anonymizes payment histories and terminates authentication.
          </p>
        </div>
        {!deleteConfirm && (
          <button 
            onClick={() => setDeleteConfirm(true)} 
            className="bg-red-50 hover:bg-red-100 border border-red-200 hover:border-red-300 text-red-600 font-bold text-xs px-4 py-2.5 rounded-lg transition-all cursor-pointer whitespace-nowrap uppercase tracking-wider"
          >
            <Trash2 className="w-3.5 h-3.5 mr-1 inline" />
            <span>Wipe Profile</span>
          </button>
        )}
      </div>

      {deleteConfirm && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 space-y-3 animate-slide-up">
          <p className="text-red-700 text-xs font-semibold font-mono">⚠️ WARNING: Erasure is absolute and immediate. All flight itineraries and bag tokens will be permanently scrubbed.</p>
          <div className="flex space-x-3 text-xs">
            <button 
              onClick={onDelete} 
              disabled={gdprLoading} 
              className="bg-red-600 hover:bg-red-500 text-white font-bold px-3 py-1.5 rounded cursor-pointer uppercase tracking-wider"
            >
              {gdprLoading ? "Wiping Database..." : "Yes, Delete Accounts"}
            </button>
            <button 
              onClick={() => setDeleteConfirm(false)} 
              className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold px-3 py-1.5 rounded cursor-pointer uppercase tracking-wider"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
