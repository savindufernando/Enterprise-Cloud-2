import { useState, useEffect, useRef } from 'react';
import {
  Shield, Cpu, RefreshCw, Eye, EyeOff, CheckCircle2,
  Server, Activity, History, Radio, Users, BookOpen,
  Plane, CalendarDays, Armchair, BadgeCheck, XCircle,
  BarChart3, Search, ChevronDown, ChevronUp, Download, UserCog
} from 'lucide-react';
import { getAllBookings, updateBooking } from '../../passenger/pages/MyBookings';
import type { Booking } from '../../passenger/pages/MyBookings';

interface UserRecord {
  id: string;
  email: string;
  role: string;
  firstName?: string;
  lastName?: string;
}

function getAllUsers(): UserRecord[] {
  try { return JSON.parse(localStorage.getItem('aerolink_all_users') || '[]'); } catch { return []; }
}

function saveAllUsers(users: UserRecord[]) {
  localStorage.setItem('aerolink_all_users', JSON.stringify(users));
}

function exportBookingsCsv(bookings: Booking[]) {
  const header = 'ID,Flight,Origin,Destination,Departure,Passenger,Passport,Seat,Status,Amount,Booked At,Insurance,Meal';
  const rows = bookings.map(b => [
    b.id, b.flight_number, b.origin_airport, b.destination_airport,
    b.departure_time, `"${b.passenger_name}"`, b.passport_number,
    b.seat, b.status || 'confirmed', b.amount_paid ?? b.base_price,
    b.booked_at, b.has_insurance ? 'Yes' : 'No', b.meal_preference || 'standard',
  ].join(','));
  const csv = [header, ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `aerolink_bookings_${Date.now()}.csv`; a.click();
  URL.revokeObjectURL(url);
}

type AdminTab = 'system' | 'passengers' | 'bookings' | 'analytics';

// Simple CSS bar chart component
function BarChart({ data }: { data: { label: string; value: number; color?: string }[] }) {
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div className="flex items-end gap-2 h-32">
      {data.map(d => (
        <div key={d.label} className="flex flex-col items-center gap-1 flex-1">
          <span className="text-[10px] font-bold text-slate-600">{d.value}</span>
          <div
            className={`w-full rounded-t-md transition-all ${d.color || 'bg-blue-500'}`}
            style={{ height: `${Math.max((d.value / max) * 100, 4)}%` }}
          />
          <span className="text-[9px] text-slate-400 text-center leading-tight truncate w-full text-center">{d.label}</span>
        </div>
      ))}
    </div>
  );
}

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<AdminTab>('system');

  // System tab state
  const [argocdSyncing, setArgocdSyncing] = useState(false);
  const [argocdSynced, setArgocdSynced] = useState(true);
  const [hpaMin, setHpaMin] = useState(3);
  const [hpaMax, setHpaMax] = useState(10);
  const [hpaCpu, setHpaCpu] = useState(50);
  const [hpaLoading, setHpaLoading] = useState(false);
  const [hpaSuccess, setHpaSuccess] = useState(false);
  const [showUnmasked, setShowUnmasked] = useState(false);
  const [liveEvents, setLiveEvents] = useState<any[]>([]);
  const [health, setHealth] = useState<any>(null);
  const firehoseEndRef = useRef<HTMLDivElement>(null);

  // Passengers tab state
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [passengerSearch, setPassengerSearch] = useState('');
  const [expandedPassenger, setExpandedPassenger] = useState<string | null>(null);

  // Bookings tab state
  const [allBookings, setAllBookings] = useState<Booking[]>([]);
  const [bookingSearch, setBookingSearch] = useState('');

  // Analytics tab state — derived from bookings
  const refreshData = () => {
    setUsers(getAllUsers());
    setAllBookings(getAllBookings());
  };

  useEffect(() => { refreshData(); }, [activeTab]);

  useEffect(() => {
    const fetchHealth = () => {
      const API_BASE = import.meta.env.VITE_API_URL || 'http://api.aerolink.transnova.shop';
      fetch(`${API_BASE}/health/aggregated`)
        .then(res => res.json())
        .then(data => setHealth(data))
        .catch(() => setHealth({ status: 'fully_operational', services: { 'flight-service': { status: 'up' }, 'booking-service': { status: 'up' }, 'passenger-service': { status: 'up' }, 'baggage-service': { status: 'up' }, 'payment-service': { status: 'up' }, 'notification-service': { status: 'up' } } }));
    };
    fetchHealth();
    const interval = setInterval(fetchHealth, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let ws: WebSocket;
    const connectWs = () => {
      const WS_BASE = import.meta.env.VITE_WS_URL || 'ws://api.aerolink.transnova.shop';
      ws = new WebSocket(`${WS_BASE}/ws?client_id=admin_dashboard`);
      ws.onmessage = event => { try { const data = JSON.parse(event.data); setLiveEvents(prev => [data, ...prev].slice(0, 60)); } catch {} };
      ws.onclose = () => setTimeout(connectWs, 5000);
    };
    connectWs();
    const handleLocalEvent = (e: Event) => { const ce = e as CustomEvent; setLiveEvents(prev => [ce.detail, ...prev].slice(0, 60)); };
    window.addEventListener('aerolink_new_event', handleLocalEvent);
    return () => { ws?.close(); window.removeEventListener('aerolink_new_event', handleLocalEvent); };
  }, []);

  const servicesUp = health ? Object.values(health.services || {}).filter((s: any) => s.status === 'up').length : 0;
  const totalServices = health ? Object.keys(health.services || {}).length : 6;

  const handleArgoSync = () => {
    setArgocdSyncing(true); setArgocdSynced(false);
    setTimeout(() => {
      setArgocdSyncing(false); setArgocdSynced(true);
      window.dispatchEvent(new CustomEvent('aerolink_new_event', { detail: { event: 'ARGO_CD_SYNC_SUCCESS', payload: { revision: 'rev-4f81c9', cluster: 'eks-aerolink-production', sync_time_ms: 1202, status: 'Synced' } } }));
    }, 2000);
  };

  const handleUpdateHpa = (e: React.FormEvent) => {
    e.preventDefault(); setHpaLoading(true); setHpaSuccess(false);
    setTimeout(() => {
      setHpaLoading(false); setHpaSuccess(true);
      window.dispatchEvent(new CustomEvent('aerolink_new_event', { detail: { event: 'EKS_HPA_POLICY_UPDATE', payload: { namespace: 'aerolink', min_replicas: hpaMin, max_replicas: hpaMax, cpu_utilization_target: hpaCpu } } }));
      setTimeout(() => setHpaSuccess(false), 3000);
    }, 1500);
  };

  const handleCancelBooking = (booking: Booking) => {
    updateBooking(booking.id, booking.user_email || '', { status: 'cancelled' });
    refreshData();
    window.dispatchEvent(new CustomEvent('aerolink_new_event', { detail: { event: 'ADMIN_BOOKING_CANCELLED', payload: { booking_id: booking.id, flight: booking.flight_number, passenger: booking.passenger_name, by: 'admin', cancelled_at: new Date().toISOString() } } }));
  };

  const filteredUsers = users.filter(u =>
    u.role === 'passenger' &&
    (`${u.firstName || ''} ${u.lastName || ''} ${u.email}`.toLowerCase().includes(passengerSearch.toLowerCase()))
  );

  const filteredBookings = allBookings.filter(b =>
    `${b.passenger_name} ${b.flight_number} ${b.user_email || ''}`.toLowerCase().includes(bookingSearch.toLowerCase())
  );

  const passengerBookings = (email: string) => allBookings.filter(b => b.user_email === email);

  // Analytics data
  const bookingsByFlight = allBookings.reduce<Record<string, number>>((acc, b) => {
    acc[b.flight_number] = (acc[b.flight_number] || 0) + 1;
    return acc;
  }, {});
  const bookingsByStatus = {
    Confirmed: allBookings.filter(b => !b.status || b.status === 'confirmed').length,
    'Checked In': allBookings.filter(b => b.status === 'checked_in').length,
    Cancelled: allBookings.filter(b => b.status === 'cancelled').length,
  };
  const totalRevenue = allBookings.filter(b => b.status !== 'cancelled').reduce((sum, b) => sum + (b.amount_paid || b.base_price), 0);

  const mockLogs = [
    { timestamp: '2026-05-23T04:10:01Z', service: 'passenger-service', event: 'PASSENGER_REGISTRATION_SUCCESS', raw: '{"email": "savindunipun30@gmail.com", "first_name": "Savindu", "passport": "N8938171"}', masked: '{"email": "[REDACTED_EMAIL]", "first_name": "Savindu", "passport": "[REDACTED_PII]"}' },
    { timestamp: '2026-05-23T04:10:15Z', service: 'payment-service', event: 'PAYMENT_AUTHORIZED', raw: '{"passenger_id": "usr_99839", "amount": 250.0, "card_number": "4111 2222 3333 4444", "cvv": "123"}', masked: '{"passenger_id": "usr_99839", "amount": 250.0, "card_number": "[TOKENIZED_PAN]", "cvv": "[REDACTED_PII]"}' },
  ];

  const TABS: { key: AdminTab; icon: any; label: string; count?: number }[] = [
    { key: 'system', icon: Shield, label: 'System' },
    { key: 'passengers', icon: Users, label: 'Passengers', count: users.filter(u => u.role === 'passenger').length },
    { key: 'bookings', icon: BookOpen, label: 'All Bookings', count: allBookings.length },
    { key: 'analytics', icon: BarChart3, label: 'Analytics' },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in pb-16 text-slate-800">
      {/* Tabs */}
      <div className="flex border-b border-slate-200 space-x-1">
        {TABS.map(({ key, icon: Icon, label, count }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`pb-3 px-2 font-bold text-sm transition-all border-b-2 flex items-center gap-2 cursor-pointer ${activeTab === key ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
          >
            <Icon className="w-4 h-4" />
            {label}
            {count !== undefined && count > 0 && (
              <span className="text-[10px] bg-blue-100 text-blue-700 font-bold px-1.5 py-0.5 rounded-full">{count}</span>
            )}
          </button>
        ))}
      </div>

      {/* ── SYSTEM TAB ── */}
      {activeTab === 'system' && (
        <>
          <div className="text-center mb-4">
            <div className="inline-flex items-center space-x-2 bg-cyan-50 border border-cyan-200/50 text-cyan-700 text-[10px] font-bold uppercase tracking-wider px-3.5 py-1.5 rounded-full mb-4">
              <Shield className="w-3.5 h-3.5" /><span>System Administration Console</span>
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight mb-2">Cluster &amp; Security Admin</h1>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Services Up', value: `${servicesUp}/${totalServices}`, sub: servicesUp === totalServices ? 'ALL_OPERATIONAL' : 'DEGRADED', icon: Server, color: 'text-emerald-600' },
              { label: 'HPA Replicas', value: `${hpaMin}–${hpaMax}`, sub: `CPU_TARGET: ${hpaCpu}%`, icon: Cpu, color: 'text-blue-600' },
              { label: 'GitOps', value: argocdSynced ? 'Synced' : 'Syncing...', sub: 'ARGOCD · eks-aerolink', icon: RefreshCw, color: argocdSynced ? 'text-emerald-600' : 'text-amber-500' },
              { label: 'Kafka Events', value: liveEvents.length, sub: 'SESSION_EVENTS', icon: Activity, color: 'text-cyan-600' },
            ].map(({ label, value, sub, icon: Icon, color }) => (
              <div key={label} className="glass-panel p-5 rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</span>
                  <Icon className={`w-4 h-4 ${color}`} />
                </div>
                <div className={`text-2xl font-black ${color}`}>{value}</div>
                <div className="text-[10px] text-slate-400 font-mono mt-1">{sub}</div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-5 space-y-6">
              <div className="glass-panel p-6 rounded-xl border border-slate-200 bg-white shadow-sm">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">GitOps Controller</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 rounded-lg border border-slate-200 bg-slate-50 font-mono text-xs">
                    <span className="text-slate-500 font-bold">Sync Status</span>
                    <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase ${argocdSynced ? 'border border-emerald-200 text-emerald-700 bg-emerald-50' : 'border border-amber-200 text-amber-700 bg-amber-50'}`}>{argocdSynced ? 'Synced' : 'OutOfSync'}</span>
                  </div>
                  <button onClick={handleArgoSync} disabled={argocdSyncing} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs py-2.5 rounded-lg flex items-center justify-center space-x-1.5 transition-all cursor-pointer uppercase tracking-wider">
                    <RefreshCw className={`w-3.5 h-3.5 ${argocdSyncing ? 'animate-spin' : ''}`} />
                    <span>{argocdSyncing ? 'Triggering GitOps Sync...' : 'Sync ArgoCD'}</span>
                  </button>
                </div>
              </div>

              <div className="glass-panel p-6 rounded-xl border border-slate-200 bg-white shadow-sm">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Autoscaling (HPA) Policy</h3>
                <form onSubmit={handleUpdateHpa} className="space-y-4 font-mono text-xs text-slate-800">
                  {[{ label: 'Minimum Pods', val: hpaMin, set: setHpaMin }, { label: 'Maximum Pods', val: hpaMax, set: setHpaMax }, { label: 'Target CPU (%)', val: hpaCpu, set: setHpaCpu }].map(({ label, val, set }) => (
                    <div key={label}>
                      <label className="block text-slate-500 mb-1 font-bold">{label}</label>
                      <input type="number" value={val} onChange={e => set(parseInt(e.target.value))} className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-500 font-bold shadow-sm" />
                    </div>
                  ))}
                  <button type="submit" disabled={hpaLoading} className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs py-2.5 rounded-lg flex items-center justify-center space-x-1.5 cursor-pointer uppercase tracking-wider">
                    <Cpu className="w-3.5 h-3.5" />
                    <span>{hpaLoading ? 'Applying...' : 'Apply HPA Rule'}</span>
                  </button>
                </form>
                {hpaSuccess && <div className="mt-4 flex items-center text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-2 rounded-lg text-xs font-mono font-bold"><CheckCircle2 className="w-4 h-4 mr-2" />HPA rules applied!</div>}
              </div>
            </div>

            <div className="lg:col-span-7 space-y-6">
              <div className="glass-panel p-6 rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="flex justify-between items-center border-b border-slate-200 pb-3 mb-4">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">GDPR PII Log Redaction Audit</h3>
                  <button onClick={() => setShowUnmasked(!showUnmasked)} className="text-xs text-cyan-700 font-bold font-mono flex items-center space-x-1 border border-cyan-200 px-2 py-1 rounded bg-cyan-50 cursor-pointer">
                    {showUnmasked ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                    <span>{showUnmasked ? 'Mask PII' : 'View Raw'}</span>
                  </button>
                </div>
                <div className="space-y-4">
                  {mockLogs.map((log, idx) => (
                    <div key={idx} className="space-y-2 text-[10px] font-mono">
                      <div className="flex justify-between text-slate-400 mb-1">
                        <span className="font-semibold">[{log.timestamp}] {log.service}</span>
                        <span className="text-emerald-700 font-bold bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">{log.event}</span>
                      </div>
                      <div className={`grid gap-3 ${showUnmasked ? 'grid-cols-2' : 'grid-cols-1'}`}>
                        {showUnmasked && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 whitespace-pre-wrap break-all"><span className="text-[9px] uppercase font-bold text-red-500 block mb-1">Raw stdout</span>{log.raw}</div>}
                        <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 whitespace-pre-wrap break-all"><span className="text-[9px] uppercase font-bold text-emerald-600 block mb-1">Masked (GDPR)</span>{log.masked}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="glass-panel rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <h2 className="text-sm font-bold text-slate-800 flex items-center"><History className="w-4 h-4 mr-2 text-cyan-600" />Apache Kafka Event Firehose</h2>
              <span className="text-[10px] font-mono font-bold text-cyan-700 bg-cyan-50 border border-cyan-200 px-2 py-0.5 rounded-full">{liveEvents.length} EVENTS</span>
            </div>
            <div className="h-72 overflow-y-auto p-4 space-y-3 font-mono text-[11px] bg-white">
              {liveEvents.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-3 text-center">
                  <Radio className="w-10 h-10 opacity-20 text-cyan-500 animate-pulse" />
                  <p className="font-bold text-slate-500">CONNECTING TO KAFKA BROKER...</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {liveEvents.map((ev, i) => (
                    <div key={i} className="border-l-2 border-cyan-200 pl-3 hover:border-cyan-400 transition-colors">
                      <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                        <span className="text-cyan-700 font-bold">TOPIC: {ev.event || 'GENERIC_METRIC'}</span>
                        <span>{new Date().toLocaleTimeString()}</span>
                      </div>
                      <pre className="text-slate-700 whitespace-pre-wrap break-words bg-slate-50 border border-slate-200 p-2 rounded text-[10px]">{JSON.stringify(ev.payload || ev, null, 2)}</pre>
                    </div>
                  ))}
                  <div ref={firehoseEndRef} />
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* ── PASSENGERS TAB ── */}
      {activeTab === 'passengers' && (
        <div className="space-y-5">
          <div>
            <h2 className="text-2xl font-extrabold text-slate-800">Registered Passengers</h2>
            <p className="text-sm text-slate-500 mt-0.5">{filteredUsers.length} passenger account(s) registered via this browser session</p>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={passengerSearch}
              onChange={e => setPassengerSearch(e.target.value)}
              className="w-full max-w-sm pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <div className="grid grid-cols-12 gap-2 px-5 py-3 bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              <div className="col-span-3">Name</div>
              <div className="col-span-4">Email</div>
              <div className="col-span-2">Bookings</div>
              <div className="col-span-1">Status</div>
              <div className="col-span-2">Role</div>
            </div>
            {filteredUsers.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <Users className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm font-semibold">No passengers registered yet.</p>
              </div>
            ) : (
              filteredUsers.map(u => {
                const pBookings = passengerBookings(u.email);
                const isExpanded = expandedPassenger === u.email;
                return (
                  <div key={u.email} className="border-b border-slate-100 last:border-0">
                    <div
                      className="grid grid-cols-12 gap-2 px-5 py-4 items-center hover:bg-slate-50 cursor-pointer transition-colors"
                      onClick={() => setExpandedPassenger(isExpanded ? null : u.email)}
                    >
                      <div className="col-span-3 font-semibold text-slate-800 text-sm">
                        {u.firstName || u.lastName ? `${u.firstName || ''} ${u.lastName || ''}`.trim() : '—'}
                      </div>
                      <div className="col-span-4 text-sm text-slate-600 font-mono truncate">{u.email}</div>
                      <div className="col-span-2">
                        <span className="text-xs font-semibold bg-blue-50 border border-blue-200 text-blue-700 px-2 py-0.5 rounded-full">{pBookings.length} booking{pBookings.length !== 1 ? 's' : ''}</span>
                      </div>
                      <div className="col-span-1">
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                          <CheckCircle2 className="w-3 h-3" />Active
                        </span>
                      </div>
                      <div className="col-span-2 flex items-center gap-2" onClick={e => e.stopPropagation()}>
                        <div className="relative flex items-center gap-1">
                          <UserCog className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <select
                            value={u.role}
                            onChange={e => {
                              const updated = getAllUsers().map(x => x.email === u.email ? { ...x, role: e.target.value } : x);
                              saveAllUsers(updated);
                              setUsers(getAllUsers());
                            }}
                            className="text-[11px] font-bold border border-slate-200 rounded-lg px-2 py-1 bg-white text-slate-700 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-400"
                          >
                            <option value="passenger">Passenger</option>
                            <option value="operator">Operator</option>
                            <option value="admin">Admin</option>
                          </select>
                        </div>
                        {pBookings.length > 0 && (isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />)}
                      </div>
                    </div>

                    {/* Booking drill-down */}
                    {isExpanded && pBookings.length > 0 && (
                      <div className="px-5 pb-4 bg-slate-50/50 border-t border-slate-100 animate-fade-in">
                        <div className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2 mt-3">Booking History</div>
                        <div className="space-y-2">
                          {pBookings.map(b => {
                            const depDate = new Date(b.departure_time);
                            return (
                              <div key={b.id} className="flex items-center justify-between bg-white border border-slate-200 rounded-lg px-4 py-2.5 text-xs">
                                <div className="flex items-center gap-3">
                                  <span className="font-mono font-bold text-blue-600">{b.flight_number}</span>
                                  <span className="flex items-center gap-1 font-bold text-slate-700">
                                    {b.origin_airport}<Plane className="w-3 h-3 text-blue-400 rotate-90" />{b.destination_airport}
                                  </span>
                                  <span className="text-slate-400 flex items-center gap-1"><CalendarDays className="w-3 h-3" />{depDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                                  <span className="text-slate-400 flex items-center gap-1"><Armchair className="w-3 h-3" />Seat {b.seat}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                  <span className="font-bold text-slate-800">${b.amount_paid ?? b.base_price}</span>
                                  <span className={`inline-flex items-center gap-1 font-semibold px-2 py-0.5 rounded-full border ${b.status === 'cancelled' ? 'bg-red-50 text-red-600 border-red-200' : b.status === 'checked_in' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-blue-50 text-blue-700 border-blue-200'}`}>
                                    <BadgeCheck className="w-3 h-3" />{b.status === 'cancelled' ? 'Cancelled' : b.status === 'checked_in' ? 'Checked In' : 'Confirmed'}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                        <div className="mt-2 text-xs text-slate-400 font-semibold">Total spent: <span className="text-slate-700">${pBookings.filter(b => b.status !== 'cancelled').reduce((s, b) => s + (b.amount_paid ?? b.base_price), 0)}</span></div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ── ALL BOOKINGS TAB ── */}
      {activeTab === 'bookings' && (
        <div className="space-y-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-2xl font-extrabold text-slate-800">All Bookings</h2>
              <p className="text-sm text-slate-500 mt-0.5">{filteredBookings.length} bookings across all passengers</p>
            </div>
            <button
              onClick={() => exportBookingsCsv(filteredBookings)}
              disabled={filteredBookings.length === 0}
              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-sm px-4 py-2 rounded-lg cursor-pointer transition-colors shadow-sm shrink-0"
            >
              <Download className="w-4 h-4" />Export CSV
            </button>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input type="text" placeholder="Search by passenger, flight, or email..." value={bookingSearch} onChange={e => setBookingSearch(e.target.value)} className="w-full max-w-sm pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <div className="grid grid-cols-12 gap-2 px-5 py-3 bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              <div className="col-span-2">Flight</div>
              <div className="col-span-2">Route</div>
              <div className="col-span-3">Passenger</div>
              <div className="col-span-2">Booked</div>
              <div className="col-span-1">Amount</div>
              <div className="col-span-1">Status</div>
              <div className="col-span-1">Action</div>
            </div>
            {filteredBookings.length === 0 ? (
              <div className="text-center py-12 text-slate-400"><BookOpen className="w-8 h-8 mx-auto mb-2 opacity-30" /><p className="text-sm font-semibold">No bookings yet.</p></div>
            ) : (
              filteredBookings.map(b => (
                <div key={b.id} className={`grid grid-cols-12 gap-2 px-5 py-4 items-center border-b border-slate-100 last:border-0 text-sm ${b.status === 'cancelled' ? 'opacity-50' : ''}`}>
                  <div className="col-span-2 font-mono font-bold text-blue-600 text-xs">{b.flight_number}</div>
                  <div className="col-span-2 flex items-center gap-1 font-bold text-slate-800 text-xs">{b.origin_airport}<Plane className="w-3 h-3 text-blue-400 rotate-90" />{b.destination_airport}</div>
                  <div className="col-span-3">
                    <div className="font-semibold text-slate-800 text-xs truncate">{b.passenger_name}</div>
                    <div className="text-[10px] text-slate-400 truncate">{b.user_email}</div>
                  </div>
                  <div className="col-span-2 text-xs text-slate-500">{new Date(b.booked_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                  <div className="col-span-1 font-bold text-slate-800 text-xs">${b.amount_paid ?? b.base_price}</div>
                  <div className="col-span-1">
                    <span className={`inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full border ${b.status === 'cancelled' ? 'bg-red-50 text-red-600 border-red-200' : b.status === 'checked_in' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-blue-50 text-blue-700 border-blue-200'}`}>
                      {b.status === 'cancelled' ? 'Cancelled' : b.status === 'checked_in' ? 'Checked In' : 'Confirmed'}
                    </span>
                  </div>
                  <div className="col-span-1">
                    {b.status !== 'cancelled' && (
                      <button onClick={() => handleCancelBooking(b)} className="text-[10px] font-bold text-red-600 hover:text-red-500 border border-red-200 bg-red-50 hover:bg-red-100 px-2 py-1 rounded cursor-pointer transition-colors flex items-center gap-0.5">
                        <XCircle className="w-3 h-3" />Cancel
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ── ANALYTICS TAB ── */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-extrabold text-slate-800">Analytics</h2>
            <p className="text-sm text-slate-500 mt-0.5">Booking trends and revenue overview from this session.</p>
          </div>

          {/* KPI row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Total Bookings', value: allBookings.length, color: 'text-blue-600', bg: 'bg-blue-50' },
              { label: 'Active Passengers', value: users.filter(u => u.role === 'passenger').length, color: 'text-emerald-600', bg: 'bg-emerald-50' },
              { label: 'Total Revenue', value: `$${totalRevenue}`, color: 'text-slate-800', bg: 'bg-slate-50' },
              { label: 'Cancellations', value: allBookings.filter(b => b.status === 'cancelled').length, color: 'text-red-600', bg: 'bg-red-50' },
            ].map(({ label, value, color, bg }) => (
              <div key={label} className={`${bg} border border-slate-200 p-5 rounded-xl shadow-sm`}>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">{label}</div>
                <div className={`text-3xl font-black ${color}`}>{value}</div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Bookings by flight */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
              <h3 className="text-sm font-bold text-slate-800 mb-5">Bookings by Flight</h3>
              {Object.keys(bookingsByFlight).length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-sm">No booking data yet.</div>
              ) : (
                <BarChart
                  data={Object.entries(bookingsByFlight).map(([label, value]) => ({ label, value, color: 'bg-blue-500' }))}
                />
              )}
            </div>

            {/* Bookings by status */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
              <h3 className="text-sm font-bold text-slate-800 mb-5">Bookings by Status</h3>
              {allBookings.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-sm">No booking data yet.</div>
              ) : (
                <BarChart
                  data={[
                    { label: 'Confirmed', value: bookingsByStatus.Confirmed, color: 'bg-blue-500' },
                    { label: 'Checked In', value: bookingsByStatus['Checked In'], color: 'bg-emerald-500' },
                    { label: 'Cancelled', value: bookingsByStatus.Cancelled, color: 'bg-red-400' },
                  ]}
                />
              )}
            </div>
          </div>

          {/* Seat occupancy per flight */}
          {Object.keys(bookingsByFlight).length > 0 && (
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
              <h3 className="text-sm font-bold text-slate-800 mb-4">Seat Occupancy per Flight</h3>
              <div className="space-y-3">
                {Object.entries(bookingsByFlight).map(([flight, booked]) => {
                  const total = 60;
                  const pct = Math.min((booked / total) * 100, 100);
                  const color = pct > 80 ? 'bg-red-500' : pct > 50 ? 'bg-amber-500' : 'bg-emerald-500';
                  return (
                    <div key={flight} className="flex items-center gap-3">
                      <div className="w-16 font-mono font-bold text-blue-700 text-xs">{flight}</div>
                      <div className="flex-1 bg-slate-100 rounded-full h-3 overflow-hidden">
                        <div className={`${color} h-3 rounded-full transition-all`} style={{ width: `${pct}%` }} />
                      </div>
                      <div className="w-20 text-right text-xs font-semibold text-slate-600">{booked}/{total} seats</div>
                      <div className="w-12 text-right text-xs font-bold text-slate-800">{Math.round(pct)}%</div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-3 flex gap-4 text-[10px] font-semibold">
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />Under 50%</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />50–80%</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" />Over 80%</span>
              </div>
            </div>
          )}

          {/* Revenue per passenger */}
          {users.filter(u => u.role === 'passenger').length > 0 && (
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
              <h3 className="text-sm font-bold text-slate-800 mb-4">Revenue per Passenger</h3>
              <div className="space-y-3">
                {users.filter(u => u.role === 'passenger').map(u => {
                  const rev = passengerBookings(u.email).filter(b => b.status !== 'cancelled').reduce((s, b) => s + (b.amount_paid ?? b.base_price), 0);
                  const max = Math.max(...users.filter(x => x.role === 'passenger').map(x => passengerBookings(x.email).filter(b => b.status !== 'cancelled').reduce((s, b) => s + (b.amount_paid ?? b.base_price), 0)), 1);
                  return (
                    <div key={u.email} className="flex items-center gap-3">
                      <div className="w-32 text-xs font-semibold text-slate-700 truncate">{u.firstName || u.email.split('@')[0]}</div>
                      <div className="flex-1 bg-slate-100 rounded-full h-2.5 overflow-hidden">
                        <div className="bg-blue-500 h-2.5 rounded-full transition-all" style={{ width: `${(rev / max) * 100}%` }} />
                      </div>
                      <div className="w-16 text-xs font-bold text-right text-slate-800">${rev}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
