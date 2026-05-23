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
  onBack
}: SeatSelectionProps) {

  const getSeatClass = (seatCode: string) => {
    if (occupiedSeats.includes(seatCode)) {
      return 'bg-slate-200 text-slate-400 cursor-not-allowed border-slate-300';
    }
    if (selectedSeat === seatCode) {
      return 'bg-blue-600 text-white border-blue-500 shadow-[0_0_12px_rgba(37,99,235,0.4)] scale-105 transition-all ring-2 ring-blue-200';
    }
    const row = parseInt(seatCode);
    if (row <= 2) {
      return 'bg-amber-50 text-amber-800 hover:bg-amber-100 border-amber-200 hover:border-amber-300 cursor-pointer';
    }
    return 'bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200 hover:border-slate-300 cursor-pointer';
  };

  const rows = Array.from({ length: 10 }, (_, i) => i + 1);

  return (
    <div className="space-y-6 animate-fade-in">
      <button 
        onClick={onBack}
        className="flex items-center text-xs font-bold text-slate-500 hover:text-blue-600 transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-3.5 h-3.5 mr-1" />
        <span>Return to Network Listings</span>
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 text-slate-800">
        {/* Passenger Forms */}
        <div className="col-span-1 lg:col-span-5 space-y-6">
          <div className="glass-panel p-6 rounded-xl border border-slate-200 bg-white">
            <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center border-b border-slate-200 pb-3">
              <Ticket className="w-4 h-4 mr-2 text-blue-600" />
              Active Reservation Summary
            </h3>
            <div className="p-4 bg-slate-50 rounded-lg space-y-3 font-mono text-xs border border-slate-200">
              <div className="flex justify-between">
                <span className="text-slate-500 font-semibold">Flight Ref:</span>
                <span className="text-blue-600 font-bold">{selectedFlight.flight_number}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-semibold">Route Coordinates:</span>
                <span className="text-slate-700 font-bold">{selectedFlight.origin_airport} → {selectedFlight.destination_airport}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-semibold">Departure:</span>
                <span className="text-slate-700 font-semibold">{new Date(selectedFlight.departure_time).toLocaleString()}</span>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-3">
                <span className="text-slate-500 font-semibold">Selected Cabin Seat:</span>
                <span className="font-bold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded border border-blue-200/50">{selectedSeat || 'UNSELECTED'}</span>
              </div>
              {selectedSeat && (
                <div className="flex justify-between">
                  <span className="text-slate-500 font-semibold">Class Matrix:</span>
                  <span className="font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200/50">
                    {parseInt(selectedSeat) <= 2 ? '🌟 Business Class (+$50)' : 'Economy Standard'}
                  </span>
                </div>
              )}
              <div className="flex justify-between border-t border-slate-200 pt-3 text-sm font-bold">
                <span className="text-slate-700">Total Price (USD):</span>
                <span className="text-emerald-600 font-black text-base">
                  ${selectedSeat && parseInt(selectedSeat) <= 2 ? selectedFlight.base_price + 50 : selectedFlight.base_price}
                </span>
              </div>
            </div>
          </div>

          <div className="glass-panel p-6 rounded-xl border border-slate-200 bg-white">
            <h3 className="text-sm font-bold text-slate-800 mb-6 flex items-center border-b border-slate-200 pb-3">
              <User className="w-4 h-4 mr-2 text-blue-600" />
              Passenger Manifest Registration
            </h3>
            <form onSubmit={onSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Full Legal Name</label>
                <input 
                  type="text" 
                  required
                  value={passengerName}
                  onChange={e => onPassengerNameChange(e.target.value)}
                  placeholder="Jane Doe" 
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-slate-800 text-sm font-semibold shadow-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Passport Number (PII)</label>
                <input 
                  type="text" 
                  required
                  value={passportNumber}
                  onChange={e => onPassportNumberChange(e.target.value)}
                  placeholder="N1234567" 
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-slate-800 text-sm font-semibold shadow-sm font-mono"
                />
              </div>
              <button 
                type="submit" 
                disabled={!selectedSeat || isSubmitting}
                className="w-full flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 rounded-lg shadow-md transition-all disabled:opacity-40 disabled:cursor-not-allowed mt-6 text-xs uppercase tracking-wider cursor-pointer font-semibold"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Executing Distributed Saga...</span>
                  </>
                ) : (
                  <>
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>Book Ticket Reservation</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Interactive Cabin Selector */}
        <div className="col-span-1 lg:col-span-7">
          <div className="glass-panel p-6 rounded-xl border border-slate-200 bg-white flex flex-col items-center">
            <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center self-start border-b border-slate-200 pb-3 w-full">
              <Armchair className="w-4 h-4 mr-2 text-blue-600" />
              Aircraft Cabin Fuselage Coordinator
            </h3>
            
            {/* Legends */}
            <div className="flex flex-wrap gap-4 mb-8 text-[10px] font-mono text-slate-500 justify-center">
              <div className="flex items-center space-x-1.5">
                <div className="w-3.5 h-3.5 bg-slate-50 border border-slate-200 rounded"></div>
                <span>Economy</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <div className="w-3.5 h-3.5 bg-amber-50 border border-amber-200 rounded"></div>
                <span>Business</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <div className="w-3.5 h-3.5 bg-blue-600 rounded shadow-[0_0_8px_rgba(37,99,235,0.4)]"></div>
                <span>Selected</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <div className="w-3.5 h-3.5 bg-slate-200 border border-slate-300 rounded text-slate-400"></div>
                <span>Locked</span>
              </div>
            </div>

            {/* Fuselage Frame */}
            <div className="border-x-2 border-t-4 border-slate-300 rounded-t-full pt-12 pb-6 px-8 sm:px-12 w-full max-w-sm bg-slate-50/50 shadow-inner relative">
              <div className="absolute top-3 left-1/2 transform -translate-x-1/2 text-[9px] font-bold text-slate-400 tracking-widest uppercase font-mono">
                ✈️ FRONT COCKPIT DECK
              </div>
              
              <div className="space-y-3 mt-4">
                {rows.map(rowNum => (
                  <div key={rowNum} className="flex justify-between items-center">
                    {/* Left Columns A, B, C */}
                    <div className="flex space-x-2">
                      {['A', 'B', 'C'].map(col => {
                        const seatCode = `${rowNum}${col}`;
                        const isOccupied = occupiedSeats.includes(seatCode);
                        return (
                          <button
                            key={col}
                            type="button"
                            disabled={isOccupied}
                            onClick={() => onSelectSeat(seatCode)}
                            className={`w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center text-[10px] font-bold font-mono border rounded-lg transition-all ${getSeatClass(seatCode)}`}
                          >
                            {col}
                          </button>
                        );
                      })}
                    </div>

                    {/* Row ID */}
                    <div className="text-[9px] font-bold text-slate-400 font-mono w-4 text-center">
                      {rowNum}
                    </div>

                    {/* Right Columns D, E, F */}
                    <div className="flex space-x-2">
                      {['D', 'E', 'F'].map(col => {
                        const seatCode = `${rowNum}${col}`;
                        const isOccupied = occupiedSeats.includes(seatCode);
                        return (
                          <button
                            key={col}
                            type="button"
                            disabled={isOccupied}
                            onClick={() => onSelectSeat(seatCode)}
                            className={`w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center text-[10px] font-bold font-mono border rounded-lg transition-all ${getSeatClass(seatCode)}`}
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
