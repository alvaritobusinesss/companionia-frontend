import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { User, Crown, LogOut, Settings } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useTranslation } from '@/hooks/useTranslation';

interface UserMenuProps {
  user: {
    id: string;
    email: string;
    is_premium: boolean;
  };
  onSignOut?: () => void;
}

export function UserMenu({ user, onSignOut }: UserMenuProps) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  const handleSignOut = async () => {
    try {
      console.log('🚪 Cerrando sesión...');
      await supabase.auth.signOut({ scope: 'global' as any });
      // Verificación rápida: si aún hay sesión, forzar limpieza local
      try {
        const { data } = await supabase.auth.getSession();
        if (data?.session) {
          console.warn('⚠️ Sesión persistente tras signOut, limpiando almacenamiento local');
          localStorage.removeItem('sb-"session"');
        }
      } catch {}
      
      // Callback opcional para notificar al componente padre
      if (onSignOut) {
        onSignOut();
      }
      
      // Redirigir a inicio (la ruta /auth no existe en producción)
      window.location.replace('/');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  const handleProfile = () => {
    // Placeholder para funcionalidad de perfil
    console.log('Perfil del usuario');
    alert('Funcionalidad de perfil en desarrollo');
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          className="flex items-center gap-2 p-2 h-auto hover:bg-muted/50"
        >
          <Avatar className="w-8 h-8">
            <AvatarImage src="" alt={user.email} />
            <AvatarFallback className="bg-primary text-primary-foreground text-sm">
              {user.email.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          
          <div className="hidden sm:flex flex-col items-start">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-foreground">
                {user.email}
              </span>
              <Badge 
                variant={user.is_premium ? "default" : "secondary"}
                className={`text-xs ${
                  user.is_premium 
                    ? 'bg-violet-600 text-white hover:bg-violet-700' 
                    : 'bg-gray-500 text-white'
                }`}
              >
                {user.is_premium ? (
                  <>
                    <Crown className="w-3 h-3 mr-1" />
                    Premium
                  </>
                ) : (
                  'Gratis'
                )}
              </Badge>
            </div>
          </div>
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent 
        align="end" 
        className="w-64 p-2"
        sideOffset={8}
      >
        {/* Header con info del usuario */}
        <div className="px-3 py-2 border-b border-border">
          <div className="flex items-center gap-3">
            <Avatar className="w-10 h-10">
              <AvatarImage src="" alt={user.email} />
              <AvatarFallback className="bg-primary text-primary-foreground">
                {user.email.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {user.email}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <Badge 
                  variant={user.is_premium ? "default" : "secondary"}
                  className={`text-xs ${
                    user.is_premium 
                      ? 'bg-violet-600 text-white' 
                      : 'bg-gray-500 text-white'
                  }`}
                >
                  {user.is_premium ? (
                    <>
                      <Crown className="w-3 h-3 mr-1" />
                      Premium
                    </>
                  ) : (
                    'Gratis'
                  )}
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Opciones del menú */}
        <div className="py-1">
          <DropdownMenuItem 
            onClick={handleProfile}
            className="flex items-center gap-2 cursor-pointer"
          >
            <Settings className="w-4 h-4" />
            <span>Perfil</span>
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem 
            onClick={handleSignOut}
            className="flex items-center gap-2 cursor-pointer text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <LogOut className="w-4 h-4" />
            <span>Cerrar sesión</span>
          </DropdownMenuItem>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}



