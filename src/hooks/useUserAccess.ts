import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

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

    async function init() {
      try {
        const { data } = await supabase.auth.getSession();
        const sUser = data?.session?.user;
        if (!sUser?.email) {
          setUser(null);
          return;
        }
        await refreshUser();
      } catch (e) {
        console.warn('useUserAccess init error', e);
        setUser(null);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    init();

    const { data: sub } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT') {
        setUser(null);
      }
      if (event === 'SIGNED_IN' || event === 'USER_UPDATED' || event === 'TOKEN_REFRESHED') {
        await refreshUser();
      }
    });

    return () => {
      isMounted = false;
      try { sub.subscription?.unsubscribe?.(); } catch {}
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

  const refreshUser = async () => {
    try {
      const { data } = await supabase.auth.getSession();
      const sUser = data?.session?.user;
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
