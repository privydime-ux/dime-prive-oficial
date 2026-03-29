import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Crown, LogOut, User as UserIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function Navbar() {
  const { user, logout, isAuthenticated } = useAuth();
  const [location] = useLocation();

  const isClient = user?.role === 'client';
  const isModel = user?.role === 'model';
  const isAdmin = user?.role === 'admin';

  const themeClass = isModel ? "text-neon-green" : "text-neon-pink";

  return (
    <nav className="sticky top-0 z-50 w-full glass-panel border-b-0 border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex-shrink-0 flex items-center">
            <Link href="/" className="flex items-center gap-2 group cursor-pointer">
              <Crown className={cn("w-6 h-6 transition-all duration-300 group-hover:scale-110", themeClass)} />
              <span className="font-display font-bold text-xl tracking-widest text-white">
                DIME <span className={themeClass}>PRIVY</span>
              </span>
            </Link>
          </div>

          <div className="flex items-center space-x-4">
            {!isAuthenticated ? (
              <>
                <Link href="/creator/register">
                  <Button variant="ghost" className="text-white/70 hover:text-white hidden sm:flex">
                    Seja uma Criadora
                  </Button>
                </Link>
                <Link href="/login">
                  <Button className="bg-pink-600 hover:bg-pink-500 text-white rounded-full px-6 shadow-[0_0_15px_rgba(255,0,255,0.4)] transition-all">
                    Entrar
                  </Button>
                </Link>
              </>
            ) : (
              <>
                {isModel && (
                  <Link href="/creator">
                    <Button variant="ghost" className="text-green-400 hover:text-green-300 hover:bg-green-400/10">
                      Dashboard
                    </Button>
                  </Link>
                )}
                {isAdmin && (
                  <Link href="/admin">
                    <Button variant="ghost" className="text-pink-400 hover:text-pink-300 hover:bg-pink-400/10">
                      Painel Admin
                    </Button>
                  </Link>
                )}
                
                <div className="flex items-center gap-4 pl-4 border-l border-white/10">
                  <div className="flex items-center gap-2 text-sm text-white/70">
                    <UserIcon className="w-4 h-4" />
                    <span className="hidden sm:inline">{user?.name}</span>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={logout}
                    className="text-white/50 hover:text-red-400 hover:bg-red-400/10"
                  >
                    <LogOut className="w-5 h-5" />
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
