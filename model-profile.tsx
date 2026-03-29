import { useParams, useLocation } from "wouter";
import { useGetModel } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { LockKeyhole, MessageCircle, Star, Image as ImageIcon, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect } from "react";

export default function ModelProfile() {
  const params = useParams();
  const modelId = Number(params.id);
  const [, setLocation] = useLocation();
  const { checkAccess, isAuthenticated } = useAuth();
  
  const hasLocalAccess = checkAccess(modelId);
  
  const { data, isLoading } = useGetModel(modelId, {
    query: {
      retry: false
    }
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <div className="flex-grow flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-pink-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (!data?.model) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <div className="flex-grow flex items-center justify-center flex-col gap-4">
          <h2 className="text-2xl font-bold text-white">Modelo não encontrada</h2>
          <Button variant="ghost" onClick={() => setLocation("/")} className="text-white/60">Voltar</Button>
        </div>
      </div>
    );
  }

  const { model, photos } = data;
  // If backend says they have access OR local storage says so
  const hasAccess = data.hasAccess || hasLocalAccess;

  const handleUnlock = () => {
    if (!isAuthenticated) {
      setLocation("/login");
      return;
    }
    setLocation(`/checkout/${modelId}`);
  };

  const handleChat = () => {
    setLocation(`/chat/${modelId}`);
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <Navbar />
      
      {/* Profile Header */}
      <div className="relative">
        <div className="absolute inset-0 h-64 bg-gradient-to-b from-pink-900/20 to-background pointer-events-none" />
        
        <div className="max-w-5xl mx-auto px-4 pt-8 relative z-10">
          <Button 
            variant="ghost" 
            className="text-white/60 hover:text-white mb-6 pl-0"
            onClick={() => setLocation("/")}
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> Vitrine
          </Button>

          <div className="flex flex-col md:flex-row gap-8 items-start">
            {/* Avatar */}
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="shrink-0 relative"
            >
              <div className="w-40 h-40 md:w-48 md:h-48 rounded-3xl overflow-hidden border-2 border-white/10 shadow-2xl relative z-10 bg-black">
                {model.profilePhoto ? (
                  <img src={model.profilePhoto} alt={model.artistName} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-white/5">
                    <Star className="w-16 h-16 text-white/20" />
                  </div>
                )}
              </div>
              {/* Glow behind avatar */}
              <div className="absolute inset-0 bg-pink-500/30 blur-2xl rounded-full z-0 -m-4" />
              
              {model.isOnline && (
                <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 bg-black/80 backdrop-blur-md px-4 py-1.5 rounded-full border border-green-500/50">
                  <span className="w-2.5 h-2.5 rounded-full bg-green-500 shadow-[0_0_10px_#00ff41] animate-pulse" />
                  <span className="text-sm font-semibold text-green-400">Online</span>
                </div>
              )}
            </motion.div>

            {/* Info */}
            <div className="flex-grow pt-2">
              <h1 className="text-4xl md:text-5xl font-display font-bold text-white mb-4">
                {model.artistName}
              </h1>
              <div className="glass-panel rounded-2xl p-6 mb-6">
                <h3 className="text-sm text-pink-400 font-semibold mb-2 uppercase tracking-wider">Sobre Mim</h3>
                <p className="text-white/80 text-lg leading-relaxed">
                  {model.bio || "Venha me conhecer no VIP. Conteúdo exclusivo para assinantes."}
                </p>
              </div>

              <div className="flex flex-wrap gap-4">
                {hasAccess ? (
                  <Button 
                    onClick={handleChat}
                    className="h-14 px-8 rounded-xl bg-pink-600 hover:bg-pink-500 text-white text-lg font-bold shadow-[0_0_20px_rgba(255,0,255,0.4)] transition-all"
                  >
                    <MessageCircle className="w-5 h-5 mr-2" />
                    Entrar no Chat VIP
                  </Button>
                ) : (
                  <Button 
                    onClick={handleUnlock}
                    className="h-14 px-8 rounded-xl bg-pink-600 hover:bg-pink-500 text-white text-lg font-bold shadow-[0_0_20px_rgba(255,0,255,0.4)] transition-all"
                  >
                    <LockKeyhole className="w-5 h-5 mr-2" />
                    LIBERAR ACESSO VIP - R$ 2,00
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Gallery Section */}
      <div className="max-w-5xl mx-auto px-4 mt-16 relative">
        <div className="flex items-center gap-3 mb-8">
          <ImageIcon className="w-6 h-6 text-pink-500" />
          <h2 className="text-2xl font-bold text-white">Galeria Privada</h2>
          <span className="text-white/40 text-sm ml-2">({photos?.length || 0} fotos)</span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 relative">
          {photos?.length > 0 ? photos.map((photo, idx) => (
            <motion.div 
              key={photo.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="aspect-[3/4] rounded-2xl overflow-hidden relative group bg-white/5"
            >
              <img 
                src={photo.url} 
                alt="Gallery content" 
                className={`w-full h-full object-cover transition-all duration-500 ${!hasAccess ? 'blur-xl scale-110 opacity-70' : 'group-hover:scale-105'}`}
              />
              
              {!hasAccess && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                  <LockKeyhole className="w-10 h-10 text-white/30" />
                </div>
              )}
            </motion.div>
          )) : (
            <div className="col-span-full py-20 text-center glass-panel rounded-3xl">
              <ImageIcon className="w-12 h-12 text-white/20 mx-auto mb-4" />
              <p className="text-white/50 text-lg">Nenhuma foto na galeria ainda.</p>
            </div>
          )}

          {/* Overlay if locked */}
          {!hasAccess && photos?.length > 0 && (
            <div className="absolute inset-0 z-20 flex items-center justify-center bg-gradient-to-t from-black via-black/80 to-transparent pt-32">
              <div className="text-center px-4">
                <div className="w-20 h-20 bg-pink-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-pink-500/50 shadow-[0_0_30px_rgba(255,0,255,0.3)]">
                  <LockKeyhole className="w-10 h-10 text-pink-400" />
                </div>
                <h3 className="text-3xl font-display font-bold text-white mb-4">Conteúdo Bloqueado</h3>
                <p className="text-white/60 max-w-md mx-auto mb-8 text-lg">
                  Faça o pagamento via Pix para remover o borrado das fotos e liberar o chat exclusivo com {model.artistName}.
                </p>
                <Button 
                  onClick={handleUnlock}
                  className="h-16 px-10 rounded-xl bg-pink-600 hover:bg-pink-500 text-white text-xl font-bold shadow-[0_0_30px_rgba(255,0,255,0.5)] transition-all hover:scale-105"
                >
                  LIBERAR AGORA - R$ 2,00
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
