import { CheckCircle, Loader2, Plane, Mail, Printer, MapPin, X, UtensilsCrossed } from 'lucide-react';
import { useState, useEffect } from 'react';

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
  userEmail?: string;
  gate?: string;
  mealPreference?: string;
  onReset: () => void;
}

const MEAL_LABELS: Record<string, string> = {
  standard: 'Standard Meal', vegetarian: 'Vegetarian', vegan: 'Vegan',
  halal: 'Halal', kosher: 'Kosher', 'gluten-free': 'Gluten-Free',
  child: 'Child Meal', diabetic: 'Diabetic',
};

export default function BoardingPass({ selectedFlight, selectedSeat, passengerName, passportNumber, userEmail, gate, mealPreference = 'standard', onReset }: BoardingPassProps) {
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [loadingQr, setLoadingQr] = useState<boolean>(true);
  const [showEmailModal, setShowEmailModal] = useState(false);

  useEffect(() => {
    const qrData = `AEROLINK:${selectedFlight.flight_number}:${selectedSeat}:${passengerName}`;
    const LAMBDA_FUNCTION_URL = "https://ah6gu7ida2et4r4qfxpqondps40renaq.lambda-url.eu-west-1.on.aws/";
    setLoadingQr(true);
    fetch(LAMBDA_FUNCTION_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ flight_id: selectedFlight.flight_number, seat: selectedSeat, passenger_name: passengerName }),
    })
      .then(res => res.json())
      .then(data => {
        setQrCodeUrl(data.qr_code_base64
          ? `data:image/png;base64,${data.qr_code_base64}`
          : `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(qrData)}`
        );
      })
      .catch(() => setQrCodeUrl(`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(qrData)}`))
      .finally(() => setLoadingQr(false));
  }, [selectedFlight, selectedSeat, passengerName]);

  const isBusinessClass = parseInt(selectedSeat || '3') <= 2;

  const handlePrint = () => window.print();

  return (
    <div className="max-w-xl mx-auto space-y-6 animate-fade-in text-slate-800">
      {/* Success banner */}
      <div className="p-6 rounded-xl border border-emerald-200 bg-emerald-50 text-center space-y-2 print:hidden">
        <div className="w-12 h-12 bg-emerald-100 border border-emerald-200 rounded-full flex items-center justify-center mx-auto text-emerald-600">
          <CheckCircle className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-slate-800">Booking Confirmed!</h2>
        <p className="text-sm text-slate-500 max-w-sm mx-auto leading-relaxed">
          Your seat has been reserved. Please arrive at the airport at least 2 hours before departure.
        </p>
        {userEmail && (
          <div className="inline-flex items-center gap-2 bg-emerald-100 border border-emerald-200 text-emerald-700 text-xs font-medium px-3 py-1.5 rounded-full mx-auto">
            <Mail className="w-3.5 h-3.5 shrink-0" />
            Confirmation email sent to <span className="font-semibold">{userEmail}</span>
          </div>
        )}
      </div>

      {/* Boarding Pass */}
      <div id="boarding-pass-print" className="rounded-2xl overflow-hidden border border-slate-300 shadow-xl flex flex-col md:flex-row">
        {/* Main section */}
        <div className="p-6 md:p-8 flex-1 bg-gradient-to-br from-blue-950 via-slate-900 to-cyan-950 text-white space-y-6">
          <div className="flex justify-between items-center border-b border-slate-700/50 pb-4">
            <div className="text-cyan-400 text-xs font-bold tracking-widest uppercase">Boarding Pass</div>
            <div className="font-mono bg-blue-950/80 text-blue-300 border border-blue-800/50 px-3 py-1 rounded text-xs font-semibold">
              {selectedFlight.flight_number}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="text-center">
              <div className="text-4xl font-extrabold text-white">{selectedFlight.origin_airport}</div>
            </div>
            <Plane className="w-6 h-6 text-cyan-400 rotate-90 shrink-0" />
            <div className="text-center">
              <div className="text-4xl font-extrabold text-white">{selectedFlight.destination_airport}</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-y-4 gap-x-6 text-xs font-mono">
            <div>
              <div className="text-[9px] text-slate-500 uppercase tracking-widest">Passenger</div>
              <div className="font-bold text-slate-200 mt-0.5 truncate">{passengerName}</div>
            </div>
            <div>
              <div className="text-[9px] text-slate-500 uppercase tracking-widest">Passport</div>
              <div className="font-bold text-slate-200 mt-0.5">{passportNumber}</div>
            </div>
            <div>
              <div className="text-[9px] text-slate-500 uppercase tracking-widest">Date</div>
              <div className="font-bold text-slate-200 mt-0.5">
                {new Date(selectedFlight.departure_time).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
              </div>
            </div>
            <div>
              <div className="text-[9px] text-slate-500 uppercase tracking-widest">Class</div>
              <div className={`font-bold mt-0.5 ${isBusinessClass ? 'text-amber-400' : 'text-slate-200'}`}>
                {isBusinessClass ? 'Business' : 'Economy'}
              </div>
            </div>
            <div className="col-span-2">
              <div className="text-[9px] text-slate-500 uppercase tracking-widest">Meal</div>
              <div className="font-bold text-slate-200 mt-0.5 flex items-center gap-1.5">
                <UtensilsCrossed className="w-3 h-3 text-amber-400" />
                {MEAL_LABELS[mealPreference] ?? 'Standard Meal'}
              </div>
            </div>
          </div>

          <div className="flex justify-between items-end border-t border-slate-700/50 pt-4">
            <div>
              <div className="text-[9px] text-slate-500 uppercase tracking-widest">Seat</div>
              <div className="text-2xl font-bold font-mono text-cyan-400 mt-0.5">{selectedSeat}</div>
            </div>
            <div className="text-center">
              <div className="text-[9px] text-slate-500 uppercase tracking-widest">Gate</div>
              <div className="flex items-center gap-1 font-bold text-white mt-0.5">
                <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                {gate || '—'}
              </div>
            </div>
            <div className="text-right">
              <div className="text-[9px] text-slate-500 uppercase tracking-widest">Boarding</div>
              <div className="font-bold text-slate-200 mt-0.5">
                {new Date(new Date(selectedFlight.departure_time).getTime() - 40 * 60000).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        </div>

        {/* QR side */}
        <div className="p-6 bg-[#0b101b] md:w-44 border-t md:border-t-0 md:border-l border-dashed border-slate-800 flex flex-col justify-between items-center gap-4">
          <div className="w-24 h-24 bg-white p-1.5 rounded flex items-center justify-center shadow-md">
            {loadingQr ? (
              <Loader2 className="w-6 h-6 text-slate-800 animate-spin" />
            ) : (
              qrCodeUrl && <img src={qrCodeUrl} alt="Boarding QR" className="w-full h-full object-contain" />
            )}
          </div>

          <div className="text-center">
            <div className="text-[9px] text-slate-500 uppercase tracking-widest">PNR</div>
            <div className="text-[10px] font-mono font-bold text-cyan-400 mt-0.5">AL-{selectedSeat}</div>
          </div>

          <div className="w-full flex flex-col gap-2">
            <button
              onClick={handlePrint}
              className="w-full bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold py-2 rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1.5 print:hidden"
            >
              <Printer className="w-3.5 h-3.5" />
              Print
            </button>
            <button
              onClick={() => setShowEmailModal(true)}
              className="w-full bg-blue-900/60 hover:bg-blue-800/60 text-blue-200 text-xs font-bold py-2 rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1.5 print:hidden"
            >
              <Mail className="w-3.5 h-3.5" />
              View Email
            </button>
            <button
              onClick={onReset}
              className="w-full bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold py-2 rounded-lg transition-colors cursor-pointer print:hidden"
            >
              Book Another
            </button>
          </div>
        </div>
      </div>

      {/* Email confirmation modal */}
      {showEmailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm print:hidden" onClick={() => setShowEmailModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full mx-4 overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-blue-600" />
                <span className="font-bold text-slate-800 text-sm">Booking Confirmation Email</span>
              </div>
              <button onClick={() => setShowEmailModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-3 text-xs text-slate-600 max-h-[70vh] overflow-y-auto">
              <div className="text-slate-400 space-y-0.5">
                <div><span className="font-semibold text-slate-500">From:</span> no-reply@aerolink.com</div>
                <div><span className="font-semibold text-slate-500">To:</span> {userEmail || 'passenger@example.com'}</div>
                <div><span className="font-semibold text-slate-500">Subject:</span> Your AeroLink Booking Confirmation — {selectedFlight.flight_number}</div>
              </div>
              <div className="border border-slate-100 rounded-xl overflow-hidden">
                <div className="bg-gradient-to-r from-blue-950 to-cyan-900 px-6 py-5 text-white text-center">
                  <div className="text-lg font-extrabold tracking-wide">AeroLink</div>
                  <div className="text-cyan-300 text-xs mt-1 font-semibold">Booking Confirmation</div>
                </div>
                <div className="p-5 space-y-4 bg-slate-50">
                  <p className="text-slate-700">Dear <span className="font-bold">{passengerName}</span>,</p>
                  <p className="text-slate-600 leading-relaxed">Your booking has been confirmed. Please find your travel details below.</p>
                  <div className="bg-white border border-slate-200 rounded-lg divide-y divide-slate-100">
                    {[
                      ['Flight', selectedFlight.flight_number],
                      ['Route', `${selectedFlight.origin_airport} → ${selectedFlight.destination_airport}`],
                      ['Departure', new Date(selectedFlight.departure_time).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })],
                      ['Seat', `${selectedSeat} (${isBusinessClass ? 'Business' : 'Economy'})`],
                      ['Gate', gate || 'TBC'],
                      ['Meal', MEAL_LABELS[mealPreference] ?? 'Standard Meal'],
                      ['PNR', `AL-${selectedSeat}`],
                    ].map(([label, val]) => (
                      <div key={label} className="flex justify-between px-4 py-2.5">
                        <span className="text-slate-500 font-semibold">{label}</span>
                        <span className="font-bold text-slate-800">{val}</span>
                      </div>
                    ))}
                  </div>
                  <div className="bg-amber-50 border border-amber-100 rounded-lg px-4 py-3 text-amber-700 text-xs font-semibold">
                    Please arrive at least 2 hours before departure and bring a valid photo ID.
                  </div>
                  <p className="text-slate-400 text-[10px] text-center">AeroLink Airlines · This is an automated message, please do not reply.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Print styles */}
      <style>{`
        @media print {
          body > * { display: none !important; }
          #boarding-pass-print { display: flex !important; }
          .print\\:hidden { display: none !important; }
        }
      `}</style>
    </div>
  );
}
