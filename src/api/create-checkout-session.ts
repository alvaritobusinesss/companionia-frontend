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
      // Compra única de modelo
      if (!modelId) {
        throw new Error('Model ID is required for one-time purchases');
      }

      // Obtener información del modelo desde la base de datos
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(
        process.env.SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );

      const { data: model, error } = await supabase
        .from('models')
        .select('*')
        .eq('id', modelId)
        .single();

      if (error || !model) {
        throw new Error('Model not found');
      }

      sessionConfig = {
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'eur',
              product_data: {
                name: `${model.name} - AI Companion`,
                description: model.description,
                images: [model.image_url],
              },
              unit_amount: Math.round((model.price || 0) * 100), // Convertir a centavos
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:8080'}/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:8080'}/cancel`,
        metadata: {
          type: 'one_time',
          modelId: modelId,
        },
      };
    }

    const session = await stripe.checkout.sessions.create(sessionConfig);
    return { sessionId: session.id };
  } catch (error) {
    console.error('Error creating checkout session:', error);
    throw error;
  }
}