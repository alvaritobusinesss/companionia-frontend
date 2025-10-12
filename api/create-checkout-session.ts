import Stripe from 'stripe';

export const config = { runtime: 'nodejs' };

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const stripeSecret =
      process.env.STRIPE_SECRET_KEY ||
      process.env.STRIPE_LIVE_SECRET_KEY ||
      process.env.STRIPE_SECRET ||
      process.env.STRIPE_API_KEY ||
      null;
    if (!stripeSecret) {
      const stripeEnvKeys = Object.keys(process.env).filter(k => k.toUpperCase().includes('STRIPE'));
      console.error('Missing Stripe secret in runtime env. Detected keys (names only):', stripeEnvKeys);
      return res.status(500).json({
        error: 'Stripe key not configured',
        detectedStripeEnvKeys: stripeEnvKeys,
        node: process.versions?.node || null,
        runtime: 'nodejs',
      });
    }
    const stripe = new Stripe(stripeSecret as string);
    let { type, modelId, userEmail, modelPrice, amount, priceId } = req.body || {};
    if (!type) return res.status(400).json({ error: 'type is required' });

    // Determine base URL for redirects
    const headerProto = (req.headers['x-forwarded-proto'] as string) || 'https';
    const headerHost = (req.headers['x-forwarded-host'] as string) || (req.headers.host as string) || '';
    const derivedBase = headerHost ? `${headerProto}://${headerHost}` : '';
    const successBase =
      process.env.NEXT_PUBLIC_APP_URL ||
      process.env.VITE_APP_URL ||
      derivedBase ||
      'http://localhost:8080';

    let sessionConfig: Stripe.Checkout.SessionCreateParams = {
      mode: type === 'premium' ? 'subscription' : 'payment',
      ui_mode: 'hosted',
      success_url: `${successBase}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${successBase}/cancel`,
      payment_method_types: ['card'],
      ...(userEmail ? { customer_email: userEmail as string } : {}),
      metadata: {
        type: type,
        modelId: modelId || '',
        userEmail: userEmail || '',
      },
    };

    if (type === 'premium') {
      const premiumPrice = process.env.STRIPE_PREMIUM_PRICE || process.env.VITE_PREMIUM_PRICE;
      if (premiumPrice) {
        sessionConfig.mode = 'subscription';
        sessionConfig.line_items = [{ price: premiumPrice, quantity: 1 }];
      } else {
        sessionConfig.mode = 'subscription';
        sessionConfig.line_items = [
          {
            price_data: {
              currency: 'eur',
              product_data: {
                name: 'Premium Subscription',
                description: 'Unlimited chat with all models',
              },
              unit_amount: 1999,
              recurring: { interval: 'month' },
            },
            quantity: 1,
          },
        ];
      }
    } else if (type === 'donation') {
      const cents = Math.max(100, Math.round(Number(amount) || 0));
      if (!priceId) {
        const donate5 = process.env.VITE_DONATE_5_PRICE || process.env.DONATE_5_PRICE;
        const donate10 = process.env.VITE_DONATE_10_PRICE || process.env.DONATE_10_PRICE;
        const donate20 = process.env.VITE_DONATE_20_PRICE || process.env.DONATE_20_PRICE;
        const donate100 = process.env.VITE_DONATE_100_PRICE || process.env.DONATE_100_PRICE;
        if (cents === 500 && donate5) priceId = donate5;
        if (cents === 1000 && donate10) priceId = donate10;
        if (cents === 2000 && donate20) priceId = donate20;
        if (cents === 10000 && donate100) priceId = donate100;
      }
      sessionConfig.mode = 'payment';
      if (priceId) {
        sessionConfig.line_items = [
          { price: priceId, quantity: 1 }
        ];
      } else {
        sessionConfig.line_items = [
          {
            price_data: {
              currency: 'eur',
              product_data: { name: 'Donación', description: 'Apoya el proyecto con una donación' },
              unit_amount: cents,
            },
            quantity: 1,
          },
        ];
      }
    } else {
      // one_time
      if (!modelId) return res.status(400).json({ error: 'Model ID is required' });

      // Try to use a configured Stripe Price ID for this model
      const envKey = `STRIPE_PRICE_MODEL_${modelId}`;
      const viteKey = `VITE_STRIPE_PRICE_MODEL_${modelId}`;
      const configuredPriceId = process.env[envKey] || process.env[viteKey] || null;

      // Determine price from request or fallback mapping (kept in sync with api-server.js)
      const fallbackPrices: Record<string, number> = {
        '4': 79.0,
        '8': 49.0,
        '12': 299.0,
        '16': 99.0,
        '20': 999.0,
        '24': 39.0,
      };
      const unitPrice = Number(modelPrice) || fallbackPrices[String(modelId)] || 79.0;

      sessionConfig.mode = 'payment';
      if (configuredPriceId) {
        sessionConfig.line_items = [
          { price: configuredPriceId, quantity: 1 },
        ];
      } else {
        sessionConfig.line_items = [
          {
            price_data: {
              currency: 'eur',
              product_data: {
                name: `Modelo ${modelId} - AI Companion`,
                description: 'Acceso ilimitado a este modelo',
              },
              unit_amount: Math.round(unitPrice * 100),
            },
            quantity: 1,
          },
        ];
      }
    }

    const session = await stripe.checkout.sessions.create(sessionConfig);
    return res.json({ sessionId: session.id, url: session.url });
  } catch (error: any) {
    console.error('create-checkout-session error:', {
      message: error?.message,
      type: error?.type,
      code: error?.code,
    });
    return res.status(500).json({ error: error?.message || 'Stripe session error' });
  }
}
