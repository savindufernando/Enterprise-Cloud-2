import { useState, useEffect } from 'react';
import { Search, MapPin, Calendar, CreditCard, Armchair, User, CheckCircle, ArrowLeft, Ticket, Shield, FileDown, Trash2, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function PassengerPortal() {
    const { user, logout } = useAuth();
    const [flights, setFlights] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'booking' | 'gdpr'>('booking');
    
    // Booking states
    const [bookingStep, setBookingStep] = useState<'search' | 'seat-selection' | 'confirmed'>('search');
    const [selectedFlight, setSelectedFlight] = useState<any | null>(null);
    const [selectedSeat, setSelectedSeat] = useState<string | null>(null);
    const [occupiedSeats, setOccupiedSeats] = useState<string[]>([]);
    
    // Form states
    const [passengerName, setPassengerName] = useState('');
    const [passportNumber, setPassportNumber] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // GDPR states
    const [gdprLoading, setGdprLoading] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState(false);

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

    // Generate deterministic occupied seats based on flight number
    const handleInitiateBooking = (flight: any) => {
        setSelectedFlight(flight);
        setSelectedSeat(null);
        setPassengerName('');
        setPassportNumber('');
        
        // Dynamic deterministic occupied list based on flight number
        const allPossibleSeats = [];
        const cols = ['A', 'B', 'C', 'D', 'E', 'F'];
        for (let r = 1; r <= 10; r++) {
            for (const c of cols) {
                allPossibleSeats.push(`${r}${c}`);
            }
        }
        
        // Hash flight number to seed random pre-occupied seats
        const hash = flight.flight_number.split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
        const occupied = allPossibleSeats.filter((_, idx) => (hash + idx) % 4 === 0 || (hash * idx) % 7 === 1);
        
        setOccupiedSeats(occupied);
        setBookingStep('seat-selection');
    };

    const handleConfirmBooking = (e: React.FormEvent) => {
        e.preventDefault();
        if (!passengerName || !passportNumber || !selectedSeat) return;

        setIsSubmitting(true);

        // Simulate secure API Gateway distributed Saga pattern execution
        setTimeout(() => {
            setIsSubmitting(false);
            setBookingStep('confirmed');
        }, 1500);
    };

    // GDPR Article 20 JSON Portability Export
    const handleGdprExport = async () => {
        setGdprLoading(true);
        try {
            const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';
            const token = localStorage.getItem('aerolink_token');
            const res = await fetch(`${API_BASE}/api/v1/passengers/me/export`, {
                headers: { 
                    'Authorization': token ? `Bearer ${token}` : '',
                    'Content-Type': 'application/json'
                }
            });
            if (res.ok) {
                const data = await res.json();
                
                // Format and download the JSON data file
                const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(data, null, 2))}`;
                const downloadAnchor = document.createElement('a');
                downloadAnchor.setAttribute('href', jsonString);
                downloadAnchor.setAttribute('download', `aerolink_gdpr_export_${user?.email?.split('@')[0]}.json`);
                document.body.appendChild(downloadAnchor);
                downloadAnchor.click();
                downloadAnchor.remove();
            } else {
                alert("Failed to export compliance logs from EKS.");
            }
        } catch (err) {
            console.error(err);
            alert("Error connecting to data governance service.");
        } finally {
            setGdprLoading(false);
        }
    };

    // GDPR Article 17 Right to Erasure
    const handleGdprErasure = async () => {
        setGdprLoading(true);
        try {
            const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';
            const token = localStorage.getItem('aerolink_token');
            const res = await fetch(`${API_BASE}/api/v1/passengers/me`, {
                method: 'DELETE',
                headers: { 
                    'Authorization': token ? `Bearer ${token}` : '',
                    'Content-Type': 'application/json'
                }
            });
            if (res.ok) {
                alert("Your account and PII records have been permanently anonymized & wiped under GDPR Article 17.");
                logout();
            } else {
                alert("Failed to execute data erasure command in EKS.");
            }
        } catch (err) {
            console.error(err);
            alert("Error connecting to data erasure service.");
        } finally {
            setGdprLoading(false);
            setDeleteConfirm(false);
        }
    };

    // Helper to check seat status
    const getSeatClass = (seatCode: string) => {
        if (occupiedSeats.includes(seatCode)) {
            return 'bg-slate-200 text-slate-400 cursor-not-allowed border-slate-300';
        }
        if (selectedSeat === seatCode) {
            return 'bg-blue-600 text-white border-blue-700 shadow-md ring-2 ring-blue-300 scale-105 transition-all';
        }
        // Business Class for rows 1 & 2
        const row = parseInt(seatCode);
        if (row <= 2) {
            return 'bg-amber-50 text-amber-800 hover:bg-amber-100 border-amber-200 hover:border-amber-300 cursor-pointer';
        }
        return 'bg-white text-slate-700 hover:bg-slate-50 border-slate-200 hover:border-slate-300 cursor-pointer';
    };

    const rows = Array.from({ length: 10 }, (_, i) => i + 1);

    return (
        <div className="space-y-8 animate-fade-in pb-16">
            
            {/* Navigation Tabs (Only visible when not deep inside a booking seat-map selection or confirmed stub) */}
            {bookingStep === 'search' && (
                <div className="flex border-b border-slate-200 space-x-6 mb-6">
                    <button 
                        onClick={() => setActiveTab('booking')}
                        className={`pb-3 font-semibold text-sm transition-all border-b-2 flex items-center space-x-2 ${activeTab === 'booking' ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                    >
                        <Ticket className="w-4 h-4" />
                        <span>Book Passenger Ticket</span>
                    </button>
                    <button 
                        onClick={() => setActiveTab('gdpr')}
                        className={`pb-3 font-semibold text-sm transition-all border-b-2 flex items-center space-x-2 ${activeTab === 'gdpr' ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                    >
                        <Shield className="w-4 h-4" />
                        <span>Data Privacy & GDPR Dashboard</span>
                    </button>
                </div>
            )}

            {/* TAB A: FLIGHT BOOKING */}
            {activeTab === 'booking' && (
                <>
                    {/* HERO SECTION - ONLY ON SEARCH STEP */}
                    {bookingStep === 'search' && (
                        <div className="relative rounded-2xl overflow-hidden shadow-xl mb-12">
                            <div className="absolute inset-0 bg-gradient-to-r from-blue-900 to-blue-600 opacity-90 z-10"></div>
                            <div className="absolute inset-0 bg-[url('/bg-aviation.png')] bg-cover bg-center z-0"></div>
                            
                            <div className="relative z-20 px-8 py-16 lg:p-20 text-white">
                                <h1 className="text-4xl lg:text-5xl font-bold mb-4 tracking-tight">The Sky is Yours.</h1>
                                <p className="text-lg text-blue-100 max-w-xl">
                                    Experience the gold standard in modern aviation. Book flights globally through our cloud-native unified platform.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* STEP 1: FLIGHT SEARCH & SELECTION */}
                    {bookingStep === 'search' && (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {/* Search Sidebar */}
                            <div className="col-span-1">
                                <div className="glass-panel p-6 rounded-xl border border-slate-200 bg-white">
                                    <h2 className="text-lg font-semibold text-slate-800 flex items-center mb-6">
                                        <Search className="w-5 h-5 mr-2 text-blue-600" />
                                        Find Flights
                                    </h2>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-600 mb-1">Origin</label>
                                            <div className="relative">
                                                <MapPin className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                                                <input type="text" placeholder="LAX" className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-slate-900 placeholder-slate-400" />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-600 mb-1">Destination</label>
                                            <div className="relative">
                                                <MapPin className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                                                <input type="text" placeholder="JFK" className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-slate-900 placeholder-slate-400" />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-600 mb-1">Departure</label>
                                            <div className="relative">
                                                <Calendar className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                                                <input type="date" className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-slate-900" />
                                            </div>
                                        </div>
                                        <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-lg shadow-md transition-colors mt-4">
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
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                    </div>
                                ) : flights.length > 0 ? (
                                    <div className="space-y-4">
                                        {flights.map(flight => (
                                            <div key={flight.id} className="glass-panel p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col sm:flex-row justify-between items-center bg-white">
                                                <div className="flex items-center space-x-6 mb-4 sm:mb-0">
                                                    <div className="bg-blue-50 text-blue-900 font-mono font-bold px-4 py-2 rounded-lg text-lg border border-blue-100">
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
                                                    <div className="text-2xl font-bold text-slate-950">${flight.base_price}</div>
                                                    <button 
                                                        onClick={() => handleInitiateBooking(flight)}
                                                        className="flex items-center space-x-1 bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 text-white px-6 py-2.5 rounded-lg font-medium shadow-sm transition-all transform hover:-translate-y-0.5"
                                                    >
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
                    )}

                    {/* STEP 2: INTERACTIVE SEAT SELECTOR & DETAILS */}
                    {bookingStep === 'seat-selection' && selectedFlight && (
                        <div className="space-y-6">
                            <button 
                                onClick={() => setBookingStep('search')}
                                className="flex items-center text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors"
                            >
                                <ArrowLeft className="w-4 h-4 mr-1" />
                                <span>Back to Flights</span>
                            </button>

                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                                {/* Passenger Details & Booking form */}
                                <div className="col-span-1 lg:col-span-5 space-y-6">
                                    <div className="glass-panel p-6 rounded-xl border border-slate-200 bg-white">
                                        <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
                                            <Ticket className="w-5 h-5 mr-2 text-blue-600" />
                                            Flight Summary
                                        </h3>
                                        <div className="p-4 bg-slate-50 rounded-lg space-y-3 font-medium border border-slate-100">
                                            <div className="flex justify-between">
                                                <span className="text-slate-500 text-sm">Flight:</span>
                                                <span className="font-mono text-blue-700 font-bold">{selectedFlight.flight_number}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-slate-500 text-sm">Route:</span>
                                                <span className="text-slate-800">{selectedFlight.origin_airport} → {selectedFlight.destination_airport}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-slate-500 text-sm">Date & Time:</span>
                                                <span className="text-slate-800 text-sm">{new Date(selectedFlight.departure_time).toLocaleString()}</span>
                                            </div>
                                            <div className="flex justify-between border-t border-slate-200 pt-3">
                                                <span className="text-slate-500 text-sm">Selected Seat:</span>
                                                <span className="font-bold text-blue-600">{selectedSeat || 'None Selected'}</span>
                                            </div>
                                            {selectedSeat && (
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-slate-500">Seat Class:</span>
                                                    <span className="font-medium text-amber-700">
                                                        {parseInt(selectedSeat) <= 2 ? '🌟 Business Class (+$50)' : 'Economy Class'}
                                                    </span>
                                                </div>
                                            )}
                                            <div className="flex justify-between border-t border-slate-200 pt-3 text-lg font-bold">
                                                <span className="text-slate-800">Total Price:</span>
                                                <span className="text-slate-950">
                                                    ${selectedSeat && parseInt(selectedSeat) <= 2 ? selectedFlight.base_price + 50 : selectedFlight.base_price}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="glass-panel p-6 rounded-xl border border-slate-200 bg-white">
                                        <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center">
                                            <User className="w-5 h-5 mr-2 text-blue-600" />
                                            Passenger Information
                                        </h3>
                                        <form onSubmit={handleConfirmBooking} className="space-y-4">
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                                                <input 
                                                    type="text" 
                                                    required
                                                    value={passengerName}
                                                    onChange={e => setPassengerName(e.target.value)}
                                                    placeholder="Jane Doe" 
                                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-slate-900 placeholder-slate-400"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 mb-1">Passport Number</label>
                                                <input 
                                                    type="text" 
                                                    required
                                                    value={passportNumber}
                                                    onChange={e => setPassportNumber(e.target.value)}
                                                    placeholder="N1234567" 
                                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-slate-900 placeholder-slate-400"
                                                />
                                            </div>
                                            <button 
                                                type="submit" 
                                                disabled={!selectedSeat || isSubmitting}
                                                className="w-full flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-lg shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-6"
                                            >
                                                {isSubmitting ? (
                                                    <>
                                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                                        <span>Executing Saga Orchestrator...</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <CreditCard className="w-4 h-4" />
                                                        <span>Book Reservation</span>
                                                    </>
                                                )}
                                            </button>
                                        </form>
                                    </div>
                                </div>

                                {/* Interactive Seat Map */}
                                <div className="col-span-1 lg:col-span-7">
                                    <div className="glass-panel p-6 rounded-xl border border-slate-200 bg-white flex flex-col items-center">
                                        <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center self-start">
                                            <Armchair className="w-5 h-5 mr-2 text-blue-600" />
                                            Aircraft Cabin Seat Map
                                        </h3>
                                        
                                        {/* Legends */}
                                        <div className="flex space-x-6 mb-8 text-xs font-semibold text-slate-600">
                                            <div className="flex items-center space-x-2">
                                                <div className="w-4 h-4 bg-white border border-slate-200 rounded"></div>
                                                <span>Economy</span>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <div className="w-4 h-4 bg-amber-50 border border-amber-200 rounded"></div>
                                                <span>Business</span>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <div className="w-4 h-4 bg-blue-600 rounded"></div>
                                                <span>Selected</span>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <div className="w-4 h-4 bg-slate-200 border border-slate-300 rounded"></div>
                                                <span>Booked</span>
                                            </div>
                                        </div>

                                        {/* Curved Aircraft Fuselage container */}
                                        <div className="border-x-4 border-t-8 border-slate-300 rounded-t-full pt-16 pb-8 px-8 sm:px-12 w-full max-w-sm bg-slate-50/50 shadow-inner relative">
                                            <div className="absolute top-4 left-1/2 transform -translate-x-1/2 text-xs font-bold text-slate-400 tracking-widest uppercase">
                                                ✈️ Flight Deck Front
                                            </div>
                                            
                                            <div className="space-y-3">
                                                {rows.map(rowNum => (
                                                    <div key={rowNum} className="flex justify-between items-center">
                                                        {/* Left column seats: A, B, C */}
                                                        <div className="flex space-x-2">
                                                            {['A', 'B', 'C'].map(col => {
                                                                const seatCode = `${rowNum}${col}`;
                                                                const isOccupied = occupiedSeats.includes(seatCode);
                                                                return (
                                                                    <button
                                                                        key={col}
                                                                        disabled={isOccupied}
                                                                        onClick={() => setSelectedSeat(seatCode)}
                                                                        className={`w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center text-xs font-bold font-mono border rounded-lg transition-all ${getSeatClass(seatCode)}`}
                                                                    >
                                                                        {col}
                                                                    </button>
                                                                );
                                                            })}
                                                        </div>

                                                        {/* Center Aisle Indicator */}
                                                        <div className="text-[10px] font-bold text-slate-300 font-mono w-4 text-center">
                                                            {rowNum}
                                                        </div>

                                                        {/* Right column seats: D, E, F */}
                                                        <div className="flex space-x-2">
                                                            {['D', 'E', 'F'].map(col => {
                                                                const seatCode = `${rowNum}${col}`;
                                                                const isOccupied = occupiedSeats.includes(seatCode);
                                                                return (
                                                                    <button
                                                                        key={col}
                                                                        disabled={isOccupied}
                                                                        onClick={() => setSelectedSeat(seatCode)}
                                                                        className={`w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center text-xs font-bold font-mono border rounded-lg transition-all ${getSeatClass(seatCode)}`}
                                                                    >
                                                                        {col}
                                                                    </button>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* STEP 3: TRANSACTION SUCCESS & BOARDING PASS */}
                    {bookingStep === 'confirmed' && selectedFlight && (
                        <div className="max-w-xl mx-auto space-y-6 animate-fade-in">
                            <div className="glass-panel p-8 rounded-xl border border-slate-200 bg-white text-center shadow-lg space-y-4">
                                <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto animate-bounce" />
                                <h2 className="text-2xl font-bold text-slate-800">Booking Confirmed!</h2>
                                <p className="text-slate-500 max-w-sm mx-auto text-sm">
                                    The microservices distributed Saga transaction has completed successfully. Your ticketing records have been seed-locked and distributed across cluster topics.
                                </p>
                            </div>

                            {/* Visual Boarding Pass */}
                            <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-xl bg-white flex flex-col md:flex-row relative">
                                {/* Left Ticket Stub */}
                                <div className="p-6 md:p-8 flex-1 bg-gradient-to-br from-blue-900 to-blue-800 text-white space-y-6 relative">
                                    <div className="flex justify-between items-center border-b border-blue-700/50 pb-4">
                                        <div className="font-bold uppercase tracking-widest text-blue-200 text-xs">Boarding Pass</div>
                                        <div className="font-mono bg-blue-700/50 text-white border border-blue-600/30 px-3 py-1 rounded text-sm font-semibold">
                                            {selectedFlight.flight_number}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-y-4 gap-x-6">
                                        <div>
                                            <div className="text-[10px] text-blue-200 uppercase font-semibold">Passenger</div>
                                            <div className="font-bold text-sm truncate">{passengerName}</div>
                                        </div>
                                        <div>
                                            <div className="text-[10px] text-blue-200 uppercase font-semibold">Passport</div>
                                            <div className="font-bold text-sm font-mono">{passportNumber}</div>
                                        </div>
                                        <div>
                                            <div className="text-[10px] text-blue-200 uppercase font-semibold">Route</div>
                                            <div className="font-bold text-sm">
                                                {selectedFlight.origin_airport} <span className="text-blue-300">→</span> {selectedFlight.destination_airport}
                                            </div>
                                        </div>
                                        <div>
                                            <div className="text-[10px] text-blue-200 uppercase font-semibold">Class</div>
                                            <div className="font-bold text-sm">
                                                {parseInt(selectedSeat || '1') <= 2 ? 'Business Class' : 'Economy Class'}
                                            </div>
                                        </div>
                                        <div>
                                            <div className="text-[10px] text-blue-200 uppercase font-semibold">Departure</div>
                                            <div className="font-bold text-xs">{new Date(selectedFlight.departure_time).toLocaleDateString()}</div>
                                        </div>
                                        <div>
                                            <div className="text-[10px] text-blue-200 uppercase font-semibold">Gate</div>
                                            <div className="font-bold text-sm font-mono">G14</div>
                                        </div>
                                    </div>

                                    <div className="flex justify-between items-end border-t border-blue-700/50 pt-4">
                                        <div>
                                            <div className="text-[10px] text-blue-200 uppercase font-semibold">Seat</div>
                                            <div className="text-xl font-bold font-mono text-amber-300">{selectedSeat}</div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-[10px] text-blue-200 uppercase font-semibold">Gate Closes</div>
                                            <div className="font-bold text-xs">40 mins before dep.</div>
                                        </div>
                                    </div>
                                </div>

                                {/* Right Ticket Stub (Cutoff edge) */}
                                <div className="p-6 md:p-8 bg-slate-50 md:w-48 border-t md:border-t-0 md:border-l border-dashed border-slate-300 flex flex-col justify-between items-center text-slate-800">
                                    <div className="w-24 h-24 bg-white border border-slate-200 p-2 rounded-lg flex items-center justify-center shadow-inner">
                                        {/* Simulated QR Code */}
                                        <div className="grid grid-cols-5 gap-0.5 w-full h-full bg-slate-900 p-1 rounded">
                                            {Array.from({ length: 25 }).map((_, i) => (
                                                <div key={i} className={`rounded-sm ${(i % 3 === 0 || i % 7 === 1) ? 'bg-white' : 'bg-slate-900'}`}></div>
                                            ))}
                                        </div>
                                    </div>
                                    
                                    <div className="text-center mt-4">
                                        <div className="text-[9px] text-slate-400 uppercase font-semibold tracking-wider">Pass Lock</div>
                                        <div className="text-[10px] font-mono font-bold text-slate-600 truncate max-w-[120px]">
                                            SEC-SHA-{selectedSeat}
                                        </div>
                                    </div>

                                    <button 
                                        onClick={() => {
                                            setBookingStep('search');
                                            setSelectedFlight(null);
                                            setSelectedSeat(null);
                                        }}
                                        className="w-full bg-slate-800 hover:bg-slate-950 text-white text-xs font-semibold py-2 rounded-lg transition-colors shadow-sm mt-4"
                                    >
                                        Book Another
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* TAB B: PRIVACY & GDPR DASHBOARD */}
            {activeTab === 'gdpr' && (
                <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
                    <div className="text-center">
                        <div className="inline-flex items-center space-x-2 bg-blue-50 text-blue-700 text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-full mb-4">
                            <Shield className="w-3.5 h-3.5" />
                            <span>GDPR Compliance Center</span>
                        </div>
                        <h2 className="text-3xl font-extrabold text-slate-950 tracking-tight">Compliance & Data Portability</h2>
                        <p className="text-slate-500 mt-1 max-w-lg mx-auto">Review your secure account attributes, download portability logs under Article 20, or request erasure under Article 17.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {/* User profile attributes card */}
                        <div className="md:col-span-1 glass-panel p-6 rounded-xl border border-slate-200 bg-white">
                            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Active Profile</h3>
                            <div className="space-y-4">
                                <div>
                                    <span className="text-xs text-slate-400 font-medium block">Account Email</span>
                                    <span className="text-sm font-semibold text-slate-800">{user?.email}</span>
                                </div>
                                <div>
                                    <span className="text-xs text-slate-400 font-medium block">Access Token Role</span>
                                    <span className="text-xs font-bold uppercase tracking-wider bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full inline-block mt-1">
                                        {user?.role}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-xs text-slate-400 font-medium block">Distributed User ID</span>
                                    <span className="text-xs font-mono bg-slate-50 border border-slate-100 p-2 rounded text-slate-600 block mt-1 break-all select-all">
                                        {user?.id}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* GDPR Actions */}
                        <div className="md:col-span-2 space-y-6">
                            {/* Article 20 Portability card */}
                            <div className="glass-panel p-6 rounded-xl border border-slate-200 bg-white flex justify-between items-start space-x-6">
                                <div className="space-y-2 flex-1">
                                    <h4 className="text-base font-bold text-slate-850 flex items-center">
                                        <FileDown className="w-5 h-5 mr-2 text-slate-800" />
                                        GDPR Article 20: Data Portability
                                    </h4>
                                    <p className="text-slate-500 text-xs leading-relaxed">
                                        Export your entire passenger record, seat reservations, DynamoDB baggage logs, and system transaction history in a structured, standard JSON transfer format.
                                    </p>
                                </div>
                                <button 
                                    onClick={handleGdprExport} 
                                    disabled={gdprLoading} 
                                    className="bg-slate-900 hover:bg-slate-950 text-white font-bold text-xs px-4 py-2.5 rounded-lg flex items-center space-x-1.5 transition-colors disabled:opacity-50"
                                >
                                    {gdprLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileDown className="w-3.5 h-3.5" />}
                                    <span>Export JSON</span>
                                </button>
                            </div>

                            {/* Article 17 Erasure card */}
                            <div className="glass-panel p-6 rounded-xl border border-red-200 bg-red-50/20 flex flex-col space-y-4">
                                <div className="flex justify-between items-start space-x-6">
                                    <div className="space-y-2 flex-1">
                                        <h4 className="text-base font-bold text-red-950 flex items-center">
                                            <Trash2 className="w-5 h-5 mr-2 text-red-600" />
                                            GDPR Article 17: Right to Erasure
                                        </h4>
                                        <p className="text-red-900/60 text-xs leading-relaxed">
                                            Permanently wipe your personal identifiable data (email, name, passport) from the PostgreSQL database in Ireland. This anonymizes your transaction records and deletes your account.
                                        </p>
                                    </div>
                                    {!deleteConfirm && (
                                        <button 
                                            onClick={() => setDeleteConfirm(true)} 
                                            className="bg-red-600 hover:bg-red-750 text-white font-bold text-xs px-4 py-2.5 rounded-lg flex items-center space-x-1.5 transition-colors"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                            <span>Wipe Account</span>
                                        </button>
                                    )}
                                </div>

                                {deleteConfirm && (
                                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 space-y-3 animate-slide-up">
                                        <p className="text-red-900 text-xs font-bold">⚠️ Warning: Wiping your profile is immediate, irreversible, and deletes all credentials. Do you wish to proceed?</p>
                                        <div className="flex space-x-3 text-xs">
                                            <button 
                                                onClick={handleGdprErasure} 
                                                disabled={gdprLoading} 
                                                className="bg-red-600 hover:bg-red-750 text-white font-bold px-3 py-1.5 rounded"
                                            >
                                                {gdprLoading ? "Wiping EKS..." : "Yes, Delete Permanently"}
                                            </button>
                                            <button 
                                                onClick={() => setDeleteConfirm(false)} 
                                                className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold px-3 py-1.5 rounded"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
