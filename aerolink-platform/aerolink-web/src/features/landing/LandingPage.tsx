import { useState, useEffect, useMemo, useRef } from 'react';
import {
  Plane, MapPin, Calendar, Users, Search, Lock, ShieldCheck,
  Eye, EyeOff, ChevronRight, ConciergeBell, Radio, Shield,
  Globe, Star, User, LogIn, Loader2, AlertCircle,
  ChevronDown, ClipboardList, Ticket, LogOut
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const GATE_CODE = atob('MDc2ODA5NDczNjA3MTIxNDk2NjU=');
const SESSION_KEY = 'aerolink_demo_access';

// Static name lookup — codes are international standards, no need for an API
const AIRPORT_NAMES: Record<string, string> = {
  CMB: 'Colombo', LAX: 'Los Angeles', JFK: 'New York', LHR: 'London',
  CDG: 'Paris', SIN: 'Singapore', DXB: 'Dubai', HND: 'Tokyo',
  SYD: 'Sydney', FRA: 'Frankfurt', AMS: 'Amsterdam', NRT: 'Tokyo Narita',
  BOM: 'Mumbai', DEL: 'Delhi', HKG: 'Hong Kong', ICN: 'Seoul',
  MAD: 'Madrid', FCO: 'Rome', YYZ: 'Toronto', GRU: 'São Paulo',
};

const airportLabel = (code: string) =>
  AIRPORT_NAMES[code] ? `${code} — ${AIRPORT_NAMES[code]}` : code;

export default function LandingPage() {
  const { login, register, loginAs, logout, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  // Search form state
  const [tripType, setTripType] = useState<'round' | 'one-way'>('round');
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [departureDate, setDepartureDate] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [passengers, setPassengers] = useState(1);

  // Flights & results
  const [flights, setFlights] = useState<any[]>([]);
  const [flightsLoading, setFlightsLoading] = useState(true);
  const [flightsError, setFlightsError] = useState(false);
  const [searchResults, setSearchResults] = useState<any[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [browsingAll, setBrowsingAll] = useState(false);

  // Passenger login/register modal
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [authTab, setAuthTab] = useState<'login' | 'register'>('login');

  // Login fields
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Register fields
  const [regFirstName, setRegFirstName] = useState('');
  const [regLastName, setRegLastName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirm, setRegConfirm] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [regLoading, setRegLoading] = useState(false);
  const [regError, setRegError] = useState('');

  // Passenger profile dropdown
  const [profileOpen, setProfileOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Staff access modal (hidden, accessed from footer)
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [staffStep, setStaffStep] = useState<'code' | 'role'>('code');
  const [accessCode, setAccessCode] = useState('');
  const [showCode, setShowCode] = useState(false);
  const [codeError, setCodeError] = useState('');

  useEffect(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    setDepartureDate(d.toISOString().split('T')[0]);
    const r = new Date();
    r.setDate(r.getDate() + 8);
    setReturnDate(r.toISOString().split('T')[0]);
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    const API_BASE = import.meta.env.VITE_API_URL || 'http://api.aerolink.transnova.shop';
    setFlightsLoading(true);
    setFlightsError(false);
    fetch(`${API_BASE}/api/v1/flights/`)
      .then(res => { if (!res.ok) throw new Error(); return res.json(); })
      .then(data => { setFlights(data.data || []); })
      .catch(() => setFlightsError(true))
      .finally(() => setFlightsLoading(false));
  }, []);

  // Unique airports derived from API flights
  const availableAirports = useMemo(() => {
    const codes = new Set<string>();
    flights.forEach(f => { codes.add(f.origin_airport); codes.add(f.destination_airport); });
    return Array.from(codes).sort();
  }, [flights]);

  // Seed origin/destination from API data once flights load
  useEffect(() => {
    if (availableAirports.length >= 2) {
      setOrigin(availableAirports[0]);
      setDestination(availableAirports.find(c => c !== availableAirports[0]) ?? availableAirports[1]);
    }
  }, [availableAirports]); // eslint-disable-line react-hooks/exhaustive-deps

  // Popular routes: cheapest unique route combination from real flights
  const popularRoutes = useMemo(() => {
    const routeMap = new Map<string, any>();
    flights.forEach(f => {
      const key = `${f.origin_airport}-${f.destination_airport}`;
      if (!routeMap.has(key) || f.base_price < routeMap.get(key).base_price) {
        routeMap.set(key, f);
      }
    });
    return Array.from(routeMap.values())
      .sort((a, b) => a.base_price - b.base_price)
      .slice(0, 4);
  }, [flights]);

  // Staff are redirected away from "/" by LandingRoute in App.tsx, so only passengers can reach here
  const passengerLoggedIn = isAuthenticated && user?.role === 'passenger';

  const handleSearch = () => {
    setBrowsingAll(false);
    setSearching(true);
    setTimeout(() => {
      const results = flights.filter(f =>
        f.origin_airport.toUpperCase() === origin.toUpperCase() &&
        f.destination_airport.toUpperCase() === destination.toUpperCase()
      );
      setSearchResults(results);
      setSearching(false);
    }, 600);
  };

  const handleBrowseAll = () => {
    setBrowsingAll(true);
    setSearchResults(flights);
  };

  // ── Passenger login ──
  const openLoginModal = (tab: 'login' | 'register' = 'login') => {
    setShowLoginModal(true);
    setAuthTab(tab);
    setLoginEmail(''); setLoginPassword(''); setLoginError('');
    setRegFirstName(''); setRegLastName(''); setRegEmail('');
    setRegPassword(''); setRegConfirm(''); setRegError('');
  };

  const handlePassengerLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError('');
    try {
      await login(loginEmail, loginPassword);
      setShowLoginModal(false);
    } catch (err: any) {
      setLoginError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (regPassword !== regConfirm) { setRegError('Passwords do not match.'); return; }
    if (regPassword.length < 6) { setRegError('Password must be at least 6 characters.'); return; }
    setRegLoading(true);
    setRegError('');
    try {
      await register(regEmail, regPassword, regFirstName, regLastName);
      setShowLoginModal(false);
    } catch (err: any) {
      setRegError(err.message || 'Registration failed. Please try again.');
    } finally {
      setRegLoading(false);
    }
  };

  const handleDemoPassenger = () => {
    loginAs('passenger');
    setShowLoginModal(false);
  };

  // ── Staff access (accessed from footer) ──
  const openStaffModal = () => {
    setShowStaffModal(true);
    setStaffStep(sessionStorage.getItem(SESSION_KEY) === 'true' ? 'role' : 'code');
    setAccessCode('');
    setCodeError('');
  };

  const handleCodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (sessionStorage.getItem(SESSION_KEY) === 'true' || accessCode.trim() === GATE_CODE) {
      sessionStorage.setItem(SESSION_KEY, 'true');
      setCodeError('');
      setStaffStep('role');
    } else {
      setCodeError('Incorrect access code. Contact the demo administrator.');
      setAccessCode('');
    }
  };

  const handleRoleSelect = (role: 'admin' | 'airline_operator' | 'ground_staff') => {
    loginAs(role);
    setShowStaffModal(false);
    if (role === 'admin') navigate('/admin');
    else if (role === 'airline_operator') navigate('/operations');
    else navigate('/agent');
  };

  return (
    <div className="min-h-screen bg-white text-slate-900">
      {/* ── Top Navigation Bar ── */}
      <header className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-24">
            {/* Brand */}
            <img src="/aerolink_logo.png" alt="AeroLink" className="h-20 w-auto" />

            {/* Nav links */}
            <nav className="hidden md:flex items-center space-x-8 text-sm font-semibold text-slate-600">
              <a href="#" className="hover:text-blue-600 transition-colors border-b-2 border-blue-600 text-blue-600 pb-0.5">Book a Trip</a>
              <button onClick={() => passengerLoggedIn ? navigate('/passenger?tab=mybookings') : openLoginModal()} className="hover:text-blue-600 transition-colors cursor-pointer">Manage Booking</button>
              <button onClick={() => passengerLoggedIn ? navigate('/passenger?tab=checkin') : openLoginModal()} className="hover:text-blue-600 transition-colors cursor-pointer">Check-in</button>
              <a href="#" className="hover:text-blue-600 transition-colors">Experience</a>
            </nav>

            {/* Right: Login / user state — staff are never on this page while logged in */}
            <div className="flex items-center space-x-3">
              {passengerLoggedIn ? (
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setProfileOpen(o => !o)}
                    className="flex items-center gap-2.5 border border-slate-200 hover:border-blue-300 px-3 py-2 rounded-xl transition-colors cursor-pointer"
                  >
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0">
                      {[user?.firstName?.[0], user?.lastName?.[0]].filter(Boolean).join('').toUpperCase() || (user?.email?.[0] ?? 'P').toUpperCase()}
                    </div>
                    <div className="hidden sm:block text-left">
                      <div className="text-sm font-bold text-slate-800 leading-tight">
                        {user?.firstName ? `${user.firstName}${user.lastName ? ' ' + user.lastName : ''}`.trim() : user?.email?.split('@')[0] ?? ''}
                      </div>
                      <div className="text-[10px] text-slate-400 leading-tight max-w-[120px] truncate">{user?.email}</div>
                    </div>
                    <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform shrink-0 ${profileOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {profileOpen && (
                    <div className="absolute right-0 mt-2 w-64 bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 overflow-hidden animate-fade-in">
                      <div className="bg-gradient-to-r from-blue-600 to-blue-500 px-5 py-4 text-white">
                        <div className="w-10 h-10 bg-white/25 rounded-full flex items-center justify-center text-sm font-bold mb-2">
                          {[user?.firstName?.[0], user?.lastName?.[0]].filter(Boolean).join('').toUpperCase() || (user?.email?.[0] ?? 'P').toUpperCase()}
                        </div>
                        <div className="font-bold text-sm">
                          {user?.firstName ? `${user.firstName}${user.lastName ? ' ' + user.lastName : ''}`.trim() : user?.email?.split('@')[0] ?? ''}
                        </div>
                        <div className="text-blue-200 text-xs mt-0.5 truncate">{user?.email}</div>
                        <div className="text-blue-300 text-[10px] mt-0.5 uppercase tracking-wide font-semibold">Passenger Account</div>
                      </div>
                      <div className="p-2">
                        <button
                          onClick={() => { setProfileOpen(false); navigate('/passenger?tab=mybookings'); }}
                          className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-slate-600 hover:bg-blue-50 hover:text-blue-700 rounded-xl transition-colors cursor-pointer"
                        >
                          <ClipboardList className="w-4 h-4" /> My Bookings
                        </button>
                        <button
                          onClick={() => { setProfileOpen(false); navigate('/passenger?tab=booking'); }}
                          className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-slate-600 hover:bg-blue-50 hover:text-blue-700 rounded-xl transition-colors cursor-pointer"
                        >
                          <Ticket className="w-4 h-4" /> Book a Flight
                        </button>
                        <button
                          onClick={() => { setProfileOpen(false); navigate('/passenger?tab=profile'); }}
                          className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-slate-600 hover:bg-blue-50 hover:text-blue-700 rounded-xl transition-colors cursor-pointer"
                        >
                          <User className="w-4 h-4" /> My Profile
                        </button>
                        <div className="border-t border-slate-100 mt-1 pt-1">
                          <button
                            onClick={() => { logout(); setProfileOpen(false); }}
                            className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
                          >
                            <LogOut className="w-4 h-4" /> Sign Out
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => openLoginModal()}
                  className="flex items-center space-x-2 px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-lg transition-all cursor-pointer shadow-sm"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Login</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* ── Hero Banner ── */}
      <div className="w-full">
        <img
          src="/banner.png"
          alt="AeroLink — Fly Seamlessly. Travel Effortlessly."
          className="w-full object-cover object-center block"
          style={{ height: 'clamp(200px, 40vw, 460px)' }}
        />
      </div>

      {/* ── Flight Search Panel ── */}
      <div className="bg-blue-700">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8">
            {/* Trip type */}
            <div className="flex items-center space-x-6 mb-6 pb-5 border-b border-slate-100 text-sm font-semibold">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input type="radio" checked={tripType === 'round'} onChange={() => setTripType('round')} className="accent-blue-600 w-4 h-4" />
                <span className={tripType === 'round' ? 'text-blue-600' : 'text-slate-400'}>Round Trip</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input type="radio" checked={tripType === 'one-way'} onChange={() => setTripType('one-way')} className="accent-blue-600 w-4 h-4" />
                <span className={tripType === 'one-way' ? 'text-blue-600' : 'text-slate-400'}>One Way</span>
              </label>
            </div>

            {/* Search inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="lg:col-span-1">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">From</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3.5 w-4 h-4 text-blue-500 z-10 pointer-events-none" />
                  <select value={origin} onChange={e => setOrigin(e.target.value)} disabled={flightsLoading} className="w-full pl-9 pr-3 py-3 border border-slate-200 rounded-xl bg-white text-slate-800 font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer disabled:opacity-60">
                    {availableAirports.map(code => <option key={code} value={code}>{airportLabel(code)}</option>)}
                  </select>
                </div>
              </div>

              <div className="lg:col-span-1">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">To</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3.5 w-4 h-4 text-slate-400 z-10 pointer-events-none" />
                  <select value={destination} onChange={e => setDestination(e.target.value)} disabled={flightsLoading} className="w-full pl-9 pr-3 py-3 border border-slate-200 rounded-xl bg-white text-slate-800 font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer disabled:opacity-60">
                    {availableAirports.filter(c => c !== origin).map(code => <option key={code} value={code}>{airportLabel(code)}</option>)}
                  </select>
                </div>
              </div>

              <div className="lg:col-span-1">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Departure</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
                  <input type="date" value={departureDate} onChange={e => setDepartureDate(e.target.value)} className="w-full pl-9 pr-3 py-3 border border-slate-200 rounded-xl bg-white text-slate-800 font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                </div>
              </div>

              <div className="lg:col-span-1">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Return {tripType === 'one-way' && <span className="text-slate-300 font-normal">(N/A)</span>}
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
                  <input type="date" value={returnDate} onChange={e => setReturnDate(e.target.value)} disabled={tripType === 'one-way'} className="w-full pl-9 pr-3 py-3 border border-slate-200 rounded-xl bg-white text-slate-800 font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-40 disabled:cursor-not-allowed" />
                </div>
              </div>

              <div className="lg:col-span-1">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Passengers</label>
                <div className="flex gap-2">
                  <div className="relative flex-1 min-w-0">
                    <Users className="absolute left-3 top-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
                    <select value={passengers} onChange={e => setPassengers(parseInt(e.target.value))} className="w-full pl-9 pr-2 py-3 border border-slate-200 rounded-xl bg-white text-slate-800 font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer">
                      {[1, 2, 3, 4, 5, 6].map(n => <option key={n} value={n}>{n} pax</option>)}
                    </select>
                  </div>
                  <button onClick={handleSearch} disabled={searching || flightsLoading} className="bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white font-bold px-5 py-3 rounded-xl flex items-center space-x-2 transition-all shadow-md text-sm cursor-pointer whitespace-nowrap">
                    {searching || flightsLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                    <span>{flightsLoading ? 'Loading...' : 'Search'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
          {/* Browse all flights link */}
          {!flightsLoading && flights.length > 0 && (
            <div className="text-center mt-4">
              <button
                onClick={handleBrowseAll}
                className="text-blue-200 hover:text-white text-sm font-semibold underline underline-offset-2 cursor-pointer transition-colors"
              >
                Browse all {flights.length} available flights →
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Stats Bar ── */}
      <div className="bg-slate-50 border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 divide-x divide-slate-200">
            {[
              { value: '100+', label: 'Destinations' },
              { value: '2M+',  label: 'Happy Passengers' },
              { value: '99%',  label: 'On-Time Rate' },
              { value: '4.9★', label: 'Passenger Rating' },
            ].map((stat, i) => (
              <div key={i} className={`text-center ${i === 0 ? '' : 'pl-4'}`}>
                <div className="text-2xl font-extrabold text-blue-600">{stat.value}</div>
                <div className="text-xs text-slate-500 mt-0.5 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Main Content ── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        {searchResults !== null ? (
          /* ── Search Results ── */
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-extrabold text-slate-800">
                  {browsingAll
                    ? `All Available Flights (${searchResults.length})`
                    : searchResults.length > 0
                      ? `${searchResults.length} Flight${searchResults.length > 1 ? 's' : ''} Found`
                      : 'No Flights on This Route'}
                </h2>
                <p className="text-sm text-slate-500 mt-1">
                  {browsingAll
                    ? 'Showing all flights in our network'
                    : `${origin} → ${destination} · ${passengers} passenger${passengers > 1 ? 's' : ''} · ${new Date(departureDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}`}
                </p>
              </div>
              <button onClick={() => { setSearchResults(null); setBrowsingAll(false); }} className="text-sm text-blue-600 hover:text-blue-500 font-semibold underline cursor-pointer">
                ← New Search
              </button>
            </div>
            {/* Sort bar (shown when browsing all flights) */}
            {browsingAll && searchResults.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Sort:</span>
                {([
                  { key: 'price', label: 'Cheapest first' },
                  { key: 'dep', label: 'Earliest first' },
                ] as const).map(s => (
                  <button
                    key={s.key}
                    onClick={() => setSearchResults([...searchResults].sort((a, b) =>
                      s.key === 'price'
                        ? a.base_price - b.base_price
                        : new Date(a.departure_time).getTime() - new Date(b.departure_time).getTime()
                    ))}
                    className="text-xs font-semibold px-3 py-1.5 rounded-full border border-slate-200 bg-white text-slate-600 hover:border-blue-400 hover:text-blue-600 transition-all cursor-pointer"
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            )}

            <div className="space-y-3">
              {searchResults.length === 0 ? (
                <div className="text-center py-16 text-slate-400">
                  <Plane className="w-10 h-10 mx-auto mb-3 opacity-30 rotate-90" />
                  <p className="font-semibold text-slate-500 text-base">No flights found on this route.</p>
                  <p className="text-sm mt-1">Try different airports or <button onClick={handleBrowseAll} className="text-blue-600 underline cursor-pointer">browse all flights</button>.</p>
                </div>
              ) : (
                searchResults.map(flight => {
                  const dep = new Date(flight.departure_time);
                  const totalPrice = (flight.base_price * passengers).toFixed(2);
                  const perPerson = Number(flight.base_price).toFixed(2);
                  return (
                    <div key={flight.id} className="bg-white border border-slate-200 rounded-2xl overflow-hidden hover:shadow-lg hover:border-blue-200 transition-all group">
                      <div className="h-1 bg-gradient-to-r from-blue-500 to-blue-700 group-hover:from-blue-600 group-hover:to-blue-800 transition-all" />
                      <div className="p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        {/* Left: flight info */}
                        <div className="flex items-center gap-5 flex-1 min-w-0">
                          <div className="shrink-0 bg-blue-50 border border-blue-100 rounded-xl px-3 py-2 text-center min-w-[72px]">
                            <div className="text-[9px] text-blue-400 uppercase tracking-widest font-bold">Flight</div>
                            <div className="text-blue-700 font-mono font-extrabold text-sm mt-0.5">{flight.flight_number}</div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3">
                              <div className="text-center">
                                <div className="text-2xl font-extrabold text-slate-900 leading-none">{flight.origin_airport}</div>
                                <div className="text-[10px] text-slate-400 mt-0.5 font-medium">{AIRPORT_NAMES[flight.origin_airport] ?? ''}</div>
                              </div>
                              <div className="flex flex-col items-center gap-1 px-1">
                                <div className="w-14 h-px bg-gradient-to-r from-blue-200 via-blue-400 to-blue-200 relative">
                                  <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white flex items-center justify-center">
                                    <Plane className="w-3.5 h-3.5 text-blue-500 rotate-90" />
                                  </div>
                                </div>
                                <span className="text-[9px] text-blue-500 font-bold uppercase tracking-widest mt-0.5">Direct</span>
                              </div>
                              <div className="text-center">
                                <div className="text-2xl font-extrabold text-slate-900 leading-none">{flight.destination_airport}</div>
                                <div className="text-[10px] text-slate-400 mt-0.5 font-medium">{AIRPORT_NAMES[flight.destination_airport] ?? ''}</div>
                              </div>
                            </div>
                            <div className="text-xs text-slate-500 mt-2.5 flex items-center gap-1.5">
                              <Calendar className="w-3 h-3 text-slate-400 shrink-0" />
                              {dep.toLocaleString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                        </div>

                        {/* Right: price + CTA */}
                        <div className="flex items-center gap-4 shrink-0 sm:border-l sm:border-slate-100 sm:pl-5">
                          <div className="text-right">
                            <div className="text-[10px] text-slate-400 uppercase tracking-wide font-semibold">from / person</div>
                            <div className="text-2xl font-extrabold text-slate-900 leading-tight mt-0.5">${perPerson}</div>
                            {passengers > 1 && (
                              <div className="text-xs text-blue-600 font-bold mt-0.5">{passengers} pax: ${totalPrice}</div>
                            )}
                          </div>
                          <button
                            onClick={() => passengerLoggedIn ? navigate('/passenger?tab=booking') : openLoginModal()}
                            className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-3 rounded-xl font-bold text-sm transition-all cursor-pointer shadow-sm group-hover:shadow-md flex items-center gap-2 whitespace-nowrap"
                          >
                            Select
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        ) : (
          /* ── Default Landing Content ── */
          <div className="space-y-20">

            {/* Why Fly With Us */}
            <div>
              <div className="text-center mb-10">
                <span className="inline-block text-xs font-bold text-blue-600 uppercase tracking-widest bg-blue-50 border border-blue-100 px-4 py-1.5 rounded-full mb-3">Why AeroLink</span>
                <h2 className="text-3xl font-extrabold text-slate-800">Travel Made Simple</h2>
                <p className="text-slate-500 mt-2 text-sm max-w-md mx-auto">Exceptional service at every step of your journey, from booking to touchdown.</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  { icon: <Star className="w-6 h-6 text-amber-500" />, iconBg: 'bg-amber-50 border-amber-100', title: 'Best Fare Guarantee', desc: 'We match any lower price you find. Book with confidence knowing you always get the best deal.' },
                  { icon: <Globe className="w-6 h-6 text-blue-600" />, iconBg: 'bg-blue-50 border-blue-100', title: 'Worldwide Destinations', desc: 'Fly to over 100 destinations across 6 continents with seamless connections through our network.' },
                  { icon: <ShieldCheck className="w-6 h-6 text-emerald-600" />, iconBg: 'bg-emerald-50 border-emerald-100', title: 'Safe & Reliable', desc: 'Our modern fleet and award-winning crew are committed to your safety and comfort on every flight.' },
                  { icon: <Plane className="w-6 h-6 text-blue-500" />, iconBg: 'bg-blue-50 border-blue-100', title: 'Flexible Booking', desc: 'Plans change — change or cancel your booking hassle-free with our flexible fare options.' },
                ].map((card, i) => (
                  <div key={i} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md hover:border-blue-200 transition-all group">
                    <div className={`w-11 h-11 ${card.iconBg} border rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>{card.icon}</div>
                    <h3 className="text-base font-bold text-slate-800 mb-2">{card.title}</h3>
                    <p className="text-sm text-slate-500 leading-relaxed">{card.desc}</p>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}
      </div>

      {/* ── How It Works ── */}
      {searchResults === null && (
        <div className="bg-slate-50 border-y border-slate-200 py-16">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <span className="inline-block text-xs font-bold text-blue-600 uppercase tracking-widest bg-blue-50 border border-blue-100 px-4 py-1.5 rounded-full mb-3">How It Works</span>
              <h2 className="text-3xl font-extrabold text-slate-800">Three Steps to Your Next Adventure</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
              {/* Connector line */}
              <div className="hidden md:block absolute top-10 left-1/4 right-1/4 h-0.5 bg-gradient-to-r from-blue-200 via-blue-400 to-blue-200" />
              {[
                { step: '01', icon: <Search className="w-6 h-6 text-blue-600" />, title: 'Search Flights', desc: 'Enter your origin, destination, and travel dates to browse available flights instantly.' },
                { step: '02', icon: <Users className="w-6 h-6 text-blue-600" />, title: 'Choose Your Seat', desc: 'Pick the perfect seat from our interactive cabin map. Business or economy — your choice.' },
                { step: '03', icon: <Plane className="w-6 h-6 text-blue-600" />, title: 'Fly & Enjoy', desc: 'Receive your digital boarding pass and enjoy a seamless journey with AeroLink.' },
              ].map((step, i) => (
                <div key={i} className="relative flex flex-col items-center text-center bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-extrabold shadow-md">{step.step}</div>
                  <div className="w-14 h-14 bg-blue-50 border border-blue-100 rounded-2xl flex items-center justify-center mb-4 mt-3">{step.icon}</div>
                  <h3 className="text-base font-bold text-slate-800 mb-2">{step.title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Popular Routes ── */}
      {searchResults === null && (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="flex items-end justify-between mb-8">
            <div>
              <span className="inline-block text-xs font-bold text-blue-600 uppercase tracking-widest bg-blue-50 border border-blue-100 px-4 py-1.5 rounded-full mb-3">Destinations</span>
              <h2 className="text-3xl font-extrabold text-slate-800">Popular Routes</h2>
              <p className="text-slate-500 mt-1 text-sm">Live fares from our network. Click any to search instantly.</p>
            </div>
          </div>

          {flightsLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {[0, 1, 2, 3].map(i => (
                <div key={i} className="bg-white border border-slate-200 rounded-2xl overflow-hidden animate-pulse">
                  <div className="h-2 bg-slate-200" />
                  <div className="p-5 space-y-3">
                    <div className="h-3 bg-slate-100 rounded w-20" />
                    <div className="h-8 bg-slate-100 rounded w-32" />
                    <div className="h-3 bg-slate-100 rounded w-28" />
                    <div className="h-6 bg-slate-100 rounded w-16 mt-4" />
                  </div>
                </div>
              ))}
            </div>
          ) : flightsError ? (
            <div className="text-center py-10 text-slate-400">
              <Plane className="w-10 h-10 mx-auto mb-3 opacity-30 rotate-90" />
              <p className="text-sm font-semibold">Could not load routes — check your connection.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {popularRoutes.map((flight, i) => {
                const tags = ['Best Value', 'Most Booked', 'Long Haul', 'Premium'];
                return (
                  <button
                    key={flight.id}
                    onClick={() => {
                      setOrigin(flight.origin_airport);
                      setDestination(flight.destination_airport);
                      setTimeout(handleSearch, 0);
                    }}
                    className="text-left bg-white border border-slate-200 rounded-2xl overflow-hidden hover:border-blue-300 hover:shadow-lg transition-all cursor-pointer group"
                  >
                    <div className="h-2 bg-gradient-to-r from-blue-500 to-blue-700 group-hover:from-blue-600 group-hover:to-blue-800 transition-all" />
                    <div className="p-5">
                      <div className="text-[10px] font-bold text-blue-600 uppercase tracking-wider mb-3 bg-blue-50 border border-blue-100 px-2.5 py-1 rounded-full inline-block">{tags[i] ?? 'Popular'}</div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-2xl font-extrabold text-slate-900">{flight.origin_airport}</span>
                        <Plane className="w-4 h-4 text-blue-400 rotate-90 shrink-0" />
                        <span className="text-2xl font-extrabold text-slate-900">{flight.destination_airport}</span>
                      </div>
                      <div className="text-xs text-slate-400 mb-4">
                        {AIRPORT_NAMES[flight.origin_airport] ?? flight.origin_airport} → {AIRPORT_NAMES[flight.destination_airport] ?? flight.destination_airport}
                      </div>
                      <div className="flex items-end justify-between">
                        <div>
                          <div className="text-[10px] text-slate-400 uppercase tracking-wide">from</div>
                          <div className="text-xl font-extrabold text-blue-600">${Math.round(flight.base_price)}</div>
                        </div>
                        <div className="w-8 h-8 bg-blue-50 group-hover:bg-blue-600 border border-blue-100 group-hover:border-blue-600 rounded-lg flex items-center justify-center transition-all">
                          <ChevronRight className="w-4 h-4 text-blue-400 group-hover:text-white transition-colors" />
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── CTA Banner ── */}
      {searchResults === null && (
        <div className="bg-gradient-to-br from-blue-700 via-blue-600 to-blue-500 py-16">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
              <div className="text-white text-center lg:text-left">
                <h2 className="text-3xl font-extrabold mb-3">Ready to Take Off?</h2>
                <p className="text-blue-100 text-sm leading-relaxed max-w-lg">Create your AeroLink account today and unlock exclusive member fares, priority boarding, and seamless digital check-in on every journey.</p>
                <div className="flex flex-wrap gap-4 mt-5 justify-center lg:justify-start text-sm text-blue-200">
                  <span className="flex items-center gap-1.5"><Star className="w-4 h-4 text-amber-400" /> Member-only fares</span>
                  <span className="flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-emerald-400" /> Secure booking</span>
                  <span className="flex items-center gap-1.5"><Plane className="w-4 h-4 text-blue-300" /> Digital boarding pass</span>
                </div>
              </div>
              <div className="flex flex-col gap-3 shrink-0">
                <button
                  onClick={() => openLoginModal('register')}
                  className="bg-white hover:bg-blue-50 text-blue-700 font-bold px-10 py-3.5 rounded-xl text-sm transition-all cursor-pointer shadow-lg whitespace-nowrap"
                >
                  Create Free Account
                </button>
                <button
                  onClick={() => openLoginModal('login')}
                  className="border border-blue-400 hover:bg-blue-600/40 text-white font-semibold px-10 py-3 rounded-xl text-sm transition-all cursor-pointer whitespace-nowrap"
                >
                  Sign In
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Footer ── */}
      <footer className="border-t border-slate-100 mt-10 py-8 text-center text-xs text-slate-400 space-y-2">
        <div className="flex justify-center mb-4">
          <img src="/aerolink_logo.png" alt="AeroLink" className="h-8 w-auto opacity-40" />
        </div>
        <p className="text-slate-400">© {new Date().getFullYear()} AeroLink Aviation. All rights reserved.</p>
        <div className="flex justify-center gap-5 text-slate-300 mt-2">
          <a href="#" className="hover:text-slate-500 transition-colors">Privacy Policy</a>
          <a href="#" className="hover:text-slate-500 transition-colors">Terms of Service</a>
          <a href="#" className="hover:text-slate-500 transition-colors">Cookie Settings</a>
        </div>
        <p>
          <button onClick={openStaffModal} className="text-slate-300 hover:text-slate-500 transition-colors cursor-pointer text-[10px]">
            Staff Access
          </button>
        </p>
      </footer>

      {/* ── Passenger Login / Register Modal ── */}
      {showLoginModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={e => { if (e.target === e.currentTarget) setShowLoginModal(false); }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm relative animate-fade-in">
            <button onClick={() => setShowLoginModal(false)} className="absolute top-4 right-4 w-7 h-7 flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors cursor-pointer font-bold text-lg z-10">×</button>

            {/* Tabs */}
            <div className="flex border-b border-slate-200 rounded-t-2xl overflow-hidden">
              <button
                onClick={() => { setAuthTab('login'); setLoginError(''); }}
                className={`flex-1 py-4 text-sm font-bold transition-colors cursor-pointer ${authTab === 'login' ? 'bg-white text-blue-600 border-b-2 border-blue-600' : 'bg-slate-50 text-slate-400 hover:text-slate-600'}`}
              >
                Sign In
              </button>
              <button
                onClick={() => { setAuthTab('register'); setRegError(''); }}
                className={`flex-1 py-4 text-sm font-bold transition-colors cursor-pointer ${authTab === 'register' ? 'bg-white text-blue-600 border-b-2 border-blue-600' : 'bg-slate-50 text-slate-400 hover:text-slate-600'}`}
              >
                Register
              </button>
            </div>

            <div className="p-7">
              {authTab === 'login' ? (
                <>
                  <p className="text-slate-500 text-sm mb-5">Sign in to book flights and manage your reservations.</p>
                  <form onSubmit={handlePassengerLogin} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1.5">Email Address</label>
                      <input
                        type="email"
                        value={loginEmail}
                        onChange={e => setLoginEmail(e.target.value)}
                        placeholder="you@example.com"
                        required
                        autoFocus
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1.5">Password</label>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={loginPassword}
                          onChange={e => setLoginPassword(e.target.value)}
                          placeholder="Enter your password"
                          required
                          className="w-full px-4 py-2.5 pr-11 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-sm"
                        />
                        <button type="button" onClick={() => setShowPassword(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer" tabIndex={-1}>
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                    {loginError && (
                      <div className="flex items-start space-x-2 text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                        <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                        <span>{loginError}</span>
                      </div>
                    )}
                    <button type="submit" disabled={loginLoading || !loginEmail || !loginPassword} className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold rounded-xl transition-all flex items-center justify-center space-x-2 cursor-pointer text-sm">
                      {loginLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />}
                      <span>{loginLoading ? 'Signing in...' : 'Sign In'}</span>
                    </button>
                  </form>
                  <div className="mt-4 pt-4 border-t border-slate-100">
                    <p className="text-[11px] text-slate-400 text-center mb-2.5 font-mono">— or for demo purposes —</p>
                    <button onClick={handleDemoPassenger} className="w-full py-2.5 border border-slate-200 hover:border-blue-300 hover:bg-blue-50 text-slate-600 hover:text-blue-700 font-semibold text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center space-x-2">
                      <Plane className="w-3.5 h-3.5 rotate-45" />
                      <span>Continue as Demo Passenger</span>
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-slate-500 text-sm mb-5">Create your account to start booking flights.</p>
                  <form onSubmit={handleRegister} className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1.5">First Name</label>
                        <input
                          type="text"
                          value={regFirstName}
                          onChange={e => setRegFirstName(e.target.value)}
                          placeholder="First name"
                          required
                          autoFocus
                          className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1.5">Last Name</label>
                        <input
                          type="text"
                          value={regLastName}
                          onChange={e => setRegLastName(e.target.value)}
                          placeholder="Last name"
                          required
                          className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-sm"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1.5">Email Address</label>
                      <input
                        type="email"
                        value={regEmail}
                        onChange={e => setRegEmail(e.target.value)}
                        placeholder="you@example.com"
                        required
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1.5">Password</label>
                      <div className="relative">
                        <input
                          type={showRegPassword ? 'text' : 'password'}
                          value={regPassword}
                          onChange={e => setRegPassword(e.target.value)}
                          placeholder="Min. 6 characters"
                          required
                          className="w-full px-4 py-2.5 pr-11 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-sm"
                        />
                        <button type="button" onClick={() => setShowRegPassword(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer" tabIndex={-1}>
                          {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1.5">Confirm Password</label>
                      <input
                        type="password"
                        value={regConfirm}
                        onChange={e => setRegConfirm(e.target.value)}
                        placeholder="Repeat your password"
                        required
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-sm"
                      />
                    </div>
                    {regError && (
                      <div className="flex items-start space-x-2 text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                        <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                        <span>{regError}</span>
                      </div>
                    )}
                    <button type="submit" disabled={regLoading || !regFirstName || !regLastName || !regEmail || !regPassword || !regConfirm} className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold rounded-xl transition-all flex items-center justify-center space-x-2 cursor-pointer text-sm mt-1">
                      {regLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <User className="w-4 h-4" />}
                      <span>{regLoading ? 'Creating account...' : 'Create Account'}</span>
                    </button>
                  </form>
                  <div className="mt-4 pt-4 border-t border-slate-100">
                    <p className="text-[11px] text-slate-400 text-center mb-2.5 font-mono">— or for demo purposes —</p>
                    <button onClick={handleDemoPassenger} className="w-full py-2.5 border border-slate-200 hover:border-blue-300 hover:bg-blue-50 text-slate-600 hover:text-blue-700 font-semibold text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center space-x-2">
                      <Plane className="w-3.5 h-3.5 rotate-45" />
                      <span>Continue as Demo Passenger</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Staff Access Modal (hidden, footer link) ── */}
      {showStaffModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={e => { if (e.target === e.currentTarget) setShowStaffModal(false); }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-8 relative animate-fade-in">
            <button onClick={() => setShowStaffModal(false)} className="absolute top-4 right-4 w-7 h-7 flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors cursor-pointer font-bold text-lg">×</button>

            {staffStep === 'code' ? (
              <>
                <div className="w-12 h-12 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-center mb-5">
                  <Lock className="w-6 h-6 text-slate-600" />
                </div>
                <h2 className="text-xl font-extrabold text-slate-900 mb-1">Staff Portal</h2>
                <p className="text-slate-500 text-sm mb-6">Enter the staff access code to continue.</p>
                <form onSubmit={handleCodeSubmit} className="space-y-4">
                  <div className="relative">
                    <input
                      type={showCode ? 'text' : 'password'}
                      value={accessCode}
                      onChange={e => setAccessCode(e.target.value)}
                      placeholder="Enter access code"
                      required
                      autoFocus
                      className="w-full px-4 py-3 pr-11 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-transparent transition"
                    />
                    <button type="button" onClick={() => setShowCode(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer" tabIndex={-1}>
                      {showCode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {codeError && <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{codeError}</p>}
                  <button type="submit" disabled={!accessCode} className="w-full py-3 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white font-bold rounded-xl transition-all flex items-center justify-center space-x-2 cursor-pointer">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Verify &amp; Continue</span>
                  </button>
                </form>
              </>
            ) : (
              <>
                <div className="w-12 h-12 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center justify-center mb-5">
                  <ShieldCheck className="w-6 h-6 text-emerald-600" />
                </div>
                <h2 className="text-xl font-extrabold text-slate-900 mb-1">Select Your Role</h2>
                <p className="text-slate-500 text-sm mb-6">Choose your staff access level.</p>
                <div className="space-y-2.5">
                  <button onClick={() => handleRoleSelect('admin')} className="w-full flex items-center space-x-4 p-4 border border-slate-200 hover:border-blue-400 hover:bg-blue-50 rounded-xl transition-all cursor-pointer group text-left">
                    <div className="w-10 h-10 bg-blue-100 group-hover:bg-blue-200 rounded-xl flex items-center justify-center shrink-0 transition-colors">
                      <Shield className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <div className="font-bold text-slate-800 text-sm">System Administrator</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">ArgoCD, HPA, GDPR audit, Kafka firehose</div>
                    </div>
                  </button>
                  <button onClick={() => handleRoleSelect('airline_operator')} className="w-full flex items-center space-x-4 p-4 border border-slate-200 hover:border-cyan-400 hover:bg-cyan-50 rounded-xl transition-all cursor-pointer group text-left">
                    <div className="w-10 h-10 bg-cyan-100 group-hover:bg-cyan-200 rounded-xl flex items-center justify-center shrink-0 transition-colors">
                      <Radio className="w-5 h-5 text-cyan-600" />
                    </div>
                    <div>
                      <div className="font-bold text-slate-800 text-sm">Flight Operator</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">Operations control, dynamic pricing, health map</div>
                    </div>
                  </button>
                  <button onClick={() => handleRoleSelect('ground_staff')} className="w-full flex items-center space-x-4 p-4 border border-slate-200 hover:border-emerald-400 hover:bg-emerald-50 rounded-xl transition-all cursor-pointer group text-left">
                    <div className="w-10 h-10 bg-emerald-100 group-hover:bg-emerald-200 rounded-xl flex items-center justify-center shrink-0 transition-colors">
                      <ConciergeBell className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <div className="font-bold text-slate-800 text-sm">Ground Staff</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">Manifest validation, baggage scanning, Kafka scan</div>
                    </div>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
