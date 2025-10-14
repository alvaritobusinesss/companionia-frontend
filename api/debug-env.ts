export default async function handler(_req: any, res: any) {
  const keys = Object.keys(process.env).filter(k => k.toUpperCase().includes('STRIPE'));
  res.status(200).json({
    stripeKeysPresent: keys,
    STRIPE_SECRET_KEY_present: Boolean(process.env.STRIPE_SECRET_KEY),
    STRIPE_PREMIUM_PRICE_present: Boolean(process.env.STRIPE_PREMIUM_PRICE),
    SUPABASE_URL_present: Boolean(process.env.SUPABASE_URL),
    SUPABASE_SERVICE_ROLE_KEY_present: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
    VITE_SUPABASE_URL_present: Boolean((process as any).env?.VITE_SUPABASE_URL),
    VITE_SUPABASE_ANON_KEY_present: Boolean((process as any).env?.VITE_SUPABASE_ANON_KEY),
    APP_URL: process.env.NEXT_PUBLIC_APP_URL || process.env.VITE_APP_URL || null,
    NODE_ENV: process.env.NODE_ENV || null,
  });
}
