import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Heart, MessageCircle, Sparkles, Coffee, ArrowRight, Flame, Zap } from "lucide-react";
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

// Modal reducido a una única pregunta: mood

export function PersonalizationModal({ 
  isOpen, 
  onClose, 
  onStartChat, 
  modelName, 
  modelImage,
  userIsPremium = false
}: PersonalizationModalProps) {
  const { t } = useTranslation();
  const [selectedMood, setSelectedMood] = useState("");

  // Sin selección de topics/estilo

  const handleNext = () => {
    if (!selectedMood) return;
    onStartChat({ mood: selectedMood, topics: [], style: "" });
    onClose();
  };

  // Sin navegación atrás/adelante

  const handleStartChat = () => {
    if (!selectedMood) return;
    onStartChat({ mood: selectedMood, topics: [], style: "" });
    onClose();
  };

  const canContinue = !!selectedMood;

  const question = t('personalization.questions.mood');

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
            
            {/* Sin indicadores de progreso (una única pregunta) */}
            
            <h3 className="font-medium text-lg text-foreground mb-2">
              {question}
            </h3>
            <p className="text-sm text-muted-foreground">
              {t('personalization.step', { current: 1 })}
            </p>
          </div>

          {/* Única pregunta: mood */}
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
                        <div className={`absolute -top-2 -right-2 text-xs px-2 py-1 rounded ${
                          isLocked 
                            ? 'bg-muted-foreground text-muted' 
                            : 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white'
                        }`}>
                          {t('personalization.premium')}
                        </div>
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

          {/* Navigation */}
          <div className="pt-4">
            <Button 
              onClick={handleNext}
              disabled={!canContinue}
              className="w-full bg-primary hover:bg-primary/90 transition-all shadow-glow-primary"
            >
              {t('personalization.navigation.next')}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}