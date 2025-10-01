import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    let { type, modelId, userEmail, modelPrice, amount, priceId } = req.body || {};

    const successBase = process.env.NEXT_PUBLIC_APP_URL || process.env.VITE_APP_URL || 'http://localhost:8080';

    let sessionConfig: Stripe.Checkout.SessionCreateParams = {
      payment_method_types: ['card'],
      mode: type === 'premium' ? 'subscription' : 'payment',
      success_url: `${successBase}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${successBase}/cancel`,
      customer_email: userEmail,
      metadata: {
        type: type,
        modelId: modelId || '',
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
      const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
      const { data: model, error } = await supabase
        .from('models')
        .select('*')
        .eq('id', modelId)
        .single();
      if (error || !model) return res.status(404).json({ error: 'Model not found' });

      sessionConfig.line_items = [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: `${model.name} - AI Companion`,
              description: model.description,
              images: model.image_url ? [model.image_url] : undefined,
            },
            unit_amount: Math.round((model.price || 0) * 100),
          },
          quantity: 1,
        },
      ];
      sessionConfig.mode = 'payment';
    }

    const session = await stripe.checkout.sessions.create(sessionConfig);
    return res.json({ sessionId: session.id, url: session.url });
  } catch (error: any) {
    return res.status(500).json({ error: error?.message || 'Stripe session error' });
  }
}
