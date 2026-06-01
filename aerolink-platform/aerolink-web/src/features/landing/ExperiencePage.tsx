import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plane, Star, Wifi, Tv2, UtensilsCrossed, Luggage, ShieldCheck,
  ChevronRight, Award, Crown, Gem, Users, Globe, Clock,
  Armchair, Coffee, Headphones, Sparkles, ArrowLeft, CheckCircle2,
} from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://api.aerolink.transnova.shop';

const AIRPORT_NAMES: Record<string, string> = {
  CMB: 'Colombo', LAX: 'Los Angeles', JFK: 'New York', LHR: 'London',
  CDG: 'Paris', SIN: 'Singapore', DXB: 'Dubai', HND: 'Tokyo',
  SYD: 'Sydney', FRA: 'Frankfurt', AMS: 'Amsterdam',
};

const DEST_PHOTOS: Record<string, { photo: string; accent: string }> = {
  CDG: { photo: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800&q=80', accent: 'bg-blue-500' },
  HND: { photo: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800&q=80', accent: 'bg-red-500' },
  SYD: { photo: 'https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?w=800&q=80', accent: 'bg-cyan-500' },
  DXB: { photo: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800&q=80', accent: 'bg-amber-500' },
  SIN: { photo: 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=800&q=80', accent: 'bg-emerald-500' },
  JFK: { photo: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=800&q=80', accent: 'bg-purple-500' },
  LHR: { photo: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=800&q=80', accent: 'bg-slate-500' },
  LAX: { photo: 'https://images.unsplash.com/photo-1534430480872-3498386e7856?w=800&q=80', accent: 'bg-orange-500' },
  AMS: { photo: 'https://images.unsplash.com/photo-1512470876302-972faa2aa9a4?w=800&q=80', accent: 'bg-indigo-500' },
  FRA: { photo: 'https://images.unsplash.com/photo-1564507592333-c60657eea523?w=800&q=80', accent: 'bg-gray-500' },
  CMB: { photo: 'https://images.unsplash.com/photo-1570168007204-dfb528c6958f?w=800&q=80', accent: 'bg-teal-500' },
};

const CABIN_CLASSES = [
  {
    key: 'economy',
    label: 'Economy',
    icon: Armchair,
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    image: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=1200&q=80&fit=crop',
    imageAlt: 'Economy class cabin interior with rows of seats',
    badge: 'Most Popular',
    tagline: 'Smart comfort for every journey',
    perks: [
      { icon: Armchair,       label: 'Seat Pitch',      value: '30" standard recline' },
      { icon: UtensilsCrossed,label: 'Dining',          value: 'Complimentary hot meal' },
      { icon: Luggage,        label: 'Baggage',         value: '1 carry-on + 20kg checked' },
      { icon: Wifi,           label: 'Wi-Fi',           value: 'Basic in-flight internet' },
      { icon: Tv2,            label: 'Entertainment',   value: '500+ movies & shows' },
      { icon: Headphones,     label: 'Audio',           value: 'Complimentary headphones' },
    ],
  },
  {
    key: 'business',
    label: 'Business',
    icon: Star,
    color: 'text-purple-600',
    bg: 'bg-purple-50',
    border: 'border-purple-200',
    image: 'https://images.unsplash.com/photo-1540339832862-474599807836?w=1200&q=80&fit=crop',
    imageAlt: 'Business class lie-flat seat pod with ambient lighting',
    badge: 'Best Value',
    tagline: 'Work, rest and arrive refreshed',
    perks: [
      { icon: Armchair,       label: 'Seat',            value: '60" lie-flat pod bed' },
      { icon: UtensilsCrossed,label: 'Dining',          value: 'Chef-curated 4-course menu' },
      { icon: Luggage,        label: 'Baggage',         value: '2 bags + priority handling' },
      { icon: Wifi,           label: 'Wi-Fi',           value: 'High-speed unlimited internet' },
      { icon: Coffee,         label: 'Lounge Access',   value: 'Premium airport lounge' },
      { icon: CheckCircle2,   label: 'Boarding',        value: 'Priority & dedicated lane' },
    ],
  },
  {
    key: 'first',
    label: 'First Class',
    icon: Crown,
    color: 'text-amber-600',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    image: 'https://images.unsplash.com/photo-1612618736568-a2c7e77d5e3e?w=1200&q=80&fit=crop',
    imageAlt: 'First class private suite with enclosed door and luxury finishes',
    badge: 'Luxury',
    tagline: 'An exclusive world above the clouds',
    perks: [
      { icon: Sparkles,       label: 'Suite',           value: 'Private enclosed cabin suite' },
      { icon: UtensilsCrossed,label: 'Dining',          value: 'On-demand gourmet à la carte' },
      { icon: Luggage,        label: 'Baggage',         value: 'Unlimited + door-to-door delivery' },
      { icon: Wifi,           label: 'Wi-Fi',           value: 'Dedicated satellite internet' },
      { icon: Coffee,         label: 'Lounge',          value: 'Exclusive First Class lounge + spa' },
      { icon: Crown,          label: 'Concierge',       value: 'Personal 24/7 travel concierge' },
    ],
  },
];

const SERVICES = [
  { icon: UtensilsCrossed, label: 'Gourmet Dining',         desc: 'Chef-crafted menus with regional and international cuisine on every route.',       color: 'text-amber-600',  bg: 'bg-amber-50',  border: 'border-amber-100',  photo: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&q=80' },
  { icon: Tv2,             label: 'In-Flight Entertainment', desc: 'Over 500 movies, TV series, music albums, and games on seatback touchscreens.',   color: 'text-blue-600',   bg: 'bg-blue-50',   border: 'border-blue-100',   photo: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=600&q=80' },
  { icon: Wifi,            label: 'High-Speed Wi-Fi',        desc: 'Stay connected throughout your journey with our satellite-powered internet service.',color: 'text-cyan-600',   bg: 'bg-cyan-50',   border: 'border-cyan-100',   photo: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&q=80' },
  { icon: Luggage,         label: 'Flexible Baggage',        desc: 'Generous allowances with easy upgrades, priority handling, and real-time tracking.',color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-100', photo: 'https://images.unsplash.com/photo-1553481187-be93c21490a9?w=600&q=80' },
  { icon: ShieldCheck,     label: 'Travel Insurance',        desc: 'Comprehensive coverage including medical, cancellation, and missed connections.',   color: 'text-emerald-600',bg: 'bg-emerald-50',border: 'border-emerald-100',photo: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=600&q=80' },
  { icon: CheckCircle2,    label: 'Priority Boarding',       desc: 'Skip the queues with dedicated fast-track security and early boarding privileges.', color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-100', photo: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=600&q=80' },
];

const TESTIMONIALS = [
  { name: 'Sarah M.',  route: 'LHR → SIN', rating: 5, avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&q=80', text: 'Absolutely seamless from check-in to landing. The business class pod was incredible — I arrived refreshed and ready for my meetings. AeroLink has spoiled me for any other airline.' },
  { name: 'James T.',  route: 'CDG → DXB', rating: 5, avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&q=80', text: 'The online booking was quick, the check-in even faster. The meal selection was genuinely impressive and the Wi-Fi kept me productive the whole flight. Will always choose AeroLink.' },
  { name: 'Priya K.',  route: 'CMB → HND', rating: 5, avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&q=80', text: 'Travelling with my family has never been this easy. The kids loved the entertainment system and the crew was attentive and kind. The baggage handling was spotless too.' },
];

const LOYALTY_TIERS = [
  {
    name: 'Silver', icon: Award, miles: '0–25,000',
    color: 'text-slate-600', bg: 'bg-slate-50', border: 'border-slate-200', badge: 'bg-slate-200 text-slate-700',
    perks: ['Earn 1 mile per $1 spent', '10% bonus on all routes', 'Priority check-in', 'Extra 5kg baggage allowance'],
  },
  {
    name: 'Gold', icon: Star, miles: '25,001–75,000',
    color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-300', badge: 'bg-amber-400 text-white',
    perks: ['Earn 1.5 miles per $1 spent', '25% seat upgrade bonus', 'Lounge access on long-haul', 'Complimentary seat selection', 'Priority boarding lane'],
    featured: true,
  },
  {
    name: 'Platinum', icon: Gem, miles: '75,001+',
    color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-300', badge: 'bg-purple-600 text-white',
    perks: ['Earn 2 miles per $1 spent', 'Free business upgrades', 'All-lounge global access', 'Personal concierge 24/7', 'Complimentary companion ticket'],
  },
];

export default function ExperiencePage() {
  const navigate = useNavigate();
  const [activeClass, setActiveClass] = useState('business');
  const [flights, setFlights] = useState<any[]>([]);

  useEffect(() => {
    fetch(`${API_BASE}/api/v1/flights/`)
      .then(r => r.json())
      .then(d => setFlights(d.data || []))
      .catch(() => {});
  }, []);

  const destinations = useMemo(() => {
    const map = new Map<string, any>();
    flights.forEach(f => {
      if (!map.has(f.destination_airport) || f.base_price < map.get(f.destination_airport).base_price) {
        map.set(f.destination_airport, f);
      }
    });
    return Array.from(map.values())
      .filter(f => AIRPORT_NAMES[f.destination_airport])
      .sort((a, b) => a.base_price - b.base_price)
      .slice(0, 6);
  }, [flights]);

  const activeClassData = CABIN_CLASSES.find(c => c.key === activeClass)!;

  return (
    <div className="min-h-screen bg-white text-slate-900">

      {/* ── Header ── */}
      <header className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <button onClick={() => navigate('/')} className="cursor-pointer shrink-0">
            <img src="/aerolink_logo.png" alt="AeroLink" className="h-14 w-auto" />
          </button>
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-blue-600 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Home
          </button>
        </div>
      </header>

      {/* ── Hero ── */}
      <div className="relative bg-gradient-to-br from-blue-900 via-blue-800 to-blue-600 text-white py-24 px-4 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          {[...Array(6)].map((_, i) => (
            <Plane key={i} className={`absolute w-16 h-16 rotate-90 text-white`}
              style={{ top: `${15 + i * 14}%`, left: `${5 + i * 16}%`, opacity: 0.4 - i * 0.05 }} />
          ))}
        </div>
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <span className="inline-block text-xs font-bold text-blue-300 uppercase tracking-widest bg-blue-800/60 border border-blue-600 px-4 py-1.5 rounded-full mb-5">
            The AeroLink Experience
          </span>
          <h1 className="text-5xl font-extrabold leading-tight mb-4">
            Fly Beyond <span className="text-blue-300">Expectations</span>
          </h1>
          <p className="text-blue-100 text-lg leading-relaxed max-w-2xl mx-auto mb-8">
            Every seat, every meal, every moment — crafted to make your journey as remarkable as your destination.
          </p>
          <div className="flex flex-wrap justify-center gap-6 text-sm text-blue-200">
            {[
              { icon: Globe, text: '20 Global Routes' },
              { icon: Users, text: '2M+ Passengers Served' },
              { icon: Clock, text: '99% On-Time Rate' },
              { icon: Star,  text: '4.9★ Avg Rating' },
            ].map(({ icon: Icon, text }) => (
              <span key={text} className="flex items-center gap-1.5 font-semibold">
                <Icon className="w-4 h-4 text-blue-400" /> {text}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ── Cabin Classes ── */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <span className="inline-block text-xs font-bold text-blue-600 uppercase tracking-widest bg-blue-50 border border-blue-100 px-4 py-1.5 rounded-full mb-3">Cabin Classes</span>
            <h2 className="text-3xl font-extrabold text-slate-800">Choose Your Comfort Level</h2>
            <p className="text-slate-500 mt-2 text-sm max-w-md mx-auto">From smart economy to private first-class suites — there is a perfect cabin for every journey.</p>
          </div>

          {/* Tab switcher */}
          <div className="flex justify-center mb-10">
            <div className="flex flex-wrap justify-center gap-1 bg-slate-100 rounded-2xl p-1.5">
              {CABIN_CLASSES.map(c => (
                <button
                  key={c.key}
                  onClick={() => setActiveClass(c.key)}
                  className={`flex items-center gap-1.5 px-3 py-2 sm:px-6 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${activeClass === c.key ? `bg-white shadow-sm ${c.color}` : 'text-slate-500 hover:text-slate-700'}`}
                >
                  <c.icon className="w-4 h-4" />
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* Active class panel */}
          <div className={`border-2 ${activeClassData.border} rounded-3xl overflow-hidden shadow-xl transition-all`}>
            {/* Hero image */}
            <div className="relative h-56 sm:h-72 overflow-hidden">
              <img
                src={activeClassData.image}
                alt={activeClassData.imageAlt}
                className="w-full h-full object-cover transition-all duration-500"
                onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
              <div className="absolute bottom-0 left-0 p-6 text-white">
                <div className="flex items-center gap-3 mb-1">
                  <activeClassData.icon className="w-6 h-6" />
                  <h3 className="text-2xl font-extrabold">{activeClassData.label}</h3>
                  <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 uppercase tracking-wider">
                    {activeClassData.badge}
                  </span>
                </div>
                <p className="text-white/80 text-sm">{activeClassData.tagline}</p>
              </div>
              <div className="absolute top-4 right-4">
                <button
                  onClick={() => navigate('/')}
                  className="flex items-center gap-2 bg-white/90 hover:bg-white backdrop-blur-sm text-slate-800 font-bold text-sm px-4 py-2 rounded-xl cursor-pointer transition-all shadow-lg"
                >
                  Book Now <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
            {/* Perks grid */}
            <div className="bg-white p-6 sm:p-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeClassData.perks.map(perk => (
                <div key={perk.label} className="flex items-start gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className={`w-10 h-10 ${activeClassData.bg} border ${activeClassData.border} rounded-xl flex items-center justify-center shrink-0`}>
                    <perk.icon className={`w-5 h-5 ${activeClassData.color}`} />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">{perk.label}</div>
                    <div className="text-sm font-semibold text-slate-800">{perk.value}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── In-Flight Services ── */}
      <section className="py-20 px-4 bg-slate-50 border-y border-slate-200">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <span className="inline-block text-xs font-bold text-blue-600 uppercase tracking-widest bg-blue-50 border border-blue-100 px-4 py-1.5 rounded-full mb-3">Services</span>
            <h2 className="text-3xl font-extrabold text-slate-800">Everything You Need at 35,000 ft</h2>
            <p className="text-slate-500 mt-2 text-sm max-w-md mx-auto">Our in-flight services are designed to make every hour in the air feel like time well spent.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {SERVICES.map(s => (
              <div key={s.label} className={`bg-white border ${s.border} rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all group`}>
                {/* Photo strip */}
                <div className="relative h-36 overflow-hidden">
                  <img src={s.photo} alt={s.label} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                  <div className={`absolute bottom-3 left-3 w-10 h-10 ${s.bg} border ${s.border} rounded-xl flex items-center justify-center shadow-md`}>
                    <s.icon className={`w-5 h-5 ${s.color}`} />
                  </div>
                </div>
                <div className="p-5">
                  <h3 className="text-base font-bold text-slate-800 mb-1.5">{s.label}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Destinations Showcase ── */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <span className="inline-block text-xs font-bold text-blue-600 uppercase tracking-widest bg-blue-50 border border-blue-100 px-4 py-1.5 rounded-full mb-3">Destinations</span>
            <h2 className="text-3xl font-extrabold text-slate-800">The World Is Waiting</h2>
            <p className="text-slate-500 mt-2 text-sm max-w-md mx-auto">Live fares directly from our network. Every price shown is real and bookable today.</p>
          </div>
          {destinations.length === 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-5">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-48 bg-slate-100 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {destinations.map(f => {
                const theme = DEST_PHOTOS[f.destination_airport] ?? { photo: '', accent: 'bg-blue-500' };
                return (
                  <button
                    key={f.id}
                    onClick={() => navigate('/')}
                    className="relative text-white rounded-2xl overflow-hidden h-56 text-left group cursor-pointer hover:scale-[1.02] transition-transform shadow-lg"
                  >
                    {/* Real photo background */}
                    {theme.photo ? (
                      <img src={theme.photo} alt={AIRPORT_NAMES[f.destination_airport] ?? f.destination_airport}
                        className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-br from-blue-900 to-blue-600" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
                    <div className="absolute bottom-0 left-0 p-5">
                      <div className="text-xs font-bold text-white/60 uppercase tracking-widest mb-1">{f.origin_airport} → {f.destination_airport}</div>
                      <div className="text-2xl font-extrabold leading-none mb-2">{AIRPORT_NAMES[f.destination_airport]}</div>
                      <div className="flex items-center gap-2">
                        <span className={`${theme.accent} text-white text-xs font-bold px-2.5 py-1 rounded-full`}>
                          from ${Number(f.base_price).toFixed(0)}
                        </span>
                        <span className="text-white/70 text-xs">per person</span>
                      </div>
                    </div>
                    <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="flex items-center gap-1 text-[11px] font-bold text-white bg-white/20 px-2.5 py-1 rounded-full backdrop-blur-sm">
                        Book Now <ChevronRight className="w-3 h-3" />
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* ── Loyalty Programme ── */}
      <section className="py-20 px-4 bg-gradient-to-br from-slate-900 to-slate-800 text-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <span className="inline-block text-xs font-bold text-blue-400 uppercase tracking-widest bg-blue-900/50 border border-blue-700 px-4 py-1.5 rounded-full mb-3">AeroLink Miles</span>
            <h2 className="text-3xl font-extrabold">Earn More. Fly Better.</h2>
            <p className="text-slate-400 mt-2 text-sm max-w-md mx-auto">Every flight earns miles. Redeem for upgrades, free flights, and exclusive experiences.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {LOYALTY_TIERS.map(tier => (
              <div key={tier.name} className={`relative bg-slate-800 border ${tier.border} rounded-2xl p-7 transition-all ${tier.featured ? 'ring-2 ring-amber-400 scale-100 md:scale-105' : ''}`}>
                {tier.featured && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-amber-400 text-amber-900 text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider">
                    Most Popular
                  </div>
                )}
                <div className="flex items-center gap-3 mb-2">
                  <div className={`w-10 h-10 ${tier.bg} border ${tier.border} rounded-xl flex items-center justify-center`}>
                    <tier.icon className={`w-5 h-5 ${tier.color}`} />
                  </div>
                  <div>
                    <div className="font-extrabold text-white text-lg leading-none">{tier.name}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">{tier.miles} miles / year</div>
                  </div>
                </div>
                <div className="border-t border-slate-700 mt-5 pt-5 space-y-2.5">
                  {tier.perks.map(p => (
                    <div key={p} className="flex items-start gap-2.5 text-sm text-slate-300">
                      <CheckCircle2 className={`w-4 h-4 shrink-0 mt-0.5 ${tier.color}`} />
                      {p}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="text-center mt-10">
            <button
              onClick={() => navigate('/')}
              className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-10 py-3.5 rounded-xl text-sm transition-all cursor-pointer shadow-lg"
            >
              Join AeroLink Miles — It's Free
            </button>
            <p className="text-slate-500 text-xs mt-3">No annual fee. Miles never expire while your account is active.</p>
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <span className="inline-block text-xs font-bold text-blue-600 uppercase tracking-widest bg-blue-50 border border-blue-100 px-4 py-1.5 rounded-full mb-3">Testimonials</span>
            <h2 className="text-3xl font-extrabold text-slate-800">What Our Passengers Say</h2>
            <p className="text-slate-500 mt-2 text-sm">Over 2 million passengers trust AeroLink every year.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map(t => (
              <div key={t.name} className="bg-white border border-slate-200 rounded-2xl p-7 shadow-sm hover:shadow-md transition-all">
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(t.rating)].map((_, i) => <Star key={i} className="w-4 h-4 text-amber-400 fill-amber-400" />)}
                </div>
                <p className="text-slate-600 text-sm leading-relaxed mb-5 italic">"{t.text}"</p>
                <div className="flex items-center gap-3 border-t border-slate-100 pt-4">
                  <img src={t.avatar} alt={t.name}
                    className="w-10 h-10 rounded-full object-cover shrink-0 border-2 border-blue-100"
                    onError={e => { (e.target as HTMLImageElement).style.display='none'; }} />
                  <div>
                    <div className="text-sm font-bold text-slate-800">{t.name}</div>
                    <div className="text-xs text-slate-400 flex items-center gap-1"><Plane className="w-3 h-3 rotate-90" /> {t.route}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <div className="relative py-16 px-4 overflow-hidden">
        <img src="https://images.unsplash.com/photo-1464037866556-6812c9d1c72e?w=1600&q=80"
          alt="Aerial view above clouds"
          className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-blue-900/75" />
        <div className="relative max-w-3xl mx-auto text-center text-white">
          <h2 className="text-3xl font-extrabold mb-3">Ready to Experience AeroLink?</h2>
          <p className="text-blue-100 text-sm mb-7 max-w-lg mx-auto">Join millions of travellers who have chosen AeroLink for a seamless, elevated flying experience.</p>
          <button onClick={() => navigate('/')} className="bg-white hover:bg-blue-50 text-blue-700 font-bold px-10 py-3.5 rounded-xl text-sm transition-all cursor-pointer shadow-lg">
            Book Your Flight Now
          </button>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-100 py-8 text-center text-xs text-slate-400 space-y-2">
        <div className="flex justify-center mb-3">
          <img src="/aerolink_logo.png" alt="AeroLink" className="h-8 w-auto opacity-40" />
        </div>
        <p>© {new Date().getFullYear()} AeroLink Aviation. All rights reserved.</p>
      </footer>
    </div>
  );
}
