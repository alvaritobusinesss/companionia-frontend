import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
});

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function handleStripeWebhook(event: Stripe.Event) {
  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
        break;
      
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;
      
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;
      
      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;
      
      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
        break;
      
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
  } catch (error) {
    console.error('Error handling webhook:', error);
    throw error;
  }
}

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  const { type, userEmail, modelId } = session.metadata || {};
  
  if (!userEmail) {
    console.error('No user email in session metadata');
    return;
  }

  // Buscar usuario por email
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('*')
    .eq('email', userEmail)
    .single();

  if (userError || !user) {
    console.error('User not found:', userError);
    return;
  }

  if (type === 'premium') {
    // Actualizar usuario a premium
    const { error: updateError } = await supabase
      .from('users')
      .update({
        is_premium: true,
        premium_expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 días
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id);

    if (updateError) {
      console.error('Error updating user to premium:', updateError);
    } else {
      console.log(`User ${userEmail} upgraded to premium`);
    }
  } else if (type === 'one_time' && modelId) {
    // Agregar modelo comprado al usuario
    const { error: insertError } = await supabase
      .from('user_purchased_models')
      .insert({
        user_id: user.id,
        model_id: modelId,
        purchased_at: new Date().toISOString()
      });

    if (insertError) {
      console.error('Error adding purchased model:', insertError);
    } else {
      console.log(`User ${userEmail} purchased model ${modelId}`);
    }
  }
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  // Buscar usuario por customer ID
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('*')
    .eq('stripe_customer_id', subscription.customer)
    .single();

  if (userError || !user) {
    console.error('User not found for subscription update:', userError);
    return;
  }

  const isActive = subscription.status === 'active';
  const expiresAt = isActive 
    ? new Date(subscription.current_period_end * 1000).toISOString()
    : null;

  const { error: updateError } = await supabase
    .from('users')
    .update({
      is_premium: isActive,
      premium_expires_at: expiresAt,
      updated_at: new Date().toISOString()
    })
    .eq('id', user.id);

  if (updateError) {
    console.error('Error updating subscription:', updateError);
  } else {
    console.log(`Subscription updated for user ${user.email}: ${subscription.status}`);
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  // Buscar usuario por customer ID
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('*')
    .eq('stripe_customer_id', subscription.customer)
    .single();

  if (userError || !user) {
    console.error('User not found for subscription deletion:', userError);
    return;
  }

  const { error: updateError } = await supabase
    .from('users')
    .update({
      is_premium: false,
      premium_expires_at: null,
      updated_at: new Date().toISOString()
    })
    .eq('id', user.id);

  if (updateError) {
    console.error('Error removing premium status:', updateError);
  } else {
    console.log(`Premium status removed for user ${user.email}`);
  }
}

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  if (invoice.subscription) {
    // La suscripción se renovó exitosamente
    console.log(`Invoice payment succeeded for subscription ${invoice.subscription}`);
  }
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  if (invoice.subscription) {
    // El pago de la suscripción falló
    console.log(`Invoice payment failed for subscription ${invoice.subscription}`);
    // Aquí podrías implementar lógica para notificar al usuario o suspender el servicio
  }
}