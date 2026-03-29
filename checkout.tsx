import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useCreatePayment, useGetPaymentStatus } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { ShieldCheck, Copy, CheckCircle2, AlertTriangle, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import QRCode from "react-qr-code";
import { motion } from "framer-motion";

export default function Checkout() {
  const params = useParams();
  const modelId = Number(params.id);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { token, grantAccess } = useAuth();
  
  const [txid, setTxid] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // 1. Create payment on mount
  const createMutation = useCreatePayment();
  
  useEffect(() => {
    if (modelId && !txid && !createMutation.isPending && !createMutation.isSuccess) {
      createMutation.mutate({
        data: { modelId, clientToken: token || "anon" }
      }, {
        onSuccess: (data) => {
          setTxid(data.txid);
        },
        onError: () => {
          toast({ title: "Erro", description: "Não foi possível gerar o Pix.", variant: "destructive" });
        }
      });
    }
  }, [modelId]);

  // 2. Poll status every 3 seconds if we have a txid
  const { data: statusData } = useGetPaymentStatus(txid!, {
    query: {
      enabled: !!txid,
      refetchInterval: (query) => (query.state.data?.paid ? false : 3000), // stop polling if paid
    }
  });

  // 3. Handle success
  useEffect(() => {
    if (statusData?.paid) {
      // Create a fake token if the backend didn't provide one, just for local state
      grantAccess(modelId, "access_granted");
      toast({
        title: "Pagamento Confirmado!",
        description: "Seu acesso VIP foi liberado.",
      });
      // Small delay for user to see the success screen
      setTimeout(() => {
        setLocation(`/model/${modelId}`);
      }, 2000);
    }
  }, [statusData?.paid]);

  const handleCopy = () => {
    if (createMutation.data?.copiaCola) {
      navigator.clipboard.writeText(createMutation.data.copiaCola);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  const isPaid = statusData?.paid;

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 relative">
      {/* Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-pink-600/10 blur-[120px] rounded-full" />
      </div>

      <div className="w-full max-w-md relative z-10">
        <Button 
          variant="ghost" 
          className="text-white/60 hover:text-white mb-6 pl-0"
          onClick={() => setLocation(`/model/${modelId}`)}
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Cancelar
        </Button>

        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-panel rounded-3xl p-8 border-t border-pink-500/30 neon-glow-pink text-center"
        >
          {isPaid ? (
            <motion.div 
              initial={{ scale: 0.8 }} animate={{ scale: 1 }}
              className="py-12 flex flex-col items-center"
            >
              <div className="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center mb-6 border border-green-500/50 shadow-[0_0_30px_rgba(0,255,65,0.4)]">
                <CheckCircle2 className="w-12 h-12 text-green-400" />
              </div>
              <h2 className="text-3xl font-bold text-white mb-2">Pix Recebido!</h2>
              <p className="text-white/60">Redirecionando para o conteúdo VIP...</p>
            </motion.div>
          ) : (
            <>
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 bg-pink-500/10 rounded-2xl flex items-center justify-center border border-pink-500/30">
                  <ShieldCheck className="w-8 h-8 text-pink-400" />
                </div>
              </div>
              
              <h2 className="text-2xl font-bold text-white mb-2">Liberação VIP</h2>
              <p className="text-white/60 mb-8">Pague via Pix para ter acesso imediato.</p>
              
              <div className="bg-black/50 rounded-2xl p-6 border border-white/10 mb-8 inline-block mx-auto">
                {createMutation.isPending ? (
                  <div className="w-[200px] h-[200px] flex items-center justify-center">
                    <div className="w-10 h-10 border-4 border-pink-500 border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : createMutation.data?.qrCodeBase64 ? (
                   // API should return base64 image or raw string. Assuming raw string for react-qr-code
                   // Actually schema says qrCodeBase64. If it's a data url:
                  <img src={createMutation.data.qrCodeBase64} alt="QR Code Pix" className="w-[200px] h-[200px] rounded-lg" />
                ) : createMutation.data?.copiaCola ? (
                  // Fallback to generating it client side if base64 fails but copiaCola exists
                  <div className="bg-white p-2 rounded-lg">
                     <QRCode value={createMutation.data.copiaCola} size={184} />
                  </div>
                ) : null}
              </div>

              <div className="text-3xl font-display font-bold text-pink-400 mb-8">
                R$ 2,00
              </div>

              <Button 
                onClick={handleCopy}
                disabled={!createMutation.data?.copiaCola}
                className={`w-full h-14 rounded-xl text-lg font-bold transition-all ${
                  copied 
                    ? "bg-green-500 hover:bg-green-400 text-black shadow-[0_0_20px_rgba(0,255,65,0.4)]" 
                    : "bg-white/10 hover:bg-white/20 text-white border border-white/20"
                }`}
              >
                {copied ? <CheckCircle2 className="w-5 h-5 mr-2" /> : <Copy className="w-5 h-5 mr-2" />}
                {copied ? "Código Copiado!" : "Copiar Código Pix"}
              </Button>

              <div className="mt-8 flex items-start gap-3 bg-pink-500/10 p-4 rounded-xl text-left border border-pink-500/20">
                <AlertTriangle className="w-5 h-5 text-pink-400 shrink-0 mt-0.5" />
                <p className="text-sm text-pink-200/80">
                  <strong>Não feche esta página.</strong> Assim que o pagamento for aprovado no seu banco, o acesso será liberado automaticamente aqui em segundos.
                </p>
              </div>
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
}
