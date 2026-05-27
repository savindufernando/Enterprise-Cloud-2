import { useState, useEffect } from 'react';
import {
  Plane, CheckCircle2, Clock, AlertTriangle, Armchair,
  Luggage, UtensilsCrossed, ShieldCheck, QrCode, Inbox,
} from 'lucide-react';
import type { Booking } from './MyBookings';
import { getBookings, updateBooking, getFlightDelays } from './MyBookings';
import BoardingPass from './BoardingPass';

const MEAL_LABELS: Record<string, string> = {
  standard: 'Standard Meal', vegetarian: 'Vegetarian', vegan: 'Vegan',
  halal: 'Halal', kosher: 'Kosher', 'gluten-free': 'Gluten-Free',
  child: 'Child Meal', diabetic: 'Diabetic',
};

const GATES = ['A1','A3','A5','B2','B4','C1','C3','D2','D4','E1'];
function assignGate(flightNumber: string): string {
  const hash = flightNumber.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  return GATES[hash % GATES.length];
}

interface CheckInProps {
  userId: string;
  userEmail?: string;
}

export default function CheckIn({ userId, userEmail }: CheckInProps) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [delays, setDelays] = useState(getFlightDelays());
  const [boardingPass, setBoardingPass] = useState<Booking | null>(null);
  const [checkingIn, setCheckingIn] = useState<string | null>(null);

  useEffect(() => {
    setBookings(getBookings(userId));
  }, [userId]);

  useEffect(() => {
    const sync = () => setDelays(getFlightDelays());
    window.addEventListener('storage', sync);
    return () => window.removeEventListener('storage', sync);
  }, []);

  const upcoming = bookings.filter(b => {
    const dep = new Date(b.departure_time).getTime();
    return dep > Date.now() - 2 * 60 * 60 * 1000 && b.status !== 'cancelled';
  }).sort((a, b) => new Date(a.departure_time).getTime() - new Date(b.departure_time).getTime());

  const handleCheckIn = (booking: Booking) => {
    setCheckingIn(booking.id);
    setTimeout(() => {
      const gate = assignGate(booking.flight_number);
      updateBooking(booking.id, userId, { status: 'checked_in', gate });
      const updated = { ...booking, status: 'checked_in' as const, gate };
      setBookings(prev => prev.map(b => b.id === booking.id ? updated : b));
      setCheckingIn(null);
      setBoardingPass(updated);
    }, 900);
  };

  if (upcoming.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-slate-400 animate-fade-in">
        <Inbox className="w-14 h-14 mb-4 opacity-30" />
        <p className="text-base font-semibold">No upcoming flights</p>
        <p className="text-sm mt-1">Book a flight to get started with online check-in.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-extrabold text-slate-800">Online Check-In</h2>
        <p className="text-sm text-slate-500 mt-1">Check in up to 24 hours before departure and get your boarding pass instantly.</p>
      </div>

      {upcoming.map(booking => {
        const delay = delays.find(d => d.flight_number === booking.flight_number);
        const dep = new Date(booking.departure_time);
        const hoursUntil = (dep.getTime() - Date.now()) / 3600000;
        const isCheckedIn = booking.status === 'checked_in';
        const eligible = hoursUntil <= 24 && hoursUntil > -2;
        const tooEarly = hoursUntil > 24;
        const isBusinessClass = parseInt(booking.seat) <= 2;

        return (
          <div key={booking.id} className={`bg-white border rounded-2xl overflow-hidden shadow-sm transition-all ${isCheckedIn ? 'border-emerald-200' : delay ? 'border-amber-200' : 'border-slate-200 hover:border-blue-200'}`}>
            {/* Status bar */}
            <div className={`h-1.5 w-full ${isCheckedIn ? 'bg-emerald-400' : delay ? 'bg-amber-400' : tooEarly ? 'bg-slate-200' : 'bg-blue-500'}`} />

            <div className="p-6">
              {/* Delay alert */}
              {delay && (
                <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-4 text-sm">
                  <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-amber-800">Flight delayed +{delay.delay_minutes} min</span>
                    <span className="text-amber-700 ml-2">{delay.reason}</span>
                  </div>
                </div>
              )}

              <div className="flex flex-col sm:flex-row justify-between gap-5">
                {/* Flight info */}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="bg-blue-50 text-blue-700 font-mono font-extrabold px-3 py-1.5 rounded-lg text-sm border border-blue-100">{booking.flight_number}</span>
                    {isCheckedIn && (
                      <span className="flex items-center gap-1.5 text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full text-xs font-bold">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Checked In
                      </span>
                    )}
                    {tooEarly && !isCheckedIn && (
                      <span className="flex items-center gap-1.5 text-slate-500 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-full text-xs font-semibold">
                        <Clock className="w-3.5 h-3.5" /> Check-in opens in {Math.floor(hoursUntil - 24)}h
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-4 mb-4">
                    <div className="text-center">
                      <div className="text-2xl font-extrabold text-slate-900">{booking.origin_airport}</div>
                      <div className="text-xs text-slate-400 mt-0.5">Origin</div>
                    </div>
                    <Plane className="w-5 h-5 text-blue-400 rotate-90 shrink-0" />
                    <div className="text-center">
                      <div className="text-2xl font-extrabold text-slate-900">{booking.destination_airport}</div>
                      <div className="text-xs text-slate-400 mt-0.5">Destination</div>
                    </div>
                  </div>

                  <div className="text-sm text-slate-600">
                    <span className="font-semibold">Departs: </span>
                    {dep.toLocaleString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    {delay && <span className="text-amber-600 font-semibold ml-2">(+{delay.delay_minutes}m)</span>}
                  </div>

                  <div className="flex flex-wrap gap-3 mt-3 text-xs">
                    <span className="flex items-center gap-1.5 text-slate-600 bg-slate-50 border border-slate-100 px-2.5 py-1 rounded-full">
                      <Armchair className="w-3.5 h-3.5 text-blue-500" />
                      Seat {booking.seat} — {isBusinessClass ? 'Business' : 'Economy'}
                    </span>
                    {booking.has_baggage && (
                      <span className="flex items-center gap-1.5 text-slate-600 bg-slate-50 border border-slate-100 px-2.5 py-1 rounded-full">
                        <Luggage className="w-3.5 h-3.5 text-indigo-500" /> {booking.baggage_weight ?? 23}kg bag
                      </span>
                    )}
                    {booking.meal_preference && booking.meal_preference !== 'standard' && (
                      <span className="flex items-center gap-1.5 text-slate-600 bg-slate-50 border border-slate-100 px-2.5 py-1 rounded-full">
                        <UtensilsCrossed className="w-3.5 h-3.5 text-amber-500" /> {MEAL_LABELS[booking.meal_preference] ?? booking.meal_preference}
                      </span>
                    )}
                    {booking.has_insurance && (
                      <span className="flex items-center gap-1.5 text-emerald-700 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-full">
                        <ShieldCheck className="w-3.5 h-3.5" /> Insured
                      </span>
                    )}
                    {isCheckedIn && booking.gate && (
                      <span className="flex items-center gap-1.5 text-blue-700 bg-blue-50 border border-blue-100 px-2.5 py-1 rounded-full font-semibold">
                        Gate {booking.gate}
                      </span>
                    )}
                  </div>
                </div>

                {/* Action */}
                <div className="flex flex-col items-center justify-center gap-3 shrink-0 min-w-[140px]">
                  {isCheckedIn ? (
                    <>
                      <div className="w-16 h-16 bg-emerald-50 border-2 border-emerald-200 rounded-2xl flex items-center justify-center">
                        <QrCode className="w-8 h-8 text-emerald-600" />
                      </div>
                      <button
                        onClick={() => setBoardingPass(booking)}
                        className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2.5 rounded-xl text-sm transition-all cursor-pointer"
                      >
                        View Boarding Pass
                      </button>
                    </>
                  ) : eligible ? (
                    <button
                      onClick={() => handleCheckIn(booking)}
                      disabled={checkingIn === booking.id}
                      className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white font-bold px-4 py-3 rounded-xl text-sm transition-all cursor-pointer flex items-center justify-center gap-2"
                    >
                      {checkingIn === booking.id ? (
                        <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Checking in...</>
                      ) : (
                        <><CheckCircle2 className="w-4 h-4" /> Check In Now</>
                      )}
                    </button>
                  ) : (
                    <div className="text-center text-xs text-slate-400 px-2">
                      <Clock className="w-8 h-8 mx-auto mb-2 opacity-30" />
                      Check-in opens<br />24h before departure
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}

      {/* Boarding pass modal */}
      {boardingPass && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto" onClick={e => { if (e.target === e.currentTarget) setBoardingPass(null); }}>
          <div className="w-full max-w-2xl">
            <BoardingPass
              selectedFlight={{
                flight_number: boardingPass.flight_number,
                origin_airport: boardingPass.origin_airport,
                destination_airport: boardingPass.destination_airport,
                departure_time: boardingPass.departure_time,
                base_price: boardingPass.base_price,
              }}
              selectedSeat={boardingPass.seat}
              passengerName={boardingPass.passenger_name}
              passportNumber={boardingPass.passport_number}
              userEmail={userEmail}
              mealPreference={boardingPass.meal_preference}
              onReset={() => setBoardingPass(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
