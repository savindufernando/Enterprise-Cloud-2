import { useState, useEffect } from 'react';
import { Search, MapPin, Calendar, Plane, Loader2 } from 'lucide-react';

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
      {/* Search Sidebar */}
      <div className="col-span-1">
        <div className="p-6 rounded-xl border border-slate-200 bg-white shadow-sm">
          <h2 className="text-base font-bold text-slate-700 flex items-center mb-6 border-b border-slate-100 pb-3">
            <Search className="w-4 h-4 mr-2 text-blue-600" />
            Search Flights
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5">From</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3.5 w-4 h-4 text-slate-400 z-10" />
                <select
                  value={origin}
                  onChange={e => setOrigin(e.target.value)}
                  className="w-full pl-10 pr-8 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-slate-800 text-sm font-semibold shadow-sm cursor-pointer"
                >
                  <option value="CMB">CMB — Colombo</option>
                  <option value="LAX">LAX — Los Angeles</option>
                  <option value="JFK">JFK — New York</option>
                  <option value="LHR">LHR — London</option>
                  <option value="CDG">CDG — Paris</option>
                  <option value="SIN">SIN — Singapore</option>
                  <option value="DXB">DXB — Dubai</option>
                  <option value="HND">HND — Tokyo</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5">To</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3.5 w-4 h-4 text-slate-400 z-10" />
                <select
                  value={destination}
                  onChange={e => setDestination(e.target.value)}
                  className="w-full pl-10 pr-8 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-slate-800 text-sm font-semibold shadow-sm cursor-pointer"
                >
                  <option value="JFK">JFK — New York</option>
                  <option value="CMB">CMB — Colombo</option>
                  <option value="LAX">LAX — Los Angeles</option>
                  <option value="LHR">LHR — London</option>
                  <option value="CDG">CDG — Paris</option>
                  <option value="SIN">SIN — Singapore</option>
                  <option value="DXB">DXB — Dubai</option>
                  <option value="HND">HND — Tokyo</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5">Departure Date</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" />
                <input
                  type="date"
                  defaultValue={new Date(Date.now() + 86400000).toISOString().split('T')[0]}
                  className="w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-slate-800 text-sm font-semibold shadow-sm"
                />
              </div>
            </div>

            <div className="flex gap-2.5 pt-2">
              <button
                onClick={handleSearch}
                className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2.5 rounded-lg shadow-sm transition-all cursor-pointer text-sm"
              >
                Search
              </button>
              {hasSearched && (
                <button
                  onClick={handleReset}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold py-2.5 px-4 rounded-lg border border-slate-200 transition-all cursor-pointer text-sm"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Flight Results */}
      <div className="col-span-1 lg:col-span-2">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-6">
          <h2 className="text-xl font-bold text-slate-800">Available Flights</h2>
          <span className="text-xs bg-slate-100 border border-slate-200 px-3 py-1 rounded-full text-slate-500 font-semibold">
            {filteredFlights.length} flight{filteredFlights.length !== 1 ? 's' : ''} found
          </span>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          </div>
        ) : filteredFlights.length > 0 ? (
          <div className="space-y-4">
            {filteredFlights.map(flight => (
              <div
                key={flight.id}
                className="p-6 rounded-xl border border-slate-200 hover:border-blue-300 bg-white hover:shadow-md transition-all flex flex-col sm:flex-row justify-between items-center gap-4 group relative overflow-hidden"
              >
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-200 group-hover:bg-blue-600 transition-all rounded-l-xl" />

                <div className="flex items-center gap-5 pl-2">
                  <div className="bg-blue-50 text-blue-700 font-mono font-bold px-4 py-2.5 rounded-lg text-sm border border-blue-100">
                    {flight.flight_number}
                  </div>
                  <div>
                    <div className="text-xl font-extrabold text-slate-800 flex items-center gap-2">
                      <span>{flight.origin_airport}</span>
                      <Plane className="w-4 h-4 text-slate-300 rotate-90" />
                      <span>{flight.destination_airport}</span>
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      Departs {new Date(flight.departure_time).toLocaleString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-3 shrink-0">
                  <div className="text-2xl font-extrabold text-slate-900">${flight.base_price}</div>
                  <button
                    onClick={() => onSelectFlight(flight)}
                    className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-lg font-semibold shadow-sm hover:shadow-md transition-all cursor-pointer text-sm"
                  >
                    Select Flight
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-16 text-center rounded-xl bg-slate-50 border border-slate-200">
            <Plane className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 font-semibold">No flights found for this route.</p>
            <button
              onClick={handleReset}
              className="mt-3 text-sm text-blue-600 hover:text-blue-500 font-semibold underline cursor-pointer"
            >
              Show all flights
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
