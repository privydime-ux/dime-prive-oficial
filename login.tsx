import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Navbar } from "@/components/layout/Navbar";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, Mail, Loader2, ArrowRight, ShieldAlert } from "lucide-react";
import { motion } from "framer-motion";
import { MatrixLogin } from "@/components/MatrixLogin";

type LoginRole = "client" | "model" | "admin";

export default function Login() {
  const { login } = useAuth();
  const [, navigate] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState<LoginRole>("client");
  const [showMatrix, setShowMatrix] = useState(false);
  const [error, setError] = useState("");

  const isModel = role === "model";
  const isAdmin = role === "admin";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const apiRole = isAdmin ? "admin" : role;
      await login(email, password, apiRole as any);

      if (email === "dimeprivyoficial@gmail.com" && !sessionStorage.getItem("matrix_shown")) {
        sessionStorage.setItem("matrix_shown", "1");
        setShowMatrix(true);
      } else {
        navigate(isAdmin ? "/admin" : isModel ? "/creator" : "/");
      }
    } catch {
      setError("Email ou senha incorretos. Verifique suas credenciais.");
    } finally {
      setLoading(false);
    }
  };

  const handleMatrixComplete = () => {
    setShowMatrix(false);
    navigate("/admin");
  };

  const buttonClass = isAdmin
    ? "bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-400 hover:to-yellow-500 text-black shadow-[0_0_20px_rgba(255,215,0,0.5)]"
    : isModel
    ? "bg-green-500 hover:bg-green-400 text-black shadow-[0_0_15px_rgba(0,255,65,0.4)]"
    : "bg-pink-600 hover:bg-pink-500 text-white shadow-[0_0_15px_rgba(255,0,255,0.4)]";

  const borderClass = isAdmin
    ? "border-yellow-500/40"
    : isModel
    ? "border-green-500/30"
    : "border-pink-500/30";

  return (
    <>
      {showMatrix && <MatrixLogin onComplete={handleMatrixComplete} />}

      <div className="min-h-screen bg-background flex flex-col relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-20 bg-cover bg-center transition-all duration-700"
          style={{
            backgroundImage: `url(${import.meta.env.BASE_URL}images/${isModel || isAdmin ? "neon-green-bg.png" : "neon-pink-bg.png"})`,
          }}
        />
        <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]" />

        <div className="relative z-10">
          <Navbar />
        </div>

        <div className="flex-grow flex items-center justify-center p-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md"
          >
            <div
              className={`glass-panel rounded-3xl p-8 border-t ${borderClass} transition-all duration-500`}
              style={{
                boxShadow: isAdmin
                  ? "0 0 30px rgba(255,215,0,0.15), inset 0 1px 0 rgba(255,215,0,0.1)"
                  : isModel
                  ? "0 0 30px rgba(0,255,65,0.1)"
                  : "0 0 30px rgba(255,0,255,0.1)",
              }}
            >
              <div className="text-center mb-8">
                {isAdmin ? (
                  <>
                    <div className="flex justify-center mb-3">
                      <ShieldAlert className="w-10 h-10 text-yellow-400" style={{ filter: "drop-shadow(0 0 8px #FFD700)" }} />
                    </div>
                    <h2 className="text-3xl font-bold text-yellow-400 mb-2 tracking-widest uppercase" style={{ textShadow: "0 0 15px rgba(255,215,0,0.5)" }}>
                      Acesso Restrito
                    </h2>
                    <p className="text-white/50 text-sm">Área exclusiva do Arquiteto</p>
                  </>
                ) : (
                  <>
                    <h2 className="text-3xl font-bold text-white mb-2">Bem-vindo(a)</h2>
                    <p className="text-white/60">Acesse sua conta no DIME PRIVY</p>
                  </>
                )}
              </div>

              {/* Role toggle */}
              <div className="flex gap-2 mb-8 bg-white/5 rounded-xl p-1">
                {(["client", "model", "admin"] as LoginRole[]).map((r) => (
                  <button
                    key={r}
                    onClick={() => setRole(r)}
                    className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
                      role === r
                        ? r === "admin"
                          ? "bg-yellow-500 text-black shadow-[0_0_10px_rgba(255,215,0,0.4)]"
                          : r === "model"
                          ? "bg-green-500 text-black"
                          : "bg-pink-600 text-white"
                        : "text-white/40 hover:text-white/70"
                    }`}
                  >
                    {r === "client" ? "Cliente" : r === "model" ? "Criadora" : "Admin"}
                  </button>
                ))}
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label className="text-white/80">E-mail</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-white/40" />
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="bg-black/50 border-white/10 text-white pl-10 h-12 rounded-xl"
                      placeholder="seu@email.com"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-white/80">Senha</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-white/40" />
                    <Input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="bg-black/50 border-white/10 text-white pl-10 h-12 rounded-xl"
                      placeholder="••••••••"
                      autoComplete="current-password"
                      required
                    />
                  </div>
                </div>

                {error && (
                  <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-red-400 text-sm text-center bg-red-500/10 rounded-lg p-3 border border-red-500/20"
                  >
                    {error}
                  </motion.p>
                )}

                <Button
                  type="submit"
                  disabled={loading}
                  className={`w-full h-14 rounded-xl text-lg font-bold transition-all ${buttonClass}`}
                >
                  {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : isAdmin ? "🔐 Acessar Comando" : "Entrar"}
                </Button>
              </form>

              {role !== "admin" && (
                <div className="mt-8 text-center">
                  <p className="text-white/50 text-sm">
                    {role === "client" ? "Quer se tornar uma criadora? " : "Ainda não tem conta? "}
                    <Link
                      href="/creator/register"
                      className={`font-medium inline-flex items-center gap-1 ${isModel ? "text-green-400 hover:text-green-300" : "text-pink-400 hover:text-pink-300"}`}
                    >
                      Cadastre-se <ArrowRight className="w-3 h-3" />
                    </Link>
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </>
  );
}
