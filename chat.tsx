import React, { useState } from "react";
import { useRoute, useLocation } from "wouter";
import { useCheckAccess, useGetModel } from "@workspace/api-client-react";
import { Layout } from "@/components/layout";
import { Input, Button } from "@/components/ui";
import { Send, Video, ShieldCheck } from "lucide-react";
import { getAuthHeaders } from "@/lib/utils";

export default function Chat() {
  const [, params] = useRoute("/chat/:id");
  const [, setLocation] = useLocation();
  const modelId = Number(params?.id);
  const [msg, setMsg] = useState("");
  const [chatHistory, setChatHistory] = useState<{me: boolean, text: string}[]>([
    { me: false, text: "Oii! Que bom que você desbloqueou. O que manda hoje? 😘" }
  ]);

  const { data: access, isLoading: checking } = useCheckAccess(modelId, { request: { headers: getAuthHeaders() }});
  const { data: model } = useGetModel(modelId, { request: { headers: getAuthHeaders() }});

  if (checking) return <Layout><div className="p-20 text-center text-accent animate-pulse">Verificando acesso VIP...</div></Layout>;
  
  if (access && !access.hasAccess) {
    setLocation(`/model/${modelId}`);
    return null;
  }

  const sendMsg = (e: React.FormEvent) => {
    e.preventDefault();
    if (!msg.trim()) return;
    setChatHistory([...chatHistory, { me: true, text: msg }]);
    setMsg("");
    // Fake reply
    setTimeout(() => {
      setChatHistory(prev => [...prev, { me: false, text: "Adorei! Me conta mais..." }]);
    }, 2000);
  };

  return (
    <Layout>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 h-[calc(100vh-160px)] flex flex-col">
        <div className="bg-black/60 backdrop-blur-xl border border-accent/30 rounded-t-2xl p-4 flex items-center justify-between shadow-[0_0_30px_rgba(0,255,65,0.1)]">
          <div className="flex items-center gap-4">
            <div className="relative">
              <img src={model?.profilePhotoUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100"} alt="Avatar" className="w-12 h-12 rounded-full border-2 border-accent object-cover" />
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-accent rounded-full border border-black shadow-[0_0_5px_#00FF41]" />
            </div>
            <div>
              <h2 className="font-display font-bold flex items-center gap-1 neon-text-green text-accent">
                {model?.artisticName || "Criadora VIP"} <ShieldCheck className="w-4 h-4" />
              </h2>
              <span className="text-xs text-white/50">Chat Privado Desbloqueado</span>
            </div>
          </div>
          <Button variant="outline" className="border-accent/30 text-accent hover:bg-accent/10 opacity-50 cursor-not-allowed">
            <Video className="w-4 h-4 mr-2" /> Ao Vivo
          </Button>
        </div>

        <div className="flex-1 bg-black/40 border-x border-white/10 p-4 overflow-y-auto space-y-4">
          {chatHistory.map((m, i) => (
            <div key={i} className={`flex ${m.me ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] rounded-2xl px-5 py-3 ${m.me ? 'bg-primary/20 border border-primary/30 text-white rounded-br-none' : 'bg-white/10 border border-white/10 text-white rounded-bl-none'}`}>
                {m.text}
              </div>
            </div>
          ))}
        </div>

        <form onSubmit={sendMsg} className="bg-black/60 backdrop-blur-xl border border-white/10 rounded-b-2xl p-4 flex gap-3">
          <Input 
            value={msg} 
            onChange={(e) => setMsg(e.target.value)} 
            placeholder="Digite sua mensagem picante..." 
            className="border-accent/20 focus:border-accent focus:ring-accent/30"
          />
          <Button type="submit" variant="green" className="w-12 h-12 rounded-xl p-0 shrink-0">
            <Send className="w-5 h-5 -ml-1" />
          </Button>
        </form>
      </div>
    </Layout>
  );
}
