import React, { useState } from "react";
import { useGetModelDashboard, useRequestWithdrawal } from "@workspace/api-client-react";
import { Layout } from "@/components/layout";
import { Card, Button, Modal, Input, Badge } from "@/components/ui";
import { getAuthHeaders, formatCurrency } from "@/lib/utils";
import { DollarSign, TrendingUp, Users, ArrowRight } from "lucide-react";
import { format } from "date-fns";

export default function CreatorDashboard() {
  const { data: dashboard, refetch } = useGetModelDashboard({ request: { headers: getAuthHeaders() } });
  const withdrawMutation = useRequestWithdrawal({ request: { headers: getAuthHeaders() } });
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [amount, setAmount] = useState("");

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await withdrawMutation.mutateAsync({ data: { amount: Number(amount) } });
      setIsModalOpen(false);
      setAmount("");
      refetch();
      alert("Saque solicitado com sucesso!");
    } catch (err: any) {
      alert(err.message || "Erro ao solicitar saque");
    }
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-display font-black neon-text-green text-accent">Meu Dashboard</h1>
          <Button variant="green" onClick={() => setIsModalOpen(true)}>Solicitar Saque</Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <Card className="p-6 border-white/5 bg-gradient-to-br from-white/5 to-transparent">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-accent/20 rounded-xl"><DollarSign className="text-accent" /></div>
              <h3 className="text-white/60 font-bold">Saldo Disponível</h3>
            </div>
            <p className="text-4xl font-display font-black">{formatCurrency(dashboard?.balance || 0)}</p>
          </Card>
          
          <Card className="p-6 border-white/5">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-white/10 rounded-xl"><TrendingUp className="text-white" /></div>
              <h3 className="text-white/60 font-bold">Total Ganho</h3>
            </div>
            <p className="text-3xl font-display font-bold">{formatCurrency(dashboard?.totalEarned || 0)}</p>
          </Card>

          <Card className="p-6 border-white/5">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-primary/20 rounded-xl"><Users className="text-primary" /></div>
              <h3 className="text-white/60 font-bold">Total de Vendas</h3>
            </div>
            <p className="text-3xl font-display font-bold">{dashboard?.totalSales || 0}</p>
          </Card>
        </div>

        <h2 className="text-xl font-bold mb-6 flex items-center gap-2"><ArrowRight className="w-5 h-5 text-primary"/> Pagamentos Recentes</h2>
        <Card className="border-white/5 overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 bg-white/5">
                <th className="p-4 font-bold text-white/60">ID</th>
                <th className="p-4 font-bold text-white/60">Data</th>
                <th className="p-4 font-bold text-white/60">Valor Recebido</th>
                <th className="p-4 font-bold text-white/60">Status</th>
              </tr>
            </thead>
            <tbody>
              {dashboard?.recentPayments?.map(p => (
                <tr key={p.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <td className="p-4 text-white/80 font-mono text-sm">#{p.id}</td>
                  <td className="p-4 text-white/80">{p.createdAt ? format(new Date(p.createdAt), "dd/MM/yyyy HH:mm") : "-"}</td>
                  <td className="p-4 font-bold text-accent">{formatCurrency(p.modelEarning)}</td>
                  <td className="p-4">
                    <Badge variant={p.status === 'confirmed' ? 'green' : 'neutral'}>{p.status.toUpperCase()}</Badge>
                  </td>
                </tr>
              ))}
              {!dashboard?.recentPayments?.length && (
                <tr><td colSpan={4} className="p-8 text-center text-white/40">Nenhum pagamento ainda.</td></tr>
              )}
            </tbody>
          </table>
        </Card>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Solicitar Saque">
        <form onSubmit={handleWithdraw} className="space-y-6">
          <div>
            <label className="block text-sm text-white/60 mb-2">Valor a sacar (Máx: {formatCurrency(dashboard?.balance || 0)})</label>
            <Input type="number" step="0.01" min="10" max={dashboard?.balance || 0} required value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" className="text-2xl h-14 font-mono" />
          </div>
          <p className="text-xs text-white/40">O pagamento será enviado para sua Chave Pix cadastrada.</p>
          <Button type="submit" variant="green" className="w-full" disabled={withdrawMutation.isPending}>
            {withdrawMutation.isPending ? "Processando..." : "Confirmar Saque"}
          </Button>
        </form>
      </Modal>
    </Layout>
  );
}
