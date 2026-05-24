import { Trash2, Loader2 } from 'lucide-react';

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
  onDelete,
}: DeleteAccountProps) {
  return (
    <div className="p-6 rounded-xl border border-red-200 bg-red-50/40 space-y-4 shadow-sm">
      <div>
        <h4 className="text-sm font-bold text-red-600 flex items-center gap-2 mb-2">
          <Trash2 className="w-4 h-4" />
          Delete Account
        </h4>
        <p className="text-red-700/80 text-xs leading-relaxed">
          Permanently delete your account and all associated personal information. This action cannot be undone.
        </p>
      </div>

      {!deleteConfirm ? (
        <button
          onClick={() => setDeleteConfirm(true)}
          className="bg-white hover:bg-red-50 border border-red-200 hover:border-red-300 text-red-600 font-semibold text-xs px-4 py-2.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Delete My Account
        </button>
      ) : (
        <div className="bg-white border border-red-200 rounded-lg p-4 space-y-3">
          <p className="text-red-700 text-xs font-semibold">
            Are you sure? This will permanently delete your account and all your booking history.
          </p>
          <div className="flex gap-2">
            <button
              onClick={onDelete}
              disabled={gdprLoading}
              className="flex items-center gap-1.5 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-semibold text-xs px-4 py-2 rounded-lg cursor-pointer transition-colors"
            >
              {gdprLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
              <span>{gdprLoading ? 'Deleting...' : 'Yes, Delete'}</span>
            </button>
            <button
              onClick={() => setDeleteConfirm(false)}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs px-4 py-2 rounded-lg cursor-pointer transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
