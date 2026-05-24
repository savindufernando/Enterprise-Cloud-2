import { FileDown, Loader2, User } from 'lucide-react';

interface UserType {
  id: string;
  email: string;
  role: string;
  firstName?: string;
  lastName?: string;
}

interface GDPRExportProps {
  user: UserType | null;
  gdprLoading: boolean;
  onExport: () => void;
}

export default function GDPRExport({ user, gdprLoading, onExport }: GDPRExportProps) {
  return (
    <div className="space-y-6 text-slate-800">
      {/* Profile Info */}
      <div className="p-6 rounded-xl border border-slate-200 bg-white shadow-sm">
        <h3 className="text-sm font-bold text-slate-700 mb-5 flex items-center border-b border-slate-100 pb-3">
          <User className="w-4 h-4 mr-2 text-blue-600" />
          Account Details
        </h3>
        <div className="space-y-4 text-sm">
          {(user?.firstName || user?.lastName) && (
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Full Name</span>
              <span className="text-slate-800 font-semibold">{user?.firstName} {user?.lastName}</span>
            </div>
          )}
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Email Address</span>
            <span className="text-slate-800 font-semibold">{user?.email}</span>
          </div>
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Account Type</span>
            <span className="text-xs font-bold capitalize text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-full inline-block">
              {user?.role === 'passenger' ? 'Passenger' : user?.role}
            </span>
          </div>
        </div>
      </div>

      {/* Download My Data */}
      <div className="p-6 rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex justify-between items-start gap-6">
          <div className="space-y-1.5 flex-1">
            <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <FileDown className="w-4 h-4 text-blue-600" />
              Download My Data
            </h4>
            <p className="text-slate-500 text-xs leading-relaxed">
              Download a copy of your account information, booking history, and travel records in JSON format.
            </p>
          </div>
          <button
            onClick={onExport}
            disabled={gdprLoading}
            className="bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs px-4 py-2.5 rounded-lg flex items-center gap-1.5 transition-colors disabled:opacity-40 cursor-pointer shadow-sm shrink-0"
          >
            {gdprLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileDown className="w-3.5 h-3.5" />}
            <span>Download</span>
          </button>
        </div>
      </div>
    </div>
  );
}
