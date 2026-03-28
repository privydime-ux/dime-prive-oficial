import React from "react";
import { useRoute, useLocation } from "wouter";
import { motion } from "framer-motion";
import { useGetModel, useCreatePayment } from "@workspace/api-client-react";
import { Layout } from "@/components/layout";
import { Card, Button, Badge } from "@/components/ui";
import { Lock, ShieldCheck, MessageCircleHeart } from "lucide-react";
import { getAuthHeaders } from "@/lib/utils";

export default function ModelProfile() {
  const [, params] = useRoute("/model/:id");
  const [, setLocation] = useLocation();
  const modelId = Number(params?.id);
  
  const { data: model, isLoading } = useGetModel(modelId, { request: { headers: getAuthHeaders() }});
  const createPayment = useCreatePayment({ request: { headers: getAuthHeaders() } });

  const handleUnlock = async () => {
    try {
      const payment = await createPayment.mutateAsync({ data: { modelId } });
      setLocation(`/checkout?paymentId=${payment.id}&modelId=${modelId}`);
    } catch (err: any) {
      if (err.message?.includes("Unauthorized")) {
        setLocation("/register");
      } else {
        alert("Erro ao gerar pagamento. Tente novamente.");
      }
    }
  };

  if (isLoading) return <Layout><div className="flex justify-center p-20"><div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"/></div></Layout>;
  if (!model) return <Layout><div className="text-center p-20 text-white/50">Modelo não encontrada.</div></Layout>;

  return (
    <Layout>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          
          {/* Header Profile */}
          <div className="flex flex-col md:flex-row gap-8 items-start mb-12">
            <div className="w-32 h-32 md:w-48 md:h-48 rounded-full overflow-hidden border-4 border-primary/30 shadow-[0_0_30px_rgba(255,0,255,0.3)] shrink-0">
              {/* model profile closeup soft lighting */}
              <img 
                src={model.profilePhotoUrl || `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&h=500&fit=crop&q=80&sig=${model.id}`} 
                alt={model.artisticName} 
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-4xl font-display font-black text-white">{model.artisticName}</h1>
                <ShieldCheck className="w-8 h-8 text-primary drop-shadow-[0_0_10px_rgba(255,0,255,0.5)]" />
              </div>
              <Badge variant="green" className="mb-4">Online Agora</Badge>
              <p className="text-white/70 text-lg leading-relaxed">{model.bio || "Criadora de conteúdo VIP. Assine para conversar comigo ao vivo!"}</p>
            </div>
          </div>

          {/* Locked Content */}
          <Card className="p-8 text-center relative overflow-hidden border-primary/20">
            <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />
            
            <div className="grid grid-cols-2 gap-4 mb-8 opacity-40 blur-sm pointer-events-none">
              {[1,2,3,4].map(i => (
                <div key={i} className="aspect-square bg-white/10 rounded-xl overflow-hidden">
                   {/* blurred background textures */}
                  <img src={`https://images.unsplash.com/photo-1518550687729-819219298d98?w=300&h=300&fit=crop&q=20&sig=${i}`} className="w-full h-full object-cover" alt="blurred content"/>
                </div>
              ))}
            </div>

            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-md">
              <Lock className="w-16 h-16 text-primary mb-6 drop-shadow-[0_0_15px_rgba(255,0,255,0.8)]" />
              <h2 className="text-3xl font-display font-bold text-white mb-2">Conteúdo Protegido</h2>
              <p className="text-white/60 mb-8 max-w-md">Libere acesso imediato ao chat privado e galeria VIP sem assinaturas recorrentes.</p>
              
              <Button onClick={handleUnlock} disabled={createPayment.isPending} className="text-lg px-8 py-4 w-full md:w-auto flex items-center gap-3">
                <MessageCircleHeart className="w-6 h-6" />
                {createPayment.isPending ? "Gerando Pagamento..." : "Liberar Chat Privado — R$ 2,00"}
              </Button>
            </div>
          </Card>

        </motion.div>
      </div>
    </Layout>
  );
}
