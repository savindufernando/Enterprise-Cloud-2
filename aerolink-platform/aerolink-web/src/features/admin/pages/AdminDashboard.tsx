import { useState, useEffect, useRef } from 'react';
import {
  Shield, Cpu, RefreshCw, Eye, EyeOff, CheckCircle2,
  Server, Activity, History, Radio, Users, BookOpen,
  Plane, CalendarDays, Armchair, BadgeCheck, Inbox
} from 'lucide-react';
import type { Booking } from '../../passenger/pages/MyBookings';
import { getAllBookings } from '../../passenger/pages/MyBookings';

interface UserRecord {
  id: string;
  email: string;
  role: string;
  firstName?: string;
  lastName?: string;
}

function getAllUsers(): UserRecord[] {
  try {
    return JSON.parse(localStorage.getItem('aerolink_all_users') || '[]');
  } catch {
    return [];
  }
}

export default function AdminDashboard() {
  const [adminTab, setAdminTab] = useState<'system' | 'passengers' | 'bookings'>('system');

  // ArgoCD + HPA state
  const [argocdSyncing, setArgocdSyncing] = useState(false);
  const [argocdSynced, setArgocdSynced] = useState(true);
  const [hpaMin, setHpaMin] = useState(3);
  const [hpaMax, setHpaMax] = useState(10);
  const [hpaCpu, setHpaCpu] = useState(50);
  const [hpaLoading, setHpaLoading] = useState(false);
  const [hpaSuccess, setHpaSuccess] = useState(false);

  // GDPR masking toggle
  const [showUnmasked, setShowUnmasked] = useState(false);

  // Kafka firehose (moved from OperationsDashboard)
  const [liveEvents, setLiveEvents] = useState<any[]>([]);
  const firehoseEndRef = useRef<HTMLDivElement>(null);

  // Health for KPI
  const [health, setHealth] = useState<any>(null);

  // Fetch health for KPI
  useEffect(() => {
    const fetchHealth = () => {
      const API_BASE = import.meta.env.VITE_API_URL || 'http://api.aerolink.transnova.shop';
      fetch(`${API_BASE}/health/aggregated`)
        .then(res => res.json())
        .then(data => setHealth(data))
        .catch(() => {
          setHealth({
            status: 'fully_operational',
            services: {
              'flight-service': { status: 'up' },
              'booking-service': { status: 'up' },
              'passenger-service': { status: 'up' },
              'baggage-service': { status: 'up' },
              'payment-service': { status: 'up' },
              'notification-service': { status: 'up' },
            },
          });
        });
    };
    fetchHealth();
    const interval = setInterval(fetchHealth, 10000);
    return () => clearInterval(interval);
  }, []);

  // Connect to Kafka WebSocket
  useEffect(() => {
    let ws: WebSocket;
    const connectWs = () => {
      const WS_BASE = import.meta.env.VITE_WS_URL || 'ws://api.aerolink.transnova.shop';
      ws = new WebSocket(`${WS_BASE}/ws?client_id=admin_dashboard`);
      ws.onmessage = event => {
        try {
          const data = JSON.parse(event.data);
          setLiveEvents(prev => [data, ...prev].slice(0, 60));
        } catch {}
      };
      ws.onclose = () => setTimeout(connectWs, 5000);
    };
    connectWs();

    const handleLocalEvent = (e: Event) => {
      const ce = e as CustomEvent;
      setLiveEvents(prev => [ce.detail, ...prev].slice(0, 60));
    };
    window.addEventListener('aerolink_new_event', handleLocalEvent);
    return () => {
      ws?.close();
      window.removeEventListener('aerolink_new_event', handleLocalEvent);
    };
  }, []);

  // KPI derived values
  const servicesUp = health
    ? Object.values(health.services || {}).filter((s: any) => s.status === 'up').length
    : 0;
  const totalServices = health ? Object.keys(health.services || {}).length : 6;

  // ArgoCD sync handler
  const handleArgoSync = () => {
    setArgocdSyncing(true);
    setArgocdSynced(false);
    setTimeout(() => {
      setArgocdSyncing(false);
      setArgocdSynced(true);
      window.dispatchEvent(new CustomEvent('aerolink_new_event', {
        detail: {
          event: 'ARGO_CD_SYNC_SUCCESS',
          payload: {
            revision: 'rev-4f81c9',
            cluster: 'eks-aerolink-production',
            sync_time_ms: 1202,
            components: ['gateway', 'flight-service', 'baggage-service'],
            status: 'Synced',
          },
        },
      }));
    }, 2000);
  };

  // HPA update handler
  const handleUpdateHpa = (e: React.FormEvent) => {
    e.preventDefault();
    setHpaLoading(true);
    setHpaSuccess(false);
    setTimeout(() => {
      setHpaLoading(false);
      setHpaSuccess(true);
      window.dispatchEvent(new CustomEvent('aerolink_new_event', {
        detail: {
          event: 'EKS_HPA_POLICY_UPDATE',
          payload: {
            namespace: 'aerolink',
            min_replicas: hpaMin,
            max_replicas: hpaMax,
            cpu_utilization_target: hpaCpu,
            orchestrator: 'Kubernetes API Server',
          },
        },
      }));
      setTimeout(() => setHpaSuccess(false), 3000);
    }, 1500);
  };

  const mockLogs = [
    {
      timestamp: '2026-05-23T04:10:01Z',
      service: 'passenger-service',
      event: 'PASSENGER_REGISTRATION_SUCCESS',
      raw: '{"email": "savindunipun30@gmail.com", "first_name": "Savindu", "last_name": "Fernando", "passport": "N8938171"}',
      masked: '{"email": "[REDACTED_EMAIL]", "first_name": "Savindu", "last_name": "Fernando", "passport": "[REDACTED_PII]"}',
    },
    {
      timestamp: '2026-05-23T04:10:15Z',
      service: 'payment-service',
      event: 'PAYMENT_AUTHORIZED',
      raw: '{"passenger_id": "usr_99839", "amount": 250.0, "card_number": "4111 2222 3333 4444", "cvv": "123"}',
      masked: '{"passenger_id": "usr_99839", "amount": 250.0, "card_number": "[TOKENIZED_PAN]", "cvv": "[REDACTED_PII]"}',
    },
  ];

  const allUsers = getAllUsers();
  const allBookings: Booking[] = getAllBookings();

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in pb-16 text-slate-800">

      {/* Admin tabs */}
      <div className="flex border-b border-slate-200 space-x-6">
        <button
          onClick={() => setAdminTab('system')}
          className={`pb-3 font-bold text-sm transition-all border-b-2 flex items-center space-x-2 cursor-pointer ${adminTab === 'system' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
        >
          <Shield className="w-4 h-4" />
          <span>System</span>
        </button>
        <button
          onClick={() => setAdminTab('passengers')}
          className={`pb-3 font-bold text-sm transition-all border-b-2 flex items-center space-x-2 cursor-pointer ${adminTab === 'passengers' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
        >
          <Users className="w-4 h-4" />
          <span>Passengers</span>
          {allUsers.filter(u => u.role === 'passenger').length > 0 && (
            <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
              {allUsers.filter(u => u.role === 'passenger').length}
            </span>
          )}
        </button>
        <button
          onClick={() => setAdminTab('bookings')}
          className={`pb-3 font-bold text-sm transition-all border-b-2 flex items-center space-x-2 cursor-pointer ${adminTab === 'bookings' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
        >
          <BookOpen className="w-4 h-4" />
          <span>All Bookings</span>
          {allBookings.length > 0 && (
            <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
              {allBookings.length}
            </span>
          )}
        </button>
      </div>

      {/* ── PASSENGERS TAB ── */}
      {adminTab === 'passengers' && (
        <div className="space-y-4">
          <div>
            <h2 className="text-xl font-extrabold text-slate-800">Registered Passengers</h2>
            <p className="text-sm text-slate-500 mt-0.5">{allUsers.filter(u => u.role === 'passenger').length} passenger account(s) registered via this browser session</p>
          </div>
          {allUsers.filter(u => u.role === 'passenger').length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
                <Inbox className="w-7 h-7 text-slate-400" />
              </div>
              <p className="text-sm font-bold text-slate-500">No passengers registered yet</p>
              <p className="text-xs text-slate-400 mt-1">Passengers appear here once they register or log in.</p>
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="text-left px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Name</th>
                    <th className="text-left px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Email</th>
                    <th className="text-left px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Bookings</th>
                    <th className="text-left px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {allUsers.filter(u => u.role === 'passenger').map(u => {
                    const userBookingCount = allBookings.filter(b => b.user_email === u.email).length;
                    return (
                      <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-5 py-4 font-semibold text-slate-800">
                          {u.firstName || u.lastName ? `${u.firstName || ''} ${u.lastName || ''}`.trim() : '—'}
                        </td>
                        <td className="px-5 py-4 text-slate-600 font-mono text-xs">{u.email}</td>
                        <td className="px-5 py-4">
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
                            {userBookingCount} booking{userBookingCount !== 1 ? 's' : ''}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                            <BadgeCheck className="w-3 h-3" /> Active
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── ALL BOOKINGS TAB ── */}
      {adminTab === 'bookings' && (
        <div className="space-y-4">
          <div>
            <h2 className="text-xl font-extrabold text-slate-800">All Bookings</h2>
            <p className="text-sm text-slate-500 mt-0.5">{allBookings.length} booking(s) recorded in this session</p>
          </div>
          {allBookings.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
                <Inbox className="w-7 h-7 text-slate-400" />
              </div>
              <p className="text-sm font-bold text-slate-500">No bookings yet</p>
              <p className="text-xs text-slate-400 mt-1">Bookings appear here after passengers reserve flights.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {allBookings.map(booking => {
                const isBusinessClass = parseInt(booking.seat) <= 2;
                const totalPrice = isBusinessClass ? booking.base_price + 50 : booking.base_price;
                const depDate = new Date(booking.departure_time);
                const isPast = depDate < new Date();
                return (
                  <div key={booking.id} className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                    <div className={`h-1 w-full ${isPast ? 'bg-slate-300' : 'bg-gradient-to-r from-blue-500 to-blue-700'}`} />
                    <div className="p-4 flex flex-col sm:flex-row gap-4 justify-between">
                      <div className="flex items-start gap-3">
                        <div className="bg-blue-50 border border-blue-100 text-blue-700 font-mono font-bold px-2.5 py-1.5 rounded-lg text-xs shrink-0">
                          {booking.flight_number}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xl font-extrabold text-slate-900">{booking.origin_airport}</span>
                            <Plane className="w-3.5 h-3.5 text-blue-400 rotate-90 shrink-0" />
                            <span className="text-xl font-extrabold text-slate-900">{booking.destination_airport}</span>
                          </div>
                          <div className="flex flex-wrap gap-2 text-xs text-slate-500 mt-1">
                            <span className="flex items-center gap-1">
                              <CalendarDays className="w-3 h-3 text-slate-400" />
                              {depDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </span>
                            <span className="flex items-center gap-1">
                              <Armchair className="w-3 h-3 text-slate-400" />
                              Seat {booking.seat} · {isBusinessClass ? 'Business' : 'Economy'}
                            </span>
                          </div>
                          <div className="text-xs text-slate-400 mt-1">
                            Passenger: <span className="font-semibold text-slate-600">{booking.passenger_name}</span>
                            {booking.user_email && <span className="ml-2 text-slate-400 font-mono">({booking.user_email})</span>}
                          </div>
                        </div>
                      </div>
                      <div className="flex sm:flex-col items-start sm:items-end justify-between gap-2 shrink-0">
                        <div className="text-xl font-extrabold text-slate-900">${totalPrice}</div>
                        <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${
                          isPast ? 'bg-slate-100 text-slate-500 border border-slate-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}>
                          <BadgeCheck className="w-3 h-3" />
                          {isPast ? 'Completed' : 'Confirmed'}
                        </span>
                        <div className="text-[10px] text-slate-400 font-mono">{booking.id}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── SYSTEM TAB ── */}
      {adminTab === 'system' && <>

      {/* Header */}
      <div className="text-center mb-4">
        <div className="inline-flex items-center space-x-2 bg-cyan-50 border border-cyan-200/50 text-cyan-700 text-[10px] font-bold uppercase tracking-wider px-3.5 py-1.5 rounded-full mb-4">
          <Shield className="w-3.5 h-3.5" />
          <span>System Administration Console</span>
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight mb-2">Cluster &amp; Security Admin</h1>
        <p className="text-sm text-slate-500 max-w-lg mx-auto">
          Coordinate distributed GitOps sync cycles, calibrate HPA profiles, and audit GDPR data masking compliance.
        </p>
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Services Up */}
        <div className="glass-panel p-5 rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Services Up</span>
            <Server className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-3xl font-black text-emerald-600">{servicesUp}<span className="text-base text-slate-400 font-bold">/{totalServices}</span></div>
          <div className="text-[10px] text-slate-400 font-mono mt-1">
            {servicesUp === totalServices ? 'ALL_OPERATIONAL' : 'DEGRADED_STATE'}
          </div>
        </div>

        {/* HPA Replicas */}
        <div className="glass-panel p-5 rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">HPA Replicas</span>
            <Cpu className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-3xl font-black text-blue-600">{hpaMin}<span className="text-base text-slate-400 font-bold">–{hpaMax}</span></div>
          <div className="text-[10px] text-slate-400 font-mono mt-1">CPU_TARGET: {hpaCpu}%</div>
        </div>

        {/* GitOps Status */}
        <div className="glass-panel p-5 rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">GitOps</span>
            <RefreshCw className={`w-4 h-4 ${argocdSynced ? 'text-emerald-500' : 'text-amber-500 animate-spin'}`} />
          </div>
          <div className={`text-xl font-black ${argocdSynced ? 'text-emerald-600' : 'text-amber-500'}`}>
            {argocdSynced ? 'Synced' : 'Syncing...'}
          </div>
          <div className="text-[10px] text-slate-400 font-mono mt-1">ARGOCD · eks-aerolink</div>
        </div>

        {/* Kafka Events */}
        <div className="glass-panel p-5 rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Kafka Events</span>
            <Activity className="w-4 h-4 text-cyan-500 animate-pulse" />
          </div>
          <div className="text-3xl font-black text-cyan-600">{liveEvents.length}</div>
          <div className="text-[10px] text-slate-400 font-mono mt-1">SESSION_EVENTS</div>
        </div>
      </div>

      {/* ── HPA & GitOps + GDPR ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: HPA & GitOps */}
        <div className="lg:col-span-5 space-y-6">
          {/* ArgoCD Sync Control */}
          <div className="glass-panel p-6 rounded-xl border border-slate-200 bg-white shadow-sm">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">GitOps Controller</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 rounded-lg border border-slate-200 bg-slate-50 font-mono text-xs">
                <span className="text-slate-500 font-bold">Sync Status</span>
                <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase ${argocdSynced ? 'border border-emerald-200 text-emerald-700 bg-emerald-50' : 'border border-amber-200 text-amber-700 bg-amber-50'}`}>
                  {argocdSynced ? 'Synced' : 'OutOfSync'}
                </span>
              </div>
              <button
                onClick={handleArgoSync}
                disabled={argocdSyncing}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs py-2.5 rounded-lg flex items-center justify-center space-x-1.5 transition-all cursor-pointer uppercase tracking-wider shadow-sm"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${argocdSyncing ? 'animate-spin' : ''}`} />
                <span>{argocdSyncing ? 'Triggering GitOps Sync...' : 'Sync ArgoCD'}</span>
              </button>
            </div>
          </div>

          {/* HPA Settings */}
          <div className="glass-panel p-6 rounded-xl border border-slate-200 bg-white shadow-sm">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Autoscaling (HPA) Policy</h3>
            <form onSubmit={handleUpdateHpa} className="space-y-4 font-mono text-xs text-slate-800">
              <div>
                <label className="block text-slate-500 mb-1 font-bold">Minimum Pods</label>
                <input
                  type="number"
                  value={hpaMin}
                  onChange={e => setHpaMin(parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent font-bold shadow-sm"
                />
              </div>
              <div>
                <label className="block text-slate-500 mb-1 font-bold">Maximum Pods</label>
                <input
                  type="number"
                  value={hpaMax}
                  onChange={e => setHpaMax(parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent font-bold shadow-sm"
                />
              </div>
              <div>
                <label className="block text-slate-500 mb-1 font-bold">Target CPU Threshold (%)</label>
                <input
                  type="number"
                  value={hpaCpu}
                  onChange={e => setHpaCpu(parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent font-bold shadow-sm"
                />
              </div>
              <button
                type="submit"
                disabled={hpaLoading}
                className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs py-2.5 rounded-lg flex items-center justify-center space-x-1.5 transition-all cursor-pointer uppercase tracking-wider shadow-sm"
              >
                <Cpu className="w-3.5 h-3.5" />
                <span>{hpaLoading ? 'Applying Scaling Rule...' : 'Apply HPA Rule'}</span>
              </button>
            </form>
            {hpaSuccess && (
              <div className="mt-4 flex items-center text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-2 rounded-lg text-xs font-mono font-bold animate-slide-up">
                <CheckCircle2 className="w-4 h-4 mr-2 text-emerald-600" />
                <span>HPA rules applied to EKS Namespace!</span>
              </div>
            )}
          </div>
        </div>

        {/* Right: GDPR + PCI-DSS */}
        <div className="lg:col-span-7 space-y-6">
          {/* GDPR Log Audit */}
          <div className="glass-panel p-6 rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="flex justify-between items-center border-b border-slate-200 pb-3 mb-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">GDPR PII Log Redaction Audit</h3>
              <button
                onClick={() => setShowUnmasked(!showUnmasked)}
                className="text-xs text-cyan-700 hover:text-cyan-600 font-bold font-mono flex items-center space-x-1 border border-cyan-200 hover:border-cyan-300 px-2 py-1 rounded bg-cyan-50 cursor-pointer transition-colors"
              >
                {showUnmasked ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                <span>{showUnmasked ? 'Mask PII Logs' : 'View Raw Logs'}</span>
              </button>
            </div>
            <div className="space-y-4">
              {mockLogs.map((log, idx) => (
                <div key={idx} className="space-y-2 text-[10px] font-mono">
                  <div className="flex justify-between text-slate-400 mb-1">
                    <span className="font-semibold">[{log.timestamp}] INGESTED: {log.service}</span>
                    <span className="text-emerald-700 font-bold bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">{log.event}</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {showUnmasked && (
                      <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 whitespace-pre-wrap break-all">
                        <span className="text-[9px] uppercase font-bold text-red-500 block mb-1">Raw stdout Log (Worst Case)</span>
                        {log.raw}
                      </div>
                    )}
                    <div className={`p-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 whitespace-pre-wrap break-all ${showUnmasked ? '' : 'col-span-2'}`}>
                      <span className="text-[9px] uppercase font-bold text-emerald-600 block mb-1">Masked Output (GDPR Secure)</span>
                      {log.masked}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* PCI-DSS Secure Transactions */}
          <div className="glass-panel p-6 rounded-xl border border-slate-200 bg-white shadow-sm">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 border-b border-slate-200 pb-3">PCI-DSS Secure Transactions Logs</h3>
            <div className="space-y-3 font-mono text-[10px] text-slate-600 bg-slate-50 p-4 border border-slate-200 rounded-lg">
              <div className="border-l-2 border-emerald-300 pl-3">
                <div className="text-[9px] text-slate-400">2026-05-23T04:15:33Z — EVENT: TRANSACTION_AUTHORIZED</div>
                <p className="text-slate-700 mt-1">SUCCESS: Authorization issued for transaction token <span className="bg-white border border-slate-200 px-2 py-0.5 rounded text-cyan-700 font-bold">tok_visa_7781</span>.</p>
                <p className="text-slate-400 mt-0.5">Zero storage: Card details (PAN / CVV) encrypted at proxy — not persisted.</p>
              </div>
              <div className="border-l-2 border-blue-300 pl-3 mt-3">
                <div className="text-[9px] text-slate-400">2026-05-23T04:16:01Z — EVENT: TRANSACTION_SUCCESS</div>
                <p className="text-slate-700 mt-1">Audit record written to vault: <span className="bg-white border border-slate-200 px-2 py-0.5 rounded text-cyan-700 font-bold">tx_pci_8871239</span>.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Kafka Event Firehose (full width) ── */}
      <div className="glass-panel rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
          <h2 className="text-sm font-bold text-slate-800 flex items-center">
            <History className="w-4 h-4 mr-2 text-cyan-600" />
            Apache Kafka Event Firehose
          </h2>
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-1.5 text-xs text-slate-500 font-mono font-bold">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>WS_ACTIVE · PORT 8007</span>
            </div>
            <span className="text-[10px] font-mono font-bold text-cyan-700 bg-cyan-50 border border-cyan-200 px-2 py-0.5 rounded-full">
              {liveEvents.length} EVENTS
            </span>
          </div>
        </div>

        <div className="h-72 overflow-y-auto p-4 space-y-3 font-mono text-[11px] bg-white">
          {liveEvents.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-3 font-mono text-center">
              <Radio className="w-10 h-10 opacity-20 text-cyan-500 animate-pulse" />
              <div>
                <p className="font-bold text-slate-500">CONNECTING TO KAFKA BROKER...</p>
                <p className="text-[10px] mt-1 max-w-sm text-slate-400">
                  Trigger a GitOps sync, HPA update, or navigate to other dashboards to observe events flow here.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {liveEvents.map((ev, i) => (
                <div key={i} className="animate-slide-up border-l-2 border-cyan-200 pl-3 hover:border-cyan-400 transition-colors">
                  <div className="flex justify-between items-center text-[10px] text-slate-400 mb-1">
                    <span className="text-cyan-700 font-bold">TOPIC: {ev.event || 'GENERIC_METRIC'}</span>
                    <span className="text-slate-400">{new Date().toLocaleTimeString()}</span>
                  </div>
                  <pre className="text-slate-700 whitespace-pre-wrap break-words font-mono bg-slate-50 border border-slate-200 p-2 rounded text-[10px] leading-relaxed">
                    {JSON.stringify(ev.payload || ev, null, 2)}
                  </pre>
                </div>
              ))}
              <div ref={firehoseEndRef} />
            </div>
          )}
        </div>
      </div>

      </> }

    </div>
  );
}
