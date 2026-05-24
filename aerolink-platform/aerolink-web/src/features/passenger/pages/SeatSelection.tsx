import { ArrowLeft, Ticket, CreditCard, User, Armchair, Loader2 } from 'lucide-react';

interface Flight {
  flight_number: string;
  origin_airport: string;
  destination_airport: string;
  departure_time: string;
  base_price: number;
}

interface SeatSelectionProps {
  selectedFlight: Flight;
  selectedSeat: string | null;
  occupiedSeats: string[];
  passengerName: string;
  passportNumber: string;
  isSubmitting: boolean;
  onSelectSeat: (seat: string) => void;
  onPassengerNameChange: (name: string) => void;
  onPassportNumberChange: (passport: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onBack: () => void;
}

export default function SeatSelection({
  selectedFlight,
  selectedSeat,
  occupiedSeats,
  passengerName,
  passportNumber,
  isSubmitting,
  onSelectSeat,
  onPassengerNameChange,
  onPassportNumberChange,
  onSubmit,
  onBack,
}: SeatSelectionProps) {
  const getSeatClass = (seatCode: string) => {
    if (occupiedSeats.includes(seatCode)) {
      return 'bg-slate-200 text-slate-400 cursor-not-allowed border-slate-300';
    }
    if (selectedSeat === seatCode) {
      return 'bg-blue-600 text-white border-blue-500 shadow-[0_0_12px_rgba(37,99,235,0.4)] scale-105 ring-2 ring-blue-200';
    }
    const row = parseInt(seatCode);
    if (row <= 2) {
      return 'bg-amber-50 text-amber-800 hover:bg-amber-100 border-amber-200 hover:border-amber-300 cursor-pointer';
    }
    return 'bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200 hover:border-slate-300 cursor-pointer';
  };

  const rows = Array.from({ length: 10 }, (_, i) => i + 1);
  const totalPrice = selectedSeat && parseInt(selectedSeat) <= 2
    ? selectedFlight.base_price + 50
    : selectedFlight.base_price;

  return (
    <div className="space-y-6 animate-fade-in">
      <button
        onClick={onBack}
        className="flex items-center text-sm font-semibold text-slate-500 hover:text-blue-600 transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4 mr-1.5" />
        Back to Flights
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 text-slate-800">
        {/* Left: Summary + Passenger Form */}
        <div className="col-span-1 lg:col-span-5 space-y-6">
          {/* Booking Summary */}
          <div className="p-6 rounded-xl border border-slate-200 bg-white shadow-sm">
            <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center border-b border-slate-100 pb-3">
              <Ticket className="w-4 h-4 mr-2 text-blue-600" />
              Booking Summary
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Flight</span>
                <span className="font-bold text-blue-600">{selectedFlight.flight_number}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Route</span>
                <span className="font-semibold text-slate-700">{selectedFlight.origin_airport} → {selectedFlight.destination_airport}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Departure</span>
                <span className="font-semibold text-slate-700">
                  {new Date(selectedFlight.departure_time).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Seat</span>
                <span className={`font-bold px-2.5 py-0.5 rounded border text-xs ${selectedSeat ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-slate-50 border-slate-200 text-slate-400'}`}>
                  {selectedSeat || 'Not selected'}
                </span>
              </div>
              {selectedSeat && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Class</span>
                  <span className="font-semibold text-amber-600">
                    {parseInt(selectedSeat) <= 2 ? 'Business (+$50)' : 'Economy'}
                  </span>
                </div>
              )}
              <div className="flex justify-between border-t border-slate-100 pt-3 mt-1">
                <span className="font-bold text-slate-800">Total</span>
                <span className="text-emerald-600 font-extrabold text-lg">${totalPrice}</span>
              </div>
            </div>
          </div>

          {/* Passenger Details Form */}
          <div className="p-6 rounded-xl border border-slate-200 bg-white shadow-sm">
            <h3 className="text-sm font-bold text-slate-800 mb-5 flex items-center border-b border-slate-100 pb-3">
              <User className="w-4 h-4 mr-2 text-blue-600" />
              Passenger Details
            </h3>
            <form onSubmit={onSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5">Full Name</label>
                <input
                  type="text"
                  required
                  value={passengerName}
                  onChange={e => onPassengerNameChange(e.target.value)}
                  placeholder="Full name as on passport"
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-slate-800 text-sm shadow-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5">Passport Number</label>
                <input
                  type="text"
                  required
                  value={passportNumber}
                  onChange={e => onPassportNumberChange(e.target.value)}
                  placeholder="N1234567"
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-slate-800 text-sm shadow-sm font-mono"
                />
              </div>
              <button
                type="submit"
                disabled={!selectedSeat || isSubmitting}
                className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-lg shadow-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed mt-2 text-sm cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Confirming booking...</span>
                  </>
                ) : (
                  <>
                    <CreditCard className="w-4 h-4" />
                    <span>Confirm Booking</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Right: Seat Map */}
        <div className="col-span-1 lg:col-span-7">
          <div className="p-6 rounded-xl border border-slate-200 bg-white shadow-sm flex flex-col items-center">
            <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center self-start border-b border-slate-100 pb-3 w-full">
              <Armchair className="w-4 h-4 mr-2 text-blue-600" />
              Choose Your Seat
            </h3>

            {/* Legend */}
            <div className="flex flex-wrap gap-4 mb-8 text-xs text-slate-500 justify-center">
              <div className="flex items-center gap-1.5">
                <div className="w-4 h-4 bg-slate-50 border border-slate-200 rounded"></div>
                <span>Economy</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-4 h-4 bg-amber-50 border border-amber-200 rounded"></div>
                <span>Business</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-4 h-4 bg-blue-600 rounded shadow-[0_0_8px_rgba(37,99,235,0.4)]"></div>
                <span>Selected</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-4 h-4 bg-slate-200 border border-slate-300 rounded"></div>
                <span>Taken</span>
              </div>
            </div>

            {/* Plane silhouette */}
            <div className="border-x-2 border-t-4 border-slate-300 rounded-t-full pt-12 pb-6 px-8 sm:px-12 w-full max-w-sm bg-slate-50/50 shadow-inner relative">
              <div className="absolute top-3 left-1/2 -translate-x-1/2 text-[9px] font-bold text-slate-400 tracking-widest uppercase">
                ✈ FRONT
              </div>
              <div className="space-y-3 mt-4">
                {rows.map(rowNum => (
                  <div key={rowNum} className="flex justify-between items-center">
                    <div className="flex space-x-2">
                      {['A', 'B', 'C'].map(col => {
                        const seatCode = `${rowNum}${col}`;
                        return (
                          <button
                            key={col}
                            type="button"
                            disabled={occupiedSeats.includes(seatCode)}
                            onClick={() => onSelectSeat(seatCode)}
                            className={`w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center text-[10px] font-bold border rounded-lg transition-all ${getSeatClass(seatCode)}`}
                          >
                            {col}
                          </button>
                        );
                      })}
                    </div>
                    <div className="text-[9px] font-bold text-slate-400 w-4 text-center">{rowNum}</div>
                    <div className="flex space-x-2">
                      {['D', 'E', 'F'].map(col => {
                        const seatCode = `${rowNum}${col}`;
                        return (
                          <button
                            key={col}
                            type="button"
                            disabled={occupiedSeats.includes(seatCode)}
                            onClick={() => onSelectSeat(seatCode)}
                            className={`w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center text-[10px] font-bold border rounded-lg transition-all ${getSeatClass(seatCode)}`}
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
  );
}
