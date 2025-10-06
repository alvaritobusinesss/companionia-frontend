import { useState, useEffect } from 'react';
import { getLocalUser } from '@/lib/auth-local';

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

    const local = getLocalUser();
    if (local && isMounted) {
      setUser({
        id: local.id,
        email: local.email,
        is_premium: Boolean(local.is_premium),
        purchased_models: Array.isArray(local.purchased_models) ? local.purchased_models : [],
        daily_message_count: local.daily_message_count,
      });
    } else {
      setUser(null);
    }
    if (isMounted) setLoading(false);

    return () => {
      isMounted = false;
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
    const local = getLocalUser();
    if (local) {
      const normalized: User = {
        id: local.id,
        email: local.email,
        is_premium: Boolean(local.is_premium),
        purchased_models: Array.isArray(local.purchased_models) ? local.purchased_models : [],
        daily_message_count: local.daily_message_count,
      };
      setUser(normalized);
    } else {
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
