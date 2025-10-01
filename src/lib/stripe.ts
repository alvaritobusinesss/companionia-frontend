import { loadStripe } from '@stripe/stripe-js';

// Clave pública de Stripe (segura para el frontend)
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY!);

export default stripePromise;








