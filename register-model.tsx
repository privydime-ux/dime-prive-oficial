import { useState } from "react";
import { useRegisterModel } from "@workspace/api-client-react";
import { Navbar } from "@/components/layout/Navbar";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { fileToBase64 } from "@/lib/utils";
import { Camera, Upload, Loader2, ArrowLeft, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";

export default function RegisterModel() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const registerMutation = useRegisterModel();

  const [formData, setFormData] = useState({
    artistName: "",
    email: "",
    password: "",
    whatsapp: "",
    pixKey: "",
  });
  const [selfieFile, setSelfieFile] = useState<File | null>(null);
  const [selfiePreview, setSelfiePreview] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelfieFile(file);
      const url = URL.createObjectURL(file);
      setSelfiePreview(url);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selfieFile) {
      toast({ title: "Atenção", description: "A selfie de segurança é obrigatória.", variant: "destructive" });
      return;
    }

    try {
      const base64 = await fileToBase64(selfieFile);
      await registerMutation.mutateAsync({
        data: {
          ...formData,
          selfieBase64: base64
        }
      });

      toast({
        title: "Cadastro enviado!",
        description: "Sua conta está em análise. Você já pode fazer login para ver seu painel.",
      });
      setLocation("/login");
    } catch (error: any) {
      toast({
        title: "Erro no cadastro",
        description: error.message || "Tente novamente.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen bg-background relative">
      <div 
        className="absolute inset-0 opacity-10 bg-cover bg-center"
        style={{ backgroundImage: `url(${import.meta.env.BASE_URL}images/neon-green-bg.png)` }}
      />
      <div className="relative z-10">
        <Navbar />
        
        <div className="max-w-2xl mx-auto px-4 py-12">
          <Button 
            variant="ghost" 
            className="text-white/60 hover:text-white mb-6 pl-0"
            onClick={() => setLocation("/login")}
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
          </Button>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-panel rounded-3xl p-8 border-t border-green-500/30 neon-glow-green"
          >
            <div className="mb-8">
              <h1 className="text-3xl font-display font-bold text-white mb-2">Seja uma Criadora</h1>
              <p className="text-white/60">Monetize seu conteúdo VIP com total segurança e pagamentos via Pix.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-white/80">Nome Artístico</Label>
                  <Input 
                    required 
                    value={formData.artistName}
                    onChange={(e) => setFormData({...formData, artistName: e.target.value})}
                    className="bg-black/50 border-white/10 text-white h-12 rounded-xl focus-visible:ring-green-500" 
                    placeholder="Como os clientes te verão"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-white/80">E-mail</Label>
                  <Input 
                    type="email" required 
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="bg-black/50 border-white/10 text-white h-12 rounded-xl focus-visible:ring-green-500" 
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-white/80">Senha de Acesso</Label>
                  <Input 
                    type="password" required minLength={6}
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    className="bg-black/50 border-white/10 text-white h-12 rounded-xl focus-visible:ring-green-500" 
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-white/80">WhatsApp</Label>
                  <Input 
                    required 
                    value={formData.whatsapp}
                    onChange={(e) => setFormData({...formData, whatsapp: e.target.value})}
                    className="bg-black/50 border-white/10 text-white h-12 rounded-xl focus-visible:ring-green-500" 
                    placeholder="(00) 00000-0000"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-white/80">Chave Pix (Para receber seus saques)</Label>
                <Input 
                  required 
                  value={formData.pixKey}
                  onChange={(e) => setFormData({...formData, pixKey: e.target.value})}
                  className="bg-black/50 border-white/10 text-white h-12 rounded-xl focus-visible:ring-green-500" 
                  placeholder="CPF, CNPJ, E-mail ou Celular"
                />
              </div>

              <div className="p-6 bg-green-500/5 border border-green-500/20 rounded-2xl mt-8">
                <div className="flex items-start gap-4">
                  <ShieldCheck className="w-8 h-8 text-green-400 shrink-0 mt-1" />
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">Selfie de Segurança (KYC)</h3>
                    <p className="text-sm text-white/60 mb-4">
                      Para aprovar seu perfil, precisamos de uma foto sua segurando um papel escrito <strong>"DIME PRIVY"</strong> e a data de hoje. Isso garante a segurança da plataforma.
                    </p>
                    
                    <div className="mt-4">
                      <Label htmlFor="selfie-upload" className="cursor-pointer flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-white/20 hover:border-green-500/50 rounded-xl bg-black/30 transition-colors">
                        {selfiePreview ? (
                          <div className="absolute inset-0 w-full h-full p-2">
                            <img src={selfiePreview} alt="Selfie preview" className="w-full h-full object-cover rounded-lg opacity-50" />
                            <div className="absolute inset-0 flex items-center justify-center">
                              <span className="bg-black/80 px-3 py-1 rounded-full text-xs font-medium text-white">Trocar foto</span>
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <Camera className="w-8 h-8 text-white/40 mb-2" />
                            <p className="text-sm text-white/60">Clique para tirar foto ou fazer upload</p>
                          </div>
                        )}
                        <input id="selfie-upload" type="file" accept="image/*" className="hidden" onChange={handleFileChange} capture="user" />
                      </Label>
                    </div>
                  </div>
                </div>
              </div>

              <Button 
                type="submit" 
                disabled={registerMutation.isPending}
                className="w-full h-14 mt-8 bg-green-500 hover:bg-green-400 text-black text-lg font-bold rounded-xl shadow-[0_0_20px_rgba(0,255,65,0.3)] transition-all"
              >
                {registerMutation.isPending ? <Loader2 className="w-6 h-6 animate-spin" /> : "Finalizar Cadastro"}
              </Button>
            </form>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
