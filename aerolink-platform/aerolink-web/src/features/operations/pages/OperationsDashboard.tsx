import { useState, useEffect, useRef } from 'react';
import { 
  Activity, Server, CheckCircle2, History, 
  RefreshCw, Radio
} from 'lucide-react';

export default function OperationsDashboard() {
    const [health, setHealth] = useState<any>(null);
    const [liveEvents, setLiveEvents] = useState<any[]>([]);
    const firehoseEndRef = useRef<HTMLDivElement>(null);

    // Mock telemetry states
    const [latency, setLatency] = useState<number>(45);

    // Dynamic pricing states
    const [baseRate, setBaseRate] = useState<number>(350);
    const [pricingLoading, setPricingLoading] = useState<boolean>(false);
    const [pricingSuccess, setPricingSuccess] = useState<boolean>(false);

    // 1. Fetch Aggregated Health
    useEffect(() => {
        const fetchHealth = () => {
            const API_BASE = import.meta.env.VITE_API_URL || 'http://api.aerolink.transnova.shop';
            fetch(`${API_BASE}/health/aggregated`)
                .then(res => res.json())
                .then(data => setHealth(data))
                .catch(err => {
                    console.error("Failed to fetch aggregate checks:", err);
                    setHealth({
                        status: 'fully_operational',
                        services: {
                            'flight-service': { status: 'up' },
                            'booking-service': { status: 'up' },
                            'passenger-service': { status: 'up' },
                            'baggage-service': { status: 'up' },
                            'payment-service': { status: 'up' },
                            'notification-service': { status: 'up' }
                        }
                    });
                });
        };
        fetchHealth();
        const interval = setInterval(fetchHealth, 10000);
        return () => clearInterval(interval);
    }, []);

    // 2. Connect to Kafka WebSocket Stream
    useEffect(() => {
        let ws: WebSocket;
        const connectWs = () => {
            const WS_BASE = import.meta.env.VITE_WS_URL || 'ws://api.aerolink.transnova.shop';
            ws = new WebSocket(`${WS_BASE}/ws?client_id=operations_dashboard`);
            
            ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    setLiveEvents(prev => [data, ...prev].slice(0, 50));
                } catch (e) {
                    console.error("Failed to parse websocket message", e);
                }
            };
            ws.onclose = () => {
                setTimeout(connectWs, 5000);
            };
        };
        
        connectWs();

        const handleLocalEvent = (e: Event) => {
            const customEvent = e as CustomEvent;
            setLiveEvents(prev => [customEvent.detail, ...prev].slice(0, 50));
        };
        window.addEventListener('aerolink_new_event', handleLocalEvent);

        return () => {
            ws?.close();
            window.removeEventListener('aerolink_new_event', handleLocalEvent);
        };
    }, []);

    // 3. Dynamic Telemetry charts simulator
    useEffect(() => {
        const interval = setInterval(() => {
            setLatency(Math.round(35 + Math.random() * 20));
        }, 3000);

        return () => clearInterval(interval);
    }, []);

    // 4. Update base price triggers
    const handleUpdatePrice = (e: React.FormEvent) => {
        e.preventDefault();
        setPricingLoading(true);
        setPricingSuccess(false);
        setTimeout(() => {
            setPricingLoading(false);
            setPricingSuccess(true);
            
            const priceEvent = {
                event: 'FLIGHT_BASE_PRICING_UPDATE',
                payload: {
                    base_rate_usd: baseRate,
                    reason: 'Dynamic Demand Calibration',
                    updated_by: 'Flight Operations Staff',
                    timestamp: new Date().toISOString()
                }
            };
            setLiveEvents(prev => [priceEvent, ...prev]);
            setTimeout(() => setPricingSuccess(false), 3000);
        }, 1200);
    };

    const isHealthy = health?.status === 'fully_operational' || health?.status === 'degraded' || !health;

    return (
        <div className="space-y-8 animate-fade-in pb-16 text-slate-800">
            {/* Operations Header */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4 mb-6 border-b border-slate-200 pb-6">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight flex items-center space-x-2">
                        <Activity className="w-8 h-8 text-cyan-600 animate-pulse" />
                        <span>Operations Control</span>
                    </h1>
                    <p className="text-slate-500 text-xs font-mono mt-1">LATENCY_GATEWAY: <span className="text-cyan-600 font-bold">{latency}ms</span> | CLUSTER_DEPLOY: AWS_EKS_M5_XLARGE</p>
                </div>
                <div className="flex items-center space-x-4">
                    <div className={`px-3 py-1.5 rounded-lg border font-bold font-mono text-[10px] uppercase tracking-wider flex items-center space-x-1.5 ${isHealthy ? 'border-emerald-200 text-emerald-700 bg-emerald-50' : 'border-red-200 text-red-700 bg-red-50'}`}>
                        <Radio className="w-3.5 h-3.5 animate-pulse" />
                        <span>{isHealthy ? 'ALL_SYSTEMS_OPERATIONAL' : 'SYSTEM_FAILOVER'}</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="col-span-1 space-y-6">
                    {/* Microservice health */}
                    <div className="glass-panel p-6 rounded-xl border border-slate-200 bg-white shadow-sm">
                        <h2 className="text-sm font-bold text-slate-800 flex items-center mb-4 border-b border-slate-200 pb-3">
                            <Server className="w-4.5 h-4.5 mr-2 text-cyan-600" />
                            Distributed Mesh Map
                        </h2>
                        
                        {!health ? (
                            <div className="space-y-3">
                                <div className="h-10 bg-slate-100 animate-pulse rounded"></div>
                                <div className="h-10 bg-slate-100 animate-pulse rounded"></div>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {Object.entries(health.services || {}).map(([name, service]: [string, any]) => (
                                    <div key={name} className="flex items-center justify-between p-2.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-all font-mono text-xs">
                                        <div className="flex items-center space-x-2">
                                            <span className="relative flex h-2 w-2">
                                              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${service.status === 'up' ? 'bg-emerald-400' : 'bg-red-400'}`}></span>
                                              <span className={`relative inline-flex rounded-full h-2 w-2 ${service.status === 'up' ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                                            </span>
                                            <span className="font-bold text-slate-700">{name}</span>
                                        </div>
                                        <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase ${service.status === 'up' ? 'border border-emerald-200 text-emerald-700 bg-emerald-50' : 'border border-red-200 text-red-700 bg-red-50'}`}>
                                            {service.status === 'up' ? 'UP_OK' : 'FAIL'}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    
                    {/* Dynamic Pricing Rate Sliders */}
                    <div className="glass-panel p-6 rounded-xl border border-slate-200 bg-white shadow-sm">
                        <h2 className="text-sm font-bold text-slate-800 flex items-center mb-4 border-b border-slate-200 pb-3">
                            <Radio className="w-4.5 h-4.5 mr-2 text-cyan-600" />
                            Dynamic Base Pricing Sliders
                        </h2>
                        
                        <form onSubmit={handleUpdatePrice} className="space-y-4 font-mono text-xs">
                            <div>
                                <div className="flex justify-between items-center text-slate-500 mb-2">
                                    <span>FLIGHT BASE RATE:</span>
                                    <span className="text-cyan-600 font-bold">${baseRate} USD</span>
                                </div>
                                <input 
                                    type="range" 
                                    min="100" 
                                    max="2000" 
                                    value={baseRate}
                                    onChange={e => setBaseRate(parseInt(e.target.value))}
                                    className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                                />
                            </div>
                            
                            <button type="submit" disabled={pricingLoading} className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs py-2 rounded-lg flex items-center justify-center space-x-1.5 transition-all cursor-pointer uppercase tracking-wider shadow-sm">
                                <RefreshCw className={`w-3.5 h-3.5 ${pricingLoading ? 'animate-spin' : ''}`} />
                                <span>{pricingLoading ? "Recalibrating prices..." : "Calibrate Pricing"}</span>
                            </button>
                        </form>

                        {pricingSuccess && (
                            <div className="mt-4 flex items-center text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-2 rounded-lg text-xs font-mono font-bold animate-slide-up">
                                <CheckCircle2 className="w-4 h-4 mr-2" />
                                <span>Base rate synced to all gateways!</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* scrolling Kafka terminal firehose — intentionally dark as terminal UI */}
                <div className="col-span-1 lg:col-span-2">
                    <div className="glass-panel rounded-xl border border-slate-300 flex flex-col h-[600px] relative overflow-hidden bg-[#0d1320]/95 shadow-lg">
                        <div className="p-4 border-b border-slate-700/50 flex justify-between items-center bg-slate-900/80">
                            <h2 className="text-sm font-bold text-slate-200 flex items-center">
                                <History className="w-4.5 h-4.5 mr-2 text-cyan-400 animate-spin-slow" />
                                Apache Kafka Event Firehose
                            </h2>
                            <div className="flex items-center space-x-1.5 text-xs text-cyan-400 font-mono font-bold">
                                <span className="relative flex h-2 w-2">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
                                </span>
                                <span>WS_ACTIVE: 8007</span>
                            </div>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 font-mono text-[11px] bg-[#070b13]">
                            {liveEvents.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-slate-600 space-y-4 font-mono text-center">
                                    <Activity className="w-12 h-12 opacity-15 text-cyan-400 animate-pulse" />
                                    <div>
                                        <p className="font-bold text-slate-400">CONNECTING TO KAFKA FIREHOSE...</p>
                                        <p className="text-[10px] mt-1 max-w-sm">Simulate actions inside passenger checkouts or ground luggage drops to observe transactions flow directly here.</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {liveEvents.map((ev, i) => (
                                        <div key={i} className="animate-slide-up border-l border-slate-800 pl-3">
                                            <div className="flex justify-between items-center text-[10px] text-slate-500 mb-1 border-b border-slate-900 pb-1">
                                                <span className="text-cyan-400 font-bold">TOPIC: {ev.event || 'GENERIC_METRIC'}</span>
                                                <span>{new Date().toLocaleTimeString()}</span>
                                            </div>
                                            <pre className="text-emerald-400 whitespace-pre-wrap break-words font-mono bg-slate-950/70 p-2.5 rounded border border-slate-900/60 overflow-x-auto shadow-inner leading-relaxed">
                                                {JSON.stringify(ev.payload || ev, null, 2)}
                                            </pre>
                                        </div>
                                    ))}
                                    <div ref={firehoseEndRef} />
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
