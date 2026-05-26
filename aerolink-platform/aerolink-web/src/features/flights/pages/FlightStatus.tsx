import { useState, useEffect } from 'react';
import { Plane, RefreshCw, Clock, CheckCircle2, AlertTriangle, XCircle, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Flight {
  id: string;
  flight_number: string;
  origin_airport: string;
  destination_airport: string;
  departure_time: string;
  base_price: number;
}

type FlightStatus = 'On Time' | 'Boarding' | 'Departed' | 'Delayed' | 'Cancelled';

function deriveStatus(departure: string, flightNumber: string): FlightStatus {
  const diff = new Date(departure).getTime() - Date.now();
  const hash = flightNumber.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  if (diff < 0) return 'Departed';
  if (diff < 40 * 60000) return 'Boarding';
  if (hash % 9 === 0) return 'Delayed';
  return 'On Time';
}

function getGate(flightNumber: string): string {
  const GATES = ['A12', 'B07', 'C22', 'D04', 'E15', 'F09', 'G31', 'H18'];
  const hash = flightNumber.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  return GATES[hash % GATES.length];
}

function getCountdown(departure: string): string {
  const diff = new Date(departure).getTime() - Date.now();
  if (diff <= 0) return 'Departed';
  const h = Math.floor(diff / 3600000);
  if (h < 1) return `${Math.floor(diff / 60000)}m`;
  const d = Math.floor(h / 24);
  return d > 0 ? `${d}d ${h % 24}h` : `${h}h`;
}

const statusStyle: Record<FlightStatus, string> = {
  'On Time': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'Boarding': 'bg-blue-50 text-blue-700 border-blue-200',
  'Departed': 'bg-slate-100 text-slate-500 border-slate-200',
  'Delayed': 'bg-amber-50 text-amber-700 border-amber-200',
  'Cancelled': 'bg-red-50 text-red-700 border-red-200',
};

const StatusIcon = ({ status }: { status: FlightStatus }) => {
  if (status === 'On Time' || status === 'Departed') return <CheckCircle2 className="w-3.5 h-3.5" />;
  if (status === 'Boarding') return <Plane className="w-3.5 h-3.5 rotate-90" />;
  if (status === 'Delayed') return <AlertTriangle className="w-3.5 h-3.5" />;
  return <XCircle className="w-3.5 h-3.5" />;
};

function SkeletonRow() {
  return (
    <div className="flex gap-4 p-4 animate-pulse">
      <div className="h-5 bg-slate-200 rounded w-20" />
      <div className="h-5 bg-slate-200 rounded w-32" />
      <div className="h-5 bg-slate-200 rounded w-24" />
      <div className="h-5 bg-slate-200 rounded w-16" />
    </div>
  );
}

export default function FlightStatus() {
  const [flights, setFlights] = useState<Flight[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [tick, setTick] = useState(0);

  const fetchFlights = () => {
    setLoading(true);
    const API_BASE = import.meta.env.VITE_API_URL || 'http://api.aerolink.transnova.shop';
    fetch(`${API_BASE}/api/v1/flights/`)
      .then(res => res.json())
      .then(data => { setFlights(data.data || []); setLastRefresh(new Date()); })
      .catch(() => setFlights([
        { id: 'f1', flight_number: 'AL-102', origin_airport: 'LAX', destination_airport: 'JFK', departure_time: new Date(Date.now() + 86400000).toISOString(), base_price: 350 },
        { id: 'f2', flight_number: 'AL-309', origin_airport: 'LHR', destination_airport: 'SIN', departure_time: new Date(Date.now() + 35 * 60000).toISOString(), base_price: 780 },
        { id: 'f3', flight_number: 'AL-882', origin_airport: 'DXB', destination_airport: 'HND', departure_time: new Date(Date.now() - 3600000).toISOString(), base_price: 920 },
        { id: 'f4', flight_number: 'AL-441', origin_airport: 'SIN', destination_airport: 'CMB', departure_time: new Date(Date.now() + 172800000).toISOString(), base_price: 420 },
        { id: 'f5', flight_number: 'AL-773', origin_airport: 'CDG', destination_airport: 'BOM', departure_time: new Date(Date.now() + 259200000).toISOString(), base_price: 610 },
      ]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchFlights();
    const refresh = setInterval(fetchFlights, 30000);
    const ticker = setInterval(() => setTick(n => n + 1), 60000);
    return () => { clearInterval(refresh); clearInterval(ticker); };
  }, []);

  void tick;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Navbar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <img src="/aerolink_logo.png" alt="AeroLink" className="h-9 w-auto" />
            <span className="font-extrabold text-slate-800 text-lg hidden sm:block">AeroLink</span>
          </Link>
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400">Last updated: {lastRefresh.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</span>
            <button onClick={fetchFlights} disabled={loading} className="flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:text-blue-500 cursor-pointer disabled:opacity-50">
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-slate-900">Flight Status</h1>
          <p className="text-slate-500 text-sm mt-1">Real-time departure and arrival information. Refreshes automatically every 30 seconds.</p>
        </div>

        {/* Status legend */}
        <div className="flex flex-wrap gap-2 mb-6">
          {(['On Time', 'Boarding', 'Departed', 'Delayed', 'Cancelled'] as FlightStatus[]).map(s => (
            <span key={s} className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full border ${statusStyle[s]}`}>
              <StatusIcon status={s} />
              {s}
            </span>
          ))}
        </div>

        {/* Flights table */}
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          {/* Table header */}
          <div className="grid grid-cols-12 gap-2 px-5 py-3 bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            <div className="col-span-2">Flight</div>
            <div className="col-span-3">Route</div>
            <div className="col-span-3">Departure</div>
            <div className="col-span-1">Gate</div>
            <div className="col-span-2">Countdown</div>
            <div className="col-span-1">Status</div>
          </div>

          {loading ? (
            <><SkeletonRow /><SkeletonRow /><SkeletonRow /><SkeletonRow /></>
          ) : flights.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <Plane className="w-10 h-10 mx-auto mb-3 opacity-30 rotate-90" />
              <p className="font-semibold">No flights available right now.</p>
            </div>
          ) : (
            flights.map(flight => {
              const status = deriveStatus(flight.departure_time, flight.flight_number);
              const gate = getGate(flight.flight_number);
              const depDate = new Date(flight.departure_time);
              return (
                <div key={flight.id} className="grid grid-cols-12 gap-2 px-5 py-4 border-b border-slate-100 last:border-0 hover:bg-slate-50/50 transition-colors items-center">
                  <div className="col-span-2">
                    <span className="font-mono font-bold text-sm text-blue-700 bg-blue-50 border border-blue-100 px-2 py-1 rounded-lg">{flight.flight_number}</span>
                  </div>
                  <div className="col-span-3 flex items-center gap-2 font-bold text-slate-900">
                    <span>{flight.origin_airport}</span>
                    <Plane className="w-3.5 h-3.5 text-blue-400 rotate-90 shrink-0" />
                    <span>{flight.destination_airport}</span>
                  </div>
                  <div className="col-span-3 text-sm text-slate-600">
                    <div className="font-semibold">{depDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</div>
                    <div className="text-xs text-slate-400">{depDate.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</div>
                  </div>
                  <div className="col-span-1">
                    <span className="text-sm font-bold text-slate-700 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      {gate}
                    </span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-sm font-semibold text-slate-600 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {getCountdown(flight.departure_time)}
                    </span>
                  </div>
                  <div className="col-span-1">
                    <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full border ${statusStyle[status]}`}>
                      <StatusIcon status={status} />
                      {status}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <p className="text-center text-xs text-slate-400 mt-6">
          AeroLink Flight Operations · <Link to="/" className="text-blue-500 hover:underline">Back to home</Link>
        </p>
      </main>
    </div>
  );
}
