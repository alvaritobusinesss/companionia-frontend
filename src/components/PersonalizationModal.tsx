import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Heart, MessageCircle, Sparkles, Coffee, ArrowLeft, ArrowRight, Flame, Zap } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";

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

const getMoods = (t: any) => [
  { id: "romantic", label: t('personalization.moods.romantic'), icon: Heart, description: t('personalization.moodDescriptions.romantic') },
  { id: "friendly", label: t('personalization.moods.friendly'), icon: Coffee, description: t('personalization.moodDescriptions.friendly') },
  { id: "flirty", label: t('personalization.moods.flirty'), icon: Sparkles, description: t('personalization.moodDescriptions.flirty') },
  { id: "supportive", label: t('personalization.moods.supportive'), icon: MessageCircle, description: t('personalization.moodDescriptions.supportive') },
  { id: "aggressive", label: t('personalization.moods.aggressive'), icon: Zap, description: t('personalization.moodDescriptions.aggressive'), isPremium: true },
  { id: "sensual", label: t('personalization.moods.sensual'), icon: Flame, description: t('personalization.moodDescriptions.sensual'), isPremium: true },
];

const getTopics = (t: any) => [
  t('personalization.topics.love'),
  t('personalization.topics.daily'), 
  t('personalization.topics.casual'),
  t('personalization.topics.advice'),
  t('personalization.topics.fantasy'),
  t('personalization.topics.humor'),
  t('personalization.topics.support'),
  t('personalization.topics.interests'),
];

const getStyles = (t: any) => [
  { id: "caring", label: t('personalization.styles.caring'), description: t('personalization.styleDescriptions.caring') },
  { id: "playful", label: t('personalization.styles.playful'), description: t('personalization.styleDescriptions.playful') },
  { id: "sophisticated", label: t('personalization.styles.sophisticated'), description: t('personalization.styleDescriptions.sophisticated') },
  { id: "passionate", label: t('personalization.styles.passionate'), description: t('personalization.styleDescriptions.passionate') },
];

export function PersonalizationModal({ 
  isOpen, 
  onClose, 
  onStartChat, 
  modelName, 
  modelImage,
  userIsPremium = false
}: PersonalizationModalProps) {
  const { t } = useTranslation();
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
      console.log('🎯 BOTÓN COMENZAR CHAT CLICKEADO');
      console.log('🎯 selectedStyle:', selectedStyle);
      console.log('🎯 selectedMood:', selectedMood);
      console.log('🎯 selectedTopics:', selectedTopics);
      
      // En el paso 3, si hay un estilo seleccionado, abrir chat automáticamente
      if (selectedStyle) {
        console.log('🎯 ABRIENDO CHAT CON ESTILO SELECCIONADO');
        onStartChat({
          mood: selectedMood,
          topics: selectedTopics,
          style: selectedStyle,
        });
        onClose();
      } else {
        console.log('🎯 NO HAY ESTILO SELECCIONADO, LLAMANDO handleStartChat');
        handleStartChat();
      }
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
    t('personalization.questions.mood'),
    t('personalization.questions.topics'),
    t('personalization.questions.style')
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-center">
            {t('personalization.title', { name: modelName })}
          </DialogTitle>
          <p className="text-muted-foreground text-center text-sm">
            {t('personalization.subtitle')}
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
              {t('personalization.step', { current: step })}
            </p>
          </div>

          {/* Step 1: Mood Selection */}
          {step === 1 && (
            <div className="animate-fade-in">
              <div className="grid grid-cols-2 gap-3">
                {getMoods(t).map((mood) => {
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
                            {t('personalization.premium')}
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
                            {t('personalization.upgradeToPremium')}
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
                {t('personalization.topicsHint')}
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                {getTopics(t).map((topic) => (
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
                  {t('personalization.topicsSelected', { 
                    count: selectedTopics.length, 
                    plural: selectedTopics.length !== 1 ? 's' : '' 
                  })}
                </p>
              )}
            </div>
          )}

          {/* Step 3: Style Selection */}
          {step === 3 && (
            <div className="animate-fade-in">
              <div className="space-y-3">
                {getStyles(t).map((style) => (
                  <Card 
                    key={style.id}
                    className={`cursor-pointer transition-all border-2 hover:scale-102 ${
                      selectedStyle === style.id 
                        ? 'border-primary bg-primary/10 shadow-glow-primary' 
                        : 'border-border hover:border-primary/50'
                    }`}
                    onClick={() => {
                      setSelectedStyle(style.id);
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
                {t('personalization.navigation.previous')}
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
                {t('personalization.navigation.next')}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            )}
            
            {step === 3 && (
              <Button 
                onClick={() => {
                  console.log('🎯 COMENZAR CHAT CLICKEADO');
                  console.log('🎯 DATOS:', { selectedMood, selectedTopics, selectedStyle });
                  
                  // Crear preferencias
                  const preferences = {
                    mood: selectedMood,
                    topics: selectedTopics,
                    style: selectedStyle,
                  };
                  
                  console.log('🎯 LLAMANDO onStartChat con:', preferences);
                  
                  // Usar setTimeout para evitar conflictos de estado
                  setTimeout(() => {
                    onStartChat(preferences);
                    onClose();
                  }, 100);
                }}
                disabled={!selectedStyle}
                className="w-full bg-primary hover:bg-primary/90 transition-all shadow-glow-primary"
              >
                Comenzar Chat
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            )}
            
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}