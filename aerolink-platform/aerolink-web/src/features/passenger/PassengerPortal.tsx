import { useState, useEffect } from 'react';
import { RotateCcw, Save, CheckCircle2, Star, TrendingUp } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, useSearchParams } from 'react-router-dom';

import SearchFlights from './pages/SearchFlights';
import SeatSelection from './pages/SeatSelection';
import BaggageAddOn from './pages/BaggageAddOn';
import MealPreference from './pages/MealPreference';
import PaymentStep from './pages/PaymentStep';
import BoardingPass from './pages/BoardingPass';
import GDPRExport from './pages/GDPRExport';
import DeleteAccount from './pages/DeleteAccount';
import MyBookings, { saveBooking, getBookings } from './pages/MyBookings';
import type { Booking } from './pages/MyBookings';
import CheckIn from './pages/CheckIn';

type BookingStep = 'search' | 'seat-selection' | 'baggage' | 'meal' | 'payment' | 'confirmed';

// ── Tier config ──
const TIERS = [
    { name: 'Silver', min: 0, max: 25000, color: 'text-slate-500', bg: 'bg-slate-100', bar: 'bg-slate-400', icon: '🥈' },
    { name: 'Gold', min: 25000, max: 75000, color: 'text-amber-600', bg: 'bg-amber-50', bar: 'bg-amber-400', icon: '🥇' },
    { name: 'Platinum', min: 75000, max: Infinity, color: 'text-blue-600', bg: 'bg-blue-50', bar: 'bg-blue-500', icon: '💎' },
];

function getTier(miles: number) {
    return TIERS.find(t => miles >= t.min && miles < t.max) ?? TIERS[0];
}

