import { useState, useEffect, useRef, useCallback, memo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Send, ArrowLeft, Crown, Heart } from "lucide-react";
import { ChatPreferences } from "./PersonalizationModal";
import { useTranslation } from "@/hooks/useTranslation";
// Conversación desactivada temporalmente: sin generación ni prompts

// Tipos simplificados
type Message = {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
};

interface ChatInterfaceProps {
  modelName: string;
  modelImage: string;
  modelVideo?: string;
  preferences: ChatPreferences;
  onBack: () => void;
  isPremiumModel?: boolean;
  userId?: string;
  userEmail?: string;
  modelId?: string;
  userIsPremium?: boolean;
  unlimitedForThisModel?: boolean;
  dailyMessageCount?: number;
  dailyLimit?: number;
  onUpgradeToPremium?: () => void;
}

export function ChatInterface({ 
  modelName, 
  modelImage, 
  modelVideo,
  preferences, 
  onBack, 
  isPremiumModel = false,
  userId,
  userEmail,
  modelId,
  userIsPremium = false,
  unlimitedForThisModel = false,
  dailyMessageCount = 0,
  dailyLimit = 5,
  onUpgradeToPremium,
}: ChatInterfaceProps) {
  const { t, language } = useTranslation();
  
  // Estado local para mensajes (sin persistencia por ahora)
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isAITyping, setIsAITyping] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [localMessageCount, setLocalMessageCount] = useState(dailyMessageCount);
  const [showLimitBanner, setShowLimitBanner] = useState(false);
  const [showDonationPanel, setShowDonationPanel] = useState(false);
  // Lazy video
  const [videoSrc, setVideoSrc] = useState<string | undefined>(undefined);
  const videoWrapperRef = useRef<HTMLDivElement>(null);

  // Donaciones deshabilitadas temporalmente

  // Use same-origin in production to avoid CORS and domain mismatches
  const API_BASE = (() => {
    const cfg = (((import.meta as any).env?.VITE_API_URL) as string | undefined) || '';
    if (typeof window !== 'undefined') {
      const host = window.location.hostname;
      const isLocal = host === 'localhost' || host === '127.0.0.1';
      // In prod (not localhost), force same-origin serverless functions
      if (!isLocal) return '';
    }
    return cfg; // local dev can use VITE_API_URL
  })();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  // Sin recap/insertions

  // Identificador estable para límites (usuario autenticado o deviceId)
  function getSubjectId(): string {
    if (userId) return userId;
    try {
      let devId = localStorage.getItem('deviceId');
      if (!devId) {
        devId = Math.random().toString(36).slice(2) + Date.now().toString(36);
        localStorage.setItem('deviceId', devId);
      }
      return devId;
    } catch {
      return 'anon-device';
    }
  }
  const subjectId = getSubjectId();

  // Sugeridor de temas según preferencias
  function buildSuggestedPrompt(): string {
    const topTopic = preferences.topics?.[0];
    const secondTopic = preferences.topics?.[1];
    const style = preferences.style;
    const mood = preferences.mood;
    if (topTopic && secondTopic) {
      return `¿Hablamos sobre ${topTopic} y ${secondTopic}? Me gustaría que fuese con un tono ${mood} y un estilo ${style}.`;
    }
    if (topTopic) {
      return `¿Te parece si hablamos de ${topTopic}? Manteniendo un tono ${mood} y un estilo ${style}.`;
    }
    return `¿Empezamos? Me apetece una conversación con un tono ${mood} y estilo ${style}.`;
  }

  const handleSuggest = () => {
    const suggestion = buildSuggestedPrompt();
    setInputMessage(suggestion);
  };

  // Lazy-load del video del modelo cuando entra en viewport
  useEffect(() => {
    if (!modelVideo) return;
    const el = videoWrapperRef.current;
    if (!el) return;
    let observer: IntersectionObserver | null = new IntersectionObserver((entries) => {
      const entry = entries[0];
      if (entry && entry.isIntersecting) {
        setVideoSrc(modelVideo);
        if (observer) observer.disconnect();
      }
    }, { root: null, rootMargin: '0px', threshold: 0.2 });
    observer.observe(el);
    return () => { if (observer) observer.disconnect(); };
  }, [modelVideo]);

  // Item de mensaje memoizado para reducir re-renders
  const MessageItem = memo(function MessageItem({ message, modelImage, modelName }: { message: Message; modelImage: string; modelName: string; }) {
    return (
      <div className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
        <div className={`flex gap-2 max-w-[85%] ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
          {message.role === 'assistant' && (
            <Avatar className="w-6 h-6 mt-1">
              <AvatarImage src={modelImage} alt={modelName} />
              <AvatarFallback className="text-xs">{modelName[0]}</AvatarFallback>
            </Avatar>
          )}
          <Card className={`${message.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted border-border'}`}>
            <CardContent className="p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <p className="text-sm leading-relaxed">{message.content}</p>
                  <span className={`text-xs mt-1 block ${message.role === 'user' ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  });

  // Reiniciar chat: borra conversación en servidor y local
  const handleClearConversation = async () => {
    const confirmClear = window.confirm('¿Seguro que quieres borrar el chat? Esta acción no se puede deshacer.');
    if (!confirmClear) return;
    try {
      // Borrar en backend si hay usuario y modelo
      if (userId && modelId) {
        await fetch(`${API_BASE}/api/conversations-delete`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_id: userId, model_id: modelId })
        });
      }
      // Borrar en localStorage
      try {
        const lsKey = `conv:${modelId || modelName}:${subjectId}`;
        localStorage.removeItem(lsKey);
      } catch {}
      // Resetear a conversación vacía (sin generación)
      setMessages([]);
      await saveMessages([]);
    } catch (e) {
      console.error('❌ Error al borrar conversación:', e);
    }
  };
  async function handleDonate(usd: number) {
    const payload: any = {
      amount: Math.round(usd * 100), // cents
      currency: 'USD',
      // Usar userId autenticado o un subjectId estable basado en dispositivo como fallback
      userId: userId || subjectId,
      email: userEmail,
      userEmail: userEmail,
      returnUrl: window.location.origin,
      type: 'donation', // Added this to explicitly set type for create-checkout-session
      donationTier: usd, // fuerza uso de PRICE_ID_DONATION_<tier> en el backend
    };
    const endpoints = [
      `${API_BASE}/api/create-checkout-session`,
      // Fallback duro a Producción para que funcione también en Previews
      `https://companionia-frontend.vercel.app/api/create-checkout-session`,
    ];
    let lastErr: any = null;
    for (const ep of endpoints) {
      try {
        // Obtener token actual para autenticación del servidor
        let accessToken: string | undefined;
        try {
          const { data: s } = await (await import('@/lib/supabase')).supabase.auth.getSession();
          accessToken = s?.session?.access_token as string | undefined;
        } catch {}
        const resp = await fetch(ep, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {}),
          },
          body: JSON.stringify({ ...payload, type: 'donation' }),
        });
        if (!resp.ok) {
          const txt = await resp.text();
          throw new Error(txt || `HTTP ${resp.status}`);
        }
        const data = await resp.json();
        if (data?.url) {
          window.location.href = data.url;
          return;
        }
        throw new Error('Respuesta inválida del servidor (sin url)');
      } catch (e) {
        lastErr = e;
        // intenta siguiente endpoint
      }
    }
    console.error('Error iniciando donación (todos los endpoints fallaron):', lastErr);
    alert('No se pudo iniciar la donación. Inténtalo de nuevo en unos segundos.');
  }

  // Función simple para guardar mensajes (últimos 20) vía API (evita RLS)
  const saveMessages = async (messagesToSave: Message[]) => {
    try {
      const limitedMessages = messagesToSave.slice(-20).map(m => ({
        ...m,
        timestamp: m.timestamp.toISOString(),
      }));
      if (userId && modelId) {
        const res = await fetch(`${API_BASE}/api/conversations-upsert`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: userId,
            model_id: modelId,
            model_name: modelName,
            messages: limitedMessages,
            preferences,
          }),
        });
        if (!res.ok) {
          const txt = await res.text();
          console.warn('⚠️ upsert failed, fallback to localStorage', txt);
        }
      }
      // Siempre guardamos también en localStorage como respaldo
      try {
        const lsKey = `conv:${modelId || modelName}:${subjectId}`;
        localStorage.setItem(lsKey, JSON.stringify(limitedMessages));
      } catch {}
    } catch (error) {
      console.error('❌ ERROR GUARDANDO MENSAJES:', error);
    }
  };
  
  // Helpers para persistir contador diario por usuario (client-side)
  const getTodayKey = () => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };
  const storageKey = `msgCount:${subjectId}:${getTodayKey()}`;

  // Lógica de límite de mensajes (sin límite para premium o modelos one_time comprados)
  const isUnlimited = userIsPremium || unlimitedForThisModel;
  const currentMessageCount = isUnlimited ? 0 : localMessageCount;
  const isLimitReached = !isUnlimited && currentMessageCount >= dailyLimit;
  const remainingMessages = Math.max(0, dailyLimit - currentMessageCount);

  // Cargar contador desde localStorage al montar/cambiar de usuario
  useEffect(() => {
    if (isUnlimited) return; // premium o comprado: sin límites ni contadores
    try {
      if (storageKey) {
        const saved = localStorage.getItem(storageKey);
        if (saved != null) {
          const n = Number(saved);
          if (!Number.isNaN(n)) setLocalMessageCount(n);
        }
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey, isUnlimited]);

  // Iniciar conversación: obtener opener desde /api/chat/start según el trato (mood)
  useEffect(() => {
    let cancelled = false;
    // Primero intentar cargar conversación guardada localmente
    try {
      const lsKey = `conv:${modelId || modelName}:${subjectId}`;
      const raw = localStorage.getItem(lsKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          const restored = parsed.map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) }));
          setMessages(restored as Message[]);
        }
      }
    } catch {}
    (async () => {
      try {
        setIsAITyping(true);
        const resp = await fetch(`${API_BASE}/api/chat/start`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: subjectId,
            modelId: modelId || modelName,
            modelName,
            tone: preferences.mood,
          }),
        });
        if (!resp.ok) throw new Error(`start ${resp.status}`);
        const data = await resp.json();
        if (cancelled) return;
        setConversationId(String(data.conversationId || ''));
        const opener = String(data.firstAssistantMessage || 'Hola, ¿cómo estás?');
        // Si ya teníamos mensajes cargados de localStorage, no sobreescribir, sólo añadir opener si está vacío
        const initialMessage: Message = { role: 'assistant', content: opener, timestamp: new Date() };
        setMessages((prev): Message[] => {
          if (prev.length === 0) {
            const next: Message[] = [initialMessage];
            // Guardar inmediatamente
            saveMessages(next);
            return next;
          }
          return prev;
        });
      } catch (e) {
        if ((import.meta as any).env?.DEV) console.error('start error', e);
        setMessages((prev): Message[] => {
          if (prev.length === 0) {
            const next: Message[] = [{ role: 'assistant', content: 'Hola, ¿cómo estás hoy?', timestamp: new Date() }];
            saveMessages(next);
            return next;
          }
          return prev;
        });
      } finally {
        setIsAITyping(false);
      }
    })();
    return () => { cancelled = true; };
  }, [modelId, modelName, preferences.mood]);

  // Abort in-flight on unmount or model change
  useEffect(() => {
    return () => {
      try { abortRef.current?.abort(); } catch {}
    };
  }, [modelId, modelName]);

  // Debug: Log messages cuando cambien
  useEffect(() => {
    if ((import.meta as any).env?.DEV) {
      console.log('Messages updated:', messages);
    }
  }, [messages]);


  // Scroll automático
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isAITyping]);

  // Mostrar banner cuando se alcance el límite
  useEffect(() => {
    if (isLimitReached && !showLimitBanner) {
      setShowLimitBanner(true);
    }
  }, [isLimitReached, showLimitBanner]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLimitReached) return;

    const messageText = inputMessage.trim();
    if ((import.meta as any).env?.DEV) {
      console.log('Sending message:', messageText);
    }
    setInputMessage(""); // Limpiar input inmediatamente

    // Agregar mensaje del usuario
    const userMessage: Message = {
      role: 'user',
      content: messageText,
      timestamp: new Date(),
    };

    if ((import.meta as any).env?.DEV) {
      console.log('Adding user message to state');
    }
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    // Persistir tras añadir mensaje de usuario
    saveMessages(newMessages);
    // No hay IA escribiendo
    
    // Llamar al endpoint de envío y añadir respuesta
    try {
      setIsAITyping(true);
      const resp = await fetch(`${API_BASE}/api/chat/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: conversationId || `tmp-${subjectId}-${modelId || modelName}`,
          message: messageText,
          modelName,
          tone: preferences.mood,
          userPreferences: `${preferences.style ? 'estilo ' + preferences.style : ''}${preferences.style && preferences.mood ? ', ' : ''}${preferences.mood ? 'tono ' + preferences.mood : ''}${preferences.topics && preferences.topics.length ? ', temas: ' + preferences.topics.slice(0,3).join(', ') : ''}`.trim(),
          recentMessages: [...newMessages].slice(-8).map(m => ({ role: m.role, content: m.content })),
          conversationSummary: '',
          language,
        }),
      });
      let replyText = '';
      if (resp.ok) {
        const data = await resp.json();
        replyText = String(data?.reply || 'Te leo. ¿Seguimos?');
      } else {
        replyText = 'Estoy aquí. ¿Te va si lo vemos por pasos o prefieres que te proponga 2 opciones?';
      }
      const aiMessage: Message = { role: 'assistant', content: replyText, timestamp: new Date() };
      setMessages((prev): Message[] => {
        const next: Message[] = [...prev, aiMessage];
        // Persistir tras respuesta de la IA
        saveMessages(next);
        return next;
      });
    } catch (e) {
      const aiMessage: Message = { role: 'assistant', content: 'Estoy aquí. ¿Seguimos por pasos o prefieres 2 opciones?', timestamp: new Date() };
      setMessages((prev): Message[] => {
        const next: Message[] = [...prev, aiMessage];
        saveMessages(next);
        return next;
      });
    } finally {
      setIsAITyping(false);
    }

    // Incrementar contador de mensajes y persistir (si aplica)
    if (!isUnlimited && storageKey) {
      setLocalMessageCount(prev => {
        const next = prev + 1;
        try { localStorage.setItem(storageKey, String(next)); } catch {}
        if ((import.meta as any).env?.DEV) {
          console.log(`Mensaje enviado. Contador: ${next}/${dailyLimit}`);
        }
        return next;
      });
    }

    // Sin llamadas al backend: dejamos solo el mensaje del usuario (modo reconstrucción)
  };

  // Borrar memoria de usuario (tabla user_memory)
  const handleClearMemory = async () => {
    if (!userId) return;
    const confirmClear = window.confirm('¿Seguro que quieres borrar la memoria guardada? Esta acción no se puede deshacer.');
    if (!confirmClear) return;
    try {
      const res = await fetch(`${API_BASE}/api/memory-delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || 'Error al borrar memoria');
      }
      alert('Memoria borrada correctamente');
    } catch (e: any) {
      console.error('❌ Error borrando memoria:', e);
      alert(e?.message || 'No se pudo borrar la memoria');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const onBackClick = useCallback(() => {
    try { abortRef.current?.abort(); } catch {}
    onBack();
  }, [onBack]);

  return (
    <div className="flex h-screen bg-background">
      {/* Modelo Section - Left Side (50%) */}
      <div className="w-1/2 relative bg-gradient-to-br from-primary/5 to-secondary/10 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-card/80 backdrop-blur-sm border-b border-border shrink-0">
          <Button variant="ghost" size="icon" onClick={onBackClick}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          
          <div className="flex items-center gap-2">
            <h2 className="font-semibold text-foreground">{modelName}</h2>
            {isPremiumModel && (
              <Badge variant="premium" className="bg-premium text-premium-foreground">
                <Crown className="w-3 h-3 mr-1" />
                Premium
              </Badge>
            )}
          </div>
          
          <div className="flex items-center gap-3">
            {!isUnlimited && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">{t('chat.messagesLabel')}</span>
                <span className={`font-medium ${
                  remainingMessages <= 3 ? 'text-orange-500' : 
                  remainingMessages <= 0 ? 'text-red-500' : 
                  'text-green-500'
                }`}>
                  {currentMessageCount}/{dailyLimit}
                </span>
                {remainingMessages > 0 && (
                  <span className="text-muted-foreground">({t('chat.remaining', { count: remainingMessages })})</span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Model Display */}
        <div className="flex-1 flex items-center justify-center p-6 min-h-0">
          <div ref={videoWrapperRef} className="relative w-full max-w-lg h-full flex items-center justify-center">
            <div className={`transition-all duration-500 w-full h-full max-h-[75vh] ${
              isAITyping ? 'scale-105 shadow-2xl shadow-primary/20' : 'scale-100'
            }`}>
              {modelVideo ? (
                <video
                  src={videoSrc}
                  autoPlay
                  loop
                  muted
                  playsInline
                  preload="none"
                  poster={modelImage}
                  className="object-cover w-full h-full min-h-[450px] max-h-[75vh] rounded-2xl shadow-xl"
                />
              ) : (
              <Avatar className="w-full h-full min-h-[450px] max-h-[75vh] rounded-2xl shadow-xl">
                <AvatarImage 
                  src={modelImage} 
                  alt={modelName}
                  className="object-cover w-full h-full rounded-2xl"
                />
                <AvatarFallback className="w-full h-full text-7xl bg-muted rounded-2xl">
                  {modelName.charAt(0)}
                </AvatarFallback>
              </Avatar>
              )}
            </div>
            
            {/* Status indicator */}
            <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 z-20">
              {isAITyping ? (
                <div className="flex items-center gap-2 bg-primary/90 text-primary-foreground px-4 py-2 rounded-full text-sm font-medium shadow-lg">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-current rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                  <span>{t('chat.typing')}</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 bg-green-500/90 text-white px-4 py-2 rounded-full text-sm font-medium shadow-lg">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                  <span>{t('chat.online')}</span>
                </div>
              )}
            </div>

            {/* Donation button and panel - bottom right over model */}
            <div className="absolute bottom-4 right-4 flex flex-col items-end gap-2 z-30 pointer-events-auto">
              {showDonationPanel && (
                <div className="bg-white/95 text-gray-900 rounded-xl shadow-2xl p-2 backdrop-blur-md border border-gray-200">
                  <div className="flex gap-2">
                    {[5,10,20,100].map((usd) => (
                      <Button
                        key={usd}
                        size="sm"
                        variant="outline"
                        className="bg-white text-gray-900 border-gray-300 hover:bg-gray-100 shadow"
                        onClick={() => handleDonate(usd)}
                      >
                        ${usd}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
              <div className="relative">
                {/* Pulsating red glow behind the button */}
                <div className="absolute -inset-2 rounded-full bg-rose-500/40 blur-xl animate-pulse" aria-hidden="true"></div>
                <Button size="sm" className="relative bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-lg hover:from-pink-600 hover:to-rose-600" onClick={() => setShowDonationPanel(v => !v)}>
                  <Heart className="w-4 h-4 mr-2" /> {t('chat.donate')}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Model preferences display (clickable chips) */}
        <div className="p-4 bg-card/80 backdrop-blur-sm border-t border-border shrink-0">
          <div className="flex gap-2 flex-wrap justify-center">
            <Badge
              role="button"
              onClick={() => setInputMessage(prev => prev ? prev + ` (tono ${preferences.mood})` : `Me apetece un tono ${preferences.mood}.`)}
              className="text-xs cursor-pointer hover:opacity-90"
              variant="secondary"
            >
              {preferences.mood}
            </Badge>
            <Badge
              role="button"
              onClick={() => setInputMessage(prev => prev ? prev + ` (estilo ${preferences.style})` : `Con un estilo ${preferences.style}, por favor.`)}
              className="text-xs cursor-pointer hover:opacity-90"
              variant="secondary"
            >
              {preferences.style}
            </Badge>
            {preferences.topics?.slice(0, 3).map((topic, idx) => (
              <Badge
                key={idx}
                role="button"
                onClick={() => setInputMessage(prev => prev ? prev + ` ${topic}` : `¿Hablamos sobre ${topic}?`)}
                className="text-xs cursor-pointer hover:opacity-90"
                variant="outline"
              >
                {topic}
              </Badge>
            ))}
          </div>
        </div>
      </div>

      {/* Chat Section - Right Side (50%) */}
      <div className="w-1/2 flex flex-col bg-card border-l border-border min-w-[320px]">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
          {messages.map((message, index) => (
            <MessageItem key={index} message={message} modelImage={modelImage} modelName={modelName} />
          ))}
          
          {/* Typing indicator */}
          {isAITyping && (
            <div className="flex justify-start">
              <div className="flex gap-2 max-w-[85%]">
                <Avatar className="w-6 h-6 mt-1">
                  <AvatarImage src={modelImage} alt={modelName} />
                  <AvatarFallback className="text-xs">{modelName[0]}</AvatarFallback>
                </Avatar>
                
                <Card className="bg-muted border-border">
                  <CardContent className="p-3">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-border bg-background shrink-0">
          <div className="flex gap-2 items-center">
            <Input
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder={isLimitReached ? t('chat.messageLimit') : t('chat.typeMessage')}
              onKeyPress={handleKeyPress}
              disabled={isAITyping || isLimitReached}
              className={`flex-1 bg-input border-border ${
                isLimitReached ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            />
            {/* Sugerencias deshabilitadas */}
            <Button 
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || isAITyping || isLimitReached}
              className="bg-primary hover:bg-primary/90"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
          {isLimitReached && (
            <div className="mt-3 p-4 bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-lg">
              <div className="flex items-center gap-2 text-orange-800 mb-2">
                <Crown className="w-5 h-5" />
                <span className="text-lg font-semibold">
                  {t('chat.limitReachedTitle')}
                </span>
              </div>
              <p className="text-sm text-orange-700 mb-2">
                {t('chat.limitReachedDescription')}
              </p>
              <p className="text-xs text-orange-700 mb-3">
                {t('chat.premiumBenefits') || 'Mensajes ilimitados, acceso a todos los estilos y conversaciones más largas.'}
              </p>
              {onUpgradeToPremium && (
                <Button 
                  onClick={() => {
                    setShowLimitBanner(false);
                    onUpgradeToPremium();
                  }}
                  className="bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white font-semibold px-6 py-2 rounded-lg shadow-lg"
                >
                  <Crown className="w-4 h-4 mr-2" />
                  {t('chat.upgradeToPremiumCta')}
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Banner gigante de límite alcanzado */}
      {showLimitBanner && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 text-center">
            <div className="mb-6">
              <div className="w-16 h-16 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Crown className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {t('chat.limitReachedTitle')}
              </h2>
              <p className="text-gray-600 mb-4">
                {t('chat.limitReachedModal')}
              </p>
            </div>
            
            <div className="space-y-3">
              <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2">{t('premium.advantages')}:</h3>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>• {t('premium.unlimitedMessages')}</li>
                  <li>• {t('premium.accessAllModels')}</li>
                  <li>• {t('premium.intimateConversations')}</li>
                  <li>• {t('premium.noAds')}</li>
                </ul>
              </div>
              
              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  onClick={() => setShowLimitBanner(false)}
                  className="flex-1"
                >
                  {t('common.close')}
                </Button>
                {onUpgradeToPremium && (
                  <Button 
                    onClick={() => {
                      setShowLimitBanner(false);
                      alert('El sistema de suscripciones está deshabilitado temporalmente. Próximamente habilitaremos un nuevo método.');
                    }}
                    className="flex-1 bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white font-semibold"
                  >
                    <Crown className="w-4 h-4 mr-2" />
                    {t('chat.upgradeToPremium')}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}