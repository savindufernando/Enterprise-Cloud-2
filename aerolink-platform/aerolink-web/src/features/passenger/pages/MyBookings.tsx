import { useState, useEffect } from 'react';
import {
  Plane, CalendarDays, Armchair, BadgeCheck, Inbox, Ticket, X,
  LogIn, XCircle, Luggage, MapPin, CheckCircle2, Clock, AlertCircle,
  UtensilsCrossed, ShieldCheck, AlertTriangle
} from 'lucide-react';
import BoardingPass from './BoardingPass';

export interface Booking {
  id: string;
  flight_number: string;
  origin_airport: string;
  destination_airport: string;
  departure_time: string;
  base_price: number;
  seat: string;
  passenger_name: string;
  passport_number: string;
  booked_at: string;
  user_email?: string;
  status?: 'confirmed' | 'checked_in' | 'cancelled';
  gate?: string;
  has_baggage?: boolean;
  baggage_weight?: number;
  has_insurance?: boolean;
  meal_preference?: string;
  trip_type?: 'one-way' | 'round-trip';
  return_date?: string;
  amount_paid?: number;
}

export interface FlightDelay {
  flight_number: string;
  reason: string;
  delay_minutes: number;
  marked_at: string;
}

const DELAYS_KEY = 'aerolink_flight_delays';

export function getFlightDelays(): FlightDelay[] {
  try { return JSON.parse(localStorage.getItem(DELAYS_KEY) || '[]'); } catch { return []; }
}

const MEAL_LABELS: Record<string, string> = {
  standard: 'Standard Meal', vegetarian: 'Vegetarian', vegan: 'Vegan',
  halal: 'Halal', kosher: 'Kosher', 'gluten-free': 'Gluten-Free',
  child: 'Child Meal', diabetic: 'Diabetic',
};

const getUserKey = (userId: string) => `aerolink_bookings_${userId}`;
const ALL_BOOKINGS_KEY = 'aerolink_all_bookings';

export function saveBooking(booking: Omit<Booking, 'id' | 'booked_at'>, userId: string) {
  const newBooking: Booking = {
    ...booking,
    id: `BK-${Date.now()}`,
    booked_at: new Date().toISOString(),
    status: 'confirmed',
  };
  const userBookings = getBookings(userId);
  localStorage.setItem(getUserKey(userId), JSON.stringify([newBooking, ...userBookings]));
  try {
    const allBookings = getAllBookings();
    localStorage.setItem(ALL_BOOKINGS_KEY, JSON.stringify([{ ...newBooking, user_email: userId }, ...allBookings]));
  } catch {}
  return newBooking;
}

export function updateBooking(id: string, userId: string, updates: Partial<Booking>) {
  const bookings = getBookings(userId);
  const idx = bookings.findIndex(b => b.id === id);
  if (idx >= 0) {
    bookings[idx] = { ...bookings[idx], ...updates };
    localStorage.setItem(getUserKey(userId), JSON.stringify(bookings));
  }
  try {
    const all = getAllBookings();
    const allIdx = all.findIndex(b => b.id === id);
    if (allIdx >= 0) {
      all[allIdx] = { ...all[allIdx], ...updates };
      localStorage.setItem(ALL_BOOKINGS_KEY, JSON.stringify(all));
    }
  } catch {}
}

export function getBookings(userId: string): Booking[] {
  try {
    return JSON.parse(localStorage.getItem(getUserKey(userId)) || '[]');
  } catch { return []; }
}

export function getAllBookings(): Booking[] {
  try {
    return JSON.parse(localStorage.getItem(ALL_BOOKINGS_KEY) || '[]');
  } catch { return []; }
}

// Departure countdown helper
function getCountdown(departure: string): string {
  const diff = new Date(departure).getTime() - Date.now();
  if (diff <= 0) {
    const ago = Math.abs(diff);
    const h = Math.floor(ago / 3600000);
    if (h < 24) return `Departed ${h}h ago`;
    return `Departed ${Math.floor(h / 24)}d ago`;
  }
  const h = Math.floor(diff / 3600000);
  if (h < 1) return 'Departing soon';
  if (h < 24) return `Departs in ${h}h`;
  const d = Math.floor(h / 24);
  const rh = h % 24;
  return rh > 0 ? `Departs in ${d}d ${rh}h` : `Departs in ${d}d`;
}

function isCheckInEligible(departure: string): boolean {
  const diff = new Date(departure).getTime() - Date.now();
  return diff > 0 && diff <= 48 * 60 * 60 * 1000; // 48h window for demo
}

