import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface MatrixLoginProps {
  onComplete: () => void;
}

export function MatrixLogin({ onComplete }: MatrixLoginProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [phase, setPhase] = useState<"matrix" | "title" | "done">("matrix");

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const fontSize = 14;
    const columns = Math.floor(canvas.width / fontSize);
    const drops: number[] = Array(columns).fill(1);
    const chars = "01アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン";

    let animFrame: number;
    const draw = () => {
      ctx.fillStyle = "rgba(0, 0, 0, 0.05)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#00FF41";
      ctx.font = `${fontSize}px monospace`;

      for (let i = 0; i < drops.length; i++) {
        const char = chars[Math.floor(Math.random() * chars.length)];
        ctx.fillText(char, i * fontSize, drops[i] * fontSize);
        if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
          drops[i] = 0;
        }
        drops[i]++;
      }
      animFrame = requestAnimationFrame(draw);
    };

    draw();

    const titleTimer = setTimeout(() => {
      setPhase("title");
      cancelAnimationFrame(animFrame);
    }, 2000);

    const doneTimer = setTimeout(() => {
      setPhase("done");
      setTimeout(onComplete, 500);
    }, 5000);

    return () => {
      cancelAnimationFrame(animFrame);
      clearTimeout(titleTimer);
      clearTimeout(doneTimer);
    };
  }, [onComplete]);

  return (
    <AnimatePresence>
      {phase !== "done" && (
        <motion.div
          className="fixed inset-0 z-[9999] bg-black flex items-center justify-center"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
        >
          <canvas ref={canvasRef} className="absolute inset-0" />

          <AnimatePresence>
            {phase === "title" && (
              <motion.div
                className="relative z-10 text-center px-6"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
              >
                <motion.h1
                  className="text-4xl md:text-6xl font-bold text-[#00FF41] mb-4 tracking-widest uppercase"
                  style={{
                    fontFamily: "'Courier New', monospace",
                    textShadow: "0 0 10px #00FF41, 0 0 30px #00FF41, 0 0 60px #00FF41",
                  }}
                  animate={{
                    textShadow: [
                      "0 0 10px #00FF41, 0 0 30px #00FF41, 0 0 60px #00FF41",
                      "0 0 20px #00FF41, 0 0 50px #00FF41, 0 0 100px #00FF41",
                      "0 0 10px #00FF41, 0 0 30px #00FF41, 0 0 60px #00FF41",
                    ],
                  }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                >
                  BEM-VINDO, O ARQUITETO.
                </motion.h1>
                <motion.p
                  className="text-[#00FF41]/70 text-lg md:text-xl tracking-widest font-mono"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  O Sistema DIME PRIVY está sob seu comando.
                </motion.p>
                <motion.div
                  className="mt-8 flex justify-center gap-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.8 }}
                >
                  {[...Array(3)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="w-2 h-2 rounded-full bg-[#00FF41]"
                      animate={{ opacity: [1, 0.2, 1] }}
                      transition={{ repeat: Infinity, duration: 1, delay: i * 0.3 }}
                    />
                  ))}
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
