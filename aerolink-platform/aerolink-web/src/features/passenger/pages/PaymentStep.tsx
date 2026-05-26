import { useState } from 'react';
import { ArrowLeft, CreditCard, Lock, Loader2, CheckCircle2, Luggage, Plane } from 'lucide-react';

interface Flight {
  flight_number: string;
  origin_airport: string;
  destination_airport: string;
  base_price: number;
}

interface PaymentStepProps {
  selectedFlight: Flight;
  selectedSeat: string | null;
  hasBaggage: boolean;
  baggageWeight: number;
  hasInsurance?: boolean;
  passengerName: string;
  onConfirm: () => void;
  onBack: () => void;
}

function fmtCard(val: string): string {
  return val.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();
}
function fmtExpiry(val: string): string {
  const d = val.replace(/\D/g, '').slice(0, 4);
  return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
}

export default function PaymentStep({ selectedFlight, selectedSeat, hasBaggage, baggageWeight, hasInsurance = false, passengerName, onConfirm, onBack }: PaymentStepProps) {
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [nameOnCard, setNameOnCard] = useState(passengerName);
  const [processing, setProcessing] = useState(false);
  const [authorized, setAuthorized] = useState(false);

  const isBusinessClass = selectedSeat ? parseInt(selectedSeat) <= 2 : false;
  const seatPrice = isBusinessClass ? selectedFlight.base_price + 50 : selectedFlight.base_price;
  const total = seatPrice + (hasBaggage ? 30 : 0) + (hasInsurance ? 15 : 0);

  const isValid = cardNumber.replace(/\s/g, '').length === 16 && expiry.length === 5 && cvv.length >= 3 && nameOnCard.trim().length > 0;

  const handlePay = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;
    setProcessing(true);
    setTimeout(() => {
      setProcessing(false);
      setAuthorized(true);
      window.dispatchEvent(new CustomEvent('aerolink_new_event', {
        detail: {
          event: 'PAYMENT_AUTHORIZED',
          payload: {
            passenger: passengerName,
            flight: selectedFlight.flight_number,
            amount_usd: total,
            card_token: `tok_visa_${Math.random().toString(36).substr(2, 8)}`,
            pci_compliant: true,
            authorized_at: new Date().toISOString(),
          }
        }
      }));
      setTimeout(() => onConfirm(), 900);
    }, 2000);
  };

  return (
    <div className="max-w-xl mx-auto space-y-6 animate-fade-in">
      {!authorized && (
        <button onClick={onBack} className="flex items-center text-sm font-semibold text-slate-500 hover:text-blue-600 transition-colors cursor-pointer">
          <ArrowLeft className="w-4 h-4 mr-1.5" />
          Back to Meal Preference
        </button>
      )}

      {/* Order summary */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2 text-sm">
        <div className="flex items-center gap-2 mb-3 font-bold text-slate-700">
          <Plane className="w-4 h-4 text-blue-500 rotate-90" />
          {selectedFlight.origin_airport} → {selectedFlight.destination_airport} · {selectedFlight.flight_number}
        </div>
        <div className="flex justify-between text-slate-500">
          <span>Seat {selectedSeat} · {isBusinessClass ? 'Business' : 'Economy'}</span>
          <span className="font-semibold text-slate-700">${seatPrice}</span>
        </div>
        {hasBaggage && (
          <div className="flex justify-between text-slate-500">
            <span className="flex items-center gap-1"><Luggage className="w-3.5 h-3.5" /> Checked bag ({baggageWeight}kg)</span>
            <span className="font-semibold text-slate-700">+$30</span>
          </div>
        )}
        {hasInsurance && (
          <div className="flex justify-between text-slate-500">
            <span>Travel insurance</span>
            <span className="font-semibold text-slate-700">+$15</span>
          </div>
        )}
        <div className="flex justify-between font-extrabold text-slate-900 border-t border-slate-200 pt-2 mt-1 text-base">
          <span>Total</span>
          <span className="text-emerald-600">${total}</span>
        </div>
      </div>

      {/* Payment form */}
      {!authorized ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-5">
            <Lock className="w-4 h-4 text-emerald-600" />
            <h2 className="text-sm font-extrabold text-slate-800">Secure Payment</h2>
            <span className="text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full font-bold ml-auto">PCI-DSS Compliant</span>
          </div>

          <form onSubmit={handlePay} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5">Name on Card</label>
              <input
                type="text"
                value={nameOnCard}
                onChange={e => setNameOnCard(e.target.value)}
                placeholder="Full name as on card"
                className="w-full px-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white text-slate-800 shadow-sm"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5">Card Number</label>
              <div className="relative">
                <CreditCard className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={cardNumber}
                  onChange={e => setCardNumber(fmtCard(e.target.value))}
                  placeholder="1234 5678 9012 3456"
                  className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white text-slate-800 font-mono shadow-sm"
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5">Expiry</label>
                <input
                  type="text"
                  value={expiry}
                  onChange={e => setExpiry(fmtExpiry(e.target.value))}
                  placeholder="MM/YY"
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white text-slate-800 font-mono shadow-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5">CVV</label>
                <input
                  type="password"
                  value={cvv}
                  onChange={e => setCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  placeholder="•••"
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white text-slate-800 font-mono shadow-sm"
                  required
                />
              </div>
            </div>
            <p className="text-[10px] text-slate-400 flex items-center gap-1">
              <Lock className="w-3 h-3" />
              Card details are tokenized at the proxy layer and never stored. PAN/CVV encrypted via TLS 1.3.
            </p>
            <button
              type="submit"
              disabled={!isValid || processing}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl shadow-sm transition-all text-sm cursor-pointer mt-2"
            >
              {processing ? (
                <><Loader2 className="w-4 h-4 animate-spin" /><span>Authorising payment...</span></>
              ) : (
                <><Lock className="w-4 h-4" /><span>Pay ${total} now</span></>
              )}
            </button>
          </form>
        </div>
      ) : (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-8 flex flex-col items-center text-center gap-3 animate-fade-in">
          <div className="w-14 h-14 bg-emerald-100 border border-emerald-200 rounded-full flex items-center justify-center">
            <CheckCircle2 className="w-7 h-7 text-emerald-600" />
          </div>
          <h3 className="text-lg font-extrabold text-slate-800">Payment Authorised</h3>
          <p className="text-sm text-slate-500">Confirming your booking...</p>
        </div>
      )}
    </div>
  );
}
