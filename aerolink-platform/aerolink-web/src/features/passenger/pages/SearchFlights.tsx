import { useState, useMemo, useEffect } from 'react';
import { Plane, Search, SlidersHorizontal, ArrowUpDown, ChevronDown, Heart, Clock, CalendarDays, RotateCcw } from 'lucide-react';

interface Flight {
  id: string;
  flight_number: string;
  origin_airport: string;
  destination_airport: string;
  departure_time: string;
  base_price: number;
}

interface SearchFlightsProps {
  flights: Flight[];
  loading: boolean;
  onSelectFlight: (flight: Flight, tripType: 'one-way' | 'round-trip', returnDate?: string) => void;
}

const ALL_AIRPORTS = ['Any', 'LAX', 'JFK', 'LHR', 'SIN', 'DXB', 'HND', 'CMB', 'SYD', 'CDG', 'FRA', 'NRT', 'BKK', 'DEL', 'BOM'];
type SortKey = 'price_asc' | 'price_desc' | 'dep_asc' | 'dep_desc';

const SAVED_KEY = 'aerolink_saved_flights';
const RECENT_KEY = 'aerolink_recent_searches';

function getSaved(): string[] {
  try { return JSON.parse(localStorage.getItem(SAVED_KEY) || '[]'); } catch { return []; }
}
function toggleSaved(id: string) {
  const s = getSaved();
  const next = s.includes(id) ? s.filter(x => x !== id) : [id, ...s];
  localStorage.setItem(SAVED_KEY, JSON.stringify(next));
  return next;
}
function getRecent(): { origin: string; destination: string }[] {
  try { return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]'); } catch { return []; }
}
function saveRecent(origin: string, destination: string) {
  const prev = getRecent().filter(r => !(r.origin === origin && r.destination === destination));
  localStorage.setItem(RECENT_KEY, JSON.stringify([{ origin, destination }, ...prev].slice(0, 5)));
}

function SkeletonCard() {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 animate-pulse">
      <div className="flex justify-between items-start gap-4">
        <div className="space-y-3 flex-1">
          <div className="h-4 bg-slate-200 rounded w-24" />
          <div className="flex items-center gap-3">
            <div className="h-8 bg-slate-200 rounded w-16" />
            <div className="h-4 bg-slate-200 rounded w-6" />
            <div className="h-8 bg-slate-200 rounded w-16" />
          </div>
          <div className="h-3 bg-slate-200 rounded w-40" />
        </div>
        <div className="space-y-2 items-end flex flex-col">
          <div className="h-8 bg-slate-200 rounded w-20" />
          <div className="h-9 bg-slate-200 rounded w-28" />
        </div>
      </div>
    </div>
  );
}

