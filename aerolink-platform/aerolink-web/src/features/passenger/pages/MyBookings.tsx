import { useState } from 'react';
import { Plane, CalendarDays, Armchair, BadgeCheck, Inbox, Ticket, X } from 'lucide-react';
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
}

const getUserKey = (userId: string) => `aerolink_bookings_${userId}`;
const ALL_BOOKINGS_KEY = 'aerolink_all_bookings';

export function saveBooking(booking: Omit<Booking, 'id' | 'booked_at'>, userId: string) {
  const newBooking: Booking = {
    ...booking,
    id: `BK-${Date.now()}`,
    booked_at: new Date().toISOString(),
  };

  const userBookings = getBookings(userId);
  localStorage.setItem(getUserKey(userId), JSON.stringify([newBooking, ...userBookings]));

  try {
    const allBookings = getAllBookings();
    localStorage.setItem(ALL_BOOKINGS_KEY, JSON.stringify([{ ...newBooking, user_email: userId }, ...allBookings]));
  } catch {}

  return newBooking;
}

export function getBookings(userId: string): Booking[] {
  try {
    return JSON.parse(localStorage.getItem(getUserKey(userId)) || '[]');
  } catch {
    return [];
  }
}

export function getAllBookings(): Booking[] {
  try {
    return JSON.parse(localStorage.getItem(ALL_BOOKINGS_KEY) || '[]');
  } catch {
    return [];
  }
}

interface MyBookingsProps {
  onBookAgain: () => void;
  userId: string;
  userEmail?: string;
}

export default function MyBookings({ onBookAgain, userId, userEmail }: MyBookingsProps) {
  const bookings = getBookings(userId);
  const [viewingBooking, setViewingBooking] = useState<Booking | null>(null);

  if (bookings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center animate-fade-in">
        <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-5">
          <Inbox className="w-8 h-8 text-slate-400" />
        </div>
        <h3 className="text-lg font-bold text-slate-700 mb-2">No bookings yet</h3>
        <p className="text-sm text-slate-400 max-w-xs mb-6">
          You haven't booked any flights. Search for a route and reserve your seat to get started.
        </p>
        <button
          onClick={onBookAgain}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold px-6 py-2.5 rounded-xl text-sm transition-all cursor-pointer shadow-sm"
        >
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
              <button
                onClick={() => setViewingBooking(null)}
                className="bg-white/10 hover:bg-white/20 text-white rounded-full p-2 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <BoardingPass
              selectedFlight={{
                flight_number: viewingBooking.flight_number,
                origin_airport: viewingBooking.origin_airport,
                destination_airport: viewingBooking.destination_airport,
                departure_time: viewingBooking.departure_time,
                base_price: viewingBooking.base_price,
              }}
              selectedSeat={viewingBooking.seat}
              passengerName={viewingBooking.passenger_name}
              passportNumber={viewingBooking.passport_number}
              userEmail={userEmail}
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
          <button
            onClick={onBookAgain}
            className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-500 font-semibold cursor-pointer"
          >
            <Plane className="w-4 h-4 rotate-90" />
            Book Another
          </button>
        </div>

        {bookings.map(booking => {
          const isBusinessClass = parseInt(booking.seat) <= 2;
          const totalPrice = isBusinessClass ? booking.base_price + 50 : booking.base_price;
          const depDate = new Date(booking.departure_time);
          const isPast = depDate < new Date();

          return (
            <div
              key={booking.id}
              className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
            >
              <div className={`h-1.5 w-full ${isPast ? 'bg-slate-300' : 'bg-gradient-to-r from-blue-500 to-blue-700'}`} />

              <div className="p-5 sm:p-6 flex flex-col sm:flex-row gap-5 justify-between">
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
                    </div>

                    <div className="text-xs text-slate-400 mt-1.5">
                      Passenger: <span className="font-semibold text-slate-600">{booking.passenger_name}</span>
                      &nbsp;·&nbsp;Booked {new Date(booking.booked_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </div>
                  </div>
                </div>

                {/* Right: price + status + boarding pass */}
                <div className="flex sm:flex-col items-start sm:items-end justify-between sm:justify-between gap-3 shrink-0">
                  <div className="text-right">
                    <div className="text-2xl font-extrabold text-slate-900">${totalPrice}</div>
                    <div className="text-[10px] text-slate-400 uppercase tracking-wide mt-0.5">Total paid</div>
                  </div>
                  <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${
                    isPast
                      ? 'bg-slate-100 text-slate-500 border border-slate-200'
                      : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  }`}>
                    <BadgeCheck className="w-3.5 h-3.5" />
                    {isPast ? 'Completed' : 'Confirmed'}
                  </span>
                  <button
                    onClick={() => setViewingBooking(booking)}
                    className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-500 border border-blue-200 hover:border-blue-300 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-all cursor-pointer"
                  >
                    <Ticket className="w-3.5 h-3.5" />
                    View Pass
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
