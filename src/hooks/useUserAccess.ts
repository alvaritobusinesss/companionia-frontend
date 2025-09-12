import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export interface User {
  id: string;
  email: string;
  is_premium: boolean;
  purchased_models: string[];
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
    async function getUser() {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        
        if (authUser) {
          const { data: userData, error } = await supabase
            .from('users')
            .select('*')
            .eq('email', authUser.email)
            .single();

          if (error && error.code === 'PGRST116') {
            // Usuario no existe, crearlo
            const { data: newUser, error: createError } = await supabase
              .from('users')
              .insert({
                email: authUser.email,
                is_premium: false,
                purchased_models: []
              })
              .select()
              .single();

            if (createError) {
              console.error('Error creating user:', createError);
            } else {
              setUser(newUser);
            }
          } else if (error) {
            console.error('Error fetching user:', error);
          } else {
            setUser(userData);
          }
        }
      } catch (error) {
        console.error('Error in useUserAccess:', error);
      } finally {
        setLoading(false);
      }
    }

    getUser();
  }, []);

  const checkModelAccess = (model: Model): UserAccess => {
    switch (model.type) {
      case 'free':
        return { hasAccess: true, reason: 'free' };
      
      case 'premium':
        if (!user) {
          return { hasAccess: false, reason: 'premium_required' };
        }
        return { 
          hasAccess: user.is_premium, 
          reason: user.is_premium ? 'free' : 'premium_required' 
        };
      
      case 'one_time':
        if (!user) {
          return { hasAccess: false, reason: 'purchase_required', price: model.price };
        }
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
      const { data: { user: authUser } } = await supabase.auth.getUser();
      
      if (authUser) {
        const { data: userData, error } = await supabase
          .from('users')
          .select('*')
          .eq('email', authUser.email)
          .single();

        if (!error && userData) {
          setUser(userData);
        }
      }
    } catch (error) {
      console.error('Error refreshing user:', error);
    }
  };

  return {
    user,
    loading,
    checkModelAccess,
    refreshUser
  };
}
