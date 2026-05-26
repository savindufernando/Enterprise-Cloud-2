import { Luggage, ArrowLeft, ArrowRight, CheckCircle2, Plane, ShieldCheck } from 'lucide-react';

interface Flight {
  flight_number: string;
  origin_airport: string;
  destination_airport: string;
  base_price: number;
}

interface BaggageAddOnProps {
  selectedFlight: Flight;
  selectedSeat: string | null;
  hasBaggage: boolean;
  baggageWeight: number;
  hasInsurance: boolean;
  onToggleBaggage: (val: boolean) => void;
  onWeightChange: (kg: number) => void;
  onToggleInsurance: (val: boolean) => void;
  onNext: () => void;
  onBack: () => void;
}

const WEIGHT_OPTIONS = [15, 20, 23, 25, 30, 32];

export default function BaggageAddOn({
  selectedFlight,
  selectedSeat,
  hasBaggage,
  baggageWeight,
  hasInsurance,
  onToggleBaggage,
  onWeightChange,
  onToggleInsurance,
  onNext,
  onBack,
}: BaggageAddOnProps) {
  const isBusinessClass = selectedSeat ? parseInt(selectedSeat) <= 2 : false;
  const seatPrice = isBusinessClass ? selectedFlight.base_price + 50 : selectedFlight.base_price;
  const total = seatPrice + (hasBaggage ? 30 : 0) + (hasInsurance ? 15 : 0);

  return (
    <div className="max-w-xl mx-auto space-y-6 animate-fade-in">
      <button onClick={onBack} className="flex items-center text-sm font-semibold text-slate-500 hover:text-blue-600 transition-colors cursor-pointer">
        <ArrowLeft className="w-4 h-4 mr-1.5" />
        Back to Seat Selection
      </button>

      {/* Flight summary strip */}
      <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-5 py-3">
        <div className="flex items-center gap-3 text-slate-700 dark:text-slate-200">
          <span className="font-mono font-bold text-sm text-blue-600 bg-blue-50 border border-blue-100 px-2 py-1 rounded-lg">{selectedFlight.flight_number}</span>
          <span className="font-bold">{selectedFlight.origin_airport}</span>
          <Plane className="w-4 h-4 text-blue-400 rotate-90" />
          <span className="font-bold">{selectedFlight.destination_airport}</span>
        </div>
        <div className="text-sm font-bold text-slate-700 dark:text-slate-200">Seat {selectedSeat}</div>
      </div>

      {/* Baggage card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 shadow-sm space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-50 border border-blue-100 rounded-xl flex items-center justify-center">
            <Luggage className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-slate-800 dark:text-slate-100">Add Checked Baggage</h2>
            <p className="text-xs text-slate-500 mt-0.5">Your carry-on bag is always included free of charge.</p>
          </div>
        </div>

        {/* Baggage toggle */}
        <div
          onClick={() => onToggleBaggage(!hasBaggage)}
          className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all ${hasBaggage ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30' : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:border-slate-300'}`}
        >
          <div className="flex items-center gap-3">
            <Luggage className={`w-5 h-5 ${hasBaggage ? 'text-blue-600' : 'text-slate-400'}`} />
            <div>
              <div className="text-sm font-bold text-slate-800 dark:text-slate-100">1 Checked Bag</div>
              <div className="text-xs text-slate-500">Up to your selected weight allowance</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm font-extrabold text-slate-800 dark:text-slate-100">+$30</span>
            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${hasBaggage ? 'border-blue-500 bg-blue-500' : 'border-slate-300'}`}>
              {hasBaggage && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
            </div>
          </div>
        </div>

        {/* Weight selector */}
        {hasBaggage && (
          <div className="space-y-2 animate-fade-in">
            <label className="block text-xs font-bold text-slate-500">Baggage Weight Allowance</label>
            <div className="grid grid-cols-3 gap-2">
              {WEIGHT_OPTIONS.map(kg => (
                <button
                  key={kg}
                  type="button"
                  onClick={() => onWeightChange(kg)}
                  className={`py-2 rounded-lg text-sm font-bold border transition-all cursor-pointer ${baggageWeight === kg ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-blue-300'}`}
                >
                  {kg} kg
                </button>
              ))}
            </div>
          </div>
        )}

        {!hasBaggage && (
          <p className="text-xs text-slate-400 text-center">No checked baggage — travelling light? ✓</p>
        )}
      </div>

      {/* Travel insurance card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center justify-center">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-slate-800 dark:text-slate-100">Travel Insurance</h2>
            <p className="text-xs text-slate-500 mt-0.5">Protection against cancellations, delays, and medical emergencies.</p>
          </div>
        </div>

        <div
          onClick={() => onToggleInsurance(!hasInsurance)}
          className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all ${hasInsurance ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30' : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:border-slate-300'}`}
        >
          <div className="flex items-center gap-3">
            <ShieldCheck className={`w-5 h-5 ${hasInsurance ? 'text-emerald-600' : 'text-slate-400'}`} />
            <div>
              <div className="text-sm font-bold text-slate-800 dark:text-slate-100">Comprehensive Cover</div>
              <div className="text-xs text-slate-500">Trip cancellation · Medical · Lost baggage</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm font-extrabold text-slate-800 dark:text-slate-100">+$15</span>
            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${hasInsurance ? 'border-emerald-500 bg-emerald-500' : 'border-slate-300'}`}>
              {hasInsurance && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
            </div>
          </div>
        </div>

        {hasInsurance && (
          <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900 rounded-lg px-3 py-2 text-xs text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-2 animate-fade-in">
            <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
            You're covered — insurance added to your booking.
          </div>
        )}
      </div>

      {/* Price summary */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4 space-y-2">
        <div className="flex justify-between text-sm text-slate-500">
          <span>Flight ({isBusinessClass ? 'Business' : 'Economy'})</span>
          <span className="font-semibold text-slate-700 dark:text-slate-200">${seatPrice}</span>
        </div>
        {hasBaggage && (
          <div className="flex justify-between text-sm text-slate-500">
            <span>Checked baggage ({baggageWeight}kg)</span>
            <span className="font-semibold text-slate-700 dark:text-slate-200">+$30</span>
          </div>
        )}
        {hasInsurance && (
          <div className="flex justify-between text-sm text-slate-500">
            <span>Travel insurance</span>
            <span className="font-semibold text-slate-700 dark:text-slate-200">+$15</span>
          </div>
        )}
        <div className="flex justify-between font-extrabold text-slate-900 dark:text-slate-100 border-t border-slate-100 dark:border-slate-700 pt-2 mt-1">
          <span>Total</span>
          <span className="text-emerald-600 text-lg">${total}</span>
        </div>
      </div>

      <button
        onClick={onNext}
        className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold py-3.5 rounded-xl shadow-sm transition-all text-sm cursor-pointer"
      >
        Continue to Meal Preference
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
}
