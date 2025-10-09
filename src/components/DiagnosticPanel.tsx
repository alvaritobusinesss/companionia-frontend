import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthProvider';

interface DiagnosticResult {
  name: string;
  status: 'success' | 'error' | 'warning';
  message: string;
}

export function DiagnosticPanel() {
  const [results, setResults] = useState<DiagnosticResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const { status, user } = useAuth();

  const runDiagnostics = async () => {
    setIsRunning(true);
    const diagnostics: DiagnosticResult[] = [];

    // 1. Verificar variables de entorno
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      if (!supabaseUrl) {
        diagnostics.push({
          name: 'VITE_SUPABASE_URL',
          status: 'error',
          message: 'Variable de entorno no definida'
        });
      } else {
        diagnostics.push({
          name: 'VITE_SUPABASE_URL',
          status: 'success',
          message: `Configurada: ${supabaseUrl.substring(0, 30)}...`
        });
      }

      if (!supabaseKey) {
        diagnostics.push({
          name: 'VITE_SUPABASE_ANON_KEY',
          status: 'error',
          message: 'Variable de entorno no definida'
        });
      } else {
        diagnostics.push({
          name: 'VITE_SUPABASE_ANON_KEY',
          status: 'success',
          message: `Configurada: ${supabaseKey.substring(0, 20)}...`
        });
      }
    } catch (error) {
      diagnostics.push({
        name: 'Variables de entorno',
        status: 'error',
        message: `Error al verificar: ${error}`
      });
    }

    // 2. Verificar conexión con Supabase
    try {
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        diagnostics.push({
          name: 'Conexión Supabase',
          status: 'error',
          message: `Error de conexión: ${error.message}`
        });
      } else {
        diagnostics.push({
          name: 'Conexión Supabase',
          status: 'success',
          message: 'Conexión establecida correctamente'
        });
      }
    } catch (error) {
      diagnostics.push({
        name: 'Conexión Supabase',
        status: 'error',
        message: `Error de red: ${error}`
      });
    }

    // 3. Verificar estado de autenticación
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        diagnostics.push({
          name: 'Estado de autenticación',
          status: 'success',
          message: `Usuario autenticado: ${user.email}`
        });
      } else {
        diagnostics.push({
          name: 'Estado de autenticación',
          status: 'warning',
          message: 'No hay usuario autenticado'
        });
      }
    } catch (error) {
      diagnostics.push({
        name: 'Estado de autenticación',
        status: 'error',
        message: `Error al verificar usuario: ${error}`
      });
    }

    // 4. Verificar configuración del navegador
    try {
      const isLocalStorage = typeof localStorage !== 'undefined';
      const isSessionStorage = typeof sessionStorage !== 'undefined';
      
      diagnostics.push({
        name: 'Almacenamiento del navegador',
        status: isLocalStorage && isSessionStorage ? 'success' : 'warning',
        message: `LocalStorage: ${isLocalStorage}, SessionStorage: ${isSessionStorage}`
      });
    } catch (error) {
      diagnostics.push({
        name: 'Almacenamiento del navegador',
        status: 'error',
        message: `Error: ${error}`
      });
    }

    // 5. Verificar URL actual
    try {
      const currentUrl = window.location.href;
      const isHttps = currentUrl.startsWith('https://');
      
      diagnostics.push({
        name: 'URL y protocolo',
        status: isHttps ? 'success' : 'warning',
        message: `URL: ${currentUrl} (HTTPS: ${isHttps})`
      });
    } catch (error) {
      diagnostics.push({
        name: 'URL y protocolo',
        status: 'error',
        message: `Error: ${error}`
      });
    }

    setResults(diagnostics);
    setIsRunning(false);
  };

  useEffect(() => {
    runDiagnostics();
  }, []);

  const getIcon = (status: DiagnosticResult['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
    }
  };

  const getStatusColor = (status: DiagnosticResult['status']) => {
    switch (status) {
      case 'success':
        return 'border-green-200 bg-green-50';
      case 'error':
        return 'border-red-200 bg-red-50';
      case 'warning':
        return 'border-yellow-200 bg-yellow-50';
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          Panel de Diagnóstico
        </CardTitle>
        <div className="text-sm text-muted-foreground mt-1">
          Estado de autenticación: <span className="font-medium">{status}</span>
          {user?.email ? (
            <span> · Usuario: <span className="font-medium">{user.email}</span></span>
          ) : null}
        </div>
        <Button onClick={runDiagnostics} disabled={isRunning} className="w-fit">
          {isRunning ? 'Ejecutando...' : 'Ejecutar Diagnósticos'}
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {results.map((result, index) => (
          <Alert key={index} className={getStatusColor(result.status)}>
            <div className="flex items-start gap-3">
              {getIcon(result.status)}
              <div className="flex-1">
                <div className="font-medium">{result.name}</div>
                <AlertDescription className="mt-1">
                  {result.message}
                </AlertDescription>
              </div>
            </div>
          </Alert>
        ))}
        
        {results.length === 0 && !isRunning && (
          <Alert>
            <AlertDescription>
              Haz clic en "Ejecutar Diagnósticos" para verificar la configuración.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
