import { useState, useRef, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useGetChatMessages, useSendMessage, useGetModel } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, ArrowLeft, MoreVertical } from "lucide-react";

export default function Chat() {
  const params = useParams();
  const modelId = Number(params.id);
  const [, setLocation] = useLocation();
  const { user, checkAccess } = useAuth();
  const [content, setContent] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Redirect if no access (unless they are the model themselves or admin)
  useEffect(() => {
    if (user?.role === 'client' && !checkAccess(modelId)) {
      setLocation(`/model/${modelId}`);
    }
  }, [user, modelId]);

  // Poll messages every 2 seconds
  const { data: chatData } = useGetChatMessages(modelId, {
    query: { refetchInterval: 2000 }
  });

  const { data: modelData } = useGetModel(modelId);
  const sendMutation = useSendMessage();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatData?.messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    const message = content;
    setContent(""); // optimistic clear
    
    try {
      await sendMutation.mutateAsync({
        modelId,
        data: { content: message }
      });
    } catch {
      setContent(message); // revert on error
    }
  };

  const isModelView = user?.role === 'model';
  const myRole = user?.role || 'client';

  return (
    <div className="h-screen bg-[#0a0a0a] flex flex-col max-w-3xl mx-auto border-x border-white/5 relative">
      {/* Chat Header */}
      <div className="h-16 shrink-0 bg-[#121212] border-b border-white/10 flex items-center justify-between px-4 z-10 relative shadow-md">
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setLocation(isModelView ? "/creator" : `/model/${modelId}`)}
            className="text-white/70 hover:text-white"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-full overflow-hidden bg-white/10">
                {modelData?.model?.profilePhoto && (
                  <img src={modelData.model.profilePhoto} alt="Avatar" className="w-full h-full object-cover" />
                )}
              </div>
              {chatData?.modelOnline && (
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-[#121212] shadow-[0_0_5px_#00ff41]" />
              )}
            </div>
            <div>
              <h2 className="text-white font-semibold text-lg leading-tight">
                {isModelView ? "Cliente VIP" : modelData?.model?.artistName || "Modelo"}
              </h2>
              <p className="text-xs text-green-400">
                {chatData?.modelOnline ? 'Online' : 'Offline'}
              </p>
            </div>
          </div>
        </div>
        
        <Button variant="ghost" size="icon" className="text-white/70">
          <MoreVertical className="w-5 h-5" />
        </Button>
      </div>

      {/* Messages Area - WhatsApp Dark Style */}
      <div className="flex-grow overflow-y-auto p-4 space-y-4" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/stardust.png")', opacity: 0.9 }}>
        {chatData?.messages?.map((msg) => {
          const isMe = msg.senderRole === myRole;
          
          return (
            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div 
                className={`max-w-[75%] rounded-2xl px-4 py-2 ${
                  isMe 
                    ? isModelView ? 'bg-green-600 text-black rounded-tr-none' : 'bg-pink-600 text-white rounded-tr-none shadow-[0_0_10px_rgba(255,0,255,0.2)]'
                    : 'bg-[#2a2a2a] text-white rounded-tl-none border border-white/5'
                }`}
              >
                <p className="text-sm md:text-base leading-relaxed break-words">{msg.content}</p>
                <p className={`text-[10px] text-right mt-1 opacity-70 ${isMe && isModelView ? 'text-black/70' : ''}`}>
                  {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-[#121212] border-t border-white/10 shrink-0">
        <form onSubmit={handleSend} className="flex items-end gap-2">
          <Input
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Digite uma mensagem..."
            className="bg-[#2a2a2a] border-transparent text-white min-h-[50px] rounded-2xl focus-visible:ring-1 focus-visible:ring-pink-500"
          />
          <Button 
            type="submit" 
            size="icon"
            disabled={!content.trim() || sendMutation.isPending}
            className={`h-[50px] w-[50px] rounded-full shrink-0 ${isModelView ? 'bg-green-500 hover:bg-green-400 text-black' : 'bg-pink-600 hover:bg-pink-500 text-white'}`}
          >
            <Send className="w-5 h-5 ml-1" />
          </Button>
        </form>
      </div>
    </div>
  );
}
