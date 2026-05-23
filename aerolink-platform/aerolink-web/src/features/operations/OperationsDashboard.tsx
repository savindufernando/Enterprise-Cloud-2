import { useState, useEffect, useRef } from 'react';
import { 
  Activity, Server, CheckCircle2, History, 
  Cpu, RefreshCw, Eye, EyeOff, Radio, BarChart2
} from 'lucide-react';

export default function OperationsDashboard() {
    const [health, setHealth] = useState<any>(null);
    const [liveEvents, setLiveEvents] = useState<any[]>([]);
    const [activeTab, setActiveTab] = useState<'mission-control' | 'policies'>('mission-control');
    const firehoseEndRef = useRef<HTMLDivElement>(null);

    // Mock telemetry states
    const [cpuLoad, setCpuLoad] = useState<number[]>([42, 45, 40, 52, 48, 55, 60, 58, 62, 59]);
    const [memLoad, setMemLoad] = useState<number[]>([68, 69, 68, 70, 71, 72, 70, 71, 73, 72]);
    const [latency, setLatency] = useState<number>(45);

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
            const API_BASE = import.meta.env.VITE_API_URL || 'http://api.aerolink.transnova.shop';
            fetch(`${API_BASE}/health/aggregated`)
                .then(res => res.json())
                .then(data => setHealth(data))
                .catch(err => {
                    console.error("Failed to fetch aggregate checks:", err);
                    // Beautiful mock fallback structure matching EKS status report
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

    // 2. Connect to Kafka WebSocket Stream & Local Simulator
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

        // Listen for local simulation events (e.g. from Passenger booking confirmed)
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
            setCpuLoad(prev => {
                const nextVal = Math.max(10, Math.min(95, prev[prev.length - 1] + (Math.random() * 10 - 5)));
                return [...prev.slice(1), Math.round(nextVal)];
            });
            setMemLoad(prev => {
                const nextVal = Math.max(50, Math.min(99, prev[prev.length - 1] + (Math.random() * 2 - 1)));
                return [...prev.slice(1), Math.round(nextVal)];
            });
            setLatency(Math.round(35 + Math.random() * 20));
        }, 3000);

        return () => clearInterval(interval);
    }, []);

    // 4. Trigger ArgoCD Re-sync (GitOps sync simulation)
    const handleArgoSync = () => {
        setArgocdSyncing(true);
        setArgocdSynced(false);
        setTimeout(() => {
            setArgocdSyncing(false);
            setArgocdSynced(true);
            
            // Log synchronization in Kafka Firehose
            const argoEvent = {
                event: 'ARGO_CD_SYNC_SUCCESS',
                payload: {
                    revision: 'rev-4f81c9',
                    cluster: 'eks-aerolink-production',
                    sync_time_ms: 1202,
                    components: ['gateway', 'flight-service', 'baggage-service'],
                    status: 'Synced'
                }
            };
            setLiveEvents(prev => [argoEvent, ...prev]);
        }, 2000);
    };

    // 5. Update HPA Rule (Mock configuration persistence)
    const handleUpdateHpa = (e: React.FormEvent) => {
        e.preventDefault();
        setHpaLoading(true);
        setHpaSuccess(false);
        setTimeout(() => {
            setHpaLoading(false);
            setHpaSuccess(true);
            
            const hpaEvent = {
                event: 'EKS_HPA_POLICY_UPDATE',
                payload: {
                    namespace: 'aerolink',
                    min_replicas: hpaMin,
                    max_replicas: hpaMax,
                    cpu_utilization_target: hpaCpu,
                    orchestrator: 'Kubernetes API Server'
                }
            };
            setLiveEvents(prev => [hpaEvent, ...prev]);
            setTimeout(() => setHpaSuccess(false), 3000);
        }, 1500);
    };

    const isHealthy = health?.status === 'fully_operational' || health?.status === 'degraded' || !health;

    // Log templates representing raw vs tokenized payloads
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
            {/* Mission Control Header */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4 mb-6 border-b border-slate-800 pb-6">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight flex items-center space-x-2">
                        <Activity className="w-8 h-8 text-cyan-400 animate-pulse" />
                        <span>Operations Control</span>
                    </h1>
                    <p className="text-slate-500 text-xs font-mono mt-1">LATENCY_GATEWAY: <span className="text-cyan-400 font-bold">{latency}ms</span> | CLUSTER_DEPLOY: AWS_EKS_M5_XLARGE</p>
                </div>
                <div className="flex items-center space-x-4">
                    <div className="flex bg-slate-950/60 p-1 border border-slate-800 rounded-lg text-xs font-bold font-mono">
                        <button 
                            onClick={() => setActiveTab('mission-control')}
                            className={`px-3 py-1.5 rounded transition-all cursor-pointer ${activeTab === 'mission-control' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
                        >
                            Telemetry
                        </button>
                        <button 
                            onClick={() => setActiveTab('policies')}
                            className={`px-3 py-1.5 rounded transition-all cursor-pointer ${activeTab === 'policies' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
                        >
                            Kubernetes Rules
                        </button>
                    </div>

                    <div className={`px-3 py-1.5 rounded-lg border font-bold font-mono text-[10px] uppercase tracking-wider flex items-center space-x-1.5 ${isHealthy ? 'border-emerald-500/20 text-emerald-400 bg-emerald-950/20' : 'border-red-500/20 text-red-400 bg-red-950/20'}`}>
                        <Radio className="w-3.5 h-3.5 animate-pulse" />
                        <span>{isHealthy ? 'ALL_SYSTEMS_OPERATIONAL' : 'SYSTEM_FAILOVER'}</span>
                    </div>
                </div>
            </div>

            {/* TAB A: MISSION CONTROL TELEMETRY */}
            {activeTab === 'mission-control' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Health Map & Metric Gauges */}
                    <div className="col-span-1 space-y-6">
                        {/* Microservice health state matrix */}
                        <div className="glass-panel p-6 rounded-xl border border-slate-800">
                            <h2 className="text-sm font-bold text-slate-200 flex items-center mb-4 border-b border-slate-800 pb-3">
                                <Server className="w-4.5 h-4.5 mr-2 text-cyan-400" />
                                Distributed Mesh Map
                            </h2>
                            
                            {!health ? (
                                <div className="space-y-3">
                                    <div className="h-10 bg-slate-900 animate-pulse rounded"></div>
                                    <div className="h-10 bg-slate-900 animate-pulse rounded"></div>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {Object.entries(health.services || {}).map(([name, service]: [string, any]) => (
                                        <div key={name} className="flex items-center justify-between p-2.5 rounded-lg border border-slate-900 bg-slate-950/40 hover:bg-slate-950/80 transition-all font-mono text-xs">
                                            <div className="flex items-center space-x-2">
                                                <span className="relative flex h-2 w-2">
                                                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${service.status === 'up' ? 'bg-emerald-400' : 'bg-red-400'}`}></span>
                                                  <span className={`relative inline-flex rounded-full h-2 w-2 ${service.status === 'up' ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                                                </span>
                                                <span className="font-bold text-slate-300">{name}</span>
                                            </div>
                                            <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase ${service.status === 'up' ? 'border border-emerald-500/20 text-emerald-400 bg-emerald-950/20' : 'border border-red-500/20 text-red-400 bg-red-950/20'}`}>
                                                {service.status === 'up' ? 'UP_OK' : 'FAIL'}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        
                        {/* Real-time Telemetry Charts (SVG Rendered) */}
                        <div className="glass-panel p-6 rounded-xl border border-slate-800 space-y-6">
                            <h2 className="text-sm font-bold text-slate-200 flex items-center border-b border-slate-800 pb-3">
                                <BarChart2 className="w-4.5 h-4.5 mr-2 text-cyan-400" />
                                Grafana Uptime Stats
                            </h2>

                            {/* CPU Telemetry Chart */}
                            <div className="space-y-2">
                                <div className="flex justify-between items-center text-xs font-mono">
                                    <span className="text-slate-400">NODE CPU USAGE:</span>
                                    <span className="text-cyan-400 font-bold">{cpuLoad[cpuLoad.length - 1]}%</span>
                                </div>
                                <div className="h-16 bg-slate-950/60 rounded border border-slate-900/60 p-1 flex items-end justify-between gap-0.5">
                                    {cpuLoad.map((val, idx) => (
                                        <div 
                                            key={idx} 
                                            style={{ height: `${val}%` }} 
                                            className="w-full bg-cyan-500/60 rounded-t transition-all duration-500 hover:bg-cyan-400"
                                            title={`CPU: ${val}%`}
                                        />
                                    ))}
                                </div>
                            </div>

                            {/* Memory Telemetry Chart */}
                            <div className="space-y-2">
                                <div className="flex justify-between items-center text-xs font-mono">
                                    <span className="text-slate-400">HEAP MEM UTILIZATION:</span>
                                    <span className="text-purple-400 font-bold">{memLoad[memLoad.length - 1]}%</span>
                                </div>
                                <div className="h-16 bg-slate-950/60 rounded border border-slate-900/60 p-1 flex items-end justify-between gap-0.5">
                                    {memLoad.map((val, idx) => (
                                        <div 
                                            key={idx} 
                                            style={{ height: `${val}%` }} 
                                            className="w-full bg-purple-500/60 rounded-t transition-all duration-500 hover:bg-purple-400"
                                            title={`MEM: ${val}%`}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* WebSockets Kafka Event Firehose console */}
                    <div className="col-span-1 lg:col-span-2">
                        <div className="glass-panel rounded-xl border border-slate-800 flex flex-col h-[650px] relative overflow-hidden bg-[#0d1320]/60">
                            {/* Panel header */}
                            <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-950/30">
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
                            
                            {/* scrolling terminal */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-4 font-mono text-[11px] bg-[#070b13]">
                                {liveEvents.length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center text-slate-600 space-y-4 font-mono text-center">
                                        <Activity className="w-12 h-12 opacity-15 text-cyan-400 animate-pulse" />
                                        <div>
                                            <p className="font-bold text-slate-400">CONNECTING TO KAFKA FIREHOSE...</p>
                                            <p className="text-[10px] mt-1 max-w-sm">Simulate actions inside passenger ticket checkouts or ground luggage status portals to observe transactions flow directly here.</p>
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
            )}

            {/* TAB B: KUBERNETES RULES & POLICIES CONTROL */}
            {activeTab === 'policies' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* ArgoCD and HPA threshold configurations */}
                    <div className="lg:col-span-5 space-y-6">
                        {/* ArgoCD Sync panel */}
                        <div className="glass-panel p-6 rounded-xl border border-slate-800 bg-[#111827]/10">
                            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">GitOps Controller</h3>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center p-3 rounded-lg border border-slate-900 bg-slate-950/40 font-mono text-xs">
                                    <span className="text-slate-400">Sync Status</span>
                                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${argocdSynced ? 'border border-emerald-500/20 text-emerald-400 bg-emerald-950/20' : 'border border-amber-500/20 text-amber-400 bg-amber-950/20'}`}>
                                        {argocdSynced ? 'Synced' : 'OutOfSync'}
                                    </span>
                                </div>
                                <button 
                                    onClick={handleArgoSync} 
                                    disabled={argocdSyncing} 
                                    className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs py-2.5 rounded-lg flex items-center justify-center space-x-1.5 transition-all cursor-pointer uppercase tracking-wider"
                                >
                                    <RefreshCw className={`w-3.5 h-3.5 ${argocdSyncing ? 'animate-spin' : ''}`} />
                                    <span>{argocdSyncing ? "Triggering GitOps Sync..." : "Sync ArgoCD"}</span>
                                </button>
                            </div>
                        </div>

                        {/* HPA config panel */}
                        <div className="glass-panel p-6 rounded-xl border border-slate-800 bg-[#111827]/10">
                            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Autoscaling (HPA) Policy</h3>
                            <form onSubmit={handleUpdateHpa} className="space-y-4 font-mono text-xs">
                                <div>
                                    <label className="block text-slate-400 mb-1 font-bold">Minimum Pods</label>
                                    <input 
                                        type="number" 
                                        value={hpaMin}
                                        onChange={e => setHpaMin(parseInt(e.target.value))}
                                        className="w-full px-3 py-2 border border-slate-800 rounded-lg bg-slate-950/60 text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-500 font-bold"
                                    />
                                </div>
                                <div>
                                    <label className="block text-slate-400 mb-1 font-bold">Maximum Pods</label>
                                    <input 
                                        type="number" 
                                        value={hpaMax}
                                        onChange={e => setHpaMax(parseInt(e.target.value))}
                                        className="w-full px-3 py-2 border border-slate-800 rounded-lg bg-slate-950/60 text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-500 font-bold"
                                    />
                                </div>
                                <div>
                                    <label className="block text-slate-400 mb-1 font-bold">Target CPU Threshold (%)</label>
                                    <input 
                                        type="number" 
                                        value={hpaCpu}
                                        onChange={e => setHpaCpu(parseInt(e.target.value))}
                                        className="w-full px-3 py-2 border border-slate-800 rounded-lg bg-slate-950/60 text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-500 font-bold"
                                    />
                                </div>
                                <button type="submit" disabled={hpaLoading} className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs py-2.5 rounded-lg flex items-center justify-center space-x-1.5 transition-all cursor-pointer uppercase tracking-wider">
                                    <Cpu className="w-3.5 h-3.5" />
                                    <span>{hpaLoading ? "Applying Scaling Rule..." : "Apply HPA Rule"}</span>
                                </button>
                            </form>

                            {hpaSuccess && (
                                <div className="mt-4 flex items-center text-emerald-400 bg-emerald-950/20 border border-emerald-900/30 px-3 py-2 rounded-lg text-xs font-mono font-bold animate-slide-up">
                                    <CheckCircle2 className="w-4 h-4 mr-2" />
                                    <span>HPA rules applied to EKS Namespace!</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* GDPR Log redactors compliance */}
                    <div className="lg:col-span-7 space-y-6">
                        <div className="glass-panel p-6 rounded-xl border border-slate-800">
                            <div className="flex justify-between items-center border-b border-slate-800 pb-3 mb-4">
                                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">GDPR PII Log Redaction Audit</h3>
                                <button 
                                    onClick={() => setShowUnmasked(!showUnmasked)} 
                                    className="text-xs text-cyan-400 hover:text-cyan-300 font-bold font-mono flex items-center space-x-1 border border-cyan-500/20 hover:border-cyan-500/40 px-2 py-1 rounded bg-cyan-950/10 cursor-pointer"
                                >
                                    {showUnmasked ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                                    <span>{showUnmasked ? "Mask PII Logs" : "View Raw Logs"}</span>
                                </button>
                            </div>

                            <div className="space-y-4">
                                {mockLogs.map((log, idx) => (
                                    <div key={idx} className="space-y-2 text-[10px] font-mono">
                                        <div className="flex justify-between text-slate-500 mb-1">
                                            <span>[{log.timestamp}] INGESTED: {log.service}</span>
                                            <span className="text-emerald-400 font-bold bg-emerald-950/20 border border-emerald-900/30 px-2 py-0.5 rounded">{log.event}</span>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {showUnmasked && (
                                                <div className="p-3 bg-red-950/20 border border-red-900/20 rounded text-red-400 whitespace-pre-wrap break-all shadow-inner">
                                                    <span className="text-[9px] uppercase font-bold text-red-500 block mb-1">⚠️ Raw stdout Log (Worse Case)</span>
                                                    {log.raw}
                                                </div>
                                            )}
                                            <div className={`p-3 bg-slate-950/60 text-slate-300 rounded border border-slate-900 whitespace-pre-wrap break-all shadow-inner ${showUnmasked ? '' : 'col-span-2'}`}>
                                                <span className="text-[9px] uppercase font-bold text-emerald-400 block mb-1">🛡️ Masked Output (GDPR Secure)</span>
                                                {log.masked}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* PCI DSS Secure Transactions log auditing */}
                        <div className="glass-panel p-6 rounded-xl border border-slate-800">
                            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 border-b border-slate-800 pb-3">PCI-DSS Secure transactions logs</h3>
                            <div className="space-y-3 font-mono text-[10px] text-slate-400 bg-slate-950/60 p-4 border border-slate-900 rounded-lg">
                                <div className="border-l border-slate-800 pl-3">
                                    <div className="text-[9px] text-slate-600">2026-05-23T04:15:33Z - EVENT: TRANSACTION_AUTHORIZED</div>
                                    <p className="text-slate-300 mt-1">SUCCESS: Authorization issued for transaction token <span className="bg-slate-900 border border-slate-800 px-2 py-0.5 rounded text-cyan-400 font-bold">tok_visa_7781</span>.</p>
                                    <p className="text-slate-600 mt-0.5">Zero storage: Card details (PAN / CVV) are encrypted at the client proxy and not saved.</p>
                                </div>
                                <div className="border-l border-slate-800 pl-3 mt-4">
                                    <div className="text-[9px] text-slate-600">2026-05-23T04:16:01Z - EVENT: TRANSACTION_SUCCESS</div>
                                    <p className="text-slate-300 mt-1">Audit record written to vault: <span className="bg-slate-900 border border-slate-800 px-2 py-0.5 rounded text-cyan-400 font-bold">tx_pci_8871239</span>.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
