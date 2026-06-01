import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Ticket, User, LogOut, ChevronDown, ClipboardList, Menu, X, Moon, Sun } from 'lucide-react';

interface PassengerAppLayoutProps {
  children: React.ReactNode;
}

export default function PassengerAppLayout({ children }: PassengerAppLayoutProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [profileOpen, setProfileOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Feature 11: Dark mode
  const [darkMode, setDarkMode] = useState(() => {
    try { return localStorage.getItem('aerolink_dark_mode') === 'true'; } catch { return false; }
  });
  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    localStorage.setItem('aerolink_dark_mode', String(darkMode));
  }, [darkMode]);

  const initials = [user?.firstName?.[0], user?.lastName?.[0]]
    .filter(Boolean).join('').toUpperCase() || (user?.email?.[0] ?? 'P').toUpperCase();
  const displayName = user?.firstName
    ? `${user.firstName}${user.lastName ? ' ' + user.lastName : ''}`.trim()
    : user?.email?.split('@')[0] ?? '';

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const activeTab = searchParams.get('tab') ?? 'booking';

  const navTo = (tab: string) => {
    setMenuOpen(false);
    navigate(`/passenger?tab=${tab}`);
  };

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
      {/* Header — matches landing page style */}
      <header className="sticky top-0 z-50 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Brand */}
            <button onClick={() => navigate('/')} className="cursor-pointer shrink-0">
              <img src="/aerolink_logo.png" alt="AeroLink" className="h-14 w-auto" />
            </button>

            {/* Nav */}
            <nav className="hidden md:flex items-center space-x-8 text-sm font-semibold text-slate-600">
              <button
                onClick={() => navTo('booking')}
                className={`hover:text-blue-600 transition-colors pb-0.5 border-b-2 ${activeTab === 'booking' ? 'border-blue-600 text-blue-600' : 'border-transparent'}`}
              >
                Book a Trip
              </button>
              <button
                onClick={() => navTo('mybookings')}
                className={`hover:text-blue-600 transition-colors pb-0.5 border-b-2 ${activeTab === 'mybookings' ? 'border-blue-600 text-blue-600' : 'border-transparent'}`}
              >
                Manage Booking
              </button>
              <button
                onClick={() => navTo('checkin')}
                className={`hover:text-blue-600 transition-colors pb-0.5 border-b-2 ${activeTab === 'checkin' ? 'border-blue-600 text-blue-600' : 'border-transparent'}`}
              >
                Check-in
              </button>
              <button
                onClick={() => navTo('profile')}
                className={`hover:text-blue-600 transition-colors pb-0.5 border-b-2 ${activeTab === 'profile' ? 'border-blue-600 text-blue-600' : 'border-transparent'}`}
              >
                My Profile
              </button>
            </nav>

            {/* Dark mode toggle */}
            <button
              onClick={() => setDarkMode(d => !d)}
              className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
              title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            {/* Mobile hamburger */}
            <button
              onClick={() => setMenuOpen(o => !o)}
              className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
              aria-label="Toggle menu"
            >
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            {/* Profile dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setProfileOpen(o => !o)}
                className="flex items-center gap-2.5 border border-slate-200 hover:border-blue-300 px-3 py-2 rounded-xl transition-colors cursor-pointer"
              >
                <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0">
                  {initials}
                </div>
                <div className="hidden sm:block text-left">
                  <div className="text-sm font-bold text-slate-800 leading-tight">{displayName}</div>
                  <div className="text-[10px] text-slate-400 leading-tight max-w-[120px] truncate">{user?.email}</div>
                </div>
                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform shrink-0 ${profileOpen ? 'rotate-180' : ''}`} />
              </button>

              {profileOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 overflow-hidden animate-fade-in">
                  {/* Profile header */}
                  <div className="bg-gradient-to-r from-blue-600 to-blue-500 px-5 py-4 text-white">
                    <div className="w-10 h-10 bg-white/25 rounded-full flex items-center justify-center text-sm font-bold mb-2">
                      {initials}
                    </div>
                    <div className="font-bold text-sm">{displayName}</div>
                    <div className="text-blue-200 text-xs mt-0.5 truncate">{user?.email}</div>
                    <div className="text-blue-300 text-[10px] mt-0.5 uppercase tracking-wide font-semibold">Passenger Account</div>
                  </div>

                  {/* Actions */}
                  <div className="p-2">
                    <button
                      onClick={() => { setProfileOpen(false); navTo('mybookings'); }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-slate-600 hover:bg-blue-50 hover:text-blue-700 rounded-xl transition-colors cursor-pointer"
                    >
                      <ClipboardList className="w-4 h-4" /> My Bookings
                    </button>
                    <button
                      onClick={() => { setProfileOpen(false); navTo('profile'); }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-slate-600 hover:bg-blue-50 hover:text-blue-700 rounded-xl transition-colors cursor-pointer"
                    >
                      <User className="w-4 h-4" /> My Profile
                    </button>
                    <button
                      onClick={() => { setProfileOpen(false); navTo('booking'); }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-slate-600 hover:bg-blue-50 hover:text-blue-700 rounded-xl transition-colors cursor-pointer"
                    >
                      <Ticket className="w-4 h-4" /> Book a Flight
                    </button>
                    <div className="border-t border-slate-100 mt-1 pt-1">
                      <button
                        onClick={() => { logout(); navigate('/'); }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
                      >
                        <LogOut className="w-4 h-4" /> Sign Out
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile nav dropdown */}
        {menuOpen && (
          <div className="md:hidden border-t border-slate-100 bg-white px-4 py-3 space-y-1">
            {[
              { tab: 'booking', label: 'Book a Trip' },
              { tab: 'mybookings', label: 'Manage Booking' },
              { tab: 'checkin', label: 'Check-in' },
              { tab: 'profile', label: 'My Profile' },
            ].map(({ tab, label }) => (
              <button
                key={tab}
                onClick={() => navTo(tab)}
                className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors ${activeTab === tab ? 'bg-blue-50 text-blue-600' : 'text-slate-600 hover:bg-slate-50 hover:text-blue-600'}`}
              >
                {label}
              </button>
            ))}
          </div>
        )}
      </header>

      {/* Content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 dark:bg-slate-900">
        {children}
      </main>
    </div>
  );
}
