import { useState, useEffect, useRef, useCallback, memo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Send, ArrowLeft, Settings, Crown, Heart, Sparkles, Lightbulb } from "lucide-react";
import { ChatPreferences } from "./PersonalizationModal";
import { useTranslation } from "@/hooks/useTranslation";
import stripePromise from "@/lib/stripe";

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
  modelId,
  userIsPremium = false,
  unlimitedForThisModel = false,
  dailyMessageCount = 0,
  dailyLimit = 5,
  onUpgradeToPremium,
}: ChatInterfaceProps) {
  const { t } = useTranslation();
  
  // Estado local para mensajes (sin persistencia por ahora)
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isAITyping, setIsAITyping] = useState(false);
  const [localMessageCount, setLocalMessageCount] = useState(dailyMessageCount);
  const [showLimitBanner, setShowLimitBanner] = useState(false);
  const [showDonationPanel, setShowDonationPanel] = useState(false);
  // Lazy video
  const [videoSrc, setVideoSrc] = useState<string | undefined>(undefined);
  const videoWrapperRef = useRef<HTMLDivElement>(null);

  // Precios fijos opcionales (Stripe Price IDs) por importe
  const DONATE_5_PRICE = (import.meta as any).env?.VITE_DONATE_5_PRICE as string | undefined;
  const DONATE_10_PRICE = (import.meta as any).env?.VITE_DONATE_10_PRICE as string | undefined;
  const DONATE_20_PRICE = (import.meta as any).env?.VITE_DONATE_20_PRICE as string | undefined;
  const DONATE_100_PRICE = (import.meta as any).env?.VITE_DONATE_100_PRICE as string | undefined;

  function getPriceIdForAmount(euro: number): string | undefined {
    if (euro === 5) return DONATE_5_PRICE;
    if (euro === 10) return DONATE_10_PRICE;
    if (euro === 20) return DONATE_20_PRICE;
    if (euro === 100) return DONATE_100_PRICE;
    return undefined;
  }

  const API_BASE = ((import.meta as any).env?.VITE_API_URL as string | undefined) || 'http://localhost:3001';
  const messagesEndRef = useRef<HTMLDivElement>(null);

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
        await fetch(`${API_BASE}/api/conversations`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_id: userId, model_id: modelId })
        });
      }
      // Borrar en localStorage
      try {
        const lsKey = `conv:${modelId || modelName}:${subjectId}`;
        localStorage.removeItem(lsKey);
      } catch {}
      // Resetear mensajes con saludo inicial
      const initialMessage: Message = {
        role: 'assistant',
        content: `¡Hola! Soy ${modelName} y me alegra conocerte. He visto que prefieres un trato ${preferences.mood} y te interesan temas como ${preferences.topics.slice(0, 2).join(' y ')}. ¿Cómo ha sido tu día?`,
        timestamp: new Date(),
      };
      setMessages([initialMessage]);
    } catch (e) {
      console.error('❌ Error al borrar conversación:', e);
    }
  };

  async function handleDonate(euro: number) {
    try {
      const priceId = getPriceIdForAmount(euro);
      const payload: any = {
        type: 'donation',
        amount: Math.round(euro * 100),
        userEmail: userId ? undefined : undefined, // opcional
      };
      if (priceId) payload.priceId = priceId;

      const res = await fetch(`/api/create-checkout-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || 'Error creando sesión de donación');
      }
      const { url, sessionId } = await res.json();
      if (url) {
        window.location.href = url;
        return;
      }
      if (sessionId) {
        const stripe = await stripePromise;
        await stripe?.redirectToCheckout({ sessionId });
        return;
      }
      throw new Error('Respuesta inesperada del servidor');
    } catch (e: any) {
      console.error('Donación error:', e);
      alert(e?.message || 'No se pudo iniciar la donación');
    }
  }

  // Función simple para guardar mensajes (últimos 20) vía API (evita RLS)
  const saveMessages = async (messagesToSave: Message[]) => {
    try {
      const limitedMessages = messagesToSave.slice(-20).map(m => ({
        ...m,
        timestamp: m.timestamp.toISOString(),
      }));
      if (userId && modelId) {
        const res = await fetch(`${API_BASE}/api/conversations/upsert`, {
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

  // Cargar mensajes guardados o mostrar mensaje inicial
  useEffect(() => {
    const loadMessages = async () => {
      if (!userId || !modelId) {
        // Sin persistencia, mostrar mensaje inicial
        const initialMessage: Message = {
          role: 'assistant',
          content: `¡Hola! Soy ${modelName} y me alegra conocerte. He visto que prefieres un trato ${preferences.mood} y te interesan temas como ${preferences.topics.slice(0, 2).join(' y ')}. ¿Cómo ha sido tu día?`,
          timestamp: new Date(),
        };
        setMessages([initialMessage]);
        return;
      }

      try {
        // Cargar desde backend (service role)
        const res = await fetch(`${API_BASE}/api/conversations/get?user_id=${encodeURIComponent(userId)}&model_id=${encodeURIComponent(String(modelId))}`);
        if (res.ok) {
          const { messages: serverMessages } = await res.json();
          if (Array.isArray(serverMessages) && serverMessages.length) {
            const savedMessages = serverMessages.map((msg: any) => ({ ...msg, timestamp: new Date(msg.timestamp) }));
            setMessages(savedMessages);
            return;
          }
        }
        // Fallback: intentar localStorage
        try {
          const lsKey = `conv:${modelId || modelName}:${subjectId}`;
          const raw = localStorage.getItem(lsKey);
          if (raw) {
            const localMsgs = JSON.parse(raw).map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) }));
            setMessages(localMsgs);
            return;
          }
        } catch {}
        // Mensaje inicial por defecto
        const initialMessage: Message = {
          role: 'assistant',
          content: `¡Hola! Soy ${modelName} y me alegra conocerte. He visto que prefieres un trato ${preferences.mood} y te interesan temas como ${preferences.topics.slice(0, 2).join(' y ')}. ¿Cómo ha sido tu día?`,
          timestamp: new Date(),
        };
        setMessages([initialMessage]);
      } catch (error) {
        console.error('❌ ERROR CARGANDO MENSAJES:', error);
        const initialMessage: Message = {
          role: 'assistant',
          content: `¡Hola! Soy ${modelName} y me alegra conocerte. He visto que prefieres un trato ${preferences.mood} y te interesan temas como ${preferences.topics.slice(0, 2).join(' y ')}. ¿Cómo ha sido tu día?`,
          timestamp: new Date(),
        };
        setMessages([initialMessage]);
      }
    };

    loadMessages();
  }, [userId, modelId, modelName, preferences]);

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
    setIsAITyping(true);
    
    // Guardar mensajes después de agregar el mensaje del usuario
    saveMessages(newMessages);

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

    try {
      if ((import.meta as any).env?.DEV) {
        console.log('Calling API...');
      }
      // Llamada al endpoint local /api/generate con streaming
      const response = await fetch(`${API_BASE}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: subjectId,
          modelId: modelId,
          userMessage: messageText,
          modelName,
          modelPersona: `${modelName} es una modelo virtual con personalidad ${preferences.mood}`,
          tone: preferences.mood,
          topics: preferences.topics,
          style: preferences.style,
          stream: true,
        }),
      });

      if (response.ok && (response.headers.get('content-type') || '').includes('text/event-stream')) {
        // Crear mensaje del asistente vacío y actualizarlo según llegan chunks
        let streamedContent = '';
        const aiMessage: Message = { role: 'assistant', content: '', timestamp: new Date() };
        setMessages(prev => [...prev, aiMessage]);

        const reader = (response.body as ReadableStream<Uint8Array>).getReader();
        const decoder = new TextDecoder('utf-8');
        let buffer = '';
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';
          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed) continue;
            if (trimmed.startsWith('data:')) {
              const payload = trimmed.slice(5).trim();
              if (payload === '[DONE]') {
                buffer = '';
                break;
              }
              try {
                const json = JSON.parse(payload);
                const delta = json?.choices?.[0]?.delta?.content || json?.choices?.[0]?.message?.content || '';
                if (delta) {
                  streamedContent += delta;
                  const updated: Message = { role: 'assistant', content: streamedContent, timestamp: aiMessage.timestamp };
                  setMessages(prev => {
                    const copy = prev.slice();
                    copy[copy.length - 1] = updated;
                    return copy;
                  });
                }
              } catch {}
            }
          }
        }
        // Guardar mensajes tras terminar el stream
        saveMessages([...newMessages, { role: 'assistant', content: streamedContent || '...', timestamp: new Date() }]);
      } else if (response.ok) {
        // Fallback no-stream
        const data = await response.json();
        const aiMessage: Message = {
          role: 'assistant',
          content: data.reply || 'Lo siento, no puedo responder en este momento.',
          timestamp: new Date(),
        };
        const finalMessages = [...newMessages, aiMessage];
        setMessages(finalMessages);
        saveMessages(finalMessages);
      } else if (response.status === 429) {
        // Límite alcanzado desde el servidor: activar banner y fijar contador
        let limit = dailyLimit;
        try {
          const info = await response.json();
          if (typeof info?.limit === 'number') limit = info.limit;
        } catch {}
        if (!isUnlimited) {
          setLocalMessageCount(limit);
          try { if (storageKey) localStorage.setItem(storageKey, String(limit)); } catch {}
        }
        setShowLimitBanner(true);
        throw new Error('Has alcanzado el límite diario');
      } else {
        throw new Error('Failed to get response');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: Message = {
        role: 'assistant',
        content: 'Lo siento, no puedo responder en este momento. ¿Puedes intentarlo de nuevo?',
          timestamp: new Date(),
        };
      if ((import.meta as any).env?.DEV) {
        console.log('Adding error message to state');
      }
      const finalMessages = [...newMessages, errorMessage];
      setMessages(finalMessages);
      
      // Guardar mensajes después del mensaje de error
      saveMessages(finalMessages);
    } finally {
        setIsAITyping(false);
      }
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

  return (
    <div className="flex h-screen bg-background">
      {/* Modelo Section - Left Side (50%) */}
      <div className="w-1/2 relative bg-gradient-to-br from-primary/5 to-secondary/10 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-card/80 backdrop-blur-sm border-b border-border shrink-0">
          <Button variant="ghost" size="icon" onClick={onBack}>
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
                  <span className="text-muted-foreground">
                    ({t('chat.remaining', { count: remainingMessages })})
                  </span>
                )}
              </div>
            )}
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleClearConversation}>
              {t('common.clear') || 'Borrar chat'}
            </Button>
            {userId && (
              <Button variant="outline" size="sm" onClick={handleClearMemory}>
                {t('common.clearMemory') || 'Borrar memoria'}
              </Button>
            )}
            <Button variant="ghost" size="icon">
              <Settings className="w-5 h-5" />
            </Button>
          </div>
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
                    {[5,10,20,100].map((euro) => (
                      <Button
                        key={euro}
                        size="sm"
                        variant="outline"
                        className="bg-white text-gray-900 border-gray-300 hover:bg-gray-100 shadow"
                        onClick={() => handleDonate(euro)}
                      >
                        {euro}€
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
            {!isLimitReached && (
              <Button
                type="button"
                variant="outline"
                onClick={handleSuggest}
                title={t('chat.suggestTopic') || 'Sugerir tema'}
              >
                <Lightbulb className="w-4 h-4 mr-2" />
                {t('chat.suggest') || 'Sugerir'}
              </Button>
            )}
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
                    onClick={async () => {
                      console.log('🔥 CLICK HAZTE PREMIUM - REDIRIGIENDO DIRECTAMENTE A STRIPE');
                      setShowLimitBanner(false);
                      
                      try {
                        // Crear sesión de checkout
                        const response = await fetch(`/api/create-checkout-session`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            type: 'premium',
                            userEmail: 'test@test.com'
                          })
                        });
                        const { url, sessionId } = await response.json();
                        console.log('🔥 REDIRIGIENDO A:', url);
                        
                        // Redirigir a Stripe
                        if (url) {
                          window.location.href = url;
                        } else if (sessionId) {
                          try {
                            const stripe = await import('@stripe/stripe-js');
                            const stripeInstance = await stripe.loadStripe((import.meta as any).env?.VITE_STRIPE_PUBLISHABLE_KEY);
                            await stripeInstance?.redirectToCheckout({ sessionId });
                          } catch (e) {
                            console.error('Stripe.js redirect error', e);
                          }
                        }
                      } catch (error) {
                        console.error('Error:', error);
                        alert('Error al crear la sesión de pago');
                      }
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