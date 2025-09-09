import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Heart, MessageCircle, Sparkles, Coffee, ArrowLeft, ArrowRight, Flame, Zap } from "lucide-react";

interface PersonalizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartChat: (preferences: ChatPreferences) => void;
  modelName: string;
  modelImage: string;
  userIsPremium?: boolean;
}

export interface ChatPreferences {
  mood: string;
  topics: string[];
  style: string;
}

const moods = [
  { id: "romantic", label: "Romántico", icon: Heart, description: "Dulce y cariñoso" },
  { id: "friendly", label: "Amistoso", icon: Coffee, description: "Relajado y casual" },
  { id: "flirty", label: "Coqueto", icon: Sparkles, description: "Juguetón y divertido" },
  { id: "supportive", label: "Comprensivo", icon: MessageCircle, description: "Empático y gentil" },
  { id: "aggressive", label: "Agresivo", icon: Zap, description: "Dominante y directo", isPremium: true },
  { id: "sensual", label: "Sensual", icon: Flame, description: "Seductor y provocativo", isPremium: true },
];

const topics = [
  "Amor y romance",
  "Compañía diaria", 
  "Charla casual",
  "Consejos de vida",
  "Fantasías suaves",
  "Humor y diversión",
  "Apoyo emocional",
  "Intereses personales",
];

const styles = [
  { id: "caring", label: "Cuidadoso", description: "Atento a tus necesidades" },
  { id: "playful", label: "Juguetón", description: "Divertido y espontáneo" },
  { id: "sophisticated", label: "Sofisticado", description: "Elegante e intelectual" },
  { id: "passionate", label: "Apasionado", description: "Intenso y emocional" },
];

