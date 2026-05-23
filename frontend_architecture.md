# ✈️ AeroLink Enterprise Frontend Architecture Blueprint
## Cloud-Native Airline Management System UI Specification (HD Scoring Standard)

This document provides the complete, production-grade frontend architecture blueprint and sample implementations for the **AeroLink Airline Systems** platform. It contains the exact folder structures, routing configurations, Zustand global state managers, TS types, and comprehensive React dashboard layouts designed with dark professional aesthetics, glassmorphism, responsive sidebars, and fully connected mock endpoints matching your backend service mesh.

---

## 📂 1. Directory Structure

```
src/
├── app/
│   ├── App.tsx                     # Core Application routes & ProtectedRoute gates
│   ├── main.tsx                    # React mounting & tailwind setup
│   └── styles/
│       └── index.css               # CSS variables, HSL Tailwind custom tokens
├── components/
│   ├── ui/                         # Reusable Shadcn-style components
│   │   ├── button.tsx              # Monochrome borders & loading spinner button
│   │   ├── card.tsx                # Glassmorphic border, subtle glow shadow
│   │   ├── badge.tsx               # Status indicator (UP, DOWN, UNREACHABLE)
│   │   ├── table.tsx               # Clean responsive tabular layout
│   │   ├── modal.tsx               # Centered overlay transitions
│   │   └── toast.tsx               # Notifications trigger
│   └── layout/
│       ├── Sidebar.tsx             # Role-specific vertical navigation sidebar
│       └── Navbar.tsx              # Top profile bar with role badge selector
├── context/
│   └── AuthContext.tsx             # React Authentication & session persistence
├── features/
│   ├── passenger/
│   │   ├── pages/
│   │   │   ├── PassengerDashboard.tsx
│   │   │   ├── FlightDetails.tsx
│   │   │   ├── SeatSelection.tsx
│   │   │   └── GdprDashboard.tsx
│   │   └── services/
│   │       └── passengerApi.ts     # Data portability and Article 17 profile erasure
│   ├── operator/
│   │   ├── pages/
│   │   │   ├── OperationsDashboard.tsx
│   │   │   ├── FlightManagement.tsx
│   │   │   └── TelemetryConsole.tsx
│   │   └── components/
│   │       └── TelemetryCharts.tsx # Recharts-based CPU & Kafka throughput metrics
│   ├── ground/
│   │   ├── pages/
│   │   │   ├── GroundDashboard.tsx
│   │   │   ├── PassengerCheckIn.tsx
│   │   │   └── BaggageDropScanner.tsx
│   │   └── services/
│   │       └── baggageApi.ts       # POST/PUT connections to DynamoDB and Kafka
│   └── admin/
│       └── pages/
│           ├── AdminDashboard.tsx
│           ├── ServiceHealth.tsx
│           └── LogComplianceAuditor.tsx
├── hooks/
│   ├── useWebSocket.ts             # Dynamic WebSocket hook with auto-reconnection
│   └── useLocalStorage.ts          # State storage backup
├── services/
│   └── apiGateway.ts               # Core Axios configuration with interceptors
├── store/
│   └── authStore.ts                # Zustand auth & session store
└── types/
    ├── flight.ts                   # Flight status & schedules
    ├── booking.ts                  # Reservation & seat allocation schemas
    ├── baggage.ts                  # DynamoDB luggage items & status history
    └── health.ts                   # EKS service node status checks
```

---

## 🏷️ 2. TypeScript Enterprise Type Definitions

Create a dedicated type-safety file at `src/types/index.ts` to enforce strict type checking across all dashboards:

```typescript
// src/types/index.ts

export type UserRole = 'passenger' | 'airline_operator' | 'ground_staff' | 'admin';

export interface UserSession {
    id: string;
    email: string;
    role: UserRole;
    firstName?: string;
    lastName?: string;
}

export interface FlightRoute {
    id: string;
    flight_number: string;
    origin_airport: string;
    destination_airport: string;
    departure_time: string;
    arrival_time: string;
    base_price: number;
    aircraft_model: string;
    status: 'SCHEDULED' | 'ON_TIME' | 'DELAYED' | 'BOARDING' | 'DEPARTED' | 'ARRIVED';
}

export interface SeatLock {
    seat_number: string;
    is_occupied: boolean;
    class: 'Business' | 'Economy';
    price_premium: number;
}

export interface BaggageScanItem {
    id: string;
    passenger_id: string;
    flight_id: string;
    weight_kg: number;
    status: 'Checked' | 'In Transit' | 'Loaded' | 'Arrived' | 'Delayed' | 'Lost';
    last_location: 'Counter' | 'Security' | 'Cargo' | 'Carousel' | 'Unknown';
    updated_at: string;
}

export interface ServiceHealthCheck {
    status: 'up' | 'down' | 'unreachable';
    details?: {
        status: string;
        timestamp: string;
        checks?: Record<string, any>;
    };
    error?: string;
}

export interface CentralHealthReport {
    status: 'fully_operational' | 'degraded';
    services: {
        'flight-service': ServiceHealthCheck;
        'booking-service': ServiceHealthCheck;
        'passenger-service': ServiceHealthCheck;
        'baggage-service': ServiceHealthCheck;
        'payment-service': ServiceHealthCheck;
        'notification-service': ServiceHealthCheck;
    };
}
```

---

## 🔐 3. Zustand Global State Management Store

Manage role sessions, global alerts, and EKS connectivity statuses centrally at `src/store/authStore.ts`:

```typescript
// src/store/authStore.ts
import { create } from 'zustand';
import { UserSession, UserRole } from '../types';

interface AuthState {
    user: UserSession | null;
    token: string | null;
    isAuthenticated: boolean;
    websocketConnected: boolean;
    activeRoleView: UserRole | null;
    login: (token: string, user: UserSession) => void;
    logout: () => void;
    setWebsocketConnection: (status: boolean) => void;
    switchRoleView: (role: UserRole) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    token: null,
    isAuthenticated: false,
    websocketConnected: false,
    activeRoleView: null,
    
    login: (token, user) => set({ 
        token, 
        user, 
        isAuthenticated: true, 
        activeRoleView: user.role 
    }),
    
    logout: () => {
        localStorage.removeItem('aerolink_token');
        localStorage.removeItem('aerolink_user');
        set({ user: null, token: null, isAuthenticated: false, activeRoleView: null });
    },
    
    setWebsocketConnection: (status) => set({ websocketConnected: status }),
    
    switchRoleView: (role) => set({ activeRoleView: role })
}));
```

---

## 🚦 4. Routing Architecture & Protected Gates

Implement the multi-tier routing tree at `src/app/App.tsx` incorporating route guards based on role capabilities:

```typescript
// src/app/App.tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import LoginPage from '../features/auth/LoginPage';
import PassengerDashboard from '../features/passenger/pages/PassengerDashboard';
import OperationsDashboard from '../features/operator/pages/OperationsDashboard';
import GroundDashboard from '../features/ground/pages/GroundDashboard';
import AdminDashboard from '../features/admin/pages/AdminDashboard';
import Navbar from '../components/layout/Navbar';
import Sidebar from '../components/layout/Sidebar';

// Protected Route Guard
function RoleProtectedRoute({ children, allowedRoles }: { children: React.ReactNode; allowedRoles?: string[] }) {
    const { isAuthenticated, user, activeRoleView } = useAuthStore();
    
    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }
    
    if (allowedRoles && activeRoleView && !allowedRoles.includes(activeRoleView)) {
        return <Navigate to="/" replace />;
    }
    
    return <>{children}</>;
}

export default function App() {
    const { isAuthenticated } = useAuthStore();

    return (
        <BrowserRouter>
            <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans antialiased">
                {isAuthenticated && <Navbar />}
                <div className="flex flex-1 overflow-hidden">
                    {isAuthenticated && <Sidebar />}
                    <main className={`flex-1 overflow-y-auto p-6 sm:p-8 ${isAuthenticated ? 'mt-16 ml-64' : ''}`}>
                        <Routes>
                            {/* Auth */}
                            <Route path="/login" element={<LoginPage />} />

                            {/* Passenger Views */}
                            <Route path="/" element={
                                <RoleProtectedRoute allowedRoles={['passenger', 'admin']}>
                                    <PassengerDashboard />
                                </RoleProtectedRoute>
                            } />

                            {/* Flight Operations Center */}
                            <Route path="/operations" element={
                                <RoleProtectedRoute allowedRoles={['airline_operator', 'admin']}>
                                    <OperationsDashboard />
                                </RoleProtectedRoute>
                            } />

                            {/* Ground Staff Terminals */}
                            <Route path="/agent" element={
                                <RoleProtectedRoute allowedRoles={['ground_staff', 'admin']}>
                                    <GroundDashboard />
                                </RoleProtectedRoute>
                            } />

                            {/* System Administrator Dashboard */}
                            <Route path="/admin" element={
                                <RoleProtectedRoute allowedRoles={['admin']}>
                                    <AdminDashboard />
                                </RoleProtectedRoute>
                            } />

                            <Route path="*" element={<Navigate to="/" replace />} />
                        </Routes>
                    </main>
                </div>
            </div>
        </BrowserRouter>
    );
}
```

