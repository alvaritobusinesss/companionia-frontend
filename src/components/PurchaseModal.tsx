import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Crown, Lock, CreditCard, Star } from 'lucide-react';
import { Model, User } from '@/hooks/useUserAccess';
import { useTranslation } from '@/hooks/useTranslation';

interface PurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  model: Model | null;
  type: 'premium' | 'one_time';
  user: User | null;
  onPurchase: (modelId: string) => void;
}

export function PurchaseModal({ isOpen, onClose, model, type, user, onPurchase }: PurchaseModalProps) {
  const [loading, setLoading] = useState(false);
  // Prefer explicit API base from env (e.g., production host). Fallback to same-origin
  const API_BASE = ((import.meta as any).env?.VITE_API_URL as string | undefined) || '';
  const { t } = useTranslation();
  
  console.log('🔥 PURCHASE MODAL RENDER:', { isOpen, model, type, user });

  if (!model) return null;

  const handlePurchase = async () => {
    try {
      setLoading(true);
      // Requiere usuario logueado con email
      if (!user?.id || !user?.email) {
        setLoading(false);
        alert('Debes iniciar sesión para continuar con el pago.');
        return;
      }
      // Crear sesión de checkout (suscripción para premium, pago único para one_time más adelante)
      const payload: any = {
        email: user.email,
        userEmail: user.email,
        userId: user.id,
        returnUrl: window.location.origin,
        type,
        modelId: type === 'one_time' ? model.id : undefined,
        ...(type === 'one_time'
          ? {
              modelName: model.name,
              currency: 'EUR',
              // model.price viene como string tipo "79.00"; convertir a céntimos
              amount: (() => {
                const p = typeof model.price === 'number' ? model.price : parseFloat(String(model.price || '0'));
                return Math.round((isNaN(p) ? 0 : p) * 100);
              })(),
            }
          : {}),
      };
      const resp = await fetch(`${API_BASE}/api/create-checkout-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!resp.ok) {
        const txt = await resp.text();
        throw new Error(txt || 'No se pudo crear la sesión de pago');
      }
      const { url } = await resp.json();
      if (!url) throw new Error('Respuesta inválida del servidor (sin url)');
      window.location.href = url;
    } catch (e: any) {
      console.error('Error iniciando checkout:', e);
      alert(e?.message || 'No se pudo iniciar el pago');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md z-[99999]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {type === 'premium' ? (
              <>
                <Crown className="w-5 h-5 text-yellow-500" />
                {t('premium.title')}
              </>
            ) : (
              <>
                <Lock className="w-5 h-5 text-red-500" />
                {t('premium.unlockTitle')}
              </>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Modelo info: solo para compra de una sola vez */}
          {type !== 'premium' && (
            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
              <img 
                src={model.image_url} 
                alt={model.name}
                className="w-16 h-16 rounded-lg object-cover blur-sm"
              />
              <div className="flex-1">
                <h3 className="font-semibold text-lg">{model.name}</h3>
                <p className="text-sm text-gray-600 line-clamp-2">
                  {(() => {
                    const key = `models.${model.id}.description`;
                    const localized = t(key);
                    return localized === key ? model.description : localized;
                  })()}
                </p>
                <div className="mt-2">
                  <Badge variant="secondary" className="text-xs">
                    {model.category}
                  </Badge>
                </div>
              </div>
            </div>
          )}

          {/* Contenido específico */}
          {type === 'premium' ? (
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2">{t('premium.advantages')}:</h3>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>• {t('premium.unlimitedMessages')}</li>
                  <li>• {t('premium.accessAllModels')}</li>
                  <li>• {t('premium.intimateConversations')}</li>
                  <li>• {t('premium.noAds')}</li>
                </ul>
              </div>
              
              <div className="text-center">
                <div className="flex items-center justify-center gap-3 mb-1">
                  <span className="text-sm text-gray-500 line-through">{t('premium.originalPrice')}</span>
                  <span className="text-3xl font-extrabold text-red-500 drop-shadow">{t('premium.price')}</span>
                </div>
                <div className="text-xs text-green-600 font-medium mb-1">{t('premium.save')}</div>
                <div className="text-sm text-gray-600">{t('premium.pricePerMonth')}</div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-red-500 drop-shadow">€{model.price}</div>
                <div className="text-sm text-gray-600">{t('model.oneTime')}</div>
              </div>
            </div>
          )}

          {/* Botón de compra */}
          <div className="pt-4 relative">
            <div className="pointer-events-none absolute inset-x-6 -top-1 h-10 rounded-full blur-xl bg-gradient-to-r from-yellow-300/60 via-amber-300/60 to-yellow-300/60"></div>
            <Button
              onClick={handlePurchase}
              disabled={loading}
              className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white font-semibold"
            >
              <CreditCard className="w-4 h-4 mr-2" />
              {loading ? t('common.loading') : t('premium.buy')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}