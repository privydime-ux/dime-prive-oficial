import React, { useState, useRef, useCallback, useEffect } from "react";
import { useLocation } from "wouter";
import { useRegisterModel } from "@workspace/api-client-react";
import { Layout } from "@/components/layout";
import { Card, Input, Button } from "@/components/ui";
import { getAuthHeaders } from "@/lib/utils";
import { CheckCircle, Camera, Upload, X, ImagePlus, SwitchCamera } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const BASE_URL = import.meta.env.BASE_URL.replace(/\/$/, "");

async function compressImage(file: File, maxWidthPx = 1200, quality = 0.82): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const scale = Math.min(1, maxWidthPx / img.width);
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error("Compression failed")), "image/jpeg", quality);
    };
    img.onerror = reject;
    img.src = url;
  });
}

function ProfilePhotoUpload({ value, onChange }: { value: string; onChange: (url: string, file: File) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    const preview = URL.createObjectURL(file);
    onChange(preview, file);
  };

  return (
    <div>
      <label className="block text-sm font-bold text-white/80 mb-2">
        Foto de Perfil (Pública)
      </label>
      <div
        onClick={() => inputRef.current?.click()}
        className="relative cursor-pointer rounded-xl border-2 border-dashed border-accent/40 hover:border-accent transition-all overflow-hidden"
        style={{ minHeight: 160 }}
      >
        {value ? (
          <div className="relative w-full h-40">
            <img src={value} alt="Preview" className="w-full h-40 object-cover" />
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
              <p className="text-white text-sm font-bold flex items-center gap-2">
                <ImagePlus className="w-4 h-4" /> Trocar foto
              </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-40 gap-3 text-accent/60">
            <Upload className="w-10 h-10" />
            <p className="text-sm font-bold text-accent">Clique para enviar foto</p>
            <p className="text-xs text-white/40">JPG, PNG, WEBP — comprimida automaticamente</p>
          </div>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={e => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }}
      />
    </div>
  );
}

function SelfieCapture({ value, onChange }: { value: string; onChange: (url: string, file: File) => void }) {
  const [mode, setMode] = useState<"idle" | "camera">("idle");
  const [cameraFacing, setCameraFacing] = useState<"user" | "environment">("user");
  const [stream, setStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const startCamera = useCallback(async (facing: "user" | "environment") => {
    if (stream) { stream.getTracks().forEach(t => t.stop()); }
    try {
      const s = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facing, width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      setStream(s);
      setMode("camera");
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = s;
          videoRef.current.play();
        }
      }, 50);
    } catch {
      alert("Não foi possível acessar a câmera. Verifique as permissões do navegador.");
    }
  }, [stream]);

  const stopCamera = useCallback(() => {
    stream?.getTracks().forEach(t => t.stop());
    setStream(null);
    setMode("idle");
  }, [stream]);

  const flipCamera = useCallback(() => {
    const next = cameraFacing === "user" ? "environment" : "user";
    setCameraFacing(next);
    startCamera(next);
  }, [cameraFacing, startCamera]);

  const capture = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d")!.drawImage(video, 0, 0);
    canvas.toBlob(blob => {
      if (!blob) return;
      const file = new File([blob], `selfie_${Date.now()}.jpg`, { type: "image/jpeg" });
      const url = URL.createObjectURL(file);
      onChange(url, file);
      stopCamera();
    }, "image/jpeg", 0.9);
  }, [onChange, stopCamera]);

  const handleFile = (file: File) => {
    const preview = URL.createObjectURL(file);
    onChange(preview, file);
  };

  useEffect(() => () => { stream?.getTracks().forEach(t => t.stop()); }, [stream]);

  return (
    <div>
      <label className="block text-sm font-bold text-white/80 mb-2">
        Selfie de Validação (KYC) *
        <span className="ml-2 text-xs text-white/40 font-normal">Segure um papel escrito "DIME PRIVY"</span>
      </label>

      <AnimatePresence mode="wait">
        {mode === "camera" ? (
          <motion.div key="camera" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="relative rounded-xl overflow-hidden border-2 border-accent shadow-[0_0_20px_rgba(0,255,65,0.3)]"
          >
            <video ref={videoRef} autoPlay playsInline muted className="w-full rounded-xl" style={{ maxHeight: 300, objectFit: "cover" }} />
            <canvas ref={canvasRef} className="hidden" />
            <div className="absolute bottom-4 left-0 right-0 flex items-center justify-center gap-4 px-4">
              <button type="button" onClick={stopCamera}
                className="p-3 rounded-full bg-black/60 border border-white/20 text-white hover:bg-black/80 transition-all">
                <X className="w-5 h-5" />
              </button>
              <button type="button" onClick={capture}
                className="w-16 h-16 rounded-full bg-accent border-4 border-white shadow-[0_0_20px_rgba(0,255,65,0.5)] hover:bg-accent/80 active:scale-95 transition-all flex items-center justify-center">
                <Camera className="w-7 h-7 text-black" />
              </button>
              <button type="button" onClick={flipCamera}
                className="p-3 rounded-full bg-black/60 border border-white/20 text-white hover:bg-black/80 transition-all">
                <SwitchCamera className="w-5 h-5" />
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {value ? (
              <div className="relative rounded-xl overflow-hidden border-2 border-accent/50">
                <img src={value} alt="Selfie preview" className="w-full h-48 object-cover" />
                <button type="button" onClick={() => onChange("", new File([], ""))}
                  className="absolute top-2 right-2 p-1.5 rounded-full bg-black/70 text-white hover:bg-black transition-all">
                  <X className="w-4 h-4" />
                </button>
                <div className="absolute bottom-2 left-2">
                  <span className="px-2 py-1 rounded-full text-xs bg-accent/20 text-accent border border-accent/30 font-bold">✓ Selfie capturada</span>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <button type="button" onClick={() => startCamera("user")}
                  className="flex flex-col items-center justify-center gap-2 p-5 rounded-xl border-2 border-dashed border-accent/40 hover:border-accent hover:shadow-[0_0_15px_rgba(0,255,65,0.2)] transition-all text-accent/70 hover:text-accent">
                  <Camera className="w-8 h-8" />
                  <span className="text-xs font-bold">Tirar Foto Agora</span>
                  <span className="text-xs text-white/40 text-center">Câmera frontal</span>
                </button>
                <button type="button" onClick={() => fileInputRef.current?.click()}
                  className="flex flex-col items-center justify-center gap-2 p-5 rounded-xl border-2 border-dashed border-white/20 hover:border-white/40 transition-all text-white/50 hover:text-white/80">
                  <Upload className="w-8 h-8" />
                  <span className="text-xs font-bold">Da Galeria</span>
                  <span className="text-xs text-white/40 text-center">Escolher arquivo</span>
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <canvas ref={canvasRef} className="hidden" />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={e => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }}
      />
    </div>
  );
}

export default function CreatorRegister() {
  const [, setLocation] = useLocation();
  const registerMutation = useRegisterModel({ request: { headers: getAuthHeaders() } });

  const [formData, setFormData] = useState({ artisticName: "", pixKey: "", bio: "" });
  const [profilePhotoPreview, setProfilePhotoPreview] = useState("");
  const [selfiePreview, setSelfiePreview] = useState("");
  const [profilePhotoFile, setProfilePhotoFile] = useState<File | null>(null);
  const [selfieFile, setSelfieFile] = useState<File | null>(null);
  const [success, setSuccess] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!selfieFile || selfieFile.size === 0) {
      setError("A selfie de validação é obrigatória.");
      return;
    }

    try {
      setUploading(true);
      const fd = new FormData();

      if (profilePhotoFile && profilePhotoFile.size > 0) {
        const compressed = await compressImage(profilePhotoFile);
        fd.append("profilePhoto", compressed, `profile_${Date.now()}.jpg`);
      }

      if (selfieFile && selfieFile.size > 0) {
        const compressedSelfie = await compressImage(selfieFile, 1000, 0.85);
        fd.append("selfie", compressedSelfie, `selfie_${Date.now()}.jpg`);
      }

      const token = localStorage.getItem("dime_token");
      const uploadRes = await fetch(`${BASE_URL}/api/upload`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: fd,
      });

      if (!uploadRes.ok) throw new Error("Falha no upload das imagens.");
      const urls = await uploadRes.json();

      await registerMutation.mutateAsync({
        data: {
          ...formData,
          selfieUrl: urls.selfieUrl || "",
          profilePhotoUrl: urls.profilePhotoUrl || undefined,
        },
      });

      setSuccess(true);
    } catch (err: any) {
      setError(err?.message || "Erro ao enviar cadastro. Tente novamente.");
    } finally {
      setUploading(false);
    }
  };

  const isLoading = uploading || registerMutation.isPending;

  if (success) return (
    <Layout>
      <div className="max-w-md mx-auto mt-20 p-4">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
          <Card className="p-8 text-center border-accent/30 shadow-[0_0_30px_rgba(0,255,65,0.15)]">
            <div className="w-20 h-20 rounded-full bg-accent/10 border-2 border-accent flex items-center justify-center mx-auto mb-4 shadow-[0_0_20px_rgba(0,255,65,0.3)]">
              <CheckCircle className="w-10 h-10 text-accent" />
            </div>
            <h2 className="text-2xl font-display font-bold mb-2 text-accent">Cadastro Enviado!</h2>
            <p className="text-white/60 mb-6 text-sm">Seu perfil está aguardando aprovação da administração. Você será notificada em breve.</p>
            <Button variant="outline" onClick={() => setLocation("/")} className="w-full">Voltar ao Início</Button>
          </Card>
        </motion.div>
      </div>
    </Layout>
  );

  return (
    <Layout>
      <div className="max-w-xl mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-display font-black text-accent mb-2" style={{ textShadow: "0 0 20px rgba(0,255,65,0.4)" }}>
            Complete seu Perfil
          </h1>
          <p className="text-white/50 text-sm">Preencha os campos abaixo para solicitar aprovação</p>
        </div>

        <Card className="p-6 border-white/10">
          <form onSubmit={handleSubmit} className="space-y-6">

            <div>
              <label className="block text-sm font-bold text-white/80 mb-2">Nome Artístico *</label>
              <Input required value={formData.artisticName}
                onChange={e => setFormData({ ...formData, artisticName: e.target.value })}
                placeholder="Ex: Luna Fox" />
            </div>

            <div>
              <label className="block text-sm font-bold text-white/80 mb-2">Chave Pix (Para receber) *</label>
              <Input required value={formData.pixKey}
                onChange={e => setFormData({ ...formData, pixKey: e.target.value })}
                placeholder="CPF, Email, Telefone ou Chave Aleatória" />
            </div>

            <ProfilePhotoUpload
              value={profilePhotoPreview}
              onChange={(preview, file) => { setProfilePhotoPreview(preview); setProfilePhotoFile(file); }}
            />

            <SelfieCapture
              value={selfiePreview}
              onChange={(preview, file) => { setSelfiePreview(preview); setSelfieFile(file); }}
            />

            <div>
              <label className="block text-sm font-bold text-white/80 mb-2">Bio / Descrição</label>
              <textarea
                className="w-full rounded-xl border border-white/10 bg-black/50 px-4 py-3 text-sm text-white placeholder:text-white/40 focus:border-accent focus:ring-1 focus:ring-accent outline-none min-h-[100px] transition-all"
                placeholder="Fale um pouco sobre você..."
                value={formData.bio}
                onChange={e => setFormData({ ...formData, bio: e.target.value })}
              />
            </div>

            {error && (
              <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm text-center">
                {error}
              </motion.div>
            )}

            <Button type="submit" variant="green" className="w-full text-base py-4" disabled={isLoading}>
              {isLoading
                ? (uploading ? "Enviando imagens..." : "Registrando...")
                : "Solicitar Aprovação ✦"}
            </Button>

            <p className="text-center text-xs text-white/30">
              Suas imagens são comprimidas automaticamente antes do envio
            </p>
          </form>
        </Card>
      </div>
    </Layout>
  );
}
