import { useListModels } from "@workspace/api-client-react";
import { Navbar } from "@/components/layout/Navbar";
import { Link } from "wouter";
import { Loader2, LockKeyhole, Eye, Star } from "lucide-react";
import { motion } from "framer-motion";

export default function Home() {
  const { data, isLoading } = useListModels();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      {/* Hero Section */}
      <div className="relative pt-24 pb-16 px-4 sm:px-6 lg:px-8 flex-grow flex flex-col items-center">
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-pink-600/20 blur-[120px] rounded-full" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/20 blur-[120px] rounded-full" />
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto mb-16 relative z-10"
        >
          <h1 className="text-5xl md:text-7xl font-display font-bold text-white mb-6 leading-tight">
            Conteúdo Exclusivo. <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-600 neon-text-pink">
              Acesso VIP.
            </span>
          </h1>
          <p className="text-lg text-white/60 mb-8 max-w-2xl mx-auto">
            A plataforma premium onde você se conecta com suas criadoras favoritas. 
            Acesso liberado na hora via Pix. Privacidade total.
          </p>
        </motion.div>

        {/* Models Grid */}
        <div className="w-full max-w-7xl mx-auto relative z-10">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <Star className="w-6 h-6 text-pink-500" />
              Vitrine Exclusiva
            </h2>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="w-10 h-10 text-pink-500 animate-spin" />
            </div>
          ) : data?.models && data.models.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {data.models.map((model, idx) => (
                <motion.div
                  key={model.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: idx * 0.1 }}
                >
                  <Link href={`/model/${model.id}`}>
                    <div className="group relative glass-panel rounded-2xl overflow-hidden cursor-pointer hover:-translate-y-2 transition-all duration-300 hover:border-pink-500/50 hover:shadow-[0_0_30px_rgba(255,0,255,0.2)]">
                      <div className="aspect-[3/4] w-full relative">
                        {model.profilePhoto ? (
                          <img 
                            src={model.profilePhoto} 
                            alt={model.artistName}
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                          />
                        ) : (
                          <div className="w-full h-full bg-white/5 flex items-center justify-center">
                            <LockKeyhole className="w-12 h-12 text-white/20" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                        
                        {model.isOnline && (
                          <div className="absolute top-3 right-3 flex items-center gap-2 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-green-500/30">
                            <span className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_#00ff41] animate-pulse" />
                            <span className="text-xs font-semibold text-green-400">Online</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="absolute bottom-0 left-0 w-full p-5">
                        <h3 className="text-xl font-bold text-white mb-1 group-hover:text-pink-400 transition-colors">
                          {model.artistName}
                        </h3>
                        <p className="text-sm text-white/60 line-clamp-1 mb-4">
                          {model.bio || "Criadora de conteúdo VIP"}
                        </p>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-white/40 flex items-center gap-1">
                            <Eye className="w-3 h-3" /> VIP Exclusivo
                          </span>
                          <span className="text-pink-400 font-bold text-sm bg-pink-500/10 px-3 py-1 rounded-full border border-pink-500/20">
                            R$ 2,00
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20 glass-panel rounded-2xl">
              <Star className="w-12 h-12 text-white/20 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-white/80">Nenhuma modelo na vitrine</h3>
              <p className="text-white/50 mt-2">Volte mais tarde para novidades.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
