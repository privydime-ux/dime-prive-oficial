import React, { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAdminLogin, useAdminGetStats, useAdminListModels, useAdminListWithdrawals, useAdminApproveModel, useAdminRejectModel, useAdminApproveWithdrawal } from "@workspace/api-client-react";
import { Layout } from "@/components/layout";
import { Card, Button, Input, Badge } from "@/components/ui";
import { getAdminHeaders, formatCurrency } from "@/lib/utils";
import { ShieldAlert, Check, X } from "lucide-react";
import { format } from "date-fns";

export default function AdminDashboard() {
  const qc = useQueryClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [activeTab, setActiveTab] = useState<'stats'|'models'|'withdrawals'>('stats');
  const [isLogged, setIsLogged] = useState(!!localStorage.getItem("dime_admin_token"));

  const loginMutation = useAdminLogin();
  const { data: stats } = useAdminGetStats({ request: { headers: getAdminHeaders() }, query: { enabled: isLogged } });
  const { data: models } = useAdminListModels({ request: { headers: getAdminHeaders() }, query: { enabled: isLogged && activeTab === 'models' } });
  const { data: withdrawals } = useAdminListWithdrawals({ request: { headers: getAdminHeaders() }, query: { enabled: isLogged && activeTab === 'withdrawals' } });
  
  const approveModel = useAdminApproveModel({ request: { headers: getAdminHeaders() }});
  const rejectModel = useAdminRejectModel({ request: { headers: getAdminHeaders() }});
  const approveWithdrawal = useAdminApproveWithdrawal({ request: { headers: getAdminHeaders() }});

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await loginMutation.mutateAsync({ data: { email, password } });
      localStorage.setItem("dime_admin_token", res.token);
      setIsLogged(true);
      console.log("Admin Logado!");
    } catch {
      alert("Acesso Negado");
    }
  };

  const handleAction = async (action: any, id: number, queryKey: string) => {
    await action.mutateAsync({ id });
    qc.invalidateQueries({ queryKey: [queryKey] });
  };

  if (!isLogged) return (
    <Layout>
      <div className="flex items-center justify-center min-h-[calc(100vh-100px)]">
        <Card className="p-8 w-full max-w-sm border-accent/50 shadow-[0_0_50px_rgba(0,255,65,0.1)]">
          <ShieldAlert className="w-12 h-12 text-accent mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-center mb-6 neon-text-green text-accent">Acesso Restrito</h2>
          <form onSubmit={handleLogin} className="space-y-4">
            <Input required value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email admin" />
            <Input required type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Senha" />
            <Button type="submit" variant="green" className="w-full">Entrar no Painel</Button>
          </form>
        </Card>
      </div>
    </Layout>
  );

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-display font-black text-accent neon-text-green mb-8 flex items-center gap-3"><ShieldAlert/> Administração Global</h1>
        
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
          {['stats', 'models', 'withdrawals'].map(tab => (
            <button 
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`px-6 py-3 rounded-xl font-bold transition-all whitespace-nowrap ${activeTab === tab ? 'bg-accent text-black shadow-[0_0_15px_rgba(0,255,65,0.4)]' : 'bg-white/5 text-white/60 hover:bg-white/10'}`}
            >
              {tab === 'stats' ? 'Métricas' : tab === 'models' ? 'Aprovar Modelos' : 'Aprovar Saques'}
            </button>
          ))}
        </div>

        {activeTab === 'stats' && stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="p-6 border-accent/20">
              <p className="text-white/50 mb-2">Faturamento Total</p>
              <p className="text-3xl font-bold">{formatCurrency(stats.totalRevenue)}</p>
            </Card>
            <Card className="p-6 border-primary/20">
              <p className="text-white/50 mb-2">Lucro da Plataforma (2%)</p>
              <p className="text-3xl font-bold text-primary neon-text-pink">{formatCurrency(stats.platformProfit)}</p>
            </Card>
            <Card className="p-6 border-white/10">
              <p className="text-white/50 mb-2">Transações Totais</p>
              <p className="text-3xl font-bold">{stats.totalTransactions}</p>
            </Card>
            <Card className="p-6 border-orange-500/20">
              <p className="text-white/50 mb-2">Modelos Pendentes</p>
              <p className="text-3xl font-bold text-orange-400">{stats.pendingModels}</p>
            </Card>
            <Card className="p-6 border-blue-500/20">
              <p className="text-white/50 mb-2">Saques Pendentes</p>
              <p className="text-3xl font-bold text-blue-400">{formatCurrency(stats.pendingWithdrawals)}</p>
            </Card>
          </div>
        )}

        {activeTab === 'models' && (
          <Card className="overflow-hidden border-white/10">
            <table className="w-full text-left">
              <thead><tr className="bg-white/5 border-b border-white/10"><th className="p-4">Nome</th><th className="p-4">Selfie</th><th className="p-4">Pix</th><th className="p-4">Status</th><th className="p-4">Ação</th></tr></thead>
              <tbody>
                {models?.map(m => (
                  <tr key={m.id} className="border-b border-white/5">
                    <td className="p-4 font-bold">{m.artisticName}</td>
                    <td className="p-4"><a href={m.selfieUrl} target="_blank" className="text-blue-400 hover:underline">Ver Foto</a></td>
                    <td className="p-4 font-mono text-sm">{m.pixKey}</td>
                    <td className="p-4"><Badge variant={m.status==='approved'?'green':m.status==='pending'?'neutral':'pink'}>{m.status}</Badge></td>
                    <td className="p-4 flex gap-2">
                      {m.status === 'pending' && (
                        <>
                          <Button variant="green" className="p-2 h-auto" onClick={() => handleAction(approveModel, m.id, '/api/admin/models')}><Check className="w-4 h-4"/></Button>
                          <Button variant="pink" className="p-2 h-auto" onClick={() => handleAction(rejectModel, m.id, '/api/admin/models')}><X className="w-4 h-4"/></Button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}

        {activeTab === 'withdrawals' && (
          <Card className="overflow-hidden border-white/10">
            <table className="w-full text-left">
              <thead><tr className="bg-white/5 border-b border-white/10"><th className="p-4">ID</th><th className="p-4">Model ID</th><th className="p-4">Valor Líquido</th><th className="p-4">Status</th><th className="p-4">Ação</th></tr></thead>
              <tbody>
                {withdrawals?.map(w => (
                  <tr key={w.id} className="border-b border-white/5">
                    <td className="p-4 font-mono">#{w.id}</td>
                    <td className="p-4 text-white/60">User {w.modelId}</td>
                    <td className="p-4 font-bold text-accent">{formatCurrency(w.netAmount)}</td>
                    <td className="p-4"><Badge variant={w.status==='approved'?'green':w.status==='pending'?'neutral':'pink'}>{w.status}</Badge></td>
                    <td className="p-4">
                      {w.status === 'pending' && (
                        <Button variant="green" className="py-1 px-3 h-auto text-xs" onClick={() => handleAction(approveWithdrawal, w.id, '/api/admin/withdrawals')}>Marcar como Pago</Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}
      </div>
    </Layout>
  );
}
