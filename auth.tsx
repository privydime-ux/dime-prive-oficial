import React, { useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { useLogin, useRegister, RegisterRequestRole } from "@workspace/api-client-react";
import { Layout } from "@/components/layout";
import { Card, Input, Button } from "@/components/ui";
import { useToast } from "@/hooks/use-toast";

export default function AuthPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isLogin, setIsLogin] = useState(true);
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<RegisterRequestRole>("client");
  const [artisticName, setArtisticName] = useState("");
  
  const loginMutation = useLogin();
  const registerMutation = useRegister();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isLogin) {
        const res = await loginMutation.mutateAsync({ data: { email, password } });
        localStorage.setItem("dime_token", res.token);
        setLocation(res.user.role === 'model' ? "/creator/dashboard" : "/");
        toast({ title: "Login realizado com sucesso!" });
      } else {
        const res = await registerMutation.mutateAsync({ 
          data: { email, password, role, artisticName: role === 'model' ? artisticName : undefined } 
        });
        localStorage.setItem("dime_token", res.token);
        
        if (role === 'model') {
          setLocation("/register-model");
        } else {
          setLocation("/");
        }
        toast({ title: "Conta criada com sucesso!" });
      }
    } catch (err: any) {
      toast({ title: "Erro", description: err.message || "Credenciais inválidas", variant: "destructive" });
    }
  };

  return (
    <Layout>
      <div className="min-h-[calc(100vh-80px)] flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md"
        >
          <Card className="p-8 border-primary/20 shadow-[0_0_50px_rgba(255,0,255,0.05)] relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary to-accent" />
            
            <div className="flex gap-4 mb-8">
              <button 
                onClick={() => setIsLogin(true)}
                className={`flex-1 pb-2 text-lg font-display font-bold transition-all ${isLogin ? 'text-primary border-b-2 border-primary neon-text-pink' : 'text-white/50 border-b-2 border-transparent'}`}
              >
                Entrar
              </button>
              <button 
                onClick={() => setIsLogin(false)}
                className={`flex-1 pb-2 text-lg font-display font-bold transition-all ${!isLogin ? 'text-primary border-b-2 border-primary neon-text-pink' : 'text-white/50 border-b-2 border-transparent'}`}
              >
                Cadastrar
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {!isLogin && (
                <div className="flex bg-black/50 p-1 rounded-xl border border-white/10 mb-6">
                  <button type="button" onClick={() => setRole('client')} className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${role === 'client' ? 'bg-primary text-white shadow-lg' : 'text-white/50'}`}>
                    Sou Cliente
                  </button>
                  <button type="button" onClick={() => setRole('model')} className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${role === 'model' ? 'bg-accent text-black shadow-lg' : 'text-white/50'}`}>
                    Sou Criadora
                  </button>
                </div>
              )}

              <div>
                <label className="block text-sm font-bold text-white/80 mb-2">E-mail</label>
                <Input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="seu@email.com" />
              </div>
              
              <div>
                <label className="block text-sm font-bold text-white/80 mb-2">Senha</label>
                <Input type="password" required value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" />
              </div>

              {!isLogin && role === 'model' && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                  <label className="block text-sm font-bold text-white/80 mb-2 mt-4">Nome Artístico</label>
                  <Input type="text" required value={artisticName} onChange={e => setArtisticName(e.target.value)} placeholder="Ex: Luna Fox" />
                </motion.div>
              )}

              <Button 
                type="submit" 
                className="w-full mt-8" 
                variant={!isLogin && role === 'model' ? 'green' : 'pink'}
                disabled={loginMutation.isPending || registerMutation.isPending}
              >
                {loginMutation.isPending || registerMutation.isPending ? "Aguarde..." : (isLogin ? "Acessar Plataforma" : "Criar Conta")}
              </Button>
            </form>
          </Card>
        </motion.div>
      </div>
    </Layout>
  );
}
