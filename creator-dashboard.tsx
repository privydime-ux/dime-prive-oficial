import { useState } from "react";
import { 
  useGetMyStats, 
  useGetMyProfile, 
  useUploadPhoto, 
  useDeletePhoto, 
  useRequestWithdrawal,
  useGetWithdrawalHistory
} from "@workspace/api-client-react";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { fileToBase64, formatCurrency } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Eye, TrendingUp, Wallet, ImagePlus, Trash2, Loader2, AlertTriangle, CheckCircle2, Copy } from "lucide-react";
import { motion } from "framer-motion";

export default function CreatorDashboard() {
  const { data: stats } = useGetMyStats();
  const { data: profile, refetch: refetchProfile } = useGetMyProfile();
  const { data: history, refetch: refetchHistory } = useGetWithdrawalHistory();
  const uploadMutation = useUploadPhoto();
  const deleteMutation = useDeletePhoto();
  const withdrawMutation = useRequestWithdrawal();
  const { toast } = useToast();

  const [withdrawAmount, setWithdrawAmount] = useState<number>(0);
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      try {
        const base64 = await fileToBase64(file);
        await uploadMutation.mutateAsync({ data: { imageBase64: base64 } });
        toast({ title: "Sucesso", description: "Foto adicionada à galeria." });
        refetchProfile();
      } catch (err) {
        toast({ title: "Erro", description: "Falha ao enviar foto.", variant: "destructive" });
      }
    }
  };

  const handleDeletePhoto = async (id: number) => {
    if (confirm("Excluir esta foto?")) {
      try {
        await deleteMutation.mutateAsync({ photoId: id });
        toast({ title: "Sucesso", description: "Foto removida." });
        refetchProfile();
      } catch (err) {
        toast({ title: "Erro", description: "Falha ao excluir.", variant: "destructive" });
      }
    }
  };

  const handleWithdrawal = async () => {
    if (withdrawAmount <= 0 || withdrawAmount > (stats?.availableBalance || 0)) {
      toast({ title: "Valor inválido", variant: "destructive" });
      return;
    }

    try {
      await withdrawMutation.mutateAsync({ data: { amount: withdrawAmount } });
      toast({ title: "Saque Solicitado", description: "O pedido foi registrado." });
      setIsWithdrawOpen(false);
      setWithdrawAmount(0);
      refetchHistory();
    } catch (err: any) {
      toast({ title: "Erro no saque", description: err.message || "Tente novamente.", variant: "destructive" });
    }
  };

  const feeRate = stats?.withdrawalFeeRate || 0.02;
  const netAmount = withdrawAmount - (withdrawAmount * feeRate);

  return (
    <ProtectedRoute allowedRoles={['model']}>
      <div className="min-h-screen bg-background relative">
        <div className="absolute inset-0 opacity-10 bg-cover bg-center pointer-events-none" style={{ backgroundImage: `url(${import.meta.env.BASE_URL}images/neon-green-bg.png)` }} />
        <div className="relative z-10">
          <Navbar />
          
          <div className="max-w-7xl mx-auto px-4 py-8">
            
            {/* Status Banner */}
            {profile?.model.status === 'pending' && (
              <div className="bg-yellow-500/10 border border-yellow-500/50 rounded-xl p-4 mb-8 flex items-start gap-3">
                <AlertTriangle className="w-6 h-6 text-yellow-500 shrink-0" />
                <div>
                  <h3 className="text-yellow-500 font-bold">Perfil em Análise</h3>
                  <p className="text-yellow-200/80 text-sm">Sua selfie de segurança está sendo avaliada. Você ainda não aparece na vitrine pública.</p>
                </div>
              </div>
            )}
            
            {profile?.model.status === 'approved' && (
              <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 mb-8 flex items-center gap-3">
                <CheckCircle2 className="w-6 h-6 text-green-500" />
                <p className="text-green-400 font-medium">Perfil Verificado e Ativo na Vitrine!</p>
              </div>
            )}

            {/* Dashboard Header / Metrics */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
              {/* Main Balance Card */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                className="lg:col-span-2 glass-panel rounded-3xl p-8 border-t border-green-500/50 neon-glow-green relative overflow-hidden"
              >
                <div className="absolute right-0 top-0 opacity-10">
                  <Wallet className="w-48 h-48 -mr-10 -mt-10" />
                </div>
                <div className="relative z-10">
                  <p className="text-white/60 text-lg mb-2">Saldo Disponível</p>
                  <h2 className="text-5xl font-display font-bold text-green-400 neon-text-green mb-6">
                    {formatCurrency(stats?.availableBalance || 0)}
                  </h2>
                  
                  <div className="flex gap-4">
                    <Dialog open={isWithdrawOpen} onOpenChange={setIsWithdrawOpen}>
                      <DialogTrigger asChild>
                        <Button className="bg-green-500 hover:bg-green-400 text-black font-bold h-12 px-8 rounded-xl shadow-[0_0_15px_rgba(0,255,65,0.3)]">
                          Solicitar Saque
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="bg-[#121212] border-white/10 text-white sm:max-w-md">
                        <DialogHeader>
                          <DialogTitle>Sacar Fundos</DialogTitle>
                        </DialogHeader>
                        <div className="py-4 space-y-6">
                          <div>
                            <Label className="text-white/60">Saldo Atual</Label>
                            <p className="text-2xl font-bold text-white">{formatCurrency(stats?.availableBalance || 0)}</p>
                          </div>
                          
                          <div className="space-y-2">
                            <Label>Valor do Saque (R$)</Label>
                            <Input 
                              type="number" 
                              min={0} 
                              max={stats?.availableBalance || 0}
                              value={withdrawAmount || ''}
                              onChange={(e) => setWithdrawAmount(Number(e.target.value))}
                              className="bg-black/50 border-white/10 h-12 text-xl"
                            />
                          </div>
                          
                          <div className="bg-white/5 rounded-xl p-4 space-y-2 text-sm">
                            <div className="flex justify-between text-white/60">
                              <span>Taxa de Serviço ({(feeRate * 100).toFixed(0)}%)</span>
                              <span>- {formatCurrency(withdrawAmount * feeRate)}</span>
                            </div>
                            <div className="flex justify-between font-bold text-green-400 border-t border-white/10 pt-2">
                              <span>Você recebe (Líquido)</span>
                              <span>{formatCurrency(netAmount > 0 ? netAmount : 0)}</span>
                            </div>
                          </div>
                          <p className="text-xs text-white/40 text-center">
                            Valores menores que R$ 450,00 são processados automaticamente via Pix.
                          </p>
                        </div>
                        <DialogFooter>
                          <Button 
                            onClick={handleWithdrawal}
                            disabled={withdrawMutation.isPending || withdrawAmount <= 0 || withdrawAmount > (stats?.availableBalance || 0)}
                            className="w-full bg-green-500 hover:bg-green-400 text-black font-bold h-12"
                          >
                            {withdrawMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : "Confirmar Saque"}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </motion.div>

              {/* Mini Stats */}
              <div className="space-y-6">
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="glass-panel rounded-2xl p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white/60 text-sm mb-1">Visualizações de Perfil</p>
                      <p className="text-3xl font-bold text-white">{stats?.profileViews || 0}</p>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                      <Eye className="w-6 h-6 text-blue-400" />
                    </div>
                  </div>
                </motion.div>
                
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="glass-panel rounded-2xl p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white/60 text-sm mb-1">Vendas de Acesso (R$ 2,00)</p>
                      <p className="text-3xl font-bold text-white">{stats?.totalSales || 0}</p>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-pink-500/10 flex items-center justify-center border border-pink-500/20">
                      <TrendingUp className="w-6 h-6 text-pink-400" />
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>

            {/* Content Tabs */}
            <Tabs defaultValue="gallery" className="w-full">
              <TabsList className="bg-white/5 border border-white/10 p-1 mb-8">
                <TabsTrigger value="gallery" className="data-[state=active]:bg-white/10 data-[state=active]:text-green-400 rounded-lg">
                  Galeria Privada
                </TabsTrigger>
                <TabsTrigger value="withdrawals" className="data-[state=active]:bg-white/10 data-[state=active]:text-green-400 rounded-lg">
                  Histórico de Saques
                </TabsTrigger>
              </TabsList>

              <TabsContent value="gallery" className="mt-0">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold text-white">Suas Fotos</h3>
                  <Label htmlFor="photo-upload" className="cursor-pointer inline-flex items-center justify-center h-10 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg border border-white/20 transition-all">
                    <ImagePlus className="w-4 h-4 mr-2" /> 
                    {uploadMutation.isPending ? "Enviando..." : "Adicionar Foto"}
                  </Label>
                  <input id="photo-upload" type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} disabled={uploadMutation.isPending} />
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {profile?.photos?.map((photo) => (
                    <div key={photo.id} className="aspect-[3/4] relative rounded-xl overflow-hidden group bg-white/5 border border-white/10">
                      <img src={photo.url} alt="Gallery" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Button 
                          variant="destructive" 
                          size="icon" 
                          className="rounded-full w-10 h-10 shadow-xl"
                          onClick={() => handleDeletePhoto(photo.id)}
                        >
                          <Trash2 className="w-5 h-5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  
                  {(!profile?.photos || profile.photos.length === 0) && (
                    <div className="col-span-full py-12 text-center glass-panel rounded-xl">
                      <ImagePlus className="w-12 h-12 text-white/20 mx-auto mb-3" />
                      <p className="text-white/60">Sua galeria está vazia. Adicione fotos sensuais borradas para atrair vendas.</p>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="withdrawals" className="mt-0">
                <div className="glass-panel rounded-2xl overflow-hidden border border-white/10">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead className="bg-white/5 border-b border-white/10">
                        <tr>
                          <th className="p-4 text-white/60 font-medium">Data</th>
                          <th className="p-4 text-white/60 font-medium">Valor Bruto</th>
                          <th className="p-4 text-white/60 font-medium">Taxa (2%)</th>
                          <th className="p-4 text-white/60 font-medium">Líquido Recebido</th>
                          <th className="p-4 text-white/60 font-medium">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {history?.withdrawals?.map((w) => (
                          <tr key={w.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                            <td className="p-4 text-white/80">{new Date(w.createdAt).toLocaleDateString()}</td>
                            <td className="p-4 text-white">{formatCurrency(w.grossAmount)}</td>
                            <td className="p-4 text-red-400">-{formatCurrency(w.feeAmount)}</td>
                            <td className="p-4 text-green-400 font-bold">{formatCurrency(w.netAmount)}</td>
                            <td className="p-4">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                                w.status === 'completed' ? 'bg-green-500/10 text-green-400 border-green-500/30' :
                                w.status === 'pending' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30' :
                                'bg-red-500/10 text-red-400 border-red-500/30'
                              }`}>
                                {w.status === 'completed' ? 'Concluído' : w.status === 'pending' ? 'Em Análise' : 'Rejeitado'}
                              </span>
                            </td>
                          </tr>
                        ))}
                        {(!history?.withdrawals || history.withdrawals.length === 0) && (
                          <tr>
                            <td colSpan={5} className="p-8 text-center text-white/40">Nenhum saque solicitado ainda.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