export default function PassengerPortal() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const activeTab = (searchParams.get('tab') as 'booking' | 'mybookings' | 'checkin' | 'profile') ?? 'booking';
    const [flights, setFlights] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Booking flow
    const [bookingStep, setBookingStep] = useState<BookingStep>('search');
    const [selectedFlight, setSelectedFlight] = useState<any | null>(null);
    const [selectedSeat, setSelectedSeat] = useState<string | null>(null);
    const [occupiedSeats, setOccupiedSeats] = useState<string[]>([]);
    const [passengerName, setPassengerName] = useState('');
    const [passportNumber, setPassportNumber] = useState('');
    const [hasBaggage, setHasBaggage] = useState(false);
    const [baggageWeight, setBaggageWeight] = useState(23);
    const [hasInsurance, setHasInsurance] = useState(false);
    const [mealPreference, setMealPreference] = useState('standard');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Round-trip state
    const [tripType, setTripType] = useState<'one-way' | 'round-trip'>('one-way');
    const [returnDate, setReturnDate] = useState<string | undefined>(undefined);
    const [showReturnPrompt, setShowReturnPrompt] = useState(false);

    // GDPR states
    const [gdprLoading, setGdprLoading] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState(false);

    // ── Feature 1: Profile edit state ──
    const profileKey = `aerolink_profile_${user?.email}`;
    const [profileFirstName, setProfileFirstName] = useState('');
    const [profileLastName, setProfileLastName] = useState('');
    const [profilePassport, setProfilePassport] = useState('');
    const [profileMeal, setProfileMeal] = useState('standard');
    const [profileSaveSuccess, setProfileSaveSuccess] = useState(false);

    // ── Feature 4: Loyalty miles ──
    const [userBookings, setUserBookings] = useState<Booking[]>([]);

    useEffect(() => {
        const API_BASE = import.meta.env.VITE_API_URL || 'http://api.aerolink.transnova.shop';
        fetch(`${API_BASE}/api/v1/flights/`)
            .then(res => res.json())
            .then(data => { setFlights(data.data || []); setLoading(false); })
            .catch(() => { setLoading(false); });
    }, []);

    // Load saved profile when switching to profile tab
    useEffect(() => {
        if (activeTab === 'profile') {
            try {
                const saved = JSON.parse(localStorage.getItem(profileKey) || '{}');
                setProfileFirstName(saved.firstName ?? user?.firstName ?? '');
                setProfileLastName(saved.lastName ?? user?.lastName ?? '');
                setProfilePassport(saved.passportNumber ?? '');
                setProfileMeal(saved.mealPreference ?? 'standard');
            } catch {
                setProfileFirstName(user?.firstName ?? '');
                setProfileLastName(user?.lastName ?? '');
            }
            // Load bookings for miles tracker
            if (user?.email) {
                setUserBookings(getBookings(user.email));
            }
        }
    }, [activeTab, user?.email]); // eslint-disable-line react-hooks/exhaustive-deps

    const handleProfileSave = (e: React.FormEvent) => {
        e.preventDefault();
        localStorage.setItem(profileKey, JSON.stringify({
            firstName: profileFirstName,
            lastName: profileLastName,
            passportNumber: profilePassport,
            mealPreference: profileMeal,
        }));
        setProfileSaveSuccess(true);
        setTimeout(() => setProfileSaveSuccess(false), 3500);
    };

    const handleInitiateBooking = (flight: any, type: 'one-way' | 'round-trip', retDate?: string) => {
        setSelectedFlight(flight);
        setSelectedSeat(null);
        setPassengerName(user?.firstName || user?.lastName ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : '');
        setPassportNumber('');
        setHasBaggage(false);
        setBaggageWeight(23);
        setHasInsurance(false);
        setMealPreference('standard');
        setTripType(type);
        setReturnDate(retDate);
        setShowReturnPrompt(false);

        const allPossibleSeats: string[] = [];
        const cols = ['A', 'B', 'C', 'D', 'E', 'F'];
        for (let r = 1; r <= 10; r++) for (const c of cols) allPossibleSeats.push(`${r}${c}`);
        const hash = flight.flight_number.split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
        setOccupiedSeats(allPossibleSeats.filter((_, idx) => (hash + idx) % 4 === 0 || (hash * idx) % 7 === 1));
        setBookingStep('seat-selection');
    };

    const handleSeatConfirm = (e: React.FormEvent) => {
        e.preventDefault();
        if (!passengerName || !passportNumber || !selectedSeat) return;
        setIsSubmitting(true);
        setTimeout(() => { setIsSubmitting(false); setBookingStep('baggage'); }, 600);
    };

    const handlePaymentConfirm = () => {
        const isBusinessClass = selectedSeat ? parseInt(selectedSeat) <= 2 : false;
        const seatPrice = isBusinessClass ? selectedFlight.base_price + 50 : selectedFlight.base_price;
        const amountPaid = seatPrice + (hasBaggage ? 30 : 0) + (hasInsurance ? 15 : 0);

        saveBooking({
            flight_number: selectedFlight.flight_number,
            origin_airport: selectedFlight.origin_airport,
            destination_airport: selectedFlight.destination_airport,
            departure_time: selectedFlight.departure_time,
            base_price: selectedFlight.base_price,
            seat: selectedSeat!,
            passenger_name: passengerName,
            passport_number: passportNumber,
            has_baggage: hasBaggage,
            baggage_weight: hasBaggage ? baggageWeight : undefined,
            has_insurance: hasInsurance,
            meal_preference: mealPreference,
            amount_paid: amountPaid,
            trip_type: tripType,
            return_date: returnDate,
        }, user?.email || 'guest');

        window.dispatchEvent(new CustomEvent('aerolink_new_event', {
            detail: {
                event: 'SEAT_LOCK_SUCCESS',
                payload: { flight_number: selectedFlight.flight_number, seat_number: selectedSeat, passenger_name: passengerName, status: 'LOCKED', locked_at: new Date().toISOString() }
            }
        }));

        if (tripType === 'round-trip') setShowReturnPrompt(true);
        setBookingStep('confirmed');
    };

    const handleGdprExport = async () => {
        setGdprLoading(true);
        try {
            const API_BASE = import.meta.env.VITE_API_URL || 'http://api.aerolink.transnova.shop';
            const token = localStorage.getItem('aerolink_token');
            const res = await fetch(`${API_BASE}/api/v1/passengers/me/export`, {
                headers: { 'Authorization': token ? `Bearer ${token}` : '', 'Content-Type': 'application/json' }
            });
            const data = res.ok ? await res.json() : {
                gdpr_compliance: "Article 20 Data Portability Export",
                exported_at: new Date().toISOString(),
                identity: { user_id: user?.id, email: user?.email, role: user?.role },
                booking_history: [{ booking_id: "bk_99823", flight_number: "AL-102", seat: "4F", status: "CONFIRMED", amount_paid_usd: 350 }],
                telemetry_logs: [{ ip_address: "192.168.1.104", action: "GATEWAY_AUTH_SUCCESS", location: "Web Interface" }]
            };
            const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(data, null, 2))}`;
            const a = document.createElement('a');
            a.setAttribute('href', jsonString);
            a.setAttribute('download', `aerolink_gdpr_export_${user?.email?.split('@')[0]}${res.ok ? '' : '_MOCK'}.json`);
            document.body.appendChild(a);
            a.click();
            a.remove();
        } catch (err) {
            console.error(err);
        } finally {
            setGdprLoading(false);
        }
    };

    const handleGdprErasure = async () => {
        setGdprLoading(true);
        try {
            const API_BASE = import.meta.env.VITE_API_URL || 'http://api.aerolink.transnova.shop';
            const token = localStorage.getItem('aerolink_token');
            await fetch(`${API_BASE}/api/v1/passengers/me`, { method: 'DELETE', headers: { 'Authorization': token ? `Bearer ${token}` : '' } });
        } catch {}
        logout();
        setGdprLoading(false);
        setDeleteConfirm(false);
    };

    // ── Loyalty miles calculation ──
    const totalMiles = userBookings
        .filter(b => b.status !== 'cancelled')
        .reduce((sum, b) => sum + (b.amount_paid ?? b.base_price ?? 0), 0);
    const currentTier = getTier(totalMiles);
    const nextTier = TIERS.find(t => t.min > currentTier.min);
    const progressPct = nextTier
        ? Math.min(((totalMiles - currentTier.min) / (nextTier.min - currentTier.min)) * 100, 100)
        : 100;
    const recentMileBookings = [...userBookings]
        .filter(b => b.status !== 'cancelled')
        .sort((a, b) => new Date(b.booked_at).getTime() - new Date(a.booked_at).getTime())
        .slice(0, 3);

    return (
        <div className="space-y-8 animate-fade-in pb-16">

            {/* ── TAB A: BOOKING ── */}
            {activeTab === 'booking' && (
                <>
                    {bookingStep === 'search' && (
                        <div className="rounded-2xl border border-blue-100 bg-gradient-to-r from-blue-600 to-blue-500 px-8 py-8 mb-8 flex flex-col sm:flex-row justify-between items-center gap-4 dark:from-blue-800 dark:to-blue-700">
                            <div>
                                <h1 className="text-2xl font-extrabold text-white">Welcome back{user?.firstName ? `, ${user.firstName}` : ''}!</h1>
                                <p className="text-blue-100 text-sm mt-1">Where would you like to fly today?</p>
                            </div>
                            <div className="text-right text-blue-100 text-sm">
                                <div className="font-semibold">{user?.email}</div>
                                <div className="text-blue-200 text-xs mt-0.5 capitalize">Passenger account</div>
                            </div>
                        </div>
                    )}

                    {bookingStep === 'search' && (
                        <SearchFlights flights={flights} loading={loading} onSelectFlight={handleInitiateBooking} />
                    )}

                    {bookingStep === 'seat-selection' && selectedFlight && (
                        <SeatSelection
                            selectedFlight={selectedFlight}
                            selectedSeat={selectedSeat}
                            occupiedSeats={occupiedSeats}
                            passengerName={passengerName}
                            passportNumber={passportNumber}
                            isSubmitting={isSubmitting}
                            onSelectSeat={setSelectedSeat}
                            onPassengerNameChange={setPassengerName}
                            onPassportNumberChange={setPassportNumber}
                            onSubmit={handleSeatConfirm}
                            onBack={() => setBookingStep('search')}
                        />
                    )}

                    {bookingStep === 'baggage' && selectedFlight && (
                        <BaggageAddOn
                            selectedFlight={selectedFlight}
                            selectedSeat={selectedSeat}
                            hasBaggage={hasBaggage}
                            baggageWeight={baggageWeight}
                            hasInsurance={hasInsurance}
                            onToggleBaggage={setHasBaggage}
                            onWeightChange={setBaggageWeight}
                            onToggleInsurance={setHasInsurance}
                            onNext={() => setBookingStep('meal')}
                            onBack={() => setBookingStep('seat-selection')}
                        />
                    )}

                    {bookingStep === 'meal' && selectedFlight && (
                        <MealPreference
                            selectedFlight={selectedFlight}
                            selectedSeat={selectedSeat}
                            hasBaggage={hasBaggage}
                            hasInsurance={hasInsurance}
                            baggageWeight={baggageWeight}
                            mealPreference={mealPreference}
                            onMealChange={setMealPreference}
                            onNext={() => setBookingStep('payment')}
                            onBack={() => setBookingStep('baggage')}
                        />
                    )}

                    {bookingStep === 'payment' && selectedFlight && (
                        <PaymentStep
                            selectedFlight={selectedFlight}
                            selectedSeat={selectedSeat}
                            hasBaggage={hasBaggage}
                            baggageWeight={baggageWeight}
                            hasInsurance={hasInsurance}
                            passengerName={passengerName}
                            onConfirm={handlePaymentConfirm}
                            onBack={() => setBookingStep('meal')}
                        />
                    )}

                    {bookingStep === 'confirmed' && selectedFlight && (
                        <>
                            {/* Round-trip return prompt */}
                            {showReturnPrompt && (
                                <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 flex items-start gap-4 mb-4 animate-fade-in">
                                    <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center shrink-0">
                                        <RotateCcw className="w-5 h-5 text-blue-600" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-bold text-blue-900 text-sm">Book your return flight</h3>
                                        <p className="text-xs text-blue-700 mt-1">
                                            You selected a round trip{returnDate ? ` — return date: ${new Date(returnDate).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}` : ''}. Search for a return flight from <strong>{selectedFlight.destination_airport}</strong> back to <strong>{selectedFlight.origin_airport}</strong>.
                                        </p>
                                        <button
                                            onClick={() => { setShowReturnPrompt(false); setBookingStep('search'); setSelectedFlight(null); setSelectedSeat(null); }}
                                            className="mt-3 flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold px-4 py-2 rounded-lg text-xs transition-all cursor-pointer"
                                        >
                                            <RotateCcw className="w-3.5 h-3.5" />
                                            Search Return Flight
                                        </button>
                                    </div>
                                    <button onClick={() => setShowReturnPrompt(false)} className="text-blue-400 hover:text-blue-600 cursor-pointer text-xs font-semibold shrink-0">Skip</button>
                                </div>
                            )}
                            <BoardingPass
                                selectedFlight={selectedFlight}
                                selectedSeat={selectedSeat}
                                passengerName={passengerName}
                                passportNumber={passportNumber}
                                userEmail={user?.email}
                                mealPreference={mealPreference}
                                onReset={() => { setBookingStep('search'); setSelectedFlight(null); setSelectedSeat(null); navigate('/passenger?tab=mybookings'); }}
                            />
                        </>
                    )}
                </>
            )}

            {/* ── TAB B: MY BOOKINGS ── */}
            {activeTab === 'mybookings' && (
                <MyBookings onBookAgain={() => navigate('/passenger?tab=booking')} userId={user?.email || 'guest'} userEmail={user?.email} />
            )}

            {/* ── TAB C: CHECK-IN ── */}
            {activeTab === 'checkin' && (
                <CheckIn userId={user?.email || 'guest'} userEmail={user?.email} />
            )}

            {/* ── TAB D: MY PROFILE ── */}
            {activeTab === 'profile' && (
                <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
                    <div>
                        <h2 className="text-2xl font-extrabold text-slate-800 dark:text-slate-100">My Profile</h2>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Manage your account details and preferences.</p>
                    </div>

                    {/* ── Feature 1: Profile Edit Form ── */}
                    <div className="p-6 rounded-xl border border-slate-200 bg-white dark:bg-slate-800 dark:border-slate-700 shadow-sm">
                        <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-5 flex items-center gap-2 border-b border-slate-100 dark:border-slate-700 pb-3">
                            <Save className="w-4 h-4 text-blue-600" />
                            Edit Profile
                        </h3>
                        {profileSaveSuccess && (
                            <div className="mb-4 flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg px-4 py-2.5 text-sm font-semibold animate-fade-in">
                                <CheckCircle2 className="w-4 h-4 shrink-0" />
                                Profile saved successfully!
                            </div>
                        )}
                        <form onSubmit={handleProfileSave} className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">First Name</label>
                                    <input
                                        type="text"
                                        value={profileFirstName}
                                        onChange={e => setProfileFirstName(e.target.value)}
                                        placeholder="First name"
                                        className="w-full px-3 py-2.5 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Last Name</label>
                                    <input
                                        type="text"
                                        value={profileLastName}
                                        onChange={e => setProfileLastName(e.target.value)}
                                        placeholder="Last name"
                                        className="w-full px-3 py-2.5 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Email Address</label>
                                <input
                                    type="email"
                                    value={user?.email ?? ''}
                                    readOnly
                                    className="w-full px-3 py-2.5 border border-slate-200 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-700/50 text-slate-400 dark:text-slate-500 text-sm cursor-not-allowed"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Passport Number</label>
                                <input
                                    type="text"
                                    value={profilePassport}
                                    onChange={e => setProfilePassport(e.target.value)}
                                    placeholder="e.g. N8938171"
                                    className="w-full px-3 py-2.5 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Preferred Meal</label>
                                <select
                                    value={profileMeal}
                                    onChange={e => setProfileMeal(e.target.value)}
                                    className="w-full px-3 py-2.5 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                                >
                                    <option value="standard">Standard</option>
                                    <option value="vegetarian">Vegetarian</option>
                                    <option value="vegan">Vegan</option>
                                    <option value="halal">Halal</option>
                                    <option value="kosher">Kosher</option>
                                </select>
                            </div>
                            <div className="pt-1">
                                <button
                                    type="submit"
                                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold px-5 py-2.5 rounded-lg text-sm transition-colors cursor-pointer shadow-sm"
                                >
                                    <Save className="w-4 h-4" />
                                    Save Changes
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* ── Feature 4: Loyalty Miles Tracker ── */}
                    <div className="p-6 rounded-xl border border-slate-200 bg-white dark:bg-slate-800 dark:border-slate-700 shadow-sm">
                        <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-5 flex items-center gap-2 border-b border-slate-100 dark:border-slate-700 pb-3">
                            <Star className="w-4 h-4 text-amber-500" />
                            My Miles
                        </h3>
                        <div className="flex flex-col sm:flex-row gap-6 items-start">
                            {/* Tier badge */}
                            <div className={`flex flex-col items-center justify-center w-28 h-28 rounded-2xl border-2 ${currentTier.bg} shrink-0`}>
                                <span className="text-3xl">{currentTier.icon}</span>
                                <span className={`text-xs font-extrabold mt-1 ${currentTier.color}`}>{currentTier.name}</span>
                                <span className="text-[10px] text-slate-400 font-mono mt-0.5">MEMBER</span>
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="text-3xl font-extrabold text-slate-800 dark:text-slate-100">
                                    {totalMiles.toLocaleString()} <span className="text-base font-bold text-slate-400">miles</span>
                                </div>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">1 mile earned per $1 spent on flights</p>

                                {/* Progress bar */}
                                {nextTier && (
                                    <div className="mt-4">
                                        <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mb-1.5">
                                            <span className="font-semibold">{currentTier.name} — {totalMiles.toLocaleString()} miles</span>
                                            <span>{nextTier.name} at {nextTier.min.toLocaleString()}</span>
                                        </div>
                                        <div className="h-2.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                            <div
                                                className={`h-2.5 rounded-full transition-all ${currentTier.bar}`}
                                                style={{ width: `${progressPct}%` }}
                                            />
                                        </div>
                                        <p className="text-[11px] text-slate-400 mt-1.5 flex items-center gap-1">
                                            <TrendingUp className="w-3 h-3" />
                                            {(nextTier.min - totalMiles).toLocaleString()} miles to {nextTier.name}
                                        </p>
                                    </div>
                                )}
                                {!nextTier && (
                                    <div className="mt-3 text-xs font-bold text-blue-600">You've reached the highest tier! 🎉</div>
                                )}
                            </div>
                        </div>

                        {/* Recent mile bookings */}
                        {recentMileBookings.length > 0 && (
                            <div className="mt-5 border-t border-slate-100 dark:border-slate-700 pt-4">
                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">Recent Mile-Earning Flights</div>
                                <div className="space-y-2">
                                    {recentMileBookings.map((b: Booking) => (
                                        <div key={b.id} className="flex items-center justify-between bg-slate-50 dark:bg-slate-700/40 rounded-lg px-3 py-2 text-xs">
                                            <span className="font-mono font-bold text-blue-600">{b.flight_number}</span>
                                            <span className="text-slate-600 dark:text-slate-300">{b.origin_airport} → {b.destination_airport}</span>
                                            <span className="font-bold text-emerald-600">+{(b.amount_paid ?? b.base_price ?? 0).toLocaleString()} mi</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        {recentMileBookings.length === 0 && (
                            <p className="text-sm text-slate-400 mt-4 text-center">No flights yet — book your first flight to start earning miles!</p>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="md:col-span-2">
                            <GDPRExport user={user} gdprLoading={gdprLoading} onExport={handleGdprExport} />
                        </div>
                        <div className="md:col-span-1">
                            <DeleteAccount deleteConfirm={deleteConfirm} gdprLoading={gdprLoading} setDeleteConfirm={setDeleteConfirm} onDelete={handleGdprErasure} />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
