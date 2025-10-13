import { loadStripe } from '@stripe/stripe-js';

// Clave pública de Stripe (segura para el frontend)
const PUBLISHABLE_KEY = (import.meta as any).env?.VITE_STRIPE_PUBLISHABLE_KEY;

const stripePromise = loadStripe(PUBLISHABLE_KEY!);

export default stripePromise;








