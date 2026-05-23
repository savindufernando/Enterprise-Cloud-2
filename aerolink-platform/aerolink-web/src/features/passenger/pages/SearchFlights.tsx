import { useState, useEffect } from 'react';
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
  const [origin, setOrigin] = useState('LAX');
  const [destination, setDestination] = useState('JFK');
  const [filteredFlights, setFilteredFlights] = useState<Flight[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  // Sync initially or when flights load from API
  useEffect(() => {
    setFilteredFlights(flights);
  }, [flights]);

  const handleSearch = () => {
    setHasSearched(true);
    const results = flights.filter(f => 
      f.origin_airport.toUpperCase() === origin.toUpperCase() &&
      f.destination_airport.toUpperCase() === destination.toUpperCase()
    );
    setFilteredFlights(results);
  };

  const handleReset = () => {
    setOrigin('LAX');
    setDestination('JFK');
    setFilteredFlights(flights);
    setHasSearched(false);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in text-slate-800">
      {/* Search Filter Sidebar */}
      <div className="col-span-1">
        <div className="glass-panel p-6 rounded-xl border border-slate-200 bg-white shadow-sm">
          <h2 className="text-base font-bold text-slate-700 flex items-center mb-6 border-b border-slate-100 pb-3">
            <Search className="w-4 h-4 mr-2 text-blue-600" />
            Route Discovery
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Origin Airport</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3.5 w-4 h-4 text-slate-400 z-10" />
                <select 
                  value={origin}
                  onChange={e => setOrigin(e.target.value)}
                  className="w-full pl-10 pr-8 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-slate-800 text-sm font-semibold shadow-sm cursor-pointer"
                >
                  <option value="LAX">LAX - Los Angeles</option>
                  <option value="JFK">JFK - New York</option>
                  <option value="LHR">LHR - London</option>
                  <option value="CDG">CDG - Paris</option>
                  <option value="SIN">SIN - Singapore</option>
                  <option value="DXB">DXB - Dubai</option>
                  <option value="HND">HND - Tokyo</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Destination Airport</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3.5 w-4 h-4 text-slate-400 z-10" />
                <select 
                  value={destination}
                  onChange={e => setDestination(e.target.value)}
                  className="w-full pl-10 pr-8 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-slate-800 text-sm font-semibold shadow-sm cursor-pointer"
                >
                  <option value="JFK">JFK - New York</option>
                  <option value="LAX">LAX - Los Angeles</option>
                  <option value="LHR">LHR - London</option>
                  <option value="CDG">CDG - Paris</option>
                  <option value="SIN">SIN - Singapore</option>
                  <option value="DXB">DXB - Dubai</option>
                  <option value="HND">HND - Tokyo</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Departure Schedule</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" />
                <input 
                  type="date" 
                  defaultValue={new Date(Date.now() + 86400000).toISOString().split('T')[0]} 
                  className="w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-slate-800 text-sm font-semibold shadow-sm font-mono" 
                />
              </div>
            </div>
            
            <div className="flex gap-2.5 pt-2">
              <button 
                onClick={handleSearch}
                className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 rounded-lg shadow-md transition-all cursor-pointer text-xs uppercase tracking-wider font-semibold"
              >
                Search
              </button>
              {hasSearched && (
                <button 
                  onClick={handleReset}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold py-2.5 px-4 rounded-lg border border-slate-200 transition-all cursor-pointer text-xs uppercase font-semibold"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Flight Search Results Grid */}
      <div className="col-span-1 lg:col-span-2">
        <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center justify-between border-b border-slate-200 pb-3">
          <span>Active Network Inventory</span>
          <span className="text-xs bg-slate-100 border border-slate-200 px-3 py-1 rounded-full text-slate-600 font-mono font-bold">
            FLIGHTS_ACTIVE: {filteredFlights.length}
          </span>
        </h2>
        
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          </div>
        ) : filteredFlights.length > 0 ? (
          <div className="space-y-4">
            {filteredFlights.map(flight => (
              <div 
                key={flight.id} 
                className="glass-panel p-6 rounded-xl border border-slate-200 hover:border-blue-400/40 bg-white hover:bg-slate-50 transition-all flex flex-col sm:flex-row justify-between items-center group relative overflow-hidden shadow-sm"
              >
                {/* Visual side marker */}
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-600/30 group-hover:bg-blue-600 transition-all" />
                
                <div className="flex items-center space-x-6 mb-4 sm:mb-0 pl-2">
                  <div className="bg-blue-50 text-blue-700 font-mono font-bold px-4 py-2.5 rounded-lg text-lg border border-blue-100">
                    {flight.flight_number}
                  </div>
                  <div>
                    <div className="text-xl font-black text-slate-800 flex items-center space-x-2">
                      <span>{flight.origin_airport}</span>
                      <span className="text-slate-400 font-normal">→</span>
                      <span>{flight.destination_airport}</span>
                    </div>
                    <div className="text-xs text-slate-500 mt-1 font-bold font-mono">
                      DEP: {new Date(flight.departure_time).toLocaleString()}
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-col items-end space-y-3">
                  <div className="text-2xl font-black text-slate-900 font-mono">${flight.base_price}</div>
                  <button 
                    onClick={() => onSelectFlight(flight)}
                    className="flex items-center space-x-1.5 bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-lg font-bold shadow-md hover:shadow-lg transition-all cursor-pointer text-xs uppercase tracking-wider"
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>Reserve Seat</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="glass-panel py-16 text-center rounded-xl bg-slate-50 border border-slate-200 shadow-sm">
            <p className="text-slate-500 text-sm font-bold">No flights matched your coordinates selection.</p>
            <button 
              onClick={handleReset} 
              className="mt-3 text-xs text-blue-600 hover:text-blue-500 font-bold underline uppercase cursor-pointer"
            >
              Reset Search Filter
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
