import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Crown, Lock, CreditCard, Star } from 'lucide-react';
import { Model } from '@/hooks/useUserAccess';

interface PurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  model: Model | null;
  type: 'premium' | 'one_time';
  onPurchase: (modelId: string) => void;
}

export function PurchaseModal({ isOpen, onClose, model, type, onPurchase }: PurchaseModalProps) {
  const [loading, setLoading] = useState(false);

  if (!model) return null;

  const handlePurchase = async () => {
    setLoading(true);
    try {
      await onPurchase(model.id);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {type === 'premium' ? (
              <>
                <Crown className="w-5 h-5 text-yellow-500" />
                Hazte Premium
              </>
            ) : (
              <>
                <Lock className="w-5 h-5 text-red-500" />
                Desbloquear Modelo
              </>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Modelo info */}
          <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
            <img 
              src={model.image_url} 
              alt={model.name}
              className="w-16 h-16 rounded-lg object-cover"
            />
            <div className="flex-1">
              <h3 className="font-semibold text-lg">{model.name}</h3>
              <p className="text-sm text-muted-foreground line-clamp-2">
                {model.description}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <div className="flex items-center gap-1">
                  <Star className="w-3 h-3 text-yellow-500 fill-current" />
                  <span className="text-xs">{model.rating}</span>
                </div>
                <Badge variant="secondary" className="text-xs">
                  {model.category}
                </Badge>
              </div>
            </div>
          </div>

          {/* Contenido específico */}
          {type === 'premium' ? (
            <div className="space-y-4">
              <div className="text-center">
                <h4 className="font-semibold text-lg mb-2">Desbloquea todos los modelos Premium</h4>
                <p className="text-muted-foreground text-sm">
                  Accede a modelos exclusivos, chat ilimitado y funciones especiales
                </p>
              </div>
              
              <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-4 rounded-lg text-white">
                <div className="text-center">
                  <div className="text-2xl font-bold">€9.99/mes</div>
                  <div className="text-sm opacity-90">Cancelar cuando quieras</div>
                </div>
              </div>

              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <Crown className="w-4 h-4 text-yellow-500" />
                  Acceso a todos los modelos Premium
                </li>
                <li className="flex items-center gap-2">
                  <Crown className="w-4 h-4 text-yellow-500" />
                  Chat ilimitado
                </li>
                <li className="flex items-center gap-2">
                  <Crown className="w-4 h-4 text-yellow-500" />
                  Funciones especiales
                </li>
              </ul>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-center">
                <h4 className="font-semibold text-lg mb-2">Compra única</h4>
                <p className="text-muted-foreground text-sm">
                  Desbloquea este modelo para siempre
                </p>
              </div>
              
              <div className="bg-gradient-to-r from-green-500 to-blue-500 p-4 rounded-lg text-white">
                <div className="text-center">
                  <div className="text-2xl font-bold">€{model.price}</div>
                  <div className="text-sm opacity-90">Pago único</div>
                </div>
              </div>

              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-green-500" />
                  Acceso permanente al modelo
                </li>
                <li className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-green-500" />
                  Sin suscripción requerida
                </li>
                <li className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-green-500" />
                  Actualizaciones incluidas
                </li>
              </ul>
            </div>
          )}

          {/* Botones */}
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              onClick={onClose}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button 
              onClick={handlePurchase}
              disabled={loading}
              className="flex-1 bg-primary hover:bg-primary/90"
            >
              <CreditCard className="w-4 h-4 mr-2" />
              {loading ? 'Procesando...' : 'Comprar'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
