import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { supabase } from '@/lib/supabase';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature')!;

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    // Manejar diferentes tipos de eventos
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
        break;
      
      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;
      
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;
      
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Webhook error' }, { status: 500 });
  }
}

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  const { type, modelId, userEmail } = session.metadata || {};

  if (!userEmail) {
    console.error('No user email in session metadata');
    return;
  }

  try {
    if (type === 'premium') {
      // Actualizar usuario a premium
      const { error } = await supabase
        .from('users')
        .update({ is_premium: true })
        .eq('email', userEmail);

      if (error) {
        console.error('Error updating user to premium:', error);
      } else {
        console.log(`User ${userEmail} upgraded to premium`);
      }
    } else if (type === 'one_time' && modelId) {
      // Añadir modelo comprado al usuario
      const { data: user, error: fetchError } = await supabase
        .from('users')
        .select('purchased_models')
        .eq('email', userEmail)
        .single();

      if (fetchError) {
        console.error('Error fetching user:', fetchError);
        return;
      }

      const currentModels = user.purchased_models || [];
      const updatedModels = [...currentModels, modelId];

      const { error: updateError } = await supabase
        .from('users')
        .update({ purchased_models: updatedModels })
        .eq('email', userEmail);

      if (updateError) {
        console.error('Error updating purchased models:', updateError);
      } else {
        console.log(`Model ${modelId} purchased by ${userEmail}`);
      }
    }
  } catch (error) {
    console.error('Error handling checkout session completed:', error);
  }
}

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  // Manejar renovación de suscripción premium
  if (invoice.subscription) {
    const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string);
    const customerEmail = subscription.metadata?.userEmail;

    if (customerEmail) {
      const { error } = await supabase
        .from('users')
        .update({ is_premium: true })
        .eq('email', customerEmail);

      if (error) {
        console.error('Error renewing premium subscription:', error);
      } else {
        console.log(`Premium subscription renewed for ${customerEmail}`);
      }
    }
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  // Manejar cancelación de suscripción
  const customerEmail = subscription.metadata?.userEmail;

  if (customerEmail) {
    const { error } = await supabase
      .from('users')
      .update({ is_premium: false })
      .eq('email', customerEmail);

    if (error) {
      console.error('Error canceling premium subscription:', error);
    } else {
      console.log(`Premium subscription canceled for ${customerEmail}`);
    }
  }
}
