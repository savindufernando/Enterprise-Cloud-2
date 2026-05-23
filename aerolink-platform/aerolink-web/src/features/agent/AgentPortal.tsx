import { useState } from 'react';
import { UserCheck, Luggage, QrCode, Search, AlertCircle, CheckCircle2, Shield, Loader2 } from 'lucide-react';

export default function AgentPortal() {
    const [bookingId, setBookingId] = useState('');
    const [status, setStatus] = useState<'idle' | 'loading' | 'found' | 'not_found' | 'error'>('idle');
    const [bookingDetails, setBookingDetails] = useState<any | null>(null);

    // Baggage registration states
    const [weight, setWeight] = useState('20.0');
    const [baggageLoading, setBaggageLoading] = useState(false);
    const [baggageDetails, setBaggageDetails] = useState<any | null>(null);

    // Baggage status update states
    const [baggageId, setBaggageId] = useState('');
    const [updateStatus, setUpdateStatus] = useState('Checked');
    const [updateLocation, setUpdateLocation] = useState('Counter');
    const [updateLoading, setUpdateLoading] = useState(false);
    const [updateSuccess, setUpdateSuccess] = useState(false);

    // 1. Validate Booking Reference
    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!bookingId) return;
        setStatus('loading');
        setBookingDetails(null);
        setBaggageDetails(null);
        
        try {
            const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';
            const token = localStorage.getItem('aerolink_token');
            // Try fetching by reference ID or UUID
            const isUuid = bookingId.length === 36;
            const endpoint = isUuid 
                ? `${API_BASE}/api/v1/bookings/${bookingId}` 
                : `${API_BASE}/api/v1/bookings/reference/${bookingId}`;
                
            const res = await fetch(endpoint, {
                headers: { 
                    'Authorization': token ? `Bearer ${token}` : '',
                    'Content-Type': 'application/json'
                }
            });
            if (res.ok) {
                const data = await res.json();
                setBookingDetails(data);
                setStatus('found');
            } else {
                setStatus('not_found');
            }
        } catch (err) {
            console.error(err);
            setStatus('error');
        }
    };

    // 2. Register Baggage Drop (Post to DynamoDB)
    const handleBaggageDrop = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!bookingDetails || !weight) return;
        setBaggageLoading(true);
        setBaggageDetails(null);

        try {
            const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';
            const token = localStorage.getItem('aerolink_token');
            const res = await fetch(`${API_BASE}/api/v1/baggage/`, {
                method: 'POST',
                headers: {
                    'Authorization': token ? `Bearer ${token}` : '',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    passenger_id: bookingDetails.passenger_id || 'demo-passenger',
                    flight_id: bookingDetails.flight_id || 'demo-flight',
                    weight_kg: parseFloat(weight)
                })
            });

            if (res.ok) {
                const data = await res.json();
                setBaggageDetails(data);
            } else {
                alert("Failed to register baggage drop in DynamoDB.");
            }
        } catch (err) {
            console.error(err);
            alert("Error connecting to baggage service.");
        } finally {
            setBaggageLoading(false);
        }
    };

    // 3. Update Baggage Location & Status (PUT Status + Kafka stream)
    const handleUpdateStatus = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!baggageId) return;
        setUpdateLoading(true);
        setUpdateSuccess(false);

        try {
            const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';
            const token = localStorage.getItem('aerolink_token');
            const res = await fetch(`${API_BASE}/api/v1/baggage/${baggageId}/status`, {
                method: 'PUT',
                headers: {
                    'Authorization': token ? `Bearer ${token}` : '',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    status: updateStatus,
                    location: updateLocation
                })
            });

            if (res.ok) {
                setUpdateSuccess(true);
                // Clear after 3 seconds
                setTimeout(() => setUpdateSuccess(false), 3000);
            } else {
                alert("Failed to update baggage status in DynamoDB.");
            }
        } catch (err) {
            console.error(err);
            alert("Error sending update to EKS Baggage Service.");
        } finally {
            setUpdateLoading(false);
        }
    };

    return (
        <div className="max-w-6xl mx-auto animate-fade-in space-y-8 pb-16">
            <div className="text-center mb-12">
                <div className="inline-flex items-center space-x-2 bg-slate-900 text-white text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-full mb-4">
                    <Shield className="w-3.5 h-3.5" />
                    <span>Ground Staff Gate terminal</span>
                </div>
                <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-2">Gate Control Terminal</h1>
                <p className="text-slate-500 max-w-lg mx-auto">Validate passenger ticket manifests and coordinate high-frequency baggage scanning drops to AWS DynamoDB.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left Side: Ticket Validation & Drop */}
                <div className="lg:col-span-7 space-y-8">
                    {/* Check In Action */}
                    <div className="glass-panel p-6 sm:p-8 rounded-xl border border-slate-200 bg-white shadow-sm">
                        <div className="flex items-center space-x-3 mb-6">
                            <div className="w-10 h-10 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-center">
                                <UserCheck className="w-5 h-5 text-slate-800" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-slate-800">Check-in Manifest</h2>
                                <p className="text-xs text-slate-400">Validate passenger tickets in real time.</p>
                            </div>
                        </div>
                        
                        <form onSubmit={handleSearch} className="flex gap-4">
                            <div className="relative flex-1">
                                <Search className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
                                <input 
                                    type="text" 
                                    placeholder="Enter Booking ID or Reference..." 
                                    value={bookingId}
                                    onChange={(e) => setBookingId(e.target.value)}
                                    className="w-full pl-12 pr-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-950 font-mono text-slate-900 bg-white"
                                />
                            </div>
                            <button type="submit" disabled={status === 'loading'} className="bg-slate-900 hover:bg-slate-950 text-white font-bold px-6 rounded-lg transition-colors flex items-center space-x-2">
                                {status === 'loading' && <Loader2 className="w-4 h-4 animate-spin" />}
                                <span>Validate</span>
                            </button>
                        </form>

                        {status === 'not_found' && (
                            <div className="mt-4 flex items-center text-red-600 bg-red-50 px-4 py-2.5 rounded-lg">
                                <AlertCircle className="w-4 h-4 mr-2" />
                                <span className="text-sm font-semibold">Ticket reference not found in distributed cluster.</span>
                            </div>
                        )}

                        {status === 'error' && (
                            <div className="mt-4 flex items-center text-red-600 bg-red-50 px-4 py-2.5 rounded-lg">
                                <AlertCircle className="w-4 h-4 mr-2" />
                                <span className="text-sm font-semibold">Error connecting to the Booking service.</span>
                            </div>
                        )}

                        {status === 'found' && bookingDetails && (
                            <div className="mt-6 border border-slate-200 bg-slate-50/50 rounded-xl p-5 space-y-4 animate-slide-up">
                                <div className="flex justify-between items-center border-b border-slate-200 pb-3">
                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest font-mono">Verified Passenger Itinerary</span>
                                    <span className={`text-xs px-2.5 py-1 rounded-full font-bold uppercase ${bookingDetails.booking_status === 'CONFIRMED' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                                        {bookingDetails.booking_status}
                                    </span>
                                </div>
                                <div className="grid grid-cols-2 gap-4 text-sm font-medium">
                                    <div>
                                        <span className="text-slate-400 text-xs block">Booking Reference</span>
                                        <span className="text-slate-900 font-mono">{bookingDetails.booking_reference || bookingDetails.id}</span>
                                    </div>
                                    <div>
                                        <span className="text-slate-400 text-xs block">Seat Number</span>
                                        <span className="text-slate-900 font-bold font-mono text-lg">{bookingDetails.seat_number}</span>
                                    </div>
                                    <div>
                                        <span className="text-slate-400 text-xs block">Passenger ID</span>
                                        <span className="text-slate-700 font-mono text-xs truncate block max-w-[200px]">{bookingDetails.passenger_id}</span>
                                    </div>
                                    <div>
                                        <span className="text-slate-400 text-xs block">Flight ID</span>
                                        <span className="text-slate-700 font-mono text-xs truncate block max-w-[200px]">{bookingDetails.flight_id}</span>
                                    </div>
                                </div>

                                {/* Baggage Drop Dropdown Form within Verification */}
                                <div className="border-t border-slate-200 pt-4 mt-2">
                                    <h4 className="text-sm font-bold text-slate-800 mb-3 flex items-center">
                                        <Luggage className="w-4 h-4 mr-1.5" />
                                        Fast Baggage Drop
                                    </h4>
                                    <form onSubmit={handleBaggageDrop} className="flex gap-4">
                                        <div className="flex-1">
                                            <input 
                                                type="number" 
                                                step="0.1" 
                                                placeholder="Weight in kg (e.g. 20.0)"
                                                value={weight}
                                                onChange={e => setWeight(e.target.value)}
                                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-950 text-sm bg-white"
                                            />
                                        </div>
                                        <button type="submit" disabled={baggageLoading} className="bg-slate-900 hover:bg-slate-950 text-white text-xs font-bold px-4 py-2 rounded-lg flex items-center space-x-1.5 transition-colors">
                                            {baggageLoading && <Loader2 className="w-3 h-3 animate-spin" />}
                                            <span>Register Bag</span>
                                        </button>
                                    </form>

                                    {baggageDetails && (
                                        <div className="mt-4 border border-green-200 bg-green-50/50 rounded-lg p-3 text-xs font-medium space-y-2 animate-slide-up text-slate-700">
                                            <div className="flex items-center text-green-700 font-bold">
                                                <CheckCircle2 className="w-4 h-4 mr-1" />
                                                Baggage Registered in DynamoDB!
                                            </div>
                                            <div><span className="text-slate-400">Baggage ID:</span> <span className="font-mono text-slate-900 font-bold bg-white px-1.5 py-0.5 rounded border border-slate-200">{baggageDetails.id}</span></div>
                                            <div><span className="text-slate-400">Weight:</span> <span className="text-slate-900">{baggageDetails.weight_kg} kg</span></div>
                                            <div><span className="text-slate-400">Initial Status:</span> <span className="uppercase text-slate-900 font-bold font-mono">{baggageDetails.status}</span></div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Side: Baggage In-transit updates (PUT status + WebSocket test) */}
                <div className="lg:col-span-5">
                    <div className="glass-panel p-6 sm:p-8 rounded-xl border border-slate-200 bg-white shadow-sm h-full">
                        <div className="flex items-center space-x-3 mb-6">
                            <div className="w-10 h-10 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-center">
                                <QrCode className="w-5 h-5 text-slate-800" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-slate-800">Scan & Track Terminal</h2>
                                <p className="text-xs text-slate-400">Broadcast updates to Kafka Event Firehose.</p>
                            </div>
                        </div>

                        <form onSubmit={handleUpdateStatus} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Baggage Reference ID</label>
                                <input 
                                    type="text" 
                                    required
                                    placeholder="Enter Baggage ID..." 
                                    value={baggageId}
                                    onChange={(e) => setBaggageId(e.target.value)}
                                    className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-950 font-mono text-sm bg-white"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Scanning Location</label>
                                    <select 
                                        value={updateLocation} 
                                        onChange={e => setUpdateLocation(e.target.value)}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-slate-950 text-sm"
                                    >
                                        <option value="Counter">Counter Desk</option>
                                        <option value="Security">Security screening</option>
                                        <option value="Cargo">Cargo loading Bay</option>
                                        <option value="Carousel">Carousel Arrival</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Updated Status</label>
                                    <select 
                                        value={updateStatus} 
                                        onChange={e => setUpdateStatus(e.target.value)}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-slate-950 text-sm"
                                    >
                                        <option value="Checked">Checked</option>
                                        <option value="In Transit">In Transit</option>
                                        <option value="Loaded">Loaded</option>
                                        <option value="Arrived">Arrived</option>
                                    </select>
                                </div>
                            </div>

                            <button type="submit" disabled={updateLoading || !baggageId} className="w-full mt-4 bg-slate-900 hover:bg-slate-950 text-white font-bold py-3 rounded-lg flex items-center justify-center space-x-2 transition-colors">
                                {updateLoading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        <span>Broadcasting to Kafka...</span>
                                    </>
                                ) : (
                                    <>
                                        <QrCode className="w-4 h-4" />
                                        <span>Update Scan Status</span>
                                    </>
                                )}
                            </button>
                        </form>

                        {updateSuccess && (
                            <div className="mt-4 flex items-center text-green-700 bg-green-50 px-4 py-3 rounded-lg font-medium text-xs animate-slide-up">
                                <CheckCircle2 className="w-4 h-4 mr-2" />
                                <span>Event published to Kafka! Look at Mission Control Events Firehose.</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