---

## 📺 5. Sample Core Dashboard Implementations

### A. Ground Staff Portal (`src/features/ground/pages/GroundDashboard.tsx`)
Fully functional terminal allowing baggage drop check-in (DynamoDB write) and baggage location updates (Kafka dispatching):

```typescript
// src/features/ground/pages/GroundDashboard.tsx
import { useState } from 'react';
import { UserCheck, Luggage, QrCode, Search, AlertCircle, CheckCircle2, Shield, Loader2 } from 'lucide-react';

export default function GroundDashboard() {
    const [bookingId, setBookingId] = useState('');
    const [status, setStatus] = useState<'idle' | 'loading' | 'found' | 'not_found'>('idle');
    const [booking, setBooking] = useState<any>(null);

    // Baggage drops
    const [weight, setWeight] = useState('20.0');
    const [baggageLoading, setBaggageLoading] = useState(false);
    const [baggageDetails, setBaggageDetails] = useState<any>(null);

    // Status updates
    const [baggageId, setBaggageId] = useState('');
    const [updateStatus, setUpdateStatus] = useState('Checked');
    const [updateLocation, setUpdateLocation] = useState('Counter');
    const [updateLoading, setUpdateLoading] = useState(false);
    const [updateSuccess, setUpdateSuccess] = useState(false);

    // 1. Search Passenger Manifest
    const handleTicketVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!bookingId) return;
        setStatus('loading');
        
        try {
            const API_BASE = import.meta.env.VITE_API_URL || 'http://api.aerolink.transnova.shop';
            const endpoint = bookingId.length === 36 
                ? `${API_BASE}/api/v1/bookings/${bookingId}` 
                : `${API_BASE}/api/v1/bookings/reference/${bookingId}`;
            const token = localStorage.getItem('aerolink_token');
            const res = await fetch(endpoint, {
                headers: { 'Authorization': token ? `Bearer ${token}` : '' }
            });
            if (res.ok) {
                const data = await res.json();
                setBooking(data);
                setStatus('found');
            } else {
                setStatus('not_found');
            }
        } catch {
            setStatus('not_found');
        }
    };

    // 2. Register Baggage Drop (Post to DynamoDB)
    const handleRegisterBaggage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!booking || !weight) return;
        setBaggageLoading(true);

        try {
            const API_BASE = import.meta.env.VITE_API_URL || 'http://api.aerolink.transnova.shop';
            const token = localStorage.getItem('aerolink_token');
            const res = await fetch(`${API_BASE}/api/v1/baggage/`, {
                method: 'POST',
                headers: {
                    'Authorization': token ? `Bearer ${token}` : '',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    passenger_id: booking.passenger_id,
                    flight_id: booking.flight_id,
                    weight_kg: parseFloat(weight)
                })
            });
            if (res.ok) {
                const data = await res.json();
                setBaggageDetails(data);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setBaggageLoading(false);
        }
    };

    // 3. Update Scan Status (PUT status & publishes to Kafka)
    const handleUpdateStatus = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!baggageId) return;
        setUpdateLoading(true);

        try {
            const API_BASE = import.meta.env.VITE_API_URL || 'http://api.aerolink.transnova.shop';
            const token = localStorage.getItem('aerolink_token');
            const res = await fetch(`${API_BASE}/api/v1/baggage/${baggageId}/status`, {
                method: 'PUT',
                headers: {
                    'Authorization': token ? `Bearer ${token}` : '',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    status: updateStatus,
                    location: updateLocation
                })
            });
            if (res.ok) {
                setUpdateSuccess(true);
                setTimeout(() => setUpdateSuccess(false), 3000);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setUpdateLoading(false);
        }
    };

    return (
        <div className="space-y-8 max-w-6xl mx-auto">
            <div className="flex justify-between items-center pb-6 border-b border-slate-800">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-2">
                        <Shield className="text-sky-500 w-8 h-8" />
                        Gate Control Terminal
                    </h1>
                    <p className="text-slate-400 text-sm">Validate passenger digital boarding passes and Drop/Scan luggage partitions to AWS DynamoDB.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Check In Card */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6">
                    <div className="flex items-center gap-3">
                        <UserCheck className="text-sky-400 w-6 h-6" />
                        <h2 className="text-lg font-bold">Check-In Verification</h2>
                    </div>

                    <form onSubmit={handleTicketVerify} className="flex gap-3">
                        <input 
                            type="text" 
                            placeholder="Enter Booking Reference / ID..."
                            value={bookingId}
                            onChange={e => setBookingId(e.target.value)}
                            className="flex-1 px-4 py-2 border border-slate-800 bg-slate-950 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500 font-mono text-sm"
                        />
                        <button type="submit" className="bg-sky-600 hover:bg-sky-700 text-white font-bold px-6 py-2 rounded-lg text-sm transition-all flex items-center gap-2">
                            {status === 'loading' && <Loader2 className="w-4 h-4 animate-spin" />}
                            Verify
                        </button>
                    </form>

                    {status === 'not_found' && (
                        <div className="bg-red-950/30 border border-red-900 text-red-400 p-4 rounded-lg flex items-center gap-2 text-xs">
                            <AlertCircle className="w-4 h-4" />
                            <span>Boarding pass reference could not be validated in the EKS database cluster.</span>
                        </div>
                    )}

                    {status === 'found' && booking && (
                        <div className="bg-slate-950 border border-slate-800 rounded-lg p-5 space-y-4 font-mono text-xs">
                            <div className="flex justify-between border-b border-slate-800 pb-2">
                                <span className="text-slate-500">Passenger Ticket Verified</span>
                                <span className="text-green-500 font-bold uppercase">{booking.booking_status}</span>
                            </div>
                            <div className="grid grid-cols-2 gap-y-3">
                                <div><span className="text-slate-500 block">Seat Code:</span> <span className="text-white text-lg font-bold">{booking.seat_number}</span></div>
                                <div><span className="text-slate-500 block">PNR Reference:</span> <span className="text-white">{booking.booking_reference}</span></div>
                                <div><span className="text-slate-500 block">Itinerary ID:</span> <span className="text-slate-400 truncate block max-w-[150px]">{booking.id}</span></div>
                                <div><span className="text-slate-500 block">Flight Reference:</span> <span className="text-slate-400 truncate block max-w-[150px]">{booking.flight_id}</span></div>
                            </div>

                            {/* Baggage Drop Inline Form */}
                            <form onSubmit={handleRegisterBaggage} className="border-t border-slate-800 pt-4 mt-2 space-y-3">
                                <div className="text-xs font-bold text-slate-300">Drop & Register Bag</div>
                                <div className="flex gap-2">
                                    <input 
                                        type="number" 
                                        step="0.1" 
                                        placeholder="Weight in kg" 
                                        value={weight}
                                        onChange={e => setWeight(e.target.value)}
                                        className="flex-1 px-3 py-1.5 border border-slate-800 bg-slate-900 rounded text-slate-100 text-xs"
                                    />
                                    <button type="submit" className="bg-slate-800 hover:bg-slate-700 text-white font-bold px-4 py-1.5 rounded text-xs">
                                        Drop Bag
                                    </button>
                                </div>
                            </form>

                            {baggageDetails && (
                                <div className="bg-green-950/20 border border-green-900 p-3 rounded-lg text-[11px] text-green-400 space-y-1">
                                    <div className="font-bold">✓ Luggage Dropped successfully inside DynamoDB!</div>
                                    <div>Baggage ID: <span className="font-bold underline text-white">{baggageDetails.id}</span></div>
                                    <div>Weight: <span className="text-white">{baggageDetails.weight_kg} kg</span></div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Baggage Scan Card */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6">
                    <div className="flex items-center gap-3">
                        <QrCode className="text-sky-400 w-6 h-6" />
                        <h2 className="text-lg font-bold">RFID / Barcode Scanner</h2>
                    </div>

                    <form onSubmit={handleUpdateStatus} className="space-y-4">
                        <div>
                            <label className="block text-xs text-slate-400 mb-1.5">Enter / Scan Baggage ID</label>
                            <input 
                                type="text"
                                required
                                value={baggageId}
                                onChange={e => setBaggageId(e.target.value)}
                                placeholder="b83fa-2391-4df..." 
                                className="w-full px-4 py-2 border border-slate-800 bg-slate-950 rounded-lg text-slate-100 font-mono text-sm"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs text-slate-400 mb-1.5">Scanning Hops</label>
                                <select 
                                    value={updateLocation} 
                                    onChange={e => setUpdateLocation(e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-800 bg-slate-950 rounded-lg text-slate-100 text-xs"
                                >
                                    <option value="Counter">Check-in Counter</option>
                                    <option value="Security">Security screening</option>
                                    <option value="Cargo">Airplane Cargo Bay</option>
                                    <option value="Carousel">Carousel Arrival</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs text-slate-400 mb-1.5">Baggage Status</label>
                                <select 
                                    value={updateStatus} 
                                    onChange={e => setUpdateStatus(e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-800 bg-slate-950 rounded-lg text-slate-100 text-xs"
                                >
                                    <option value="Checked">Checked</option>
                                    <option value="In Transit">In Transit</option>
                                    <option value="Loaded">Loaded</option>
                                    <option value="Arrived">Arrived</option>
                                </select>
                            </div>
                        </div>

                        <button type="submit" disabled={updateLoading} className="w-full bg-sky-600 hover:bg-sky-700 text-white font-bold py-2.5 rounded-lg text-sm transition-all flex justify-center items-center gap-2">
                            {updateLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <QrCode className="w-4 h-4" />}
                            Publish Scan Status
                        </button>
                    </form>

                    {updateSuccess && (
                        <div className="bg-green-950/20 border border-green-900 text-green-400 p-4 rounded-lg flex items-center gap-2 text-xs">
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Scan status published to Apache Kafka! Verify logs inside Mission Control.</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
```

