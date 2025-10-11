export default async function handler(_req: any, res: any) {
  try {
    const info = {
      ok: true,
      time: new Date().toISOString(),
      hasStripeSecret: Boolean(process.env.STRIPE_SECRET_KEY),
      hasWebhookSecret: Boolean(process.env.STRIPE_WEBHOOK_SECRET),
      appUrlEnv: process.env.NEXT_PUBLIC_APP_URL || process.env.VITE_APP_URL || null,
    };
    res.status(200).json(info);
  } catch (e: any) {
    res.status(500).json({ ok: false, error: e?.message || 'health error' });
  }
}
