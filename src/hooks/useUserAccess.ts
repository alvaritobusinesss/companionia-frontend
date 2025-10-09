import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthProvider';

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
  const { status, user: authUser } = useAuth();

  useEffect(() => {
    let cancelled = false;
    async function sync() {
      // While auth status is hydrating, we are loading
      if (status === 'loading') {
        setLoading(true);
        return;
      }
      // If unauthenticated, clear user and stop loading
      if (status === 'unauthenticated' || !authUser) {
        setUser(null);
        setLoading(false);
        return;
      }
      // Authenticated: fetch business row(s)
      setLoading(true);
      await refreshUser();
      if (!cancelled) setLoading(false);
    }
    sync();
    return () => { cancelled = true; };
  }, [status, authUser?.id]);

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

  const refreshUser = async () => {
    try {
      const sUser = authUser;
      if (!sUser?.id || !sUser?.email) {
        setUser(null);
        return;
      }

      // Leer fila del usuario
      const { data: uRow, error: uErr } = await supabase
        .from('users')
        .select('id, email, is_premium')
        .eq('id', sUser.id)
        .single();

      if (uErr && uErr.code !== 'PGRST116') {
        console.warn('refreshUser select users error', uErr.message);
      }

      // Leer compras
      const { data: purchases, error: pErr } = await supabase
        .from('user_purchased_models')
        .select('model_id')
        .eq('user_id', sUser.id);
      if (pErr) {
        console.warn('refreshUser purchases error', pErr.message);
      }

      const purchased = Array.isArray(purchases) ? purchases.map((r: any) => String(r.model_id)) : [];

      const normalized: User = {
        id: sUser.id,
        email: sUser.email,
        is_premium: Boolean(uRow?.is_premium),
        purchased_models: purchased,
      };
      setUser(normalized);
    } catch (e) {
      console.warn('refreshUser exception', e);
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
