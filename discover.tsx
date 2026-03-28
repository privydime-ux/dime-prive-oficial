import React from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { useListModels } from "@workspace/api-client-react";
import { Layout } from "@/components/layout";
import { Card, Badge } from "@/components/ui";
import { ShieldCheck, Star } from "lucide-react";

export default function Discover() {
  const { data: models, isLoading, error } = useListModels();

  const approvedModels = models?.filter(m => m.status === 'approved') || [];

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <Badge variant="pink" className="mb-6"><Star className="w-3 h-3 mr-1"/> Conteúdo Exclusivo</Badge>
          <h1 className="text-4xl md:text-6xl font-black mb-6 neon-text-pink leading-tight">
            Descubra Criadoras<br/>Locais Premium
          </h1>
          <p className="text-lg text-white/60 max-w-2xl mx-auto">
            Acesso VIP instantâneo via Pix. Sem assinaturas mensais, pague apenas pelo que quiser ver.
          </p>
        </motion.div>

        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {[1, 2, 3, 4].map(i => (
              <Card key={i} className="aspect-[3/4] animate-pulse bg-white/5" />
            ))}
          </div>
        ) : error ? (
          <div className="text-center text-red-500 p-8 glass-panel rounded-2xl">Falha ao carregar criadoras.</div>
        ) : approvedModels.length === 0 ? (
          <div className="text-center text-white/50 p-12 glass-panel rounded-2xl">
            Nenhuma criadora disponível no momento.
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {approvedModels.map((model, idx) => (
              <motion.div
                key={model.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.1 }}
              >
                <Link href={`/model/${model.id}`} className="block group">
                  <Card className="relative aspect-[3/4] group-hover:-translate-y-2 transition-transform duration-300 border-white/5 group-hover:border-primary/50 group-hover:shadow-[0_0_30px_rgba(255,0,255,0.2)]">
                    {/* model profile photo lifestyle outdoors */}
                    <img 
                      src={model.profilePhotoUrl || `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&h=800&fit=crop&q=80&sig=${model.id}`} 
                      alt={model.artisticName}
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                    
                    <div className="absolute top-3 right-3 flex items-center gap-2">
                      <span className="flex h-3 w-3 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-accent shadow-[0_0_8px_rgba(0,255,65,1)]"></span>
                      </span>
                    </div>

                    <div className="absolute bottom-0 left-0 right-0 p-4">
                      <h3 className="text-xl font-bold text-white flex items-center gap-2 mb-1">
                        {model.artisticName}
                        <ShieldCheck className="w-5 h-5 text-primary" />
                      </h3>
                      <p className="text-sm text-white/70 line-clamp-1">{model.bio || "Conteúdo VIP"}</p>
                    </div>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
