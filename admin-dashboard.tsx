import { useState, useEffect } from "react";
import {
  useGetAdminStats,
  useGetAdminModels,
  useApproveModel,
  useRejectModel,
  useHideModel,
  useDeleteModel,
  useGetAdminWithdrawals,
  useAuthorizeWithdrawal,
  useGetAdminNotifications,
  useGetAdminSettings,
  useUpdateAdminSettings,
} from "@workspace/api-client-react";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { formatCurrency } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import {
  Zap, EyeOff, Trash2, Search, Bell, Crown, DollarSign, Users,
  Activity, ShieldCheck, Lock, AlertTriangle, Settings, CheckCircle2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const BASE_URL = import.meta.env.BASE_URL;

const GOLD = "#FFD700";
const NEON_GREEN = "#00FF41";
const NEON_PINK = "#FF00FF";

function PulsingCard({ children, color = NEON_PINK, className = "" }: { children: React.ReactNode; color?: string; className?: string }) {
  return (
    <div
      className={`glass-panel rounded-2xl p-5 relative overflow-hidden ${className}`}
      style={{
        border: `1px solid ${color}33`,
        animation: "radarPulse 2.5s ease-in-out infinite",
      }}
    >
      <style>{`
        @keyframes radarPulse {
          0%, 100% { box-shadow: 0 0 8px ${color}22, inset 0 0 8px ${color}11; }
          50% { box-shadow: 0 0 20px ${color}44, inset 0 0 15px ${color}22; }
        }
        @keyframes crownPulse {
          0%, 100% { opacity: 1; filter: drop-shadow(0 0 6px ${GOLD}); }
          50% { opacity: 0.6; filter: drop-shadow(0 0 14px ${GOLD}); }
        }
      `}</style>
      {children}
    </div>
  );
}

export default function AdminDashboard() {
  const { data: stats, refetch: refetchStats } = useGetAdminStats();
  const { data: modelsData, refetch: refetchModels } = useGetAdminModels();
  const { data: withdrawalsData, refetch: refetchWithdrawals } = useGetAdminWithdrawals();
  const { data: notificationsData } = useGetAdminNotifications({ query: { refetchInterval: 5000 } });
  const { data: settingsData } = useGetAdminSettings();

  const approveMutation = useApproveModel();
  const rejectMutation = useRejectModel();
  const hideMutation = useHideModel();
  const deleteMutation = useDeleteModel();
  const authWithdrawalMutation = useAuthorizeWithdrawal();
  const updateSettingsMutation = useUpdateAdminSettings();
  const { toast } = useToast();

  const [lockdownActive, setLockdownActive] = useState(false);
  const [lockdownLoading, setLockdownLoading] = useState(false);
  const [settingsForm, setSettingsForm] = useState({
    pixKey: "",
    accessValue: 2,
    withdrawalFeeRate: 0.02,
    autoWithdrawalLimit: 450,
  });

  useEffect(() => {
    if (settingsData) {
      setSettingsForm({
        pixKey: settingsData.pixKey || "",
        accessValue: settingsData.accessValue || 2,
        withdrawalFeeRate: settingsData.withdrawalFeeRate || 0.02,
        autoWithdrawalLimit: settingsData.autoWithdrawalLimit || 450,
      });
    }
  }, [settingsData]);

  const token = localStorage.getItem("dimeprivy_token");
  const authHeader = { Authorization: `Bearer ${token}` };

  const handleApprove = async (id: number) => {
    await approveMutation.mutateAsync({ id });
    toast({ title: "✅ Aprovada", description: "Modelo agora aparece na vitrine." });
    refetchModels();
  };

  const handleReject = async (id: number) => {
    await rejectMutation.mutateAsync({ id });
    toast({ title: "❌ Rejeitada" });
    refetchModels();
  };

  const handleHide = async (id: number) => {
    await hideMutation.mutateAsync({ id });
    toast({ title: "👁 Visibilidade alterada" });
    refetchModels();
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Excluir esta modelo permanentemente?")) return;
    await deleteMutation.mutateAsync({ id });
    toast({ title: "🗑 Excluída" });
    refetchModels();
  };

  const handleAuthorize = async (id: number) => {
    await authWithdrawalMutation.mutateAsync({ id });
    toast({ title: "💸 PIX Enviado!", description: "Saque processado com sucesso." });
    refetchWithdrawals();
  };

  const handleLockdown = async () => {
    const newState = !lockdownActive;
    if (!confirm(newState ? "Ativar MODO LOCKDOWN? Toda a vitrine será ocultada." : "Desativar Lockdown e restaurar vitrine?")) return;
    setLockdownLoading(true);
    try {
      await fetch(`${BASE_URL}api/admin/lockdown`, {
        method: "POST",
        headers: { ...authHeader, "Content-Type": "application/json" },
        body: JSON.stringify({ active: newState }),
      });
      setLockdownActive(newState);
      toast({
        title: newState ? "🔒 LOCKDOWN ATIVADO" : "🔓 Lockdown desativado",
        description: newState ? "Toda a vitrine foi ocultada." : "Vitrine restaurada.",
      });
      refetchStats();
    } finally {
      setLockdownLoading(false);
    }
  };

  const handleRegisterWebhook = async () => {
    const domains = (window as any).__REPLIT_DOMAINS__ || "";
    const webhookUrl = `https://dime-privy-launch--privydime.replit.app/api/webhook/pix`;
    try {
      const res = await fetch(`${BASE_URL}api/admin/register-webhook`, {
        method: "POST",
        headers: { ...authHeader, "Content-Type": "application/json" },
        body: JSON.stringify({ webhookUrl }),
      });
      const data = await res.json();
      toast({
        title: data.success ? "✅ Webhook Registrado!" : "⚠️ Aviso",
        description: data.message,
      });
    } catch {
      toast({ title: "Erro ao registrar webhook", variant: "destructive" });
    }
  };

  const handleSaveSettings = async () => {
    await updateSettingsMutation.mutateAsync({ data: settingsForm });
    toast({ title: "⚙️ Configurações salvas!" });
  };

  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <style>{`
        @keyframes radarPulse {
          0%, 100% { box-shadow: 0 0 8px rgba(255,0,255,0.15); border-color: rgba(255,0,255,0.2); }
          50% { box-shadow: 0 0 25px rgba(255,0,255,0.35); border-color: rgba(255,0,255,0.5); }
        }
        @keyframes crownGlow {
          0%, 100% { filter: drop-shadow(0 0 6px ${GOLD}) drop-shadow(0 0 12px ${GOLD}); opacity: 1; }
          50% { filter: drop-shadow(0 0 14px ${GOLD}) drop-shadow(0 0 30px ${GOLD}); opacity: 0.7; }
        }
        .crown-pulse { animation: crownGlow 2s ease-in-out infinite; }
        .radar-card { animation: radarPulse 2.5s ease-in-out infinite; }
      `}</style>

      <div className="min-h-screen bg-black flex flex-col md:flex-row text-white">
        {/* Sidebar */}
        <div className="w-full md:w-72 bg-[#0a0a0a] border-r border-white/5 flex-shrink-0 flex flex-col">
          {/* Header */}
          <div className="p-6 border-b border-white/5">
            <div className="flex items-center gap-3 mb-1">
              <Crown
                className="w-8 h-8 crown-pulse"
                style={{ color: GOLD }}
              />
              <div>
                <h1 className="font-bold text-xl tracking-widest text-white">DIME <span style={{ color: NEON_PINK }}>ADMIN</span></h1>
                <p className="text-[10px] uppercase tracking-widest" style={{ color: GOLD }}>Central de Comando</p>
              </div>
            </div>
          </div>

          {/* Revenue Quick Card */}
          <div className="p-4">
            <div
              className="rounded-xl p-4 border"
              style={{ borderColor: `${NEON_PINK}33`, background: `${NEON_PINK}08` }}
            >
              <p className="text-white/50 text-xs mb-1 uppercase tracking-wider">Lucro Total (R$2,00/venda)</p>
              <p className="text-2xl font-bold" style={{ color: NEON_PINK, textShadow: `0 0 10px ${NEON_PINK}` }}>
                {formatCurrency(stats?.totalRevenue || 0)}
              </p>
              <p className="text-white/30 text-xs mt-1">{stats?.totalTransactions || 0} transações</p>
            </div>
          </div>

          {/* Lockdown Button */}
          <div className="px-4 pb-4">
            <button
              onClick={handleLockdown}
              disabled={lockdownLoading}
              className={`w-full rounded-xl py-3 px-4 flex items-center justify-center gap-2 font-bold text-sm transition-all ${
                lockdownActive
                  ? "bg-red-900/60 border border-red-500/60 text-red-400 hover:bg-red-900/80"
                  : "bg-white/5 border border-white/10 text-white/60 hover:bg-white/10"
              }`}
              style={lockdownActive ? { boxShadow: "0 0 20px rgba(255,50,50,0.3)" } : {}}
            >
              <Lock className="w-4 h-4" />
              {lockdownActive ? "🔒 LOCKDOWN ATIVO" : "MODO LOCKDOWN"}
              <AlertTriangle className="w-4 h-4 ml-auto opacity-60" />
            </button>
          </div>

          {/* Live Feed */}
          <div className="flex-1 px-4 pb-4 overflow-hidden flex flex-col">
            <div className="flex items-center gap-2 mb-3">
              <Bell className="w-4 h-4" style={{ color: NEON_PINK }} />
              <span className="text-sm font-semibold text-white/70 uppercase tracking-wider">Live Feed</span>
              <span
                className="w-2 h-2 rounded-full ml-auto"
                style={{ background: NEON_GREEN, boxShadow: `0 0 6px ${NEON_GREEN}`, animation: "radarPulse 1.5s ease-in-out infinite" }}
              />
            </div>
            <div className="flex-1 overflow-y-auto space-y-2 pr-1" style={{ maxHeight: "350px" }}>
              <AnimatePresence>
                {notificationsData?.notifications?.map((n) => (
                  <motion.div
                    key={n.id}
                    initial={{ opacity: 0, x: -15 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="bg-white/5 rounded-lg p-2.5 border border-white/5 text-xs"
                  >
                    <span className="font-mono text-[10px]" style={{ color: NEON_GREEN }}>
                      [{new Date(n.createdAt).toLocaleTimeString("pt-BR")}]
                    </span>
                    <p className="text-white/70 mt-0.5 leading-relaxed">{n.message}</p>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          {/* Metrics row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[
              { icon: <Activity className="w-5 h-5" />, label: "Conversão", value: `${((stats?.conversionRate || 0)).toFixed(1)}%`, color: "#60a5fa" },
              { icon: <Users className="w-5 h-5" />, label: "Modelos", value: stats?.totalModels || 0, color: "#c084fc" },
              { icon: <ShieldCheck className="w-5 h-5" />, label: "KYC Pendente", value: stats?.pendingKyc || 0, color: "#fbbf24" },
              { icon: <DollarSign className="w-5 h-5" />, label: "Saques Pendentes", value: stats?.pendingWithdrawals || 0, color: NEON_GREEN },
            ].map((card, i) => (
              <div
                key={i}
                className="glass-panel rounded-2xl p-5 radar-card"
                style={{ borderTop: `2px solid ${card.color}66` }}
              >
                <div className="flex items-center gap-2 mb-2" style={{ color: card.color }}>
                  {card.icon}
                  <span className="text-xs text-white/50">{card.label}</span>
                </div>
                <p className="text-3xl font-bold text-white">{card.value}</p>
              </div>
            ))}
          </div>

          {/* Volume + Fees summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="glass-panel rounded-xl p-4 border border-white/5">
              <p className="text-white/40 text-xs uppercase mb-1">Volume Total Transacionado</p>
              <p className="text-xl font-bold text-white">{formatCurrency(stats?.volumeTransacted || 0)}</p>
            </div>
            <div className="glass-panel rounded-xl p-4 border border-white/5">
              <p className="text-white/40 text-xs uppercase mb-1">Taxas de Saque (2%)</p>
              <p className="text-xl font-bold" style={{ color: NEON_GREEN }}>{formatCurrency(stats?.totalWithdrawalFees || 0)}</p>
            </div>
            <div className="glass-panel rounded-xl p-4 border border-white/5">
              <p className="text-white/40 text-xs uppercase mb-1">Top Modelo</p>
              <p className="text-xl font-bold text-white">{stats?.topModels?.[0]?.artistName || "—"}</p>
              <p className="text-xs text-white/30">{stats?.topModels?.[0]?.sales || 0} vendas</p>
            </div>
          </div>

          <Tabs defaultValue="models" className="w-full">
            <TabsList className="bg-white/5 border border-white/10 p-1 mb-6 h-12 flex-wrap gap-1">
              {[
                { value: "models", label: "👑 Modelos" },
                { value: "withdrawals", label: "💸 Saques" },
                { value: "charts", label: "📊 Gráficos" },
                { value: "settings", label: "⚙️ Config" },
              ].map(tab => (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className="data-[state=active]:text-black rounded-lg h-full px-4 text-sm font-semibold"
                  style={{ ["--tw-ring-color" as any]: NEON_PINK }}
                >
                  <span className="data-[state=active]:hidden" data-state="inactive">{tab.label}</span>
                  <span
                    className="hidden data-[state=active]:inline"
                    style={{ color: NEON_PINK }}
                    data-state="active"
                  >{tab.label}</span>
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>

            {/* MODELS TAB */}
            <TabsContent value="models">
              <div className="glass-panel rounded-2xl overflow-hidden border border-white/10">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm min-w-[700px]">
                    <thead className="bg-black/40 border-b border-white/10">
                      <tr>
                        <th className="p-4 text-white/50 font-medium">Modelo</th>
                        <th className="p-4 text-white/50 font-medium">Contato</th>
                        <th className="p-4 text-white/50 font-medium">Vendas</th>
                        <th className="p-4 text-white/50 font-medium">Status</th>
                        <th className="p-4 text-white/50 font-medium">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {modelsData?.models?.map((m) => (
                        <tr key={m.id} className="border-b border-white/5 hover:bg-white/3 transition-colors">
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full overflow-hidden bg-white/10 flex-shrink-0">
                                {m.profilePhoto
                                  ? <img src={m.profilePhoto} alt="" className="w-full h-full object-cover" />
                                  : <div className="w-full h-full flex items-center justify-center text-white/30 text-xs">{m.artistName[0]}</div>
                                }
                              </div>
                              <div>
                                <p className="font-semibold text-white">{m.artistName}</p>
                                <p className="text-xs text-white/30">{m.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="p-4">
                            <p className="text-xs text-white/50 font-mono">{m.whatsapp}</p>
                            <p className="text-xs text-white/30 truncate max-w-[120px]">{m.pixKey}</p>
                          </td>
                          <td className="p-4">
                            <span className="font-bold" style={{ color: NEON_PINK }}>{m.totalSales}</span>
                            <p className="text-xs text-white/30">{formatCurrency(m.grossBalance || 0)} saldo</p>
                          </td>
                          <td className="p-4">
                            <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                              m.status === "pending" ? "bg-yellow-500/20 text-yellow-400" :
                              m.status === "approved" ? "bg-green-500/20 text-green-400" :
                              "bg-red-500/20 text-red-400"
                            }`}>
                              {m.status === "pending" ? "PENDENTE" : m.status === "approved" ? "APROVADA" : "REJEITADA"}
                            </span>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-2 flex-wrap">
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button size="icon" variant="ghost" className="text-white/40 hover:text-white h-8 w-8" title="Ver selfie">
                                    <Search className="w-4 h-4" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="bg-[#111] border-white/10">
                                  <DialogHeader><DialogTitle className="text-white">{m.artistName} — Selfie KYC</DialogTitle></DialogHeader>
                                  <div className="aspect-[3/4] w-full bg-black rounded-lg overflow-hidden">
                                    {m.selfieUrl
                                      ? <img src={m.selfieUrl} alt="Selfie" className="w-full h-full object-cover" />
                                      : <div className="text-white/30 flex items-center justify-center h-full">Sem selfie</div>
                                    }
                                  </div>
                                </DialogContent>
                              </Dialog>

                              {m.status === "pending" && (
                                <Button
                                  size="sm"
                                  onClick={() => handleApprove(m.id)}
                                  className="h-8 px-3 text-black font-bold"
                                  style={{ background: NEON_GREEN, boxShadow: `0 0 10px ${NEON_GREEN}66` }}
                                >
                                  <Zap className="w-3 h-3 mr-1" /> Aprovar
                                </Button>
                              )}

                              {m.status === "pending" && (
                                <Button size="sm" variant="ghost" onClick={() => handleReject(m.id)} className="h-8 px-2 text-red-400 hover:text-red-300">
                                  Rejeitar
                                </Button>
                              )}

                              <Button size="icon" variant="ghost" onClick={() => handleHide(m.id)} className="h-8 w-8 text-white/30 hover:text-yellow-400">
                                <EyeOff className="w-4 h-4" />
                              </Button>

                              <Button size="icon" variant="ghost" onClick={() => handleDelete(m.id)} className="h-8 w-8 text-white/30 hover:text-red-400">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {!modelsData?.models?.length && (
                        <tr><td colSpan={5} className="p-12 text-center text-white/20">Nenhuma modelo cadastrada ainda.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </TabsContent>

            {/* WITHDRAWALS TAB */}
            <TabsContent value="withdrawals">
              <div className="glass-panel rounded-2xl overflow-hidden border border-yellow-500/20">
                <div className="p-4 border-b border-white/5 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-yellow-400" />
                  <h3 className="font-bold text-yellow-400">Saques Aguardando Autorização (≥ R$450)</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm min-w-[600px]">
                    <thead className="bg-black/40 border-b border-white/5">
                      <tr>
                        <th className="p-4 text-white/50">Criadora</th>
                        <th className="p-4 text-white/50">Chave Pix</th>
                        <th className="p-4 text-white/50">Bruto</th>
                        <th className="p-4 text-white/50">Taxa 2%</th>
                        <th className="p-4 text-white/50">Líquido</th>
                        <th className="p-4 text-white/50">Status</th>
                        <th className="p-4 text-white/50">Ação</th>
                      </tr>
                    </thead>
                    <tbody>
                      {withdrawalsData?.withdrawals?.map((w) => (
                        <tr key={w.id} className="border-b border-white/5 hover:bg-white/3">
                          <td className="p-4 font-semibold text-white">{w.artistName}</td>
                          <td className="p-4 font-mono text-white/50 text-xs">{w.pixKey}</td>
                          <td className="p-4 text-white/70">{formatCurrency(w.grossAmount)}</td>
                          <td className="p-4 text-red-400">-{formatCurrency(w.feeAmount)}</td>
                          <td className="p-4 font-bold" style={{ color: NEON_GREEN }}>{formatCurrency(w.netAmount)}</td>
                          <td className="p-4">
                            <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                              w.status === "pending_approval" ? "bg-yellow-500/20 text-yellow-400" :
                              w.status === "completed" ? "bg-green-500/20 text-green-400" :
                              "bg-red-500/20 text-red-400"
                            }`}>
                              {w.status === "pending_approval" ? "EM ANÁLISE" : w.status === "completed" ? "CONCLUÍDO" : w.status.toUpperCase()}
                            </span>
                          </td>
                          <td className="p-4">
                            {w.status === "pending_approval" && (
                              <Button
                                size="sm"
                                onClick={() => handleAuthorize(w.id)}
                                className="font-bold text-white"
                                style={{ background: NEON_PINK, boxShadow: `0 0 12px ${NEON_PINK}66` }}
                              >
                                AUTORIZAR PIX
                              </Button>
                            )}
                            {w.status === "completed" && <CheckCircle2 className="w-5 h-5 text-green-400" />}
                          </td>
                        </tr>
                      ))}
                      {!withdrawalsData?.withdrawals?.length && (
                        <tr><td colSpan={7} className="p-12 text-center text-white/20">Nenhum saque pendente.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </TabsContent>

            {/* CHARTS TAB */}
            <TabsContent value="charts">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
                {stats?.topModels?.map((m, i) => (
                  <div key={m.id} className="glass-panel rounded-xl p-4 border border-white/5 flex items-center gap-4">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-black flex-shrink-0"
                      style={{ background: i === 0 ? GOLD : i === 1 ? "#C0C0C0" : "#CD7F32" }}
                    >
                      {i + 1}
                    </div>
                    <div>
                      <p className="font-bold text-white">{m.artistName}</p>
                      <p className="text-sm" style={{ color: NEON_PINK }}>{m.sales} vendas</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="glass-panel p-6 rounded-2xl border border-white/10 h-[350px]">
                <h3 className="text-white font-bold mb-6 flex items-center gap-2">
                  <Activity className="w-5 h-5" style={{ color: NEON_PINK }} />
                  Volume de Vendas — Últimos 7 dias
                </h3>
                <ResponsiveContainer width="100%" height="85%">
                  <BarChart data={stats?.salesLast7Days || []}>
                    <XAxis dataKey="date" stroke="#ffffff30" fontSize={11} tickLine={false} axisLine={false}
                      tickFormatter={(v: string) => v.slice(5)} />
                    <YAxis stroke="#ffffff30" fontSize={11} tickLine={false} axisLine={false}
                      tickFormatter={(v) => `R$${v}`} />
                    <Tooltip
                      cursor={{ fill: "rgba(255,255,255,0.04)" }}
                      contentStyle={{ background: "#1a1a1a", border: "1px solid rgba(255,0,255,0.3)", borderRadius: "8px" }}
                      labelStyle={{ color: "#fff" }}
                    />
                    <Bar dataKey="revenue" fill={NEON_PINK} radius={[4, 4, 0, 0]}
                      style={{ filter: `drop-shadow(0 0 6px ${NEON_PINK}88)` }} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </TabsContent>

            {/* SETTINGS TAB */}
            <TabsContent value="settings">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="glass-panel rounded-2xl p-6 border border-white/10">
                  <h3 className="font-bold text-white mb-5 flex items-center gap-2">
                    <Settings className="w-5 h-5" style={{ color: NEON_PINK }} />
                    Configurações Financeiras
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <Label className="text-white/60 text-xs uppercase tracking-wider">Chave Pix da Plataforma</Label>
                      <Input
                        value={settingsForm.pixKey}
                        onChange={(e) => setSettingsForm(s => ({ ...s, pixKey: e.target.value }))}
                        className="bg-black/50 border-white/10 text-white mt-1"
                        placeholder="CPF, CNPJ, e-mail ou chave aleatória"
                      />
                    </div>
                    <div>
                      <Label className="text-white/60 text-xs uppercase tracking-wider">Valor de Acesso (R$)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={settingsForm.accessValue}
                        onChange={(e) => setSettingsForm(s => ({ ...s, accessValue: parseFloat(e.target.value) }))}
                        className="bg-black/50 border-white/10 text-white mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-white/60 text-xs uppercase tracking-wider">Taxa de Saque (ex: 0.02 = 2%)</Label>
                      <Input
                        type="number"
                        step="0.001"
                        value={settingsForm.withdrawalFeeRate}
                        onChange={(e) => setSettingsForm(s => ({ ...s, withdrawalFeeRate: parseFloat(e.target.value) }))}
                        className="bg-black/50 border-white/10 text-white mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-white/60 text-xs uppercase tracking-wider">Limite Saque Automático (R$)</Label>
                      <Input
                        type="number"
                        step="1"
                        value={settingsForm.autoWithdrawalLimit}
                        onChange={(e) => setSettingsForm(s => ({ ...s, autoWithdrawalLimit: parseFloat(e.target.value) }))}
                        className="bg-black/50 border-white/10 text-white mt-1"
                      />
                    </div>
                    <Button
                      onClick={handleSaveSettings}
                      className="w-full font-bold text-black"
                      style={{ background: NEON_GREEN, boxShadow: `0 0 12px ${NEON_GREEN}44` }}
                    >
                      Salvar Configurações
                    </Button>
                  </div>
                </div>

                <div className="glass-panel rounded-2xl p-6 border border-white/10">
                  <h3 className="font-bold text-white mb-5 flex items-center gap-2">
                    <Activity className="w-5 h-5 text-blue-400" />
                    Integração Efí Bank
                  </h3>
                  <div className="space-y-4">
                    <div className="bg-black/30 rounded-xl p-4 border border-white/5">
                      <p className="text-white/50 text-xs uppercase tracking-wider mb-2">URL do Webhook</p>
                      <p className="font-mono text-xs text-white/70 break-all">
                        https://dime-privy-launch--privydime.replit.app/api/webhook/pix
                      </p>
                    </div>
                    <Button
                      onClick={handleRegisterWebhook}
                      className="w-full font-bold text-white"
                      style={{ background: NEON_PINK, boxShadow: `0 0 12px ${NEON_PINK}44` }}
                    >
                      🔗 Registrar Webhook na Efí Bank
                    </Button>
                    <p className="text-white/30 text-xs text-center">
                      Clique para configurar automaticamente o webhook de notificações Pix
                    </p>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </ProtectedRoute>
  );
}
