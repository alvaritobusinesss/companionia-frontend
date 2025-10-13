export default async function handler(_req: any, res: any) {
  try {
    const stripeEnvKeys = Object.keys(process.env).filter(k => k.toUpperCase().includes('STRIPE'));
    const secret = process.env.STRIPE_SECRET_KEY || '';
    const info = {
      ok: true,
      time: new Date().toISOString(),
      hasStripeSecret: Boolean(secret),
      hasStripeSecretSkPrefix: secret.startsWith('sk_'),
      hasWebhookSecret: Boolean(process.env.STRIPE_WEBHOOK_SECRET),
      appUrlEnv: process.env.NEXT_PUBLIC_APP_URL || process.env.VITE_APP_URL || null,
      stripeKeysDetected: stripeEnvKeys, // names only, no values
      node: process.versions?.node || null,
      runtime: 'nodejs',
      // Match requested field name for easy verification in production
      STRIPE_SECRET_KEY_present: Boolean(secret),
    };
    res.status(200).json(info);
  } catch (e: any) {
    res.status(500).json({ ok: false, error: e?.message || 'health error' });
  }
}

