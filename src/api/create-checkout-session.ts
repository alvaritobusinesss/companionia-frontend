import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function createCheckoutSession(
  type: 'premium' | 'one_time',
  modelId?: string,
  userEmail?: string
) {
  try {
    let sessionConfig: Stripe.Checkout.SessionCreateParams;

    if (type === 'premium') {
      // Suscripción premium mensual
      sessionConfig = {
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'eur',
              product_data: {
                name: 'Suscripción Premium AI Companions',
                description: 'Acceso completo a todos los modelos premium',
                images: ['https://companion-ia-2.vercel.app/favicon.ico'],
              },
              unit_amount: 1999, // €19.99 en centavos
              recurring: {
                interval: 'month',
              },
            },
            quantity: 1,
          },
        ],
        mode: 'subscription',
        success_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:8080'}/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:8080'}/cancel`,
        metadata: {
          type: 'premium',
        },
      };
    } else {
      // Compra única genérica sin base de datos
      const defaultEuro = Number(process.env.ONE_TIME_DEFAULT_EUR || 79);
      sessionConfig = {
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'eur',
              product_data: {
                name: 'AI Companion (compra única)',
                description: 'Acceso ilimitado al modelo seleccionado en este dispositivo.',
                images: ['https://companion-ia-2.vercel.app/favicon.ico'],
              },
              unit_amount: Math.round(defaultEuro * 100),
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:8080'}/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:8080'}/cancel`,
        metadata: {
          modelId: modelId,
        },
      };
    }

    const session = await stripe.checkout.sessions.create(sessionConfig);
    return { sessionId: session.id, url: session.url };
  } catch (error) {
    console.error('Error creating checkout session:', error);
    throw error;
  }
}