import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Mail, Lock, User } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { ensureUserRow } from '@/lib/auth';
import { useTranslation } from '@/hooks/useTranslation';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (userEmail?: string) => void;
}

export function AuthModal({ isOpen, onClose, onSuccess }: AuthModalProps) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');

  // Form states
  const [loginData, setLoginData] = useState({
    email: '',
    password: ''
  });
  const [registerData, setRegisterData] = useState({
    email: '',
    password: '',
    confirmPassword: ''
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      console.log('🔐 Iniciando login para:', loginData.email);

      // Verificar que Supabase esté configurado
      if (!supabase) {
        setError('Error de configuración: Supabase no está disponible');
        return;
      }

      // 1) Iniciar sesión
      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginData.email,
        password: loginData.password,
      });
      if (error) {
        console.error('❌ Error en login:', error);
        setError(error.message || t('auth.unexpectedError'));
        return;
      }

      // 2) Esperar hasta que la sesión esté disponible localmente (máx 3s)
      const t0 = Date.now();
      while (Date.now() - t0 < 3000) {
        const { data: s } = await supabase.auth.getSession();
        if (s.session) {
          console.log('✅ Sesión detectada para:', s.session.user.email);
          // ensure user row en background (no bloquear UI)
          ensureUserRow(supabase as any, s.session.user.email).catch(() => {});
          setSuccess(t('auth.loginSuccess'));
          onSuccess(s.session.user.email);
          onClose();
          return;
        }
        await new Promise((r) => setTimeout(r, 150));
      }

      // Si no se detecta la sesión en 3s
      console.error('⏰ timeout: sesión no detectada');
      setError('La solicitud de inicio de sesión está tardando demasiado. Inténtalo de nuevo.');
    } catch (err) {
      console.error('❌ Error inesperado en login:', err);
      setError('Error inesperado. Por favor, recarga la página e inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Validaciones
    if (registerData.password !== registerData.confirmPassword) {
      setError(t('auth.passwordsDontMatch'));
      setLoading(false);
      return;
    }

    if (registerData.password.length < 6) {
      setError(t('auth.passwordTooShort'));
      setLoading(false);
      return;
    }

    try {
      const watchdog = setTimeout(() => {
        setError('El registro está tardando demasiado. Inténtalo de nuevo.');
        setLoading(false);
      }, 8000);

      const email = registerData.email;
      const password = registerData.password;

      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) {
        clearTimeout(watchdog);
        setError(error.message || t('auth.unexpectedError'));
        return;
      }

      // Intentar sesión inmediata por si no llega automáticamente
      try {
        const signInRes = await supabase.auth.signInWithPassword({ email, password });
        if (signInRes?.data?.user?.email) {
          clearTimeout(watchdog);
          ensureUserRow(supabase as any, signInRes.data.user.email).catch(() => {});
          setSuccess(t('auth.registerSuccess'));
          onSuccess(signInRes.data.user.email);
          onClose();
          setSuccess(null);
          setRegisterData({ email: '', password: '', confirmPassword: '' });
          return;
        }
      } catch {}

      // Fallback: si signUp devolvió user, proceder igualmente y dejar que onAuthStateChange nos autentique
      clearTimeout(watchdog);
      const newEmail = data?.user?.email || email;
      ensureUserRow(supabase as any, newEmail).catch(() => {});
      setSuccess(t('auth.registerSuccess'));
      onSuccess(newEmail);
      onClose();
      setSuccess(null);
      setRegisterData({ email: '', password: '', confirmPassword: '' });
    } catch (err) {
      console.error('❌ Error inesperado en Magic Link:', err);
      setError(t('auth.unexpectedError'));
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setError(null);
    setSuccess(null);
    setLoginData({ email: '', password: '' });
    setRegisterData({ email: '', password: '', confirmPassword: '' });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl font-bold">
            {t('auth.welcome')}
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'login' | 'register')} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">{t('auth.login')}</TabsTrigger>
            <TabsTrigger value="register">{t('auth.register')}</TabsTrigger>
          </TabsList>

          {/* Login Tab */}
          <TabsContent value="login" className="space-y-4">
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="login-email">{t('auth.email')}</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    id="login-email"
                    type="email"
                    placeholder={t('auth.emailPlaceholder')}
                    value={loginData.email}
                    onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="login-password">{t('auth.password')}</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    id="login-password"
                    type="password"
                    placeholder={t('auth.passwordPlaceholder')}
                    value={loginData.password}
                    onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {success && (
                <Alert>
                  <AlertDescription>{success}</AlertDescription>
                </Alert>
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {t('auth.loggingIn')}
                  </>
                ) : (
                  t('auth.login')
                )}
              </Button>
            </form>
          </TabsContent>

          {/* Register Tab */}
          <TabsContent value="register" className="space-y-4">
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="register-email">{t('auth.email')}</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    id="register-email"
                    type="email"
                    placeholder={t('auth.emailPlaceholder')}
                    value={registerData.email}
                    onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="register-password">{t('auth.password')}</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    id="register-password"
                    type="password"
                    placeholder={t('auth.passwordPlaceholder')}
                    value={registerData.password}
                    onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="register-confirm">{t('auth.confirmPassword')}</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    id="register-confirm"
                    type="password"
                    placeholder={t('auth.passwordPlaceholder')}
                    value={registerData.confirmPassword}
                    onChange={(e) => setRegisterData({ ...registerData, confirmPassword: e.target.value })}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {success && (
                <Alert>
                  <AlertDescription>{success}</AlertDescription>
                </Alert>
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {t('auth.registering')}
                  </>
                ) : (
                  t('auth.createAccount')
                )}
              </Button>
            </form>
          </TabsContent>
        </Tabs>

        <div className="text-center text-sm text-muted-foreground">
          {t('auth.termsAcceptance')}
        </div>
      </DialogContent>
    </Dialog>
  );
}