export function PersonalizationModal({ 
  isOpen, 
  onClose, 
  onStartChat, 
  modelName, 
  modelImage,
  userIsPremium = false
}: PersonalizationModalProps) {
  const [step, setStep] = useState(1);
  const [selectedMood, setSelectedMood] = useState("");
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [selectedStyle, setSelectedStyle] = useState("");

  const handleTopicToggle = (topic: string) => {
    const newTopics = selectedTopics.includes(topic) 
      ? selectedTopics.filter(t => t !== topic)
      : [...selectedTopics, topic];
    setSelectedTopics(newTopics);
  };

  const handleNext = () => {
    if (step < 3) {
      setStep(step + 1);
    } else {
      handleStartChat();
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleStartChat = () => {
    if (selectedMood && selectedTopics.length > 0 && selectedStyle) {
      onStartChat({
        mood: selectedMood,
        topics: selectedTopics,
        style: selectedStyle,
      });
      onClose();
      // Reset state
      setStep(1);
      setSelectedMood("");
      setSelectedTopics([]);
      setSelectedStyle("");
    }
  };

  const canContinue = (step === 1 && selectedMood) || 
                     (step === 2 && selectedTopics.length > 0) || 
                     (step === 3 && selectedStyle);

  const stepQuestions = [
    "¿Cómo te gusta que te traten?",
    "¿De qué te gusta hablar?",
    "¿Qué estilo prefieres?"
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-center">
            Conoce mejor a {modelName}
          </DialogTitle>
          <p className="text-muted-foreground text-center text-sm">
            3 preguntas rápidas para personalizar tu experiencia
          </p>
        </DialogHeader>
        
        <div className="space-y-6">
          <div className="text-center">
            <img 
              src={modelImage} 
              alt={modelName}
              className="w-20 h-20 rounded-full object-cover border-2 border-primary/30 mx-auto mb-4"
            />
            
            {/* Progress indicators */}
            <div className="flex items-center justify-center gap-2 mb-4">
              {[1, 2, 3].map((stepNumber) => (
                <div 
                  key={stepNumber}
                  className={`w-3 h-3 rounded-full transition-all duration-300 ${
                    step >= stepNumber ? 'bg-primary scale-110' : 'bg-muted'
                  }`} 
                />
              ))}
            </div>
            
            <h3 className="font-medium text-lg text-foreground mb-2">
              {stepQuestions[step - 1]}
            </h3>
            <p className="text-sm text-muted-foreground">
              Paso {step} de 3
            </p>
          </div>

          {/* Step 1: Mood Selection */}
          {step === 1 && (
            <div className="animate-fade-in">
              <div className="grid grid-cols-2 gap-3">
                {moods.map((mood) => {
                  const Icon = mood.icon;
                  const isLocked = mood.isPremium && !userIsPremium;
                  return (
                    <Card 
                      key={mood.id}
                      className={`cursor-pointer transition-all border-2 hover:scale-105 relative ${
                        isLocked 
                          ? 'border-muted bg-muted/50 opacity-70 cursor-not-allowed' 
                          : selectedMood === mood.id 
                            ? 'border-primary bg-primary/10 shadow-glow-primary' 
                            : 'border-border hover:border-primary/50'
                      }`}
                      onClick={() => !isLocked && setSelectedMood(mood.id)}
                    >
                      <CardContent className="p-4 text-center">
                        {mood.isPremium && (
                          <Badge className={`absolute -top-2 -right-2 text-xs px-2 py-1 ${
                            isLocked 
                              ? 'bg-muted-foreground text-muted' 
                              : 'bg-gradient-to-r from-yellow-400 to-orange-500'
                          }`}>
                            Premium
                          </Badge>
                        )}
                        <Icon className={`w-6 h-6 mx-auto mb-2 ${
                          isLocked 
                            ? 'text-muted-foreground' 
                            : selectedMood === mood.id 
                              ? 'text-primary' 
                              : 'text-muted-foreground'
                        }`} />
                        <span className={`font-medium text-sm block ${
                          isLocked ? 'text-muted-foreground' : ''
                        }`}>
                          {mood.label}
                        </span>
                        <p className="text-xs text-muted-foreground mt-1">{mood.description}</p>
                        {isLocked && (
                          <p className="text-xs text-primary mt-2 font-medium">
                            Actualiza a Premium
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step 2: Topics Selection */}
          {step === 2 && (
            <div className="animate-fade-in">
              <p className="text-sm text-muted-foreground text-center mb-4">
                Selecciona los temas que más te interesen (puedes elegir varios)
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                {topics.map((topic) => (
                  <Badge
                    key={topic}
                    variant={selectedTopics.includes(topic) ? "default" : "secondary"}
                    className={`cursor-pointer transition-all text-xs py-2 px-3 hover:scale-105 ${
                      selectedTopics.includes(topic) 
                        ? 'bg-primary text-primary-foreground shadow-glow-primary' 
                        : 'hover:bg-primary/20'
                    }`}
                    onClick={() => handleTopicToggle(topic)}
                  >
                    {topic}
                  </Badge>
                ))}
              </div>
              {selectedTopics.length > 0 && (
                <p className="text-center text-sm text-primary mt-3">
                  {selectedTopics.length} tema{selectedTopics.length !== 1 ? 's' : ''} seleccionado{selectedTopics.length !== 1 ? 's' : ''}
                </p>
              )}
            </div>
          )}

          {/* Step 3: Style Selection */}
          {step === 3 && (
            <div className="animate-fade-in">
              <div className="space-y-3">
                {styles.map((style) => (
                  <Card 
                    key={style.id}
                    className={`cursor-pointer transition-all border-2 hover:scale-102 ${
                      selectedStyle === style.id 
                        ? 'border-primary bg-primary/10 shadow-glow-primary' 
                        : 'border-border hover:border-primary/50'
                    }`}
                    onClick={() => {
                      setSelectedStyle(style.id);
                      // Auto-start chat when style is selected
                      setTimeout(() => {
                        if (selectedMood && selectedTopics.length > 0) {
                          onStartChat({
                            mood: selectedMood,
                            topics: selectedTopics,
                            style: style.id,
                          });
                          onClose();
                          // Reset state
                          setStep(1);
                          setSelectedMood("");
                          setSelectedTopics([]);
                          setSelectedStyle("");
                        }
                      }, 300); // Small delay for visual feedback
                    }}
                  >
                    <CardContent className="p-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <span className="font-medium text-base">{style.label}</span>
                          <p className="text-sm text-muted-foreground mt-1">{style.description}</p>
                        </div>
                        <div className={`w-4 h-4 rounded-full border-2 transition-all ${
                          selectedStyle === style.id 
                            ? 'border-primary bg-primary' 
                            : 'border-muted-foreground'
                        }`} />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex gap-3 pt-4">
            {step > 1 && step < 3 && (
              <Button 
                variant="outline" 
                onClick={handleBack}
                className="flex-1"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Anterior
              </Button>
            )}
            
            {step < 3 && (
              <Button 
                onClick={handleNext}
                disabled={!canContinue}
                className={`${step === 1 ? 'w-full' : 'flex-1'} bg-primary hover:bg-primary/90 transition-all ${
                  canContinue ? 'shadow-glow-primary' : ''
                }`}
              >
                Siguiente
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            )}
            
            {step === 3 && (
              <div className="w-full text-center">
                <p className="text-sm text-muted-foreground">
                  Selecciona un estilo para comenzar automáticamente
                </p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}