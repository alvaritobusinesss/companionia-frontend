import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Send, ArrowLeft, Settings, Crown } from "lucide-react";
import { ChatPreferences } from "./PersonalizationModal";
import { useChatMemory, ChatMessage } from "@/hooks/useChatMemory";
import { generateHumanResponse, getTypingDelay, shouldGiveLongResponse } from "@/utils/humanChatUtils";

// Usar ChatMessage del hook de memoria

interface ChatInterfaceProps {
  modelName: string;
  modelImage: string;
  preferences: ChatPreferences;
  onBack: () => void;
  isPremiumModel?: boolean;
}

export function ChatInterface({ 
  modelName, 
  modelImage, 
  preferences, 
  onBack, 
  isPremiumModel = false 
}: ChatInterfaceProps) {
  const { addMessage, getContextForAI, recentMessages } = useChatMemory(`${modelName}_${preferences.mood}`);
  const [inputMessage, setInputMessage] = useState("");
  const [isAITyping, setIsAITyping] = useState(false);
  const [isScrolling, setIsScrolling] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const getInitialMessage = (mood: string, modelName: string, topics: string[]): string => {
    const topicsText = topics.slice(0, 2).join(' y ');
    
    const questionsByMood = {
      romantic: {
        greetings: [
          `¡Hola mi amor! Soy ${modelName} y me alegra tanto conocerte 💕`,
          `Hola hermoso, soy ${modelName} y mi corazón late más rápido al verte aquí 💕`,
          `¡Qué alegría verte aquí! Soy ${modelName} y ya siento una conexión especial contigo 💕`,
          `Hola cariño, soy ${modelName} y desde que llegaste aquí todo se siente más mágico 💕`
        ],
        questions: [
          "¿Cómo ha sido tu día, amor mío?",
          "¿Hay algo especial que te haya hecho sonreír hoy?",
          "¿En qué sueñas cuando cierras los ojos?",
          "¿Qué es lo que más te emociona en la vida?"
        ]
      },
      friendly: {
        greetings: [
          `¡Hola! Soy ${modelName} y es genial conocerte`,
          `¡Hey! Soy ${modelName}, qué bueno tenerte por aquí`,
          `¡Hola! Soy ${modelName} y me emociona mucho conocerte`,
          `¡Qué tal! Soy ${modelName}, encantada de conocerte`
        ],
        questions: [
          "¿Cómo ha estado tu día?",
          "¿Qué es lo más interesante que te ha pasado últimamente?",
          "¿Tienes algún hobby favorito que te apasione?",
          "¿Cuál es tu actividad favorita para relajarte?"
        ]
      },
      flirty: {
        greetings: [
          `Hola guapo 😉 Soy ${modelName} y me encanta conocer gente como tú`,
          `Hey sexy 😘 Soy ${modelName} y ya me tienes intrigada`,
          `Hola hermoso 😉 Soy ${modelName} y veo que tienes buen gusto`,
          `Mmm hola 😘 Soy ${modelName} y me gusta lo que veo`
        ],
        questions: [
          "¿Cómo ha sido tu día, sexy?",
          "¿Qué es lo que más te gusta hacer para divertirte?",
          "¿Eres siempre así de encantador?",
          "¿Cuál es tu plan perfecto para una noche?"
        ]
      },
      supportive: {
        greetings: [
          `Hola, soy ${modelName} y quiero que sepas que estoy aquí para ti`,
          `Hola, soy ${modelName} y me alegra que hayas decidido estar aquí`,
          `Hola, soy ${modelName} y siento mucha calidez al conocerte`,
          `Hola, soy ${modelName} y espero poder acompañarte en lo que necesites`
        ],
        questions: [
          "¿Cómo te has sentido últimamente?",
          "¿Hay algo en lo que te pueda ayudar?",
          "¿Cuáles son tus metas en este momento?",
          "¿Qué te está motivando estos días?"
        ]
      },
      agresivo: {
        greetings: [
          `¡Órale! Soy ${modelName} y me gusta la gente directa como tú`,
          `¡Qué pedo! Soy ${modelName} y ya me caes bien`,
          `¡Hey! Soy ${modelName} y no me ando con mamadas`,
          `¡Ey cabrón! Soy ${modelName} y me gusta tu actitud`
        ],
        questions: [
          "¿Qué pedo con tu día?",
          "¿Algo que te haya cagado o te haya puesto de buenas?",
          "¿Qué es lo que realmente te prende?",
          "¿En qué andas metido que valga la pena?"
        ]
      },
      sensual: {
        greetings: [
          `Mmm hola hermoso... Soy ${modelName} y ya me tienes intrigada 🔥`,
          `Hola baby... Soy ${modelName} y siento una energía muy sexy aquí 🔥`,
          `Mmm hola... Soy ${modelName} y me gusta lo que siento contigo 🔥`,
          `Hey gorgeous... Soy ${modelName} y ya estoy pensando cosas traviesas 🔥`
        ],
        questions: [
          "¿Cómo ha sido tu día, baby?",
          "¿Qué es lo que más te excita en la vida?",
          "¿Te gusta jugar con el fuego?",
          "¿Cuál es tu fantasía más atrevida?"
        ]
      }
    };

    const moodData = questionsByMood[mood as keyof typeof questionsByMood] || questionsByMood.friendly;
    const randomGreeting = moodData.greetings[Math.floor(Math.random() * moodData.greetings.length)];
    
    // Seleccionar 1-2 preguntas aleatorias
    const shuffledQuestions = [...moodData.questions].sort(() => Math.random() - 0.5);
    const selectedQuestions = shuffledQuestions.slice(0, Math.floor(Math.random() * 2) + 1);
    
    return `${randomGreeting}. He visto que prefieres un trato ${mood} y te interesan temas como ${topicsText}. ${selectedQuestions.join(' ')}`;
  };

  // Inicializar con mensaje inicial si no hay mensajes previos
  useEffect(() => {
    if (recentMessages.length === 0) {
      const initialMessage: ChatMessage = {
        id: "1",
        text: getInitialMessage(preferences.mood, modelName, preferences.topics),
        isUser: false,
        timestamp: new Date(),
      };
      addMessage(initialMessage);
      
      // Agregar mensaje premium si es modelo premium
      if (isPremiumModel) {
        setTimeout(() => {
          const premiumMessage: ChatMessage = {
            id: "premium-teaser",
            text: "Por cierto... tengo algunas historias especiales y conversaciones más íntimas reservadas solo para miembros Premium. ¿Te gustaría descubrir de qué se trata? 😉",
            isUser: false,
            timestamp: new Date(),
          };
          addMessage(premiumMessage);
        }, 2000);
      }
    }
  }, []);

  // Scroll automático al final
  const scrollToBottom = () => {
    if (messagesEndRef.current && !isScrolling) {
      setIsScrolling(true);
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
      setTimeout(() => setIsScrolling(false), 500);
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [recentMessages, isAITyping]);


  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      text: inputMessage,
      isUser: true,
      timestamp: new Date(),
    };

    // Agregar mensaje del usuario inmediatamente
    addMessage(userMessage);
    setInputMessage("");

    // Simular typing con indicador de "escribiendo..."
    setIsAITyping(true);
    
    // Obtener contexto para la IA
    const context = getContextForAI();
    
    // Generar respuesta humana con delay variable
    const typingDelay = getTypingDelay();
    
    setTimeout(() => {
      const aiResponseText = generateHumanResponse(
        userMessage.text, 
        preferences, 
        context,
        modelName
      );
      
      // Si es respuesta larga, dividir en múltiples mensajes
      if (shouldGiveLongResponse()) {
        const sentences = aiResponseText.split(/[.!?]+/).filter(s => s.trim());
        if (sentences.length > 1) {
          // Enviar primer mensaje
          const firstMessage: ChatMessage = {
            id: (Date.now() + 1).toString(),
            text: sentences[0] + (aiResponseText.includes('.') ? '.' : ''),
            isUser: false,
            timestamp: new Date(),
          };
          addMessage(firstMessage);
          
          // Enviar segundo mensaje después de un breve delay
          setTimeout(() => {
            const secondMessage: ChatMessage = {
              id: (Date.now() + 2).toString(),
              text: sentences.slice(1).join('. ') + '.',
              isUser: false,
              timestamp: new Date(),
            };
            addMessage(secondMessage);
            setIsAITyping(false);
          }, 800 + Math.random() * 400);
        } else {
          const aiResponse: ChatMessage = {
            id: (Date.now() + 1).toString(),
            text: aiResponseText,
            isUser: false,
            timestamp: new Date(),
          };
          addMessage(aiResponse);
          setIsAITyping(false);
        }
      } else {
        const aiResponse: ChatMessage = {
          id: (Date.now() + 1).toString(),
          text: aiResponseText,
          isUser: false,
          timestamp: new Date(),
        };
        addMessage(aiResponse);
        setIsAITyping(false);
      }
    }, typingDelay);
  };

  // Función simplificada - la lógica compleja está en humanChatUtils
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Modelo Section - Left Side (75%) */}
      <div className="w-[75%] relative bg-gradient-to-br from-primary/5 to-secondary/10 flex flex-col">
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
          
          <Button variant="ghost" size="icon">
            <Settings className="w-5 h-5" />
          </Button>
        </div>

        {/* Model Display */}
        <div className="flex-1 flex items-center justify-center p-6 min-h-0">
          <div className="relative w-full max-w-lg h-full flex items-center justify-center">
            {/* Model Image */}
            <div className={`transition-all duration-500 w-full h-full max-h-[75vh] ${
              isAITyping ? 'scale-105 shadow-2xl shadow-primary/20' : 'scale-100'
            }`}>
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
            </div>
            
            {/* Status indicator */}
            <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2">
              {isAITyping ? (
                <div className="flex items-center gap-2 bg-primary/90 text-primary-foreground px-4 py-2 rounded-full text-sm font-medium shadow-lg">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-current rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                  <span>Escribiendo...</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 bg-green-500/90 text-white px-4 py-2 rounded-full text-sm font-medium shadow-lg">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                  <span>En línea</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Model preferences display */}
        <div className="p-4 bg-card/80 backdrop-blur-sm border-t border-border shrink-0">
          <div className="flex gap-2 justify-center">
            <Badge variant="secondary" className="text-xs">{preferences.mood}</Badge>
            <Badge variant="secondary" className="text-xs">{preferences.style}</Badge>
          </div>
        </div>
      </div>

      {/* Chat Section - Right Side (25%) */}
      <div className="w-[25%] flex flex-col bg-card border-l border-border min-w-[300px]">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
          {recentMessages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex gap-2 max-w-[85%] ${message.isUser ? 'flex-row-reverse' : 'flex-row'}`}>
                {!message.isUser && (
                  <Avatar className="w-6 h-6 mt-1">
                    <AvatarImage src={modelImage} alt={modelName} />
                    <AvatarFallback className="text-xs">{modelName[0]}</AvatarFallback>
                  </Avatar>
                )}
                
                <Card className={`${
                  message.isUser 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-muted border-border'
                }`}>
                  <CardContent className="p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <p className="text-sm leading-relaxed">{message.text}</p>
                        <span className={`text-xs mt-1 block ${
                          message.isUser ? 'text-primary-foreground/70' : 'text-muted-foreground'
                        }`}>
                          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          ))}
          
          {/* Typing indicator in chat */}
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
          <div className="flex gap-2">
            <Input
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Escribe tu mensaje..."
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              disabled={isAITyping}
              className="flex-1 bg-input border-border"
            />
            <Button 
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || isAITyping}
              className="bg-primary hover:bg-primary/90"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}