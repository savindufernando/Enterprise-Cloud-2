import { ArrowLeft, ArrowRight, UtensilsCrossed, Plane, ShieldCheck, Luggage } from 'lucide-react';

interface Flight {
  flight_number: string;
  origin_airport: string;
  destination_airport: string;
  base_price: number;
}

interface MealPreferenceProps {
  selectedFlight: Flight;
  selectedSeat: string | null;
  hasBaggage: boolean;
  hasInsurance: boolean;
  baggageWeight: number;
  mealPreference: string;
  onMealChange: (meal: string) => void;
  onNext: () => void;
  onBack: () => void;
}

const MEALS = [
  { id: 'standard', label: 'Standard Meal', description: 'Airline\'s regular menu selection', icon: '🍽️', extra: '' },
  { id: 'vegetarian', label: 'Vegetarian', description: 'Plant-based, may include dairy & eggs', icon: '🥗', extra: '' },
  { id: 'vegan', label: 'Vegan', description: 'Fully plant-based, no animal products', icon: '🌱', extra: '' },
  { id: 'halal', label: 'Halal', description: 'Prepared according to Islamic dietary law', icon: '🌙', extra: '' },
  { id: 'kosher', label: 'Kosher', description: 'Prepared according to Jewish dietary law', icon: '✡️', extra: '' },
  { id: 'gluten-free', label: 'Gluten-Free', description: 'No wheat, barley, rye, or oats', icon: '🚫🌾', extra: '' },
  { id: 'child', label: 'Child Meal', description: 'Kid-friendly options and smaller portions', icon: '👶', extra: '' },
  { id: 'diabetic', label: 'Diabetic', description: 'Low-sugar, balanced carbohydrate options', icon: '💊', extra: '' },
];

export default function MealPreference({
  selectedFlight,
  selectedSeat,
  hasBaggage,
  hasInsurance,
  baggageWeight,
  mealPreference,
  onMealChange,
  onNext,
  onBack,
}: MealPreferenceProps) {
  const isBusinessClass = selectedSeat ? parseInt(selectedSeat) <= 2 : false;
  const seatPrice = isBusinessClass ? selectedFlight.base_price + 50 : selectedFlight.base_price;
  const total = seatPrice + (hasBaggage ? 30 : 0) + (hasInsurance ? 15 : 0);

  return (
    <div className="max-w-xl mx-auto space-y-6 animate-fade-in">
      <button onClick={onBack} className="flex items-center text-sm font-semibold text-slate-500 hover:text-blue-600 transition-colors cursor-pointer">
        <ArrowLeft className="w-4 h-4 mr-1.5" />
        Back to Baggage & Insurance
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

      {/* Meal selection */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 shadow-sm space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-50 border border-amber-100 rounded-xl flex items-center justify-center">
            <UtensilsCrossed className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-slate-800 dark:text-slate-100">Meal Preference</h2>
            <p className="text-xs text-slate-500 mt-0.5">Select your in-flight meal. All meals are included at no extra cost.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {MEALS.map(meal => (
            <button
              key={meal.id}
              type="button"
              onClick={() => onMealChange(meal.id)}
              className={`flex items-start gap-3 p-3.5 rounded-xl border-2 text-left cursor-pointer transition-all ${
                mealPreference === meal.id
                  ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/30'
                  : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:border-slate-300'
              }`}
            >
              <span className="text-xl leading-none mt-0.5">{meal.icon}</span>
              <div>
                <div className={`text-sm font-bold ${mealPreference === meal.id ? 'text-amber-800 dark:text-amber-300' : 'text-slate-800 dark:text-slate-100'}`}>
                  {meal.label}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{meal.description}</div>
              </div>
              {mealPreference === meal.id && (
                <div className="ml-auto w-4 h-4 rounded-full bg-amber-500 flex items-center justify-center shrink-0">
                  <div className="w-1.5 h-1.5 rounded-full bg-white" />
                </div>
              )}
            </button>
          ))}
        </div>

        {mealPreference !== 'standard' && (
          <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900 rounded-lg px-3 py-2 text-xs text-amber-700 dark:text-amber-400 font-semibold animate-fade-in">
            ✓ {MEALS.find(m => m.id === mealPreference)?.label} meal selected — we'll note this on your booking.
          </div>
        )}
      </div>

      {/* Order summary */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4 space-y-2">
        <div className="flex justify-between text-sm text-slate-500">
          <span>Flight ({isBusinessClass ? 'Business' : 'Economy'})</span>
          <span className="font-semibold text-slate-700 dark:text-slate-200">${seatPrice}</span>
        </div>
        {hasBaggage && (
          <div className="flex justify-between text-sm text-slate-500">
            <span className="flex items-center gap-1"><Luggage className="w-3.5 h-3.5" /> Checked bag ({baggageWeight}kg)</span>
            <span className="font-semibold text-slate-700 dark:text-slate-200">+$30</span>
          </div>
        )}
        {hasInsurance && (
          <div className="flex justify-between text-sm text-slate-500">
            <span className="flex items-center gap-1"><ShieldCheck className="w-3.5 h-3.5" /> Travel insurance</span>
            <span className="font-semibold text-slate-700 dark:text-slate-200">+$15</span>
          </div>
        )}
        <div className="flex justify-between text-sm text-slate-500">
          <span className="flex items-center gap-1"><UtensilsCrossed className="w-3.5 h-3.5" /> Meal preference</span>
          <span className="font-semibold text-emerald-600">Included</span>
        </div>
        <div className="flex justify-between font-extrabold text-slate-900 dark:text-slate-100 border-t border-slate-100 dark:border-slate-700 pt-2 mt-1">
          <span>Total</span>
          <span className="text-emerald-600 text-lg">${total}</span>
        </div>
      </div>

      <button
        onClick={onNext}
        className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold py-3.5 rounded-xl shadow-sm transition-all text-sm cursor-pointer"
      >
        Continue to Payment
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
}