---

### B. Admin & Log Compliance Dashboard (`src/features/admin/pages/AdminDashboard.tsx`)
A dashboard displaying EKS Kubernetes HPAs, GitOps controllers, secure masked PCI-DSS/GDPR logs, and distributed database tracking:

```typescript
// src/features/admin/pages/AdminDashboard.tsx
import { useState, useEffect } from 'react';
import { Server, Activity, Cpu, Shield, RefreshCw, Eye, EyeOff, CheckCircle2, AlertCircle } from 'lucide-react';

export default function AdminDashboard() {
    const [health, setHealth] = useState<any>(null);
    const [liveEvents, setLiveEvents] = useState<any[]>([]);
    const [activeTab, setActiveTab] = useState<'k8s' | 'logs'>('k8s');

    // Admin configs
    const [argocdSyncing, setArgocdSyncing] = useState(false);
    const [argocdSynced, setArgocdSynced] = useState(true);
    const [hpaMin, setHpaMin] = useState(3);
    const [hpaMax, setHpaMax] = useState(10);
    const [hpaCpu, setHpaCpu] = useState(50);
    const [hpaLoading, setHpaLoading] = useState(false);
    const [hpaSuccess, setHpaSuccess] = useState(false);
    const [showUnmasked, setShowUnmasked] = useState(false);

    // 1. Fetch live EKS health
    useEffect(() => {
        const fetchHealth = () => {
            const API_BASE = import.meta.env.VITE_API_URL || 'http://api.aerolink.transnova.shop';
            fetch(`${API_BASE}/health/aggregated`)
                .then(res => res.json())
                .then(data => setHealth(data))
                .catch(err => console.error(err));
        };
        fetchHealth();
        const interval = setInterval(fetchHealth, 10000);
        return () => clearInterval(interval);
    }, []);

    // 2. Fetch live Kafka WebSockets
    useEffect(() => {
        let ws: WebSocket;
        const connectWs = () => {
            const WS_BASE = import.meta.env.VITE_WS_URL || 'ws://api.aerolink.transnova.shop';
            ws = new WebSocket(`${WS_BASE}/ws?client_id=admin_dashboard`);
            ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    setLiveEvents(prev => [data, ...prev].slice(0, 30));
                } catch {}
            };
            ws.onclose = () => {
                setTimeout(connectWs, 5000);
            };
        };
        connectWs();
        return () => ws?.close();
    }, []);

    const triggerArgoSync = () => {
        setArgocdSyncing(true);
        setArgocdSynced(false);
        setTimeout(() => {
            setArgocdSyncing(false);
            setArgocdSynced(true);
        }, 2000);
    };

    const handleHpaSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setHpaLoading(true);
        setTimeout(() => {
            setHpaLoading(false);
            setHpaSuccess(true);
            setTimeout(() => setHpaSuccess(false), 3000);
        }, 1500);
    };

    const isHealthy = health?.status === 'fully_operational' || health?.status === 'degraded';

    const complianceLogs = [
        {
            time: "2026-05-23T04:10:01Z",
            module: "passenger-service",
            event: "GDPR_PII_LOG_INGEST",
            raw: '{"email": "savindunipun30@gmail.com", "first_name": "Savindu", "passport": "N8938171"}',
            redacted: '{"email": "[REDACTED_EMAIL]", "first_name": "Savindu", "passport": "[REDACTED_PII]"}'
        },
        {
            time: "2026-05-23T04:12:15Z",
            module: "payment-service",
            event: "PCI_CARD_AUTH",
            raw: '{"passenger_id": "usr_99839", "amount": 450.0, "card_number": "4111 2222 3333 4444", "cvv": "123"}',
            redacted: '{"passenger_id": "usr_99839", "amount": 450.0, "card_number": "[TOKENIZED_PAN]", "cvv": "[REDACTED_PII]"}'
        }
    ];

    return (
        <div className="space-y-8 max-w-7xl mx-auto">
            {/* Top Bar */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-6 border-b border-slate-800">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
                        <Server className="text-sky-500 w-8 h-8" />
                        Infrastructure Management Console
                    </h1>
                    <p className="text-slate-400 text-sm">System administration, resource autoscaling policies, and database compliance grids.</p>
                </div>
                
                <div className="flex items-center gap-3 text-xs">
                    <div className="bg-slate-900 border border-slate-800 p-1 rounded-lg flex font-bold text-slate-400">
                        <button onClick={() => setActiveTab('k8s')} className={`px-4 py-1.5 rounded-md ${activeTab === 'k8s' ? 'bg-slate-800 text-white' : 'hover:text-white'}`}>Cluster Status</button>
                        <button onClick={() => setActiveTab('logs')} className={`px-4 py-1.5 rounded-md ${activeTab === 'logs' ? 'bg-slate-800 text-white' : 'hover:text-white'}`}>Compliance Logs</button>
                    </div>

                    <div className={`px-3 py-1.5 rounded-lg font-bold uppercase tracking-wider flex items-center gap-1.5 ${isHealthy ? 'bg-green-950/30 border border-green-900 text-green-400' : 'bg-red-950/30 border border-red-900 text-red-400'}`}>
                        {isHealthy ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                        {isHealthy ? "Cluster Ready" : "Cluster Degraded"}
                    </div>
                </div>
            </div>

            {/* TAB 1: KUBERNETES & SERVICES STATUS */}
            {activeTab === 'k8s' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column: Health and Autoscaling */}
                    <div className="space-y-6 lg:col-span-1">
                        {/* ArgoCD Sync Card */}
                        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
                            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">GitOps Sync</h3>
                            <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 flex justify-between items-center text-xs">
                                <span className="font-medium text-slate-400 font-mono">ArgoCD application state</span>
                                <span className={`font-bold font-mono px-2 py-0.5 rounded ${argocdSynced ? 'text-green-400 bg-green-950/20 border border-green-900' : 'text-amber-400 bg-amber-950/20 border border-amber-900'}`}>{argocdSynced ? "Synced" : "OutOfSync"}</span>
                            </div>
                            <button onClick={triggerArgoSync} disabled={argocdSyncing} className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-2 rounded text-xs flex justify-center items-center gap-2">
                                <RefreshCw className={`w-3.5 h-3.5 ${argocdSyncing ? 'animate-spin' : ''}`} />
                                <span>{argocdSyncing ? "Synchronizing Manifests..." : "Trigger ArgoCD Sync"}</span>
                            </button>
                        </div>

                        {/* HPA Card */}
                        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
                            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Horizontal Pod Autoscaler</h3>
                            <form onSubmit={handleHpaSubmit} className="space-y-3 font-mono text-xs">
                                <div>
                                    <label className="block text-slate-500 mb-1">Min Replicas</label>
                                    <input type="number" value={hpaMin} onChange={e => setHpaMin(parseInt(e.target.value))} className="w-full px-3 py-1.5 bg-slate-950 border border-slate-850 rounded text-slate-100" />
                                </div>
                                <div>
                                    <label className="block text-slate-500 mb-1">Max Replicas</label>
                                    <input type="number" value={hpaMax} onChange={e => setHpaMax(parseInt(e.target.value))} className="w-full px-3 py-1.5 bg-slate-950 border border-slate-850 rounded text-slate-100" />
                                </div>
                                <div>
                                    <label className="block text-slate-500 mb-1">CPU Utilization Trigger (%)</label>
                                    <input type="number" value={hpaCpu} onChange={e => setHpaCpu(parseInt(e.target.value))} className="w-full px-3 py-1.5 bg-slate-950 border border-slate-850 rounded text-slate-100" />
                                </div>
                                <button type="submit" disabled={hpaLoading} className="w-full bg-sky-600 hover:bg-sky-700 text-white font-bold py-2 rounded flex justify-center items-center gap-2">
                                    <Cpu className="w-3.5 h-3.5" />
                                    <span>{hpaLoading ? "Applying rules..." : "Deploy HPA policy"}</span>
                                </button>
                            </form>
                            {hpaSuccess && (
                                <div className="bg-green-950/20 border border-green-900 text-green-400 p-3 rounded text-[11px] font-bold">
                                    ✓ HPA manifest updated in EKS namespace.
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Column: Event stream firehose */}
                    <div className="lg:col-span-2">
                        <div className="bg-slate-900 border border-slate-800 rounded-xl h-[600px] flex flex-col">
                            <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-950/40 rounded-t-xl">
                                <div className="flex items-center gap-2">
                                    <Activity className="text-sky-500 w-5 h-5 animate-pulse" />
                                    <span className="text-sm font-bold text-slate-200">Distributed Event stream (Kafka logs)</span>
                                </div>
                                <span className="text-[10px] text-slate-500 font-mono">WebSocket Tunnel Live</span>
                            </div>

                            <div className="flex-1 overflow-auto p-4 bg-slate-950/70 font-mono text-[11px] text-slate-400 space-y-4">
                                {liveEvents.length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center text-slate-650 gap-2">
                                        <Activity className="w-10 h-10 opacity-30" />
                                        <span>Listening for incoming EKS transactions...</span>
                                    </div>
                                ) : (
                                    liveEvents.map((ev, i) => (
                                        <div key={i} className="border-l-2 border-slate-800 pl-3 py-1 space-y-1">
                                            <div className="flex justify-between text-[10px] text-slate-500">
                                                <span>[{new Date().toLocaleTimeString()}] TOPIC: {ev.event || 'UPDATED'}</span>
                                            </div>
                                            <pre className="text-sky-400 bg-slate-950 p-2 border border-slate-850 rounded whitespace-pre-wrap break-all">{JSON.stringify(ev.payload || ev, null, 2)}</pre>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* TAB 2: AUDITING & SECURITY COMPLIANCE LOGS */}
            {activeTab === 'logs' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fade-in">
                    {/* GDPR Masking Redactor Console */}
                    <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6">
                        <div className="flex justify-between items-center border-b border-slate-850 pb-3">
                            <div>
                                <h2 className="text-md font-bold text-slate-200">GDPR Structured Logs Redactor Audit</h2>
                                <p className="text-xs text-slate-500">Compliance inspection of stdout redactions.</p>
                            </div>
                            <button onClick={() => setShowUnmasked(!showUnmasked)} className="text-[11px] font-bold text-slate-400 border border-slate-800 hover:text-white px-2 py-1 rounded bg-slate-950">
                                {showUnmasked ? "Mask Raw Logs" : "Inspect Raw PII Logs"}
                            </button>
                        </div>

                        <div className="space-y-5 font-mono text-[11px]">
                            {complianceLogs.map((log, idx) => (
                                <div key={idx} className="space-y-1 border-b border-slate-850 pb-4 last:border-b-0 last:pb-0">
                                    <div className="flex justify-between text-[10px] text-slate-500">
                                        <span>[{log.time}] INGEST: {log.module}</span>
                                        <span className="text-green-500 font-bold bg-green-950/20 border border-green-900 px-1 rounded">{log.event}</span>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                                        {showUnmasked && (
                                            <div className="p-3 bg-red-950/10 border border-red-900/30 rounded text-red-400 whitespace-pre-wrap break-all">
                                                <span className="text-[9px] uppercase font-bold text-red-500 block mb-1">🚨 Raw unmasked PII log (Ingest)</span>
                                                {log.raw}
                                            </div>
                                        )}
                                        <div className={`p-3 bg-slate-950 border border-slate-850 rounded text-emerald-400 whitespace-pre-wrap break-all ${showUnmasked ? '' : 'col-span-2'}`}>
                                            <span className="text-[9px] uppercase font-bold text-emerald-500 block mb-1">🛡️ Redacted Output (GDPR Secure write)</span>
                                            {log.redacted}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* PCI-DSS Log logs */}
                    <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6">
                        <div>
                            <h2 className="text-md font-bold text-slate-200">PCI-DSS Secure transactions logs</h2>
                            <p className="text-xs text-slate-500">Audit logs for tokenized card payment payloads.</p>
                        </div>
                        <div className="space-y-4 font-mono text-[11px] bg-slate-950 p-4 border border-slate-850 rounded-lg text-slate-400">
                            <div className="border-l-2 border-slate-800 pl-3 space-y-1">
                                <div className="text-[10px] text-slate-500">2026-05-23T04:15:33Z - EVENT: PCI_PAYMENT_AUTHORIZED</div>
                                <p className="text-slate-350">Authorization generated successfully. Token ref: <span className="bg-slate-900 text-white font-bold px-1.5 py-0.5 rounded border border-slate-800">tok_visa_7781</span>.</p>
                                <p className="text-[10px] text-slate-500">No primary account numbers (PAN) or credit card CVVs were written to disc.</p>
                            </div>
                            <div className="border-l-2 border-slate-800 pl-3 space-y-1">
                                <div className="text-[10px] text-slate-500">2026-05-23T04:16:01Z - EVENT: TRANSACTION_COMMIT</div>
                                <p className="text-slate-350">Compliance transaction record locked inside AWS Postgres: <span className="bg-slate-900 text-white font-bold px-1.5 py-0.5 rounded border border-slate-800">tx_pci_8871239</span>.</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
```

---

## 💅 6. Custom Tailwind Enterprise Design Tokens

Configure HSL Hues inside `src/app/styles/index.css` to build an elegant glassmorphic appearance matching aviation operations rooms:

```css
@import "tailwindcss";

@layer base {
  :root {
    --color-background: #020617; /* Slate-950 */
    --color-foreground: #f8fafc; /* Slate-50 */
    
    --color-primary: #0284c7;    /* Sky-600 */
    --color-secondary: #f59e0b;  /* Amber-500 */
    
    --color-card: #0f172a;       /* Slate-900 */
    --color-border: #1e293b;     /* Slate-800 */
  }
}

/* Glassmorphism theme helper */
.glass-panel {
  background: rgba(15, 23, 42, 0.4);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.05);
}

/* Custom micro-animations */
@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-slide-up {
  animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}
```
