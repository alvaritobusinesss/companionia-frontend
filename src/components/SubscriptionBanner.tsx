import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Crown, Sparkles, MessageCircle, Image, X } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "@/hooks/useTranslation";

interface SubscriptionBannerProps {
  onUpgrade: () => void;
}

export function SubscriptionBanner({ onUpgrade }: SubscriptionBannerProps) {
  const [isVisible, setIsVisible] = useState(true);
  const { t } = useTranslation();

  if (!isVisible) return null;

  return (
    <Card className="bg-gradient-secondary border-premium/30 relative overflow-hidden animate-glow-pulse">
      <div className="absolute inset-0 bg-gradient-to-r from-premium/20 to-secondary/20" />
      
      <CardContent className="relative p-6">
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 inline-end-2 text-premium-foreground hover:bg-premium/20"
          onClick={() => setIsVisible(false)}
        >
          <X className="w-4 h-4" />
        </Button>
        
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-premium/20 rounded-full">
            <Crown className="w-6 h-6 text-premium" />
          </div>
          <div>
            <h3 className="font-semibold text-premium-foreground">
              {t('premium.unlockTitle')}
            </h3>
            <p className="text-sm text-premium-foreground/80">
              {t('premium.unlockSubtitle')}
            </p>
          </div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div className="flex items-center gap-2">
            <Crown className="w-4 h-4 text-premium" />
            <span className="text-sm text-premium-foreground">{t('premium.premiumModels')}</span>
          </div>
          <div className="flex items-center gap-2">
            <MessageCircle className="w-4 h-4 text-premium" />
            <span className="text-sm text-premium-foreground">{t('premium.unlimitedChat')}</span>
          </div>
          <div className="flex items-center gap-2">
            <Image className="w-4 h-4 text-premium" />
            <span className="text-sm text-premium-foreground">{t('premium.aiImages')}</span>
          </div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-premium" />
            <span className="text-sm text-premium-foreground">{t('premium.specialFeatures')}</span>
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant="premium" className="bg-premium text-premium-foreground">
              {t('premium.specialOffer')}
            </Badge>
            <span className="text-lg font-bold text-premium-foreground">{t('premium.price')} {t('premium.pricePerMonth')}</span>
            <span className="text-sm text-premium-foreground/60 line-through">{t('premium.originalPrice')}</span>
          </div>
          
          <Button 
            onClick={onUpgrade}
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
          >
            <Crown className="w-4 h-4 mr-2" />
            {t('premium.updateNow')}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}