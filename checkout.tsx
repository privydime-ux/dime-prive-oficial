import React, { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useGetPaymentStatus } from "@workspace/api-client-react";
import { Layout } from "@/components/layout";
import { Card, Button } from "@/components/ui";
import { Copy, CheckCircle2, QrCode } from "lucide-react";
import { getAuthHeaders } from "@/lib/utils";

export default function Checkout() {
  const [, setLocation] = useLocation();
  const searchParams = new URLSearchParams(window.location.search);
  const paymentId = Number(searchParams.get("paymentId"));
  const modelId = Number(searchParams.get("modelId"));
  const [copied, setCopied] = useState(false);

  // Auto-poll every 3 seconds
  const { data: payment } = useGetPaymentStatus(paymentId, { 
    query: { refetchInterval: 3000 },
    request: { headers: getAuthHeaders() }
  });

  useEffect(() => {
    if (payment?.status === 'confirmed') {
      setLocation(`/chat/${modelId}`);
    }
  }, [payment?.status, modelId, setLocation]);

  const pixKey = payment?.pixKey || "Carregando chave...";

  const handleCopy = () => {
    navigator.clipboard.writeText(pixKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!paymentId) return <Layout><div className="p-20 text-center">Pagamento não encontrado.</div></Layout>;

  return (
    <Layout>
      <div className="max-w-md mx-auto px-4 py-12">
        <Card className="p-8 text-center border-primary/30 shadow-[0_0_50px_rgba(255,0,255,0.1)]">
          <QrCode className="w-16 h-16 text-primary mx-auto mb-6 opacity-80" />
          <h1 className="text-3xl font-display font-black text-white mb-2">Checkout Pix</h1>
          <p className="text-white/60 mb-8">Pague R$ 2,00 para liberar o chat instantaneamente.</p>
          
          <div className="bg-black/60 border border-white/10 rounded-xl p-4 mb-6 relative group overflow-hidden">
            <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            <p className="text-xs text-white/50 mb-1 uppercase tracking-wider font-bold">Chave Pix Copia e Cola</p>
            <p className="font-mono text-sm text-white break-all">{pixKey}</p>
          </div>

          <Button onClick={handleCopy} className="w-full mb-8 flex items-center gap-2">
            {copied ? <CheckCircle2 className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
            {copied ? "Chave Copiada!" : "Copiar Chave Pix"}
          </Button>

          <div className="flex items-center justify-center gap-3">
            <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <span className="text-sm text-white/70 font-medium animate-pulse">Aguardando confirmação...</span>
          </div>
        </Card>
      </div>
    </Layout>
  );
}