const GATES = ['A12', 'B07', 'C22', 'D04', 'E15', 'F09', 'G31', 'H18'];
function assignGate(flightNumber: string): string {
  const hash = flightNumber.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  return GATES[hash % GATES.length];
}

const BAG_STAGES = ['Checked In', 'Security Screening', 'Cargo Loading', 'On Board'];

interface MyBookingsProps {
  onBookAgain: () => void;
  userId: string;
  userEmail?: string;
}

export default function MyBookings({ onBookAgain, userId, userEmail }: MyBookingsProps) {
  const [bookings, setBookings] = useState<Booking[]>(() => getBookings(userId));
  const [viewingBooking, setViewingBooking] = useState<Booking | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [tick, setTick] = useState(0);
  const [delays, setDelays] = useState<FlightDelay[]>(() => getFlightDelays());

  // Refresh countdown every minute + re-poll delays
  useEffect(() => {
    const t = setInterval(() => {
      setTick(n => n + 1);
      setDelays(getFlightDelays());
    }, 60000);
    return () => clearInterval(t);
  }, []);

  // Listen for storage changes (ops dashboard marks a flight delayed)
  useEffect(() => {
    const onStorage = () => setDelays(getFlightDelays());
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const handleCheckIn = (booking: Booking) => {
    const gate = assignGate(booking.flight_number);
    updateBooking(booking.id, userId, { status: 'checked_in', gate });
    setBookings(getBookings(userId));
    window.dispatchEvent(new CustomEvent('aerolink_new_event', {
      detail: {
        event: 'PASSENGER_CHECK_IN_SUCCESS',
        payload: { booking_id: booking.id, flight: booking.flight_number, gate, passenger: booking.passenger_name, checked_in_at: new Date().toISOString() }
      }
    }));
  };

  const handleCancel = (booking: Booking) => {
    updateBooking(booking.id, userId, { status: 'cancelled' });
    setBookings(getBookings(userId));
    setCancellingId(null);
    window.dispatchEvent(new CustomEvent('aerolink_new_event', {
      detail: {
        event: 'BOOKING_CANCELLED',
        payload: { booking_id: booking.id, flight: booking.flight_number, passenger: booking.passenger_name, cancelled_at: new Date().toISOString() }
      }
    }));
  };

  if (bookings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center animate-fade-in">
        <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-5">
          <Inbox className="w-8 h-8 text-slate-400" />
        </div>
        <h3 className="text-lg font-bold text-slate-700 mb-2">No bookings yet</h3>
        <p className="text-sm text-slate-400 max-w-xs mb-6">Search for a route and reserve your seat to get started.</p>
        <button onClick={onBookAgain} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold px-6 py-2.5 rounded-xl text-sm transition-all cursor-pointer shadow-sm">
          <Plane className="w-4 h-4 rotate-90" />
          Browse Flights
        </button>
      </div>
    );
  }

  return (
    <>
      {/* Boarding Pass Modal */}
      {viewingBooking && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-start justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-2xl mt-8 mb-8">
            <div className="flex justify-end mb-3">
              <button onClick={() => setViewingBooking(null)} className="bg-white/10 hover:bg-white/20 text-white rounded-full p-2 cursor-pointer transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <BoardingPass
              selectedFlight={{ flight_number: viewingBooking.flight_number, origin_airport: viewingBooking.origin_airport, destination_airport: viewingBooking.destination_airport, departure_time: viewingBooking.departure_time, base_price: viewingBooking.base_price }}
              selectedSeat={viewingBooking.seat}
              passengerName={viewingBooking.passenger_name}
              passportNumber={viewingBooking.passport_number}
              userEmail={userEmail}
              gate={viewingBooking.gate}
              mealPreference={viewingBooking.meal_preference}
              onReset={() => setViewingBooking(null)}
            />
          </div>
        </div>
      )}

      <div className="space-y-5 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-extrabold text-slate-800">My Bookings</h2>
            <p className="text-sm text-slate-500 mt-0.5">{bookings.length} booking{bookings.length !== 1 ? 's' : ''} found</p>
          </div>
          <button onClick={onBookAgain} className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-500 font-semibold cursor-pointer">
            <Plane className="w-4 h-4 rotate-90" />
            Book Another
          </button>
        </div>

        {bookings.map(booking => {
          const isBusinessClass = parseInt(booking.seat) <= 2;
          const depDate = new Date(booking.departure_time);
          const isPast = depDate < new Date();
          const isCancelled = booking.status === 'cancelled';
          const isCheckedIn = booking.status === 'checked_in';
          const canCheckIn = !isPast && !isCancelled && !isCheckedIn && isCheckInEligible(booking.departure_time);
          const canCancel = !isPast && !isCancelled && !isCheckedIn;
          const countdown = getCountdown(booking.departure_time);
          const delayInfo = delays.find(d => d.flight_number === booking.flight_number);
          // tick is used to force re-render for countdown
          void tick;

          const bagStageIndex = isCheckedIn ? (isPast ? 3 : Math.min(2, Math.floor((48 * 3600000 - (depDate.getTime() - Date.now())) / (12 * 3600000)))) : -1;

          return (
            <div key={booking.id} className={`bg-white border rounded-2xl overflow-hidden shadow-sm transition-shadow ${isCancelled ? 'border-slate-200 opacity-60' : 'border-slate-200 hover:shadow-md'}`}>
              {/* Top colour bar */}
              <div className={`h-1.5 w-full ${isCancelled ? 'bg-slate-300' : isCheckedIn ? 'bg-gradient-to-r from-emerald-400 to-emerald-600' : isPast ? 'bg-slate-300' : 'bg-gradient-to-r from-blue-500 to-blue-700'}`} />

              <div className="p-5 sm:p-6">
                <div className="flex flex-col sm:flex-row gap-5 justify-between">
                  {/* Left: route + details */}
                  <div className="flex items-start gap-4">
                    <div className="bg-blue-50 border border-blue-100 text-blue-700 font-mono font-bold px-3 py-2 rounded-xl text-sm shrink-0">
                      {booking.flight_number}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-2xl font-extrabold text-slate-900">{booking.origin_airport}</span>
                        <Plane className="w-4 h-4 text-blue-400 rotate-90 shrink-0" />
                        <span className="text-2xl font-extrabold text-slate-900">{booking.destination_airport}</span>
                      </div>
                      <div className="flex flex-wrap gap-3 text-xs text-slate-500 mt-2">
                        <span className="flex items-center gap-1">
                          <CalendarDays className="w-3.5 h-3.5 text-slate-400" />
                          {depDate.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                          {' · '}
                          {depDate.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <span className="flex items-center gap-1">
                          <Armchair className="w-3.5 h-3.5 text-slate-400" />
                          Seat {booking.seat} · {isBusinessClass ? 'Business' : 'Economy'}
                        </span>
                        {booking.has_baggage && (
                          <span className="flex items-center gap-1 text-blue-600">
                            <Luggage className="w-3.5 h-3.5" />
                            {booking.baggage_weight || 23}kg bag
                          </span>
                        )}
                        {booking.has_insurance && (
                          <span className="flex items-center gap-1 text-emerald-700">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            Insured
                          </span>
                        )}
                        {booking.meal_preference && booking.meal_preference !== 'standard' && (
                          <span className="flex items-center gap-1 text-amber-700">
                            <UtensilsCrossed className="w-3.5 h-3.5" />
                            {MEAL_LABELS[booking.meal_preference] ?? booking.meal_preference}
                          </span>
                        )}
                        {booking.gate && (
                          <span className="flex items-center gap-1 text-emerald-700 font-semibold">
                            <MapPin className="w-3.5 h-3.5" />
                            Gate {booking.gate}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-400 mt-1.5">
                        Passenger: <span className="font-semibold text-slate-600">{booking.passenger_name}</span>
                        &nbsp;·&nbsp;Booked {new Date(booking.booked_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </div>
                      {/* Countdown */}
                      {!isCancelled && (
                        <div className={`inline-flex items-center gap-1 mt-2 text-[11px] font-semibold px-2 py-0.5 rounded-full ${isPast ? 'bg-slate-100 text-slate-400' : 'bg-blue-50 text-blue-600'}`}>
                          <Clock className="w-3 h-3" />
                          {countdown}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right: price + status + actions */}
                  <div className="flex sm:flex-col items-start sm:items-end justify-between sm:justify-between gap-3 shrink-0">
                    <div className="text-right">
                      <div className="text-2xl font-extrabold text-slate-900">${booking.amount_paid ?? booking.base_price}</div>
                      <div className="text-[10px] text-slate-400 uppercase tracking-wide mt-0.5">Total paid</div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      {/* Status badge */}
                      <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${
                        isCancelled ? 'bg-red-50 text-red-600 border border-red-200' :
                        isCheckedIn ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                        isPast ? 'bg-slate-100 text-slate-500 border border-slate-200' :
                        'bg-blue-50 text-blue-700 border border-blue-200'
                      }`}>
                        {isCancelled ? <XCircle className="w-3.5 h-3.5" /> : <BadgeCheck className="w-3.5 h-3.5" />}
                        {isCancelled ? 'Cancelled' : isCheckedIn ? 'Checked In' : isPast ? 'Completed' : 'Confirmed'}
                      </span>
                      {/* Action buttons */}
                      <div className="flex gap-2">
                        {!isCancelled && (
                          <button onClick={() => setViewingBooking(booking)} className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-500 border border-blue-200 hover:border-blue-300 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-all cursor-pointer">
                            <Ticket className="w-3.5 h-3.5" />
                            View Pass
                          </button>
                        )}
                        {canCheckIn && (
                          <button onClick={() => handleCheckIn(booking)} className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 hover:text-emerald-600 border border-emerald-200 hover:border-emerald-300 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg transition-all cursor-pointer">
                            <LogIn className="w-3.5 h-3.5" />
                            Check In
                          </button>
                        )}
                        {canCancel && cancellingId !== booking.id && (
                          <button onClick={() => setCancellingId(booking.id)} className="flex items-center gap-1.5 text-xs font-semibold text-red-600 hover:text-red-500 border border-red-200 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition-all cursor-pointer">
                            <XCircle className="w-3.5 h-3.5" />
                            Cancel
                          </button>
                        )}
                      </div>
                      {/* Cancel confirmation */}
                      {cancellingId === booking.id && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-xs space-y-2 max-w-[200px]">
                          <p className="text-red-700 font-semibold">Cancel this booking?</p>
                          <div className="flex gap-1.5">
                            <button onClick={() => handleCancel(booking)} className="bg-red-600 hover:bg-red-500 text-white font-bold px-3 py-1 rounded cursor-pointer text-[11px]">Yes, Cancel</button>
                            <button onClick={() => setCancellingId(null)} className="bg-white border border-slate-200 text-slate-600 font-bold px-3 py-1 rounded cursor-pointer text-[11px]">Keep</button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Baggage tracking timeline (only after check-in) */}
                {isCheckedIn && booking.has_baggage && (
                  <div className="mt-5 pt-4 border-t border-slate-100">
                    <div className="flex items-center gap-2 mb-3">
                      <Luggage className="w-4 h-4 text-blue-500" />
                      <span className="text-xs font-bold text-slate-700">Baggage Tracking</span>
                    </div>
                    <div className="flex items-center gap-0">
                      {BAG_STAGES.map((stage, i) => {
                        const done = i <= bagStageIndex;
                        const active = i === bagStageIndex;
                        return (
                          <div key={stage} className="flex items-center flex-1">
                            <div className="flex flex-col items-center gap-1 flex-1">
                              <div className={`w-6 h-6 rounded-full flex items-center justify-center border-2 ${done ? 'bg-emerald-500 border-emerald-500' : active ? 'bg-blue-500 border-blue-500' : 'bg-white border-slate-300'}`}>
                                {done ? <CheckCircle2 className="w-3.5 h-3.5 text-white" /> : <div className="w-2 h-2 rounded-full bg-slate-300" />}
                              </div>
                              <span className={`text-[9px] font-bold text-center leading-tight ${done ? 'text-emerald-700' : 'text-slate-400'}`}>{stage}</span>
                            </div>
                            {i < BAG_STAGES.length - 1 && (
                              <div className={`h-0.5 flex-1 mb-4 ${done && i < bagStageIndex ? 'bg-emerald-400' : 'bg-slate-200'}`} />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Flight delay alert */}
                {delayInfo && !isCancelled && (
                  <div className="mt-4 flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-xs text-red-700 font-semibold animate-fade-in">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
                    <div>
                      <div className="font-bold text-red-700">Flight Delayed — {delayInfo.delay_minutes} minutes</div>
                      <div className="font-normal text-red-600 mt-0.5">{delayInfo.reason}</div>
                    </div>
                  </div>
                )}

                {/* Check-in prompt (within window but not yet checked in) */}
                {canCheckIn && (
                  <div className="mt-4 flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-4 py-2.5 text-xs text-amber-700 font-semibold">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    Check-in is open for this flight. Check in now to receive your gate assignment.
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
