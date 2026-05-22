import { useState, useEffect } from 'react';
import { Activity, Server, AlertCircle, CheckCircle2, History, Database } from 'lucide-react';

export default function OperationsDashboard() {
    const [health, setHealth] = useState<any>(null);
    const [liveEvents, setLiveEvents] = useState<any[]>([]);

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

    const isHealthy = health?.status === 'fully_operational';

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="flex justify-between items-end mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800">Mission Control</h1>
                    <p className="text-slate-500">Live Telemetry & Global Operations</p>
                </div>
                <div className={`px-4 py-2 rounded-lg font-medium flex items-center space-x-2 ${isHealthy ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {isHealthy ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                    <span>{isHealthy ? 'All Systems Go' : 'Degraded Performance'}</span>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Microservice Health Cluster */}
                <div className="col-span-1 space-y-6">
                    <div className="glass-panel p-6 rounded-xl border border-slate-200 bg-white shadow-sm">
                        <h2 className="text-lg font-semibold text-slate-800 flex items-center mb-4">
                            <Server className="w-5 h-5 mr-2 text-primary" />
                            Cluster Health Map
                        </h2>
                        
                        {!health ? (
                            <div className="animate-pulse flex space-x-4">
                                <div className="flex-1 space-y-4 py-1">
                                    <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                                    <div className="h-4 bg-slate-200 rounded"></div>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {Object.entries(health.services || {}).map(([name, service]: [string, any]) => (
                                    <div key={name} className="flex items-center justify-between p-3 rounded-lg border border-slate-100 bg-slate-50">
                                        <div className="flex items-center space-x-3">
                                            <div className={`w-2 h-2 rounded-full ${service.status === 'up' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                            <span className="font-medium text-slate-700 font-mono text-sm">{name}</span>
                                        </div>
                                        <span className={`text-xs px-2 py-1 rounded-md font-bold uppercase ${service.status === 'up' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                            {service.status}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    
                    {/* Metrics Mock */}
                    <div className="glass-panel p-6 rounded-xl border border-slate-200 bg-gradient-to-br from-primary to-primary-dark text-white shadow-md">
                        <h2 className="text-lg font-semibold flex items-center mb-6">
                            <Database className="w-5 h-5 mr-2 opacity-80" />
                            Platform Metrics
                        </h2>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-white/10 rounded-lg p-4">
                                <div className="text-sm opacity-80 mb-1">Active Bookings</div>
                                <div className="text-3xl font-bold">1,402</div>
                            </div>
                            <div className="bg-white/10 rounded-lg p-4">
                                <div className="text-sm opacity-80 mb-1">Messages/sec</div>
                                <div className="text-3xl font-bold">128</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Live Kafka Firehose */}
                <div className="col-span-1 lg:col-span-2">
                    <div className="glass-panel rounded-xl border border-slate-200 bg-white shadow-sm flex flex-col h-[700px]">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                            <h2 className="text-lg font-semibold text-slate-800 flex items-center">
                                <Activity className="w-5 h-5 mr-2 text-secondary" />
                                Kafka Event Firehose
                            </h2>
                            <div className="flex items-center space-x-2 text-sm text-slate-500 font-mono">
                                <span className="relative flex h-3 w-3">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-3 w-3 bg-secondary"></span>
                                </span>
                                <span>WebSocket Connected</span>
                            </div>
                        </div>
                        
                        <div className="flex-1 overflow-auto p-6 bg-slate-900 rounded-b-xl">
                            {liveEvents.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-4">
                                    <History className="w-12 h-12 opacity-50" />
                                    <p className="font-mono">Listening for distributed events...</p>
                                    <p className="text-xs max-w-sm text-center">Try creating a booking on the Passenger portal. You will see the event flow through Kafka directly here in real-time.</p>
                                </div>
                            ) : (
                                <div className="space-y-4 font-mono text-sm">
                                    {liveEvents.map((ev, i) => (
                                        <div key={i} className="animate-slide-up border-l-2 border-secondary pl-4 py-2">
                                            <div className="flex justify-between items-start text-xs text-slate-400 mb-1">
                                                <span>[{new Date().toLocaleTimeString()}] TOPIC: {ev.event || 'UNKNOWN'}</span>
                                            </div>
                                            <pre className="text-green-400 whitespace-pre-wrap break-words font-mono bg-slate-800 p-3 rounded overflow-x-auto">
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
        </div>
    );
}
