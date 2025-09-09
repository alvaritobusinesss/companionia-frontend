import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Crown, Heart, MessageCircle, Star, Edit, Check, X } from "lucide-react";
import { useState } from "react";

interface ModelCardProps {
  id: string;
  name: string;
  image: string;
  description: string;
  tags: string[];
  isPremium: boolean;
  isExtraPremium: boolean;
  isLocked: boolean;
  rating: number;
  conversations: number;
  price?: string;
  onSelect: (id: string) => void;
  onPriceUpdate?: (id: string, price: string) => void;
}

export function ModelCard({ 
  id, 
  name, 
  image, 
  description, 
  tags, 
  isPremium, 
  isExtraPremium,
  isLocked, 
  rating, 
  conversations,
  price,
  onSelect,
  onPriceUpdate
}: ModelCardProps) {
  const [isEditingPrice, setIsEditingPrice] = useState(false);
  const [tempPrice, setTempPrice] = useState(price || "0.00");

  const handlePriceEdit = () => {
    setIsEditingPrice(true);
  };

  const handlePriceSave = () => {
    if (onPriceUpdate) {
      onPriceUpdate(id, tempPrice);
    }
    setIsEditingPrice(false);
  };

  const handlePriceCancel = () => {
    setTempPrice(price || "0.00");
    setIsEditingPrice(false);
  };
  return (
    <div className="space-y-2">
      <Card 
        className={`group relative overflow-hidden bg-gradient-card transition-all duration-500 hover:shadow-premium hover:animate-card-hover cursor-pointer aspect-[2/3] w-full ${
          isExtraPremium
            ? 'border-2 border-extra-premium/60 shadow-extra-premium hover:border-extra-premium hover:shadow-[0_0_40px_hsl(var(--extra-premium)/0.6)] ring-2 ring-extra-premium/30'
            : isPremium 
              ? 'border-2 border-premium/60 shadow-premium hover:border-premium hover:shadow-glow ring-2 ring-premium/20' 
              : 'border-2 border-primary/30 hover:border-primary hover:shadow-glow-primary'
        }`}
        onClick={() => !isLocked && onSelect(id)}
      >
        {(isPremium || isExtraPremium) && (
          <div className="absolute top-3 right-3 z-10">
            <Badge variant={isExtraPremium ? "extra-premium" : "premium"} className={`${isExtraPremium ? 'bg-extra-premium text-extra-premium-foreground' : 'bg-premium text-premium-foreground'} animate-glow-pulse`}>
              <Crown className="w-3 h-3 mr-1" />
              {isExtraPremium ? 'Extra Premium' : 'Premium'}
            </Badge>
          </div>
        )}
        
        <CardContent className="p-0">
          {/* Imagen principal de la carta - ocupa toda la altura */}
          <div className="relative h-full w-full overflow-hidden">
            <img
              src={image}
              alt={name}
              className={`w-full h-full object-cover object-top transition-all duration-500 group-hover:scale-105 ${
                isLocked ? 'filter blur-sm brightness-50' : ''
              }`}
            />
            
            {/* Overlay de bloqueo Premium/Extra Premium */}
            {isLocked && (
              <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center">
                <div className="text-center space-y-2">
                  <Crown className={`w-12 h-12 mx-auto animate-glow-pulse ${isExtraPremium ? 'text-extra-premium' : 'text-premium'}`} />
                  <p className={`text-sm font-bold ${isExtraPremium ? 'text-extra-premium' : 'text-premium'}`}>
                    {isExtraPremium ? 'Carta Extra Premium' : 'Carta Premium'}
                  </p>
                  <p className={`text-xs ${isExtraPremium ? 'text-extra-premium/80' : 'text-premium/80'}`}>
                    {isExtraPremium ? 'Desbloquea para coleccionar' : 'Desbloquea para coleccionar'}
                  </p>
                </div>
              </div>
            )}
            
            {/* Gradiente decorativo en la parte superior */}
            <div className={`absolute top-0 left-0 right-0 h-20 bg-gradient-to-b ${
              isExtraPremium
                ? 'from-extra-premium/30 to-transparent'
                : isPremium 
                  ? 'from-premium/30 to-transparent' 
                  : 'from-primary/20 to-transparent'
            }`} />
            
            {/* Stats overlay en esquina inferior - siempre visible */}
            <div className="absolute bottom-2 right-2 flex items-center gap-1 bg-background/80 backdrop-blur-sm rounded-full px-2 py-1">
              <Star className="w-3 h-3 text-primary fill-current" />
              <span className="text-xs font-medium">{rating}</span>
            </div>

            {/* Información en hover - overlay completo */}
            <div className="absolute inset-0 bg-gradient-to-t from-background/95 via-background/80 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col justify-center items-center p-3">
              <div className="text-center space-y-3">
                {/* Nombre en hover también */}
                <h3 className="font-bold text-xl text-foreground uppercase tracking-wide">{name}</h3>
                
                {/* Descripción */}
                <p className="text-sm text-muted-foreground line-clamp-2">{description}</p>
                
                {/* Tags */}
                <div className="flex flex-wrap gap-1 justify-center">
                  {tags.slice(0, 3).map((tag) => (
                    <Badge 
                      key={tag} 
                      variant={isExtraPremium ? "extra-premium" : isPremium ? "premium" : "secondary"} 
                      className="text-xs px-2 py-1"
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>

                
                {/* Botones de acción */}
                <div className="flex flex-col gap-2 w-full items-center">
                  {/* Botón de pago para Extra Premium */}
                  {isExtraPremium && price && (
                    <Button 
                      className="w-full max-w-32 bg-yellow-500 hover:bg-yellow-400 text-black font-bold shadow-[0_0_20px_rgba(234,179,8,0.5)] transition-all duration-300"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        // Aquí iría la lógica de pago
                        console.log('Redirigiendo a pago para carta:', id, 'Precio:', price);
                      }}
                    >
                      <Crown className="w-4 h-4 mr-2" />
                      ${price}
                    </Button>
                  )}
                  
                  {/* Botón principal */}
                  <Button 
                    className={`w-full max-w-32 transition-all duration-300 ${
                      isExtraPremium
                        ? 'bg-extra-premium hover:bg-extra-premium/90 shadow-[0_0_20px_hsl(var(--extra-premium)/0.5)]'
                        : isPremium 
                          ? 'bg-premium hover:bg-premium/90 shadow-glow-secondary' 
                          : 'bg-primary hover:bg-primary/90 shadow-glow-primary'
                    }`}
                    disabled={isLocked}
                    size="sm"
                  >
                    {isLocked ? (
                      <>
                        <Crown className="w-4 h-4 mr-2" />
                        <span className="hidden sm:inline">{isExtraPremium ? 'Extra' : 'Premium'}</span>
                        <span className="sm:hidden">{isExtraPremium ? 'Extra' : 'Premium'}</span>
                      </>
                    ) : (
                      <>
                        <Heart className="w-4 h-4 mr-2" />
                        <span className="hidden sm:inline">Chat</span>
                        <span className="sm:hidden">Chat</span>
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Nombre y precio debajo de la carta */}
      <div className="text-center space-y-1">
        <h3 className="font-bold text-sm text-foreground uppercase tracking-wide">
          {name}
        </h3>
        {isExtraPremium && price && (
          <div className="flex items-center justify-center gap-1">
            {isEditingPrice ? (
              <div className="flex items-center gap-1">
                <span className="text-xs text-muted-foreground">$</span>
                <Input
                  type="number"
                  step="0.01"
                  value={tempPrice}
                  onChange={(e) => setTempPrice(e.target.value)}
                  className="w-16 h-6 text-xs text-center"
                />
                <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={handlePriceSave}>
                  <Check className="w-3 h-3 text-green-600" />
                </Button>
                <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={handlePriceCancel}>
                  <X className="w-3 h-3 text-red-600" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-1 group cursor-pointer" onClick={handlePriceEdit}>
                <span className="text-xs text-muted-foreground font-medium">${price}</span>
                <Edit className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}