export default async function handler(_req: any, res: any) {
  try {
    const stripeEnvKeys = Object.keys(process.env).filter(k => k.toUpperCase().includes('STRIPE'));
    const secret = process.env.STRIPE_SECRET_KEY || '';
    const keysOfInterest = [
      'STRIPE_SECRET_KEY',
      'STRIPE_WEBHOOK_SECRET',
      'STRIPE_PREMIUM_PRICE',
      'VITE_STRIPE_PUBLISHABLE_KEY',
    ];
    const detectedStripeEnvKeys = keysOfInterest.filter(k => Boolean(process.env[k]));

    const info = {
      ok: true,
      time: new Date().toISOString(),
      node: process.versions?.node || null,
      runtime: 'nodejs',
      appUrlEnv: process.env.NEXT_PUBLIC_APP_URL || process.env.VITE_APP_URL || null,

      // High-level
      stripeKeysDetected: stripeEnvKeys, // names only, no values
      detectedStripeEnvKeys, // specifically requested list

      // Per-key presence for quick verification
      STRIPE_SECRET_KEY_present: Boolean(secret),
      STRIPE_WEBHOOK_SECRET_present: Boolean(process.env.STRIPE_WEBHOOK_SECRET),
      STRIPE_PREMIUM_PRICE_present: Boolean(process.env.STRIPE_PREMIUM_PRICE),
      VITE_STRIPE_PUBLISHABLE_KEY_present: Boolean(process.env.VITE_STRIPE_PUBLISHABLE_KEY),

      // Extra validation
      hasStripeSecret: Boolean(secret),
      hasStripeSecretSkPrefix: secret.startsWith('sk_'),
      hasWebhookSecret: Boolean(process.env.STRIPE_WEBHOOK_SECRET),
    };
    res.status(200).json(info);
  } catch (e: any) {
    res.status(500).json({ ok: false, error: e?.message || 'health error' });
  }
}

