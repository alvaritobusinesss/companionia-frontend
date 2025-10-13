export default async function handler(_req: any, res: any) {
  const keys = Object.keys(process.env).filter(k => k.toUpperCase().includes('STRIPE'));
  res.status(200).json({
    stripeKeysPresent: keys,
    STRIPE_SECRET_KEY_present: Boolean(process.env.STRIPE_SECRET_KEY),
    STRIPE_PREMIUM_PRICE_present: Boolean(process.env.STRIPE_PREMIUM_PRICE),
  });
}
