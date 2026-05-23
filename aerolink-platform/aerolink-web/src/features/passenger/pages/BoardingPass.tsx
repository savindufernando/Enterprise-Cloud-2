import { CheckCircle } from 'lucide-react';

interface Flight {
  flight_number: string;
  origin_airport: string;
  destination_airport: string;
  departure_time: string;
  base_price: number;
}

interface BoardingPassProps {
  selectedFlight: Flight;
  selectedSeat: string | null;
  passengerName: string;
  passportNumber: string;
  onReset: () => void;
}

export default function BoardingPass({
  selectedFlight,
  selectedSeat,
  passengerName,
  passportNumber,
  onReset
}: BoardingPassProps) {
  return (
    <div className="max-w-xl mx-auto space-y-6 animate-fade-in text-slate-800">
      <div className="glass-panel p-8 rounded-xl border border-slate-200 bg-white text-center space-y-4 shadow-sm">
        <div className="w-12 h-12 bg-emerald-50 border border-emerald-200/60 rounded-full flex items-center justify-center mx-auto text-emerald-600 animate-bounce">
          <CheckCircle className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-slate-800">Saga Transaction Authorized!</h2>
        <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed font-medium">
          Ticketing data has been synchronized. A mock seat lock payload was dispatched to your operators websocket console in real-time.
        </p>
      </div>

      {/* Digital Boarding Pass */}
      <div className="rounded-2xl overflow-hidden border border-slate-300 shadow-xl flex flex-col md:flex-row relative">
        <div className="p-6 md:p-8 flex-1 bg-gradient-to-br from-blue-950 via-slate-900 to-cyan-950 text-white space-y-6 relative">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-800/10 via-transparent to-transparent pointer-events-none" />
          
          <div className="flex justify-between items-center border-b border-slate-800/60 pb-4 relative z-10">
            <div className="font-mono uppercase tracking-widest text-cyan-400 text-[10px] font-bold">DIGITAL BOARDING PASS</div>
            <div className="font-mono bg-blue-950/80 text-blue-300 border border-blue-900/50 px-3 py-1 rounded text-xs font-semibold">
              {selectedFlight.flight_number}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-y-4 gap-x-6 relative z-10 font-mono text-xs">
            <div>
              <div className="text-[9px] text-slate-500 uppercase tracking-widest">Passenger Name</div>
              <div className="font-bold text-slate-200 mt-0.5 truncate">{passengerName}</div>
            </div>
            <div>
              <div className="text-[9px] text-slate-500 uppercase tracking-widest">Passport ID</div>
              <div className="font-bold text-slate-200 mt-0.5 truncate">{passportNumber}</div>
            </div>
            <div>
              <div className="text-[9px] text-slate-500 uppercase tracking-widest">Flight Route</div>
              <div className="font-bold text-slate-200 mt-0.5">
                {selectedFlight.origin_airport} <span className="text-cyan-500">→</span> {selectedFlight.destination_airport}
              </div>
            </div>
            <div>
              <div className="text-[9px] text-slate-500 uppercase tracking-widest">Cabin Class</div>
              <div className="font-bold text-amber-400 mt-0.5">
                {parseInt(selectedSeat || '1') <= 2 ? '🌟 Business' : 'Economy'}
              </div>
            </div>
            <div>
              <div className="text-[9px] text-slate-500 uppercase tracking-widest">Departure Time</div>
              <div className="font-bold text-slate-200 mt-0.5">{new Date(selectedFlight.departure_time).toLocaleDateString()}</div>
            </div>
            <div>
              <div className="text-[9px] text-slate-500 uppercase tracking-widest">Boarding Gate</div>
              <div className="font-bold text-slate-200 mt-0.5">GATE G-12</div>
            </div>
          </div>

          <div className="flex justify-between items-end border-t border-slate-800/60 pt-4 relative z-10">
            <div>
              <div className="text-[9px] text-slate-500 uppercase tracking-widest">Seat Assignment</div>
              <div className="text-xl font-bold font-mono text-cyan-400 mt-0.5">{selectedSeat}</div>
            </div>
            <div className="text-right text-[10px] text-slate-400 font-bold uppercase">
              Gate closes 30m prior
            </div>
          </div>
        </div>

        {/* Right Barcode Side */}
        <div className="p-6 md:p-8 bg-[#0b101b] md:w-44 border-t md:border-t-0 md:border-l border-dashed border-slate-800 flex flex-col justify-between items-center text-slate-300">
          <div className="w-24 h-24 bg-white p-1 rounded flex items-center justify-center shadow-inner">
            <div className="grid grid-cols-5 gap-0.5 w-full h-full bg-slate-950 p-0.5 rounded">
              {Array.from({ length: 25 }).map((_, i) => (
                <div key={i} className={`rounded-xs ${(i % 3 === 0 || i % 7 === 1) ? 'bg-white' : 'bg-slate-950'}`}></div>
              ))}
            </div>
          </div>
          
          <div className="text-center mt-4">
            <div className="text-[9px] text-slate-500 uppercase font-mono tracking-widest">SECURE PNR</div>
            <div className="text-[10px] font-mono font-bold text-cyan-400 mt-0.5 truncate max-w-[120px]">
              AL-SHA-{selectedSeat}
            </div>
          </div>

          <button 
            onClick={onReset}
            className="w-full bg-slate-800 hover:bg-slate-700 text-white text-[10px] font-bold py-2 rounded-lg transition-colors shadow-sm cursor-pointer mt-4 uppercase tracking-wider"
          >
            Book Another
          </button>
        </div>
      </div>
    </div>
  );
}
