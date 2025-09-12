import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Crown, Lock, Star, CreditCard } from "lucide-react";
import { Model, UserAccess } from "@/hooks/useUserAccess";

interface ModelCardWithAccessProps {
  model: Model;
  userAccess: UserAccess;
  onSelect: (modelId: string) => void;
  onPurchase: (modelId: string) => void;
}

export function ModelCardWithAccess({ 
  model, 
  userAccess, 
  onSelect, 
  onPurchase 
}: ModelCardWithAccessProps) {
  
  const handleClick = () => {
    if (userAccess.hasAccess) {
      onSelect(model.id);
    } else {
      onPurchase(model.id);
    }
  };

  const getBadgeVariant = () => {
    if (userAccess.hasAccess) {
      return model.type === 'free' ? 'secondary' : 'default';
    }
    return 'destructive';
  };

  const getBadgeText = () => {
    if (userAccess.hasAccess) {
      return model.type === 'free' ? 'Gratis' : 'Desbloqueado';
    }
    
    switch (model.type) {
      case 'premium':
        return 'Premium';
      case 'one_time':
        return `€${model.price}`;
      default:
        return 'Bloqueado';
    }
  };

  const getBadgeIcon = () => {
    if (userAccess.hasAccess) {
      return null;
    }
    
    switch (model.type) {
      case 'premium':
        return <Crown className="w-3 h-3" />;
      case 'one_time':
        return <CreditCard className="w-3 h-3" />;
      default:
        return <Lock className="w-3 h-3" />;
    }
  };

  return (
    <Card 
      className={`relative group cursor-pointer transition-all duration-300 hover:scale-105 ${
        userAccess.hasAccess 
          ? 'hover:shadow-lg' 
          : 'opacity-75 hover:opacity-90'
      }`}
      onClick={handleClick}
    >
      <CardContent className="p-0">
        {/* Imagen del modelo */}
        <div className="relative aspect-[3/4] overflow-hidden rounded-t-lg">
          <img 
            src={model.image_url} 
            alt={model.name}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
          />
          
          {/* Overlay de bloqueo */}
          {!userAccess.hasAccess && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <div className="text-center text-white">
                {model.type === 'premium' ? (
                  <Crown className="w-8 h-8 mx-auto mb-2 text-yellow-400" />
                ) : (
                  <Lock className="w-8 h-8 mx-auto mb-2 text-red-400" />
                )}
                <p className="text-sm font-medium">
                  {model.type === 'premium' ? 'Premium' : `€${model.price}`}
                </p>
              </div>
            </div>
          )}

          {/* Badge de tipo */}
          <div className="absolute top-2 left-2">
            <Badge 
              variant={getBadgeVariant()}
              className="flex items-center gap-1 text-xs"
            >
              {getBadgeIcon()}
              {getBadgeText()}
            </Badge>
          </div>

          {/* Rating */}
          <div className="absolute bottom-2 right-2 flex items-center gap-1 bg-background/80 backdrop-blur-sm rounded-full px-2 py-1">
            <Star className="w-3 h-3 text-primary fill-current" />
            <span className="text-xs font-medium">{model.rating}</span>
          </div>
        </div>

        {/* Información del modelo */}
        <div className="p-4">
          <h3 className="font-bold text-lg text-foreground uppercase tracking-wide mb-2">
            {model.name}
          </h3>
          
          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
            {model.description}
          </p>
          
          {/* Tags */}
          <div className="flex flex-wrap gap-1 mb-3">
            {model.tags.slice(0, 3).map((tag) => (
              <Badge 
                key={tag} 
                variant="secondary" 
                className="text-xs px-2 py-1"
              >
                {tag}
              </Badge>
            ))}
          </div>

          {/* Botón de acción */}
          <Button 
            className={`w-full ${
              userAccess.hasAccess 
                ? 'bg-primary hover:bg-primary/90' 
                : model.type === 'premium'
                  ? 'bg-yellow-500 hover:bg-yellow-600'
                  : 'bg-green-500 hover:bg-green-600'
            }`}
            onClick={handleClick}
          >
            {userAccess.hasAccess ? (
              model.type === 'free' ? 'Chat' : 'Desbloqueado'
            ) : model.type === 'premium' ? (
              <>
                <Crown className="w-4 h-4 mr-2" />
                Hazte Premium
              </>
            ) : (
              <>
                <CreditCard className="w-4 h-4 mr-2" />
                Comprar por €{model.price}
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
