import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { ensureUserRow } from '@/lib/auth';

export interface User {
  id: string;
  email: string;
  is_premium: boolean;
  purchased_models: string[];
  daily_message_count?: number;
}

export interface Model {
  id: string;
  name: string;
  category: string;
  type: 'free' | 'premium' | 'one_time';
  price?: number;
  image_url: string;
  description: string;
  tags: string[];
  rating: number;
  conversations: number;
}

export interface UserAccess {
  hasAccess: boolean;
  reason?: 'free' | 'premium_required' | 'purchase_required';
  price?: number;
}

export function useUserAccess() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function initAuth() {
      try {
        // Sesión actual (token + usuario)
        const { data: sessionData } = await supabase.auth.getSession();
        const authUser = sessionData?.session?.user;
        if (authUser?.email) {
          // Asegura fila en tabla `users`
          await ensureUserRow(supabase as any, authUser.email);
          await refreshUser(authUser.email);
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error('Error in useUserAccess initAuth:', error);
        setUser(null);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    initAuth();

    // Suscripción a cambios de estado de autenticación
    const { data: subscription } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT') {
        setUser(null);
        try { localStorage.removeItem('user'); } catch {}
      }
      if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
        const email = session?.user?.email;
        if (email) {
          await ensureUserRow(supabase as any, email);
          await refreshUser(email);
        }
      }
    });

    return () => {
      isMounted = false;
      try {
        subscription?.subscription?.unsubscribe?.();
      } catch {}
    };
  }, []);

  const checkModelAccess = (model: Model): UserAccess => {
    if (!user) {
      return { hasAccess: false, reason: 'premium_required' };
    }

    switch (model.type) {
      case 'free':
        return { hasAccess: true, reason: 'free' };
      
      case 'premium':
        return { 
          hasAccess: user.is_premium, 
          reason: user.is_premium ? 'free' : 'premium_required' 
        };
      
      case 'one_time':
        const hasPurchased = user.purchased_models.includes(model.id);
        return { 
          hasAccess: hasPurchased, 
          reason: hasPurchased ? 'free' : 'purchase_required',
          price: model.price
        };
      
      default:
        return { hasAccess: false, reason: 'premium_required' };
    }
  };

  const refreshUser = async (userEmail?: string) => {
    try {
      // Si no viene email, obtenerlo desde la sesión autenticada
      if (!userEmail) {
        const { data } = await supabase.auth.getSession();
        const authUser = data?.session?.user;
        if (!authUser?.email) {
          setUser(null);
          return;
        }
        userEmail = authUser.email;
      }

      // Buscar usuario por email en nuestra tabla de negocio
      const { data: userData, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', userEmail)
        .single();

      if (userData && !error) {
        // Cargar modelos comprados
        const { data: purchases, error: purchasesError } = await supabase
          .from('user_purchased_models')
          .select('model_id')
          .eq('user_id', userData.id);

        const purchasedModels: string[] = purchasesError
          ? []
          : (purchases || []).map((p: any) => String(p.model_id));

        const normalizedUser: User = {
          id: userData.id,
          email: userData.email,
          is_premium: Boolean(userData.is_premium),
          purchased_models: purchasedModels,
        };

        setUser(normalizedUser);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('❌ Error refreshing user:', error);
      setUser(null);
    }
  };

  return {
    user,
    loading,
    checkModelAccess,
    refreshUser
  };
}
