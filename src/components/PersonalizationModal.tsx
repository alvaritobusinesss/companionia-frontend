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

// Eliminamos preguntas de temas y estilo: solo preguntamos el tono (mood)

export function PersonalizationModal({ 
  isOpen, 
  onClose, 
  onStartChat, 
  modelName, 
  modelImage,
  userIsPremium = false
}: PersonalizationModalProps) {
  const { t } = useTranslation();
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);

  // Sin selección de topics/estilo

  const handleNext = () => {
    if (!selectedTopics.length) return;
    onStartChat({ mood: "", topics: selectedTopics, style: "" });
    onClose();
  };

  // Sin navegación atrás/adelante

  const handleStartChat = () => {
    if (!selectedTopics.length) return;
    onStartChat({ mood: "", topics: selectedTopics, style: "" });
    onClose();
  };

  const canContinue = selectedTopics.length > 0;

  const question = t('personalization.questions.topics');

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

          {/* Única pregunta: topics */}
          (
            <div className="animate-fade-in">
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
                    onClick={() => setSelectedTopics(prev => prev.includes(topic) ? prev.filter(t0 => t0 !== topic) : [...prev, topic])}
                  >
                    {topic}
                  </Badge>
                ))}
              </div>
            </div>
          )

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