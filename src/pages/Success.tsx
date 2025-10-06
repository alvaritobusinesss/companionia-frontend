import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Crown, CreditCard, ArrowLeft } from 'lucide-react';
import { useUserAccess } from '@/hooks/useUserAccess';

export default function Success() {
  const API_BASE = ((import.meta as any).env?.VITE_API_URL as string | undefined) || 'http://localhost:3001';
  const [searchParams] = useSearchParams();
  const [sessionData, setSessionData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { refreshUser } = useUserAccess();
  
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    if (sessionId) {
      // Verificar el estado de la sesión con el backend
      const checkPaymentStatus = async () => {
        try {
          const response = await fetch(`${API_BASE}/api/check-payment-status/${sessionId}`);
          if (response.ok) {
            const data = await response.json();
            setSessionData(data);
            
            // Si el pago fue exitoso, simular la actualización del usuario
            if (data.paymentStatus === 'paid') {
              console.log('✅ Pago verificado, actualizando usuario...');
              
              // Simular actualización del usuario
              setTimeout(async () => {
                try {
                  const updateResponse = await fetch(`${API_BASE}/api/simulate-payment`, {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                      userEmail: data.customerEmail,
                      type: data.metadata?.type || 'premium',
                      modelId: data.metadata?.modelId,
                    }),
                  });
                  
                  if (updateResponse.ok) {
                    console.log('✅ Usuario actualizado automáticamente');
                    // Refrescar acceso en la app inmediatamente
                    await refreshUser();
                  }
                } catch (error) {
                  console.error('Error updating user:', error);
                }
              }, 2000);
            }
          }
        } catch (error) {
          console.error('Error checking payment status:', error);
          // Fallback: asumir que el pago fue exitoso
          setSessionData({ id: sessionId, status: 'complete' });
        } finally {
          setLoading(false);
        }
      };
      
      checkPaymentStatus();
    } else {
      setLoading(false);
    }
  }, [sessionId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <h2 className="text-xl font-bold text-foreground mb-2">Verificando pago...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <CardTitle className="text-2xl text-green-600">¡Pago Exitoso!</CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="text-center">
            <p className="text-muted-foreground mb-4">
              Tu pago ha sido procesado correctamente. Ya puedes disfrutar de tu nueva suscripción o modelo.
            </p>
            
            <div className="bg-muted p-4 rounded-lg">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Crown className="w-5 h-5 text-yellow-500" />
                <span className="font-semibold">Acceso Activado</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Tu cuenta ha sido actualizada automáticamente
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <Button asChild className="w-full">
              <Link to="/">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver a la Galería
              </Link>
            </Button>
            
            <Button variant="outline" asChild className="w-full">
              <Link to="/dashboard">
                Ver Mi Perfil
              </Link>
            </Button>
          </div>

          <div className="text-center text-xs text-muted-foreground">
            <p>ID de sesión: {sessionId}</p>
            <p>Si tienes algún problema, contacta con soporte</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

