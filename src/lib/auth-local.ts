// Simple local auth mock to remove Supabase dependency
export type LocalUser = {
  id: string;
  email: string;
  is_premium: boolean;
  purchased_models: string[];
  daily_message_count?: number;
};

const STORAGE_KEY = 'local_user_session';

export function getLocalUser(): LocalUser | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as LocalUser) : null;
  } catch {
    return null;
  }
}

export function setLocalUser(user: LocalUser) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  } catch {}
}

export function clearLocalUser() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {}
}

export async function signInLocal(email: string, password: string) {
  // Password is ignored in mock; keep signature for compatibility
  const existing = getLocalUser();
  const id = existing?.id || Math.random().toString(36).slice(2);
  const user: LocalUser = {
    id,
    email,
    is_premium: existing?.is_premium || false,
    purchased_models: existing?.purchased_models || [],
    daily_message_count: existing?.daily_message_count || 0,
  };
  setLocalUser(user);
  return user;
}

export async function signUpLocal(email: string, password: string) {
  // Same behavior as signIn for mock
  return signInLocal(email, password);
}

export async function signOutLocal() {
  clearLocalUser();
}