export default function SearchFlights({ flights, loading, onSelectFlight }: SearchFlightsProps) {
  const [tripType, setTripType] = useState<'one-way' | 'round-trip'>('one-way');
  const [searchOrigin, setSearchOrigin] = useState('Any');
  const [searchDest, setSearchDest] = useState('Any');
  const [departureDate, setDepartureDate] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [maxPrice, setMaxPrice] = useState(2000);
  const [sortKey, setSortKey] = useState<SortKey>('dep_asc');
  const [showFilters, setShowFilters] = useState(false);
  const [savedIds, setSavedIds] = useState<string[]>(getSaved);
  const [recentSearches, setRecentSearches] = useState(getRecent);
  const [showSaved, setShowSaved] = useState(false);

  // Sync saved from localStorage when tab focuses
  useEffect(() => {
    const sync = () => setSavedIds(getSaved());
    window.addEventListener('focus', sync);
    return () => window.removeEventListener('focus', sync);
  }, []);

  const maxFlightPrice = useMemo(
    () => (flights.length > 0 ? Math.max(...flights.map(f => f.base_price)) : 2000),
    [flights]
  );

  const filteredFlights = useMemo(() => {
    let result = [...flights];
    if (searchOrigin !== 'Any') result = result.filter(f => f.origin_airport === searchOrigin);
    if (searchDest !== 'Any') result = result.filter(f => f.destination_airport === searchDest);
    if (departureDate) {
      result = result.filter(f => {
        const fd = new Date(f.departure_time).toISOString().slice(0, 10);
        return fd === departureDate;
      });
    }
    result = result.filter(f => f.base_price <= maxPrice);
    result.sort((a, b) => {
      if (sortKey === 'price_asc') return a.base_price - b.base_price;
      if (sortKey === 'price_desc') return b.base_price - a.base_price;
      if (sortKey === 'dep_asc') return new Date(a.departure_time).getTime() - new Date(b.departure_time).getTime();
      return new Date(b.departure_time).getTime() - new Date(a.departure_time).getTime();
    });
    return result;
  }, [flights, searchOrigin, searchDest, departureDate, maxPrice, sortKey]);

  const savedFlights = useMemo(() => flights.filter(f => savedIds.includes(f.id)), [flights, savedIds]);

  const handleToggleSaved = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSavedIds(toggleSaved(id));
  };

  const handleSelectFlight = (flight: Flight) => {
    saveRecent(flight.origin_airport, flight.destination_airport);
    setRecentSearches(getRecent());
    onSelectFlight(flight, tripType, tripType === 'round-trip' ? returnDate : undefined);
  };

  const applyRecent = (r: { origin: string; destination: string }) => {
    setSearchOrigin(r.origin);
    setSearchDest(r.destination);
    setShowFilters(true);
  };

  const clearFilters = () => {
    setSearchOrigin('Any'); setSearchDest('Any');
    setDepartureDate(''); setReturnDate('');
    setMaxPrice(maxFlightPrice);
  };

  return (
    <div className="space-y-5">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Search className="w-5 h-5 text-blue-600" />
            Search Flights
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {loading ? 'Loading available flights...' : `${filteredFlights.length} of ${flights.length} flights shown`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {savedFlights.length > 0 && (
            <button
              onClick={() => setShowSaved(v => !v)}
              className={`flex items-center gap-1.5 text-sm font-semibold px-3 py-2 rounded-lg border transition-all cursor-pointer ${showSaved ? 'bg-rose-50 border-rose-200 text-rose-600' : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300'}`}
            >
              <Heart className={`w-4 h-4 ${showSaved ? 'fill-rose-500 text-rose-500' : ''}`} />
              Saved ({savedFlights.length})
            </button>
          )}
          {!loading && flights.length > 0 && (
            <button
              onClick={() => setShowFilters(v => !v)}
              className={`flex items-center gap-1.5 text-sm font-semibold px-3 py-2 rounded-lg border transition-all cursor-pointer ${showFilters ? 'bg-blue-50 border-blue-200 text-blue-600' : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300'}`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              Filters
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </button>
          )}
        </div>
      </div>

      {/* Trip type toggle */}
      <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-1 w-fit">
        {(['one-way', 'round-trip'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTripType(t)}
            className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-all cursor-pointer ${tripType === t ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            {t === 'one-way' ? 'One Way' : 'Round Trip'}
          </button>
        ))}
      </div>

      {/* Recent searches */}
      {recentSearches.length > 0 && !showFilters && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="flex items-center gap-1 text-xs font-bold text-slate-400">
            <Clock className="w-3.5 h-3.5" /> Recent:
          </span>
          {recentSearches.map((r, i) => (
            <button
              key={i}
              onClick={() => applyRecent(r)}
              className="flex items-center gap-1 text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 px-3 py-1 rounded-full border border-slate-200 dark:border-slate-700 transition-all cursor-pointer"
            >
              {r.origin} → {r.destination}
            </button>
          ))}
        </div>
      )}

      {/* Saved flights panel */}
      {showSaved && savedFlights.length > 0 && (
        <div className="bg-rose-50 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900 rounded-xl p-4 space-y-3 animate-fade-in">
          <div className="flex items-center gap-2 text-sm font-bold text-rose-700 dark:text-rose-400">
            <Heart className="w-4 h-4 fill-rose-500 text-rose-500" />
            Saved Flights
          </div>
          {savedFlights.map(flight => {
            const depDate = new Date(flight.departure_time);
            const isPast = depDate < new Date();
            return (
              <div key={flight.id} className="flex items-center justify-between bg-white dark:bg-slate-900 rounded-lg p-3 border border-rose-100 dark:border-rose-900">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">{flight.flight_number}</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200 text-sm">{flight.origin_airport} → {flight.destination_airport}</span>
                  <span className="text-xs text-slate-400">{depDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-slate-900 dark:text-slate-100">${flight.base_price}</span>
                  <button
                    disabled={isPast}
                    onClick={() => handleSelectFlight(flight)}
                    className="text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-lg disabled:opacity-40 cursor-pointer transition-all"
                  >
                    Select
                  </button>
                  <button onClick={e => handleToggleSaved(flight.id, e)} className="text-rose-400 hover:text-rose-600 cursor-pointer transition-colors">
                    <Heart className="w-4 h-4 fill-rose-500 text-rose-500" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Filter panel */}
      {showFilters && !loading && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-5 space-y-4 shadow-sm animate-fade-in">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5">Origin</label>
              <select value={searchOrigin} onChange={e => setSearchOrigin(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer">
                {ALL_AIRPORTS.map(a => <option key={a}>{a}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5">Destination</label>
              <select value={searchDest} onChange={e => setSearchDest(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer">
                {ALL_AIRPORTS.map(a => <option key={a}>{a}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5 flex items-center gap-1">
                <CalendarDays className="w-3.5 h-3.5" /> Departure Date
              </label>
              <input type="date" value={departureDate} onChange={e => setDepartureDate(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer" />
            </div>
            {tripType === 'round-trip' && (
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5 flex items-center gap-1">
                  <RotateCcw className="w-3.5 h-3.5" /> Return Date
                </label>
                <input type="date" value={returnDate} onChange={e => setReturnDate(e.target.value)} min={departureDate} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer" />
              </div>
            )}
            <div className={tripType === 'round-trip' ? 'sm:col-span-2 lg:col-span-4' : ''}>
              <label className="block text-xs font-bold text-slate-500 mb-1.5">Max Price: <span className="text-blue-600">${maxPrice}</span></label>
              <input type="range" min={50} max={maxFlightPrice} value={Math.min(maxPrice, maxFlightPrice)} onChange={e => setMaxPrice(Number(e.target.value))} className="w-full accent-blue-600 cursor-pointer" />
              <div className="flex justify-between text-[10px] text-slate-400 mt-0.5"><span>$50</span><span>${maxFlightPrice}</span></div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-xs font-bold text-slate-500">Sort:</span>
            {([
              { key: 'dep_asc', label: 'Earliest first' },
              { key: 'dep_desc', label: 'Latest first' },
              { key: 'price_asc', label: 'Cheapest' },
              { key: 'price_desc', label: 'Most expensive' },
            ] as { key: SortKey; label: string }[]).map(s => (
              <button key={s.key} onClick={() => setSortKey(s.key)} className={`text-xs font-semibold px-3 py-1 rounded-full border transition-all cursor-pointer ${sortKey === s.key ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-blue-300'}`}>
                {s.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Round-trip info banner */}
      {tripType === 'round-trip' && (
        <div className="flex items-center gap-2 bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900 rounded-xl px-4 py-2.5 text-xs text-blue-700 dark:text-blue-300 font-semibold">
          <RotateCcw className="w-3.5 h-3.5 shrink-0" />
          Round trip selected — after booking your outbound flight you'll be prompted to book the return leg.
        </div>
      )}

      {/* Flight list */}
      <div className="space-y-4">
        {loading ? (
          <><SkeletonCard /><SkeletonCard /><SkeletonCard /></>
        ) : filteredFlights.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <Plane className="w-10 h-10 mx-auto mb-3 opacity-30 rotate-90" />
            <p className="font-semibold text-slate-500">No flights match your filters.</p>
            <button onClick={clearFilters} className="mt-3 text-blue-600 text-sm font-semibold hover:underline cursor-pointer">
              Clear filters
            </button>
          </div>
        ) : (
          filteredFlights.map(flight => {
            const depDate = new Date(flight.departure_time);
            const isPast = depDate < new Date();
            const isSaved = savedIds.includes(flight.id);
            return (
              <div key={flight.id} className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 hover:shadow-md transition-shadow ${isPast ? 'opacity-60' : ''}`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="bg-blue-50 border border-blue-100 text-blue-700 font-mono font-bold px-3 py-2 rounded-xl text-sm shrink-0">
                      {flight.flight_number}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">{flight.origin_airport}</span>
                        <Plane className="w-4 h-4 text-blue-400 rotate-90 shrink-0" />
                        <span className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">{flight.destination_airport}</span>
                      </div>
                      <div className="text-xs text-slate-500 mt-1">
                        {depDate.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                        {' · '}
                        {depDate.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                        {tripType === 'round-trip' && returnDate && (
                          <span className="ml-2 text-blue-500 font-semibold">· Return {new Date(returnDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 sm:flex-col sm:items-end">
                    <div className="text-right">
                      <div className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">${flight.base_price}</div>
                      <div className="text-[10px] text-slate-400 uppercase tracking-wide">from / person</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={e => handleToggleSaved(flight.id, e)}
                        title={isSaved ? 'Remove from saved' : 'Save flight'}
                        className={`p-2 rounded-xl border transition-all cursor-pointer ${isSaved ? 'bg-rose-50 border-rose-200 text-rose-500' : 'bg-slate-50 border-slate-200 text-slate-400 hover:text-rose-400 hover:border-rose-200'}`}
                      >
                        <Heart className={`w-4 h-4 ${isSaved ? 'fill-rose-500' : ''}`} />
                      </button>
                      <button
                        onClick={() => handleSelectFlight(flight)}
                        disabled={isPast}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-all cursor-pointer shadow-sm"
                      >
                        <Plane className="w-4 h-4 rotate-90" />
                        Select
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
