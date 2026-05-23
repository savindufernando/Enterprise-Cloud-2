import { Search, MapPin, Calendar, CreditCard, Loader2 } from 'lucide-react';

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
  onSelectFlight: (flight: Flight) => void;
}

export default function SearchFlights({ flights, loading, onSelectFlight }: SearchFlightsProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in">
      {/* Search Filter Sidebar */}
      <div className="col-span-1">
        <div className="glass-panel p-6 rounded-xl border border-slate-800">
          <h2 className="text-base font-bold text-slate-200 flex items-center mb-6 border-b border-slate-800 pb-3">
            <Search className="w-4 h-4 mr-2 text-blue-500" />
            Route Discovery
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Origin Airport</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                <input 
                  type="text" 
                  defaultValue="LAX" 
                  className="w-full pl-10 pr-3 py-2 border border-slate-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 bg-slate-950/60 text-slate-200 text-sm font-semibold" 
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Destination Airport</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                <input 
                  type="text" 
                  defaultValue="JFK" 
                  className="w-full pl-10 pr-3 py-2 border border-slate-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 bg-slate-950/60 text-slate-200 text-sm font-semibold" 
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Departure Schedule</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                <input 
                  type="date" 
                  defaultValue={new Date(Date.now() + 86400000).toISOString().split('T')[0]} 
                  className="w-full pl-10 pr-3 py-2 border border-slate-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 bg-slate-950/60 text-slate-200 text-sm font-semibold" 
                />
              </div>
            </div>
            <button className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 rounded-lg shadow-md transition-all cursor-pointer mt-4 text-sm uppercase tracking-wider">
              Search Global Network
            </button>
          </div>
        </div>
      </div>

      {/* Flight Search Results Grid */}
      <div className="col-span-1 lg:col-span-2">
        <h2 className="text-xl font-bold text-slate-200 mb-6 flex items-center justify-between">
          <span>Active Network Inventory</span>
          <span className="text-xs bg-slate-800 border border-slate-700 px-3 py-1 rounded-full text-slate-400 font-mono">
            FLIGHTS_ACTIVE: {flights.length}
          </span>
        </h2>
        
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
          </div>
        ) : flights.length > 0 ? (
          <div className="space-y-4">
            {flights.map(flight => (
              <div 
                key={flight.id} 
                className="glass-panel p-6 rounded-xl border border-slate-800 hover:border-slate-700 transition-all flex flex-col sm:flex-row justify-between items-center bg-[#111827]/40 hover:bg-[#111827]/60 group relative overflow-hidden"
              >
                <div className="absolute right-0 top-0 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl group-hover:bg-blue-500/10 transition-all pointer-events-none" />
                
                <div className="flex items-center space-x-6 mb-4 sm:mb-0">
                  <div className="bg-blue-950/40 text-blue-400 font-mono font-bold px-4 py-2.5 rounded-lg text-lg border border-blue-900/40 group-hover:border-blue-500/30 transition-all">
                    {flight.flight_number}
                  </div>
                  <div>
                    <div className="text-xl font-extrabold text-slate-200 flex items-center space-x-2">
                      <span>{flight.origin_airport}</span>
                      <span className="text-slate-600 font-normal">→</span>
                      <span>{flight.destination_airport}</span>
                    </div>
                    <div className="text-xs text-slate-500 mt-1 font-medium font-mono">
                      DEP: {new Date(flight.departure_time).toLocaleString()}
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-col items-end space-y-3">
                  <div className="text-2xl font-black text-white font-mono">${flight.base_price}</div>
                  <button 
                    onClick={() => onSelectFlight(flight)}
                    className="flex items-center space-x-1.5 bg-blue-600 hover:bg-blue-500 text-white px-5 py-2 rounded-lg font-bold shadow-md transition-all cursor-pointer text-xs uppercase"
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>Reserve Seat</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="glass-panel py-16 text-center rounded-xl bg-slate-900/20 border border-slate-800">
            <p className="text-slate-500 text-sm">No flights matched your search.</p>
          </div>
        )}
      </div>
    </div>
  );
}
