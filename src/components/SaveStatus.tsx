import { useState, useEffect } from 'react';
import { CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface SaveStatusProps {
  isSaving: boolean;
  lastSaved?: Date;
  
  error?: string;
}

export const SaveStatus = ({ isSaving, lastSaved, error }: SaveStatusProps) => {
  const [showStatus, setShowStatus] = useState(false);

  useEffect(() => {
    if (isSaving || error) {
      setShowStatus(true);
    } else if (lastSaved) {
      setShowStatus(true);
      const timer = setTimeout(() => setShowStatus(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [isSaving, lastSaved, error]);

  if (!showStatus) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {isSaving && (
        <Badge variant="secondary" className="flex items-center gap-2 bg-blue-500 text-white">
          <Clock className="w-4 h-4 animate-spin" />
          Guardando...
        </Badge>
      )}
      
      {!isSaving && lastSaved && !error && (
        <Badge variant="secondary" className="flex items-center gap-2 bg-green-500 text-white">
          <CheckCircle className="w-4 h-4" />
          Guardado automáticamente
        </Badge>
      )}
      
      {error && (
        <Badge variant="destructive" className="flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          Error al guardar
        </Badge>
      )}
    </div>
  );
};