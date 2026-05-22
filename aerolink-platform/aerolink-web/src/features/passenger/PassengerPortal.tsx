import { useState, useEffect } from 'react';
import { Search, MapPin, Calendar, CreditCard } from 'lucide-react';

export default function PassengerPortal() {
    const [flights, setFlights] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Fetch flights from unified API Gateway
        const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';
        fetch(`${API_BASE}/api/v1/flights/`)
            .then(res => res.json())
            .then(data => {
                setFlights(data.data || []);
                setLoading(false);
            })
            .catch(err => {
                console.error("Failed to load flights:", err);
                setLoading(false);
            });
    }, []);

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Hero Section */}
            <div className="relative rounded-2xl overflow-hidden shadow-xl mb-12">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-900 to-blue-600 opacity-90 z-10"></div>
                {/* Use the generated cinematic AI image here by placing it in public folder */}
                <div className="absolute inset-0 bg-[url('/bg-aviation.png')] bg-cover bg-center z-0"></div>
                
                <div className="relative z-20 px-8 py-20 lg:p-24 text-white">
                    <h1 className="text-4xl lg:text-6xl font-bold mb-4 tracking-tight">The Sky is Yours.</h1>
                    <p className="text-xl text-blue-100 max-w-2xl">
                        Experience the gold standard in modern aviation. Book flights globally through our cloud-native unified platform.
                    </p>
                </div>
            </div>

            {/* Application Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Search Sidebar */}
                <div className="col-span-1">
                    <div className="glass-panel p-6 rounded-xl border border-slate-200">
                        <h2 className="text-lg font-semibold text-slate-800 flex items-center mb-6">
                            <Search className="w-5 h-5 mr-2 text-primary" />
                            Find Flights
                        </h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-600 mb-1">Origin</label>
                                <div className="relative">
                                    <MapPin className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                                    <input type="text" placeholder="LAX" className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-white text-slate-900 placeholder-slate-400" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-600 mb-1">Destination</label>
                                <div className="relative">
                                    <MapPin className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                                    <input type="text" placeholder="JFK" className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-white text-slate-900 placeholder-slate-400" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-600 mb-1">Departure</label>
                                <div className="relative">
                                    <Calendar className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                                    <input type="date" className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-white text-slate-900" />
                                </div>
                            </div>
                            <button className="w-full bg-primary hover:bg-primary-hover text-white font-medium py-3 rounded-lg shadow-md transition-colors mt-4">
                                Search Network
                            </button>
                        </div>
                    </div>
                </div>

                {/* Flights List */}
                <div className="col-span-1 lg:col-span-2">
                    <h2 className="text-2xl font-bold text-slate-800 mb-6">Available Upcoming Flights</h2>
                    {loading ? (
                        <div className="flex justify-center py-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                        </div>
                    ) : flights.length > 0 ? (
                        <div className="space-y-4">
                            {flights.map(flight => (
                                <div key={flight.id} className="glass-panel p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col sm:flex-row justify-between items-center bg-white">
                                    <div className="flex items-center space-x-6 mb-4 sm:mb-0">
                                        <div className="bg-blue-50 text-primary-dark font-mono font-bold px-4 py-2 rounded-lg text-lg">
                                            {flight.flight_number}
                                        </div>
                                        <div>
                                            <div className="text-xl font-bold text-slate-800 flex items-center space-x-2">
                                                <span>{flight.origin_airport}</span>
                                                <span className="text-slate-400">→</span>
                                                <span>{flight.destination_airport}</span>
                                            </div>
                                            <div className="text-sm text-slate-500 mt-1">
                                                {new Date(flight.departure_time).toLocaleString()}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end space-y-3">
                                        <div className="text-2xl font-bold text-slate-900">${flight.base_price}</div>
                                        <button className="flex items-center space-x-1 bg-gradient-to-r from-secondary to-primary hover:from-primary hover:to-primary-dark text-white px-6 py-2 rounded-lg font-medium shadow-sm transition-all transform hover:-translate-y-0.5">
                                            <CreditCard className="w-4 h-4" />
                                            <span>Reserve Seat</span>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="glass-panel py-16 text-center rounded-xl bg-white border border-slate-200">
                            <p className="text-slate-500">No flights matched your search.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
