import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { XCircle, ArrowLeft, RefreshCw } from 'lucide-react';

export default function Cancel() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <XCircle className="w-8 h-8 text-red-600" />
          </div>
          <CardTitle className="text-2xl text-red-600">Pago Cancelado</CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="text-center">
            <p className="text-muted-foreground mb-4">
              Tu pago ha sido cancelado. No se ha realizado ningún cargo.
            </p>
            
            <div className="bg-muted p-4 rounded-lg">
              <div className="flex items-center justify-center gap-2 mb-2">
                <RefreshCw className="w-5 h-5 text-blue-500" />
                <span className="font-semibold">¿Cambiaste de opinión?</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Puedes intentar el pago nuevamente cuando quieras
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
              <Link to="/">
                Explorar Modelos
              </Link>
            </Button>
          </div>

          <div className="text-center text-xs text-muted-foreground">
            <p>Si tienes algún problema con el pago, contacta con soporte</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}








