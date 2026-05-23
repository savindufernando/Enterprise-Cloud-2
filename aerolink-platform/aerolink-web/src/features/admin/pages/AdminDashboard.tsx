import { useState } from 'react';
import { Shield, Cpu, RefreshCw, Eye, EyeOff, CheckCircle2 } from 'lucide-react';

export default function AdminDashboard() {
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

    // 1. Trigger ArgoCD Re-sync (GitOps sync simulation)
    const handleArgoSync = () => {
        setArgocdSyncing(true);
        setArgocdSynced(false);
        setTimeout(() => {
            setArgocdSyncing(false);
            setArgocdSynced(true);
            
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
            window.dispatchEvent(new CustomEvent('aerolink_new_event', { detail: argoEvent }));
        }, 2000);
    };

    // 2. Update HPA Rule (Mock configuration persistence)
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
            window.dispatchEvent(new CustomEvent('aerolink_new_event', { detail: hpaEvent }));
            setTimeout(() => setHpaSuccess(false), 3000);
        }, 1500);
    };

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
        <div className="max-w-6xl mx-auto space-y-8 animate-fade-in pb-16 text-slate-800">
            <div className="text-center mb-12">
                <div className="inline-flex items-center space-x-2 bg-cyan-50 border border-cyan-200/50 text-cyan-700 text-[10px] font-bold uppercase tracking-wider px-3.5 py-1.5 rounded-full mb-4">
                    <Shield className="w-3.5 h-3.5" />
                    <span>System Administration Console</span>
                </div>
                <h1 className="text-4xl font-extrabold tracking-tight mb-2">Cluster & Security Admin</h1>
                <p className="text-sm text-slate-500 max-w-lg mx-auto">Coordinate distributed GitOps sync cycles, calibrate horizontal pod autoscale profiles, and audit GDPR data masking compliance.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* HPA & GitOps configuration */}
                <div className="lg:col-span-5 space-y-6">
                    {/* ArgoCD Sync Control */}
                    <div className="glass-panel p-6 rounded-xl border border-slate-200 bg-white shadow-sm">
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">GitOps Controller</h3>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center p-3 rounded-lg border border-slate-200 bg-slate-50 font-mono text-xs">
                                <span className="text-slate-500 font-bold">Sync Status</span>
                                <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase ${argocdSynced ? 'border border-emerald-200 text-emerald-700 bg-emerald-50' : 'border border-amber-200 text-amber-700 bg-amber-50'}`}>
                                    {argocdSynced ? 'Synced' : 'OutOfSync'}
                                </span>
                            </div>
                            <button 
                                onClick={handleArgoSync} 
                                disabled={argocdSyncing} 
                                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs py-2.5 rounded-lg flex items-center justify-center space-x-1.5 transition-all cursor-pointer uppercase tracking-wider shadow-sm"
                            >
                                <RefreshCw className={`w-3.5 h-3.5 ${argocdSyncing ? 'animate-spin' : ''}`} />
                                <span>{argocdSyncing ? "Triggering GitOps Sync..." : "Sync ArgoCD"}</span>
                            </button>
                        </div>
                    </div>

                    {/* HPA settings */}
                    <div className="glass-panel p-6 rounded-xl border border-slate-200 bg-white shadow-sm">
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Autoscaling (HPA) Policy</h3>
                        <form onSubmit={handleUpdateHpa} className="space-y-4 font-mono text-xs text-slate-800">
                            <div>
                                <label className="block text-slate-500 mb-1 font-bold">Minimum Pods</label>
                                <input 
                                    type="number" 
                                    value={hpaMin}
                                    onChange={e => setHpaMin(parseInt(e.target.value))}
                                    className="w-full px-3 py-2 border border-slate-350 rounded-lg bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent font-bold shadow-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-slate-500 mb-1 font-bold">Maximum Pods</label>
                                <input 
                                    type="number" 
                                    value={hpaMax}
                                    onChange={e => setHpaMax(parseInt(e.target.value))}
                                    className="w-full px-3 py-2 border border-slate-350 rounded-lg bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent font-bold shadow-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-slate-500 mb-1 font-bold">Target CPU Threshold (%)</label>
                                <input 
                                    type="number" 
                                    value={hpaCpu}
                                    onChange={e => setHpaCpu(parseInt(e.target.value))}
                                    className="w-full px-3 py-2 border border-slate-350 rounded-lg bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent font-bold shadow-sm"
                                />
                            </div>
                            <button type="submit" disabled={hpaLoading} className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs py-2.5 rounded-lg flex items-center justify-center space-x-1.5 transition-all cursor-pointer uppercase tracking-wider shadow-sm">
                                <Cpu className="w-3.5 h-3.5" />
                                <span>{hpaLoading ? "Applying Scaling Rule..." : "Apply HPA Rule"}</span>
                            </button>
                        </form>

                        {hpaSuccess && (
                            <div className="mt-4 flex items-center text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-2 rounded-lg text-xs font-mono font-bold animate-slide-up">
                                <CheckCircle2 className="w-4 h-4 mr-2 text-emerald-600" />
                                <span>HPA rules applied to EKS Namespace!</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* GDPR Log compliance auditing */}
                <div className="lg:col-span-7 space-y-6">
                    <div className="glass-panel p-6 rounded-xl border border-slate-200 bg-white shadow-sm">
                        <div className="flex justify-between items-center border-b border-slate-200 pb-3 mb-4">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">GDPR PII Log Redaction Audit</h3>
                            <button 
                                onClick={() => setShowUnmasked(!showUnmasked)} 
                                className="text-xs text-cyan-700 hover:text-cyan-600 font-bold font-mono flex items-center space-x-1 border border-cyan-200 hover:border-cyan-300 px-2 py-1 rounded bg-cyan-50 cursor-pointer transition-colors"
                            >
                                {showUnmasked ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                                <span>{showUnmasked ? "Mask PII Logs" : "View Raw Logs"}</span>
                            </button>
                        </div>

                        <div className="space-y-4">
                            {mockLogs.map((log, idx) => (
                                <div key={idx} className="space-y-2 text-[10px] font-mono">
                                    <div className="flex justify-between text-slate-450 mb-1">
                                        <span className="font-semibold">[{log.timestamp}] INGESTED: {log.service}</span>
                                        <span className="text-emerald-700 font-bold bg-emerald-50 border border-emerald-250 px-2 py-0.5 rounded">{log.event}</span>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {showUnmasked && (
                                            <div className="p-3 bg-red-950/20 border border-red-900/20 rounded text-red-400 whitespace-pre-wrap break-all shadow-inner">
                                                <span className="text-[9px] uppercase font-bold text-red-500 block mb-1">⚠️ Raw stdout Log (Worse Case)</span>
                                                {log.raw}
                                            </div>
                                        )}
                                        <div className={`p-3 bg-slate-900 text-slate-100 rounded border border-slate-950 whitespace-pre-wrap break-all shadow-inner ${showUnmasked ? '' : 'col-span-2'}`}>
                                            <span className="text-[9px] uppercase font-bold text-emerald-400 block mb-1">🛡️ Masked Output (GDPR Secure)</span>
                                            {log.masked}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* PCI DSS Secure Transactions log auditing */}
                    <div className="glass-panel p-6 rounded-xl border border-slate-200 bg-white shadow-sm">
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 border-b border-slate-200 pb-3">PCI-DSS Secure transactions logs</h3>
                        <div className="space-y-3 font-mono text-[10px] text-slate-400 bg-slate-900 p-4 border border-slate-950 rounded-lg">
                            <div className="border-l border-slate-800 pl-3">
                                <div className="text-[9px] text-slate-500">2026-05-23T04:15:33Z - EVENT: TRANSACTION_AUTHORIZED</div>
                                <p className="text-slate-350 mt-1">SUCCESS: Authorization issued for transaction token <span className="bg-slate-950 border border-slate-800 px-2 py-0.5 rounded text-cyan-400 font-bold">tok_visa_7781</span>.</p>
                                <p className="text-slate-500 mt-0.5">Zero storage: Card details (PAN / CVV) are encrypted at the client proxy and not saved.</p>
                            </div>
                            <div className="border-l border-slate-800 pl-3 mt-4">
                                <div className="text-[9px] text-slate-500">2026-05-23T04:16:01Z - EVENT: TRANSACTION_SUCCESS</div>
                                <p className="text-slate-350 mt-1">Audit record written to vault: <span className="bg-slate-950 border border-slate-800 px-2 py-0.5 rounded text-cyan-400 font-bold">tx_pci_8871239</span>.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
