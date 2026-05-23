import { useState, useEffect } from 'react';
import { Activity, Server, AlertCircle, CheckCircle2, History, Database, Shield, Cpu, RefreshCw, Eye, EyeOff } from 'lucide-react';

export default function OperationsDashboard() {
    const [health, setHealth] = useState<any>(null);
    const [liveEvents, setLiveEvents] = useState<any[]>([]);
    const [activeTab, setActiveTab] = useState<'mission-control' | 'policies'>('mission-control');

    // Admin state configurations
    const [argocdSyncing, setArgocdSyncing] = useState(false);
    const [argocdSynced, setArgocdSynced] = useState(true);
    const [hpaMin, setHpaMin] = useState(3);
    const [hpaMax, setHpaMax] = useState(10);
    const [hpaCpu, setHpaCpu] = useState(50);
    const [hpaLoading, setHpaLoading] = useState(false);
    const [hpaSuccess, setHpaSuccess] = useState(false);

    // GDPR Masking preview state
    const [showUnmasked, setShowUnmasked] = useState(false);

    // 1. Fetch Aggregated Health
    useEffect(() => {
        const fetchHealth = () => {
            const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';
            fetch(`${API_BASE}/health/aggregated`)
                .then(res => res.json())
                .then(data => setHealth(data))
                .catch(err => console.error(err));
        };
        fetchHealth();
        const interval = setInterval(fetchHealth, 10000); // Polling every 10s
        return () => clearInterval(interval);
    }, []);

    // 2. Connect to Kafka WebSocket Stream
    useEffect(() => {
        let ws: WebSocket;
        const connectWs = () => {
            const WS_BASE = import.meta.env.VITE_WS_URL || 'ws://localhost:8007';
            ws = new WebSocket(`${WS_BASE}/ws?client_id=operations_dashboard`);
            
            ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    setLiveEvents(prev => [data, ...prev].slice(0, 50)); // Keep last 50 events
                } catch (e) {
                    console.error("Failed to parse websocket message", e);
                }
            };
            ws.onclose = () => {
                setTimeout(connectWs, 5000); // Reconnect if dropped
            };
        };
        
        connectWs();
        return () => ws?.close();
    }, []);

    // 3. Trigger ArgoCD Re-sync (GitOps sync simulation)
    const handleArgoSync = () => {
        setArgocdSyncing(true);
        setArgocdSynced(false);
        setTimeout(() => {
            setArgocdSyncing(false);
            setArgocdSynced(true);
        }, 2000);
    };

    // 4. Update HPA Rule (Mock configuration persistence)
    const handleUpdateHpa = (e: React.FormEvent) => {
        e.preventDefault();
        setHpaLoading(true);
        setHpaSuccess(false);
        setTimeout(() => {
            setHpaLoading(false);
            setHpaSuccess(true);
            setTimeout(() => setHpaSuccess(false), 3000);
        }, 1500);
    };

    const isHealthy = health?.status === 'fully_operational' || health?.status === 'degraded';

    // Mock logs demonstrating PII Redaction dynamically
    const mockLogs = [
        {
            timestamp: "2026-05-23T04:10:01Z",
            service: "passenger-service",
            event: "PASSENGER_REGISTRATION_SUCCESS",
            raw: '{"email": "savindunipun30@gmail.com", "first_name": "Savindu", "last_name": "Fernando", "passport": "N8938171"}',
            masked: '{"email": "[REDACTED_EMAIL]", "first_name": "Savindu", "last_name": "Fernando", "passport": "[REDACTED_PII]"}'
        },
        {
            timestamp: "2026-05-23T04:10:15Z",
            service: "payment-service",
            event: "PAYMENT_AUTHORIZED",
            raw: '{"passenger_id": "usr_99839", "amount": 250.0, "card_number": "4111 2222 3333 4444", "cvv": "123"}',
            masked: '{"passenger_id": "usr_99839", "amount": 250.0, "card_number": "[TOKENIZED_PAN]", "cvv": "[REDACTED_PII]"}'
        }
    ];

    return (
        <div className="space-y-8 animate-fade-in pb-16">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4 mb-6 border-b border-slate-200 pb-6">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Mission Control</h1>
                    <p className="text-slate-500">Live Telemetry & Global Operations</p>
                </div>
                <div className="flex items-center space-x-4">
                    <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs font-bold">
                        <button 
                            onClick={() => setActiveTab('mission-control')}
                            className={`px-3 py-1.5 rounded transition-all ${activeTab === 'mission-control' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
                        >
                            Telemetry
                        </button>
                        <button 
                            onClick={() => setActiveTab('policies')}
                            className={`px-3 py-1.5 rounded transition-all ${activeTab === 'policies' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
                        >
                            Admin & Policies
                        </button>
                    </div>

                    <div className={`px-4 py-2 rounded-lg font-medium flex items-center space-x-2 text-xs uppercase tracking-wider ${isHealthy ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {isHealthy ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                        <span>{isHealthy ? 'All Systems Go' : 'Offline'}</span>
                    </div>
                </div>
            </div>

            {/* TAB A: MISSION CONTROL TELEMETRY */}
            {activeTab === 'mission-control' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Microservice Health Cluster */}
                    <div className="col-span-1 space-y-6">
                        <div className="glass-panel p-6 rounded-xl border border-slate-200 bg-white shadow-sm">
                            <h2 className="text-base font-bold text-slate-800 flex items-center mb-4 border-b border-slate-100 pb-3">
                                <Server className="w-5 h-5 mr-2 text-slate-800" />
                                Cluster Health Map
                            </h2>
                            
                            {!health ? (
                                <div className="animate-pulse space-y-3">
                                    <div className="h-10 bg-slate-100 rounded"></div>
                                    <div className="h-10 bg-slate-100 rounded"></div>
                                    <div className="h-10 bg-slate-100 rounded"></div>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {Object.entries(health.services || {}).map(([name, service]: [string, any]) => (
                                        <div key={name} className="flex items-center justify-between p-3 rounded-lg border border-slate-100 bg-slate-50">
                                            <div className="flex items-center space-x-3">
                                                <div className={`w-2 h-2 rounded-full ${service.status === 'up' ? 'bg-green-500' : service.status === 'down' ? 'bg-amber-500' : 'bg-red-500'}`}></div>
                                                <span className="font-bold text-slate-700 font-mono text-xs">{name}</span>
                                            </div>
                                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${service.status === 'up' ? 'bg-green-100 text-green-700' : service.status === 'down' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                                                {service.status}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        
                        {/* Metrics Mock */}
                        <div className="glass-panel p-6 rounded-xl border border-slate-200 bg-slate-950 text-white shadow-md">
                            <h2 className="text-base font-bold flex items-center mb-6 border-b border-slate-800 pb-3">
                                <Database className="w-5 h-5 mr-2 opacity-80" />
                                Platform Metrics
                            </h2>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                                    <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1">Active Bookings</div>
                                    <div className="text-3xl font-extrabold font-mono">1,402</div>
                                </div>
                                <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                                    <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1">Messages/sec</div>
                                    <div className="text-3xl font-extrabold font-mono">128</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Live Kafka Firehose */}
                    <div className="col-span-1 lg:col-span-2">
                        <div className="glass-panel rounded-xl border border-slate-200 bg-white shadow-sm flex flex-col h-[700px]">
                            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-xl">
                                <h2 className="text-base font-bold text-slate-800 flex items-center">
                                    <Activity className="w-5 h-5 mr-2 text-slate-800" />
                                    Kafka Event Firehose
                                </h2>
                                <div className="flex items-center space-x-2 text-xs text-slate-500 font-mono">
                                    <span className="relative flex h-2 w-2">
                                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                      <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                                    </span>
                                    <span>WebSocket Connected</span>
                                </div>
                            </div>
                            
                            <div className="flex-1 overflow-auto p-6 bg-slate-900 rounded-b-xl">
                                {liveEvents.length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-4">
                                        <History className="w-12 h-12 opacity-30" />
                                        <p className="font-mono text-sm font-bold">Listening for distributed events...</p>
                                        <p className="text-xs max-w-sm text-center text-slate-600">Try creating a booking on the Passenger portal or updating a baggage scan in the Gate Control. You will see the event flow through Kafka directly here in real-time.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4 font-mono text-xs">
                                        {liveEvents.map((ev, i) => (
                                            <div key={i} className="animate-slide-up border-l-2 border-slate-400 pl-4 py-2">
                                                <div className="flex justify-between items-start text-xs text-slate-500 mb-1">
                                                    <span>[{new Date().toLocaleTimeString()}] TOPIC: {ev.event || 'UNKNOWN'}</span>
                                                </div>
                                                <pre className="text-emerald-400 whitespace-pre-wrap break-words font-mono bg-slate-800 p-3 rounded overflow-x-auto border border-slate-700/50">
                                                    {JSON.stringify(ev.payload || ev, null, 2)}
                                                </pre>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* TAB B: ADMIN & POLICIES CONTROL */}
            {activeTab === 'policies' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* HPA & GitOps configuration */}
                    <div className="lg:col-span-5 space-y-6">
                        {/* ArgoCD Sync Control */}
                        <div className="glass-panel p-6 rounded-xl border border-slate-200 bg-white">
                            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">GitOps Controller</h3>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center p-3 rounded-lg border border-slate-100 bg-slate-50">
                                    <span className="text-xs font-bold text-slate-700">Sync Status</span>
                                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${argocdSynced ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                                        {argocdSynced ? 'Synced' : 'OutOfSync'}
                                    </span>
                                </div>
                                <button 
                                    onClick={handleArgoSync} 
                                    disabled={argocdSyncing} 
                                    className="w-full bg-slate-900 hover:bg-slate-950 text-white font-bold text-xs py-2.5 rounded-lg flex items-center justify-center space-x-1.5 transition-all"
                                >
                                    <RefreshCw className={`w-3.5 h-3.5 ${argocdSyncing ? 'animate-spin' : ''}`} />
                                    <span>{argocdSyncing ? "Triggering GitOps Sync..." : "Sync ArgoCD"}</span>
                                </button>
                            </div>
                        </div>

                        {/* HPA settings */}
                        <div className="glass-panel p-6 rounded-xl border border-slate-200 bg-white">
                            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Autoscaling (HPA) Policy</h3>
                            <form onSubmit={handleUpdateHpa} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-medium text-slate-500 mb-1">Minimum Pods</label>
                                    <input 
                                        type="number" 
                                        value={hpaMin}
                                        onChange={e => setHpaMin(parseInt(e.target.value))}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white text-slate-900"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-500 mb-1">Maximum Pods</label>
                                    <input 
                                        type="number" 
                                        value={hpaMax}
                                        onChange={e => setHpaMax(parseInt(e.target.value))}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white text-slate-900"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-500 mb-1">Target CPU Threshold (%)</label>
                                    <input 
                                        type="number" 
                                        value={hpaCpu}
                                        onChange={e => setHpaCpu(parseInt(e.target.value))}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white text-slate-900"
                                    />
                                </div>
                                <button type="submit" disabled={hpaLoading} className="w-full bg-slate-900 hover:bg-slate-950 text-white font-bold text-xs py-2.5 rounded-lg flex items-center justify-center space-x-1.5 transition-all">
                                    <Cpu className="w-3.5 h-3.5" />
                                    <span>{hpaLoading ? "Applying Scaling Rule..." : "Apply HPA Rule"}</span>
                                </button>
                            </form>

                            {hpaSuccess && (
                                <div className="mt-4 flex items-center text-green-700 bg-green-50 px-3 py-2 rounded-lg text-xs font-medium animate-slide-up">
                                    <CheckCircle2 className="w-4 h-4 mr-2" />
                                    <span>HPA rules applied to EKS Cluster!</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* GDPR Log compliance auditing */}
                    <div className="lg:col-span-7 space-y-6">
                        <div className="glass-panel p-6 rounded-xl border border-slate-200 bg-white">
                            <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-4">
                                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">GDPR PII Log Redactor Audit</h3>
                                <button 
                                    onClick={() => setShowUnmasked(!showUnmasked)} 
                                    className="text-xs text-slate-500 hover:text-slate-900 flex items-center space-x-1 border border-slate-200 px-2 py-1 rounded"
                                >
                                    {showUnmasked ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                                    <span>{showUnmasked ? "Hide Raw Data" : "View Raw Logs"}</span>
                                </button>
                            </div>

                            <div className="space-y-4">
                                {mockLogs.map((log, idx) => (
                                    <div key={idx} className="space-y-2 text-xs font-mono">
                                        <div className="flex justify-between text-slate-400 text-[10px]">
                                            <span>[{log.timestamp}] SERVICE: {log.service}</span>
                                            <span className="text-green-700 font-bold bg-green-50 px-1.5 rounded">{log.event}</span>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {showUnmasked && (
                                                <div className="p-3 bg-red-50/50 border border-red-200 rounded text-red-700 whitespace-pre-wrap break-all">
                                                    <span className="text-[9px] uppercase font-bold text-red-500 block mb-1">⚠️ Raw PII Log (Worse Case)</span>
                                                    {log.raw}
                                                </div>
                                            )}
                                            <div className={`p-3 bg-slate-900 text-slate-300 rounded border border-slate-800 whitespace-pre-wrap break-all ${showUnmasked ? '' : 'col-span-2'}`}>
                                                <span className="text-[9px] uppercase font-bold text-emerald-400 block mb-1">🛡️ Redacted Output (GDPR Compliant)</span>
                                                {log.masked}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* PCI-DSS Secure transactions log */}
                        <div className="glass-panel p-6 rounded-xl border border-slate-200 bg-white">
                            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 border-b border-slate-100 pb-3">PCI-DSS Secure transactions logs</h3>
                            <div className="space-y-3 font-mono text-xs text-slate-700 bg-slate-50 p-4 border border-slate-100 rounded-lg">
                                <div className="border-l-2 border-slate-400 pl-3">
                                    <div className="text-[10px] text-slate-400">2026-05-23T04:15:33Z - EVENT: TRANSACTION_AUTHORIZED</div>
                                    <p className="text-slate-800 mt-1">SUCCESS: Authorization issued for transaction token <span className="bg-slate-200 px-1 rounded text-slate-950 font-bold">tok_visa_7781</span>.</p>
                                    <p className="text-slate-400 mt-0.5 text-[10px]">No primary account numbers (PAN) or credit card CVVs were written to disc.</p>
                                </div>
                                <div className="border-l-2 border-slate-400 pl-3 mt-4">
                                    <div className="text-[10px] text-slate-400">2026-05-23T04:16:01Z - EVENT: TRANSACTION_SUCCESS</div>
                                    <p className="text-slate-800 mt-1">Audit record written to vault: <span className="bg-slate-200 px-1 rounded text-slate-950 font-bold">tx_pci_8871239</span>.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
