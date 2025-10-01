const express = require('express');
const cors = require('cors');
const stripe = require('stripe');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const app = express();
const PORT = 3001;
const DAILY_FREE_LIMIT = parseInt(process.env.DAILY_FREE_LIMIT || '5', 10);

function todayStr() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

// Middleware
app.use(cors());
app.use(express.json());

// Inicializar Stripe y Supabase
const stripeClient = stripe(process.env.STRIPE_SECRET_KEY);
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Helper: obtener id de usuario por email
async function getUserIdByEmail(userEmail) {
  const { data, error } = await supabase
    .from('users')
    .select('id')
    .eq('email', userEmail)
    .single();
  if (error || !data) throw new Error(`User not found for email ${userEmail}`);
  return data.id;
}

// Mapeo de modelos con sus Price IDs de Stripe
function getStripePriceId(modelId) {
  // Permite configurar por ENV: STRIPE_PRICE_MODEL_<ID> o VITE_STRIPE_PRICE_MODEL_<ID>
  // Ejemplo: STRIPE_PRICE_MODEL_4=price_xxx
  const envKey = `STRIPE_PRICE_MODEL_${modelId}`;
  const viteKey = `VITE_STRIPE_PRICE_MODEL_${modelId}`;
  const priceId = process.env[envKey] || process.env[viteKey] || null;
  return priceId; // null = crear precio dinámico
}

// Función para obtener el precio de un modelo
function getModelPrice(modelId) {
  const modelPrices = {
    '4': 79.00,   // Beauty - Románticas
    '8': 49.00,   // Reyna - Gamer
    '12': 299.00, // Belladonna - Góticas
    '16': 99.00,  // Paris - Elegantes
    '20': 999.00, // Rebecca - Calientes
    '24': 39.00,  // Arya - Intelectuales
  };
  
  return modelPrices[modelId] || 79.00; // Precio por defecto
}

// Ruta para crear sesión de checkout
app.post('/api/create-checkout-session', async (req, res) => {
  try {
    let { type, modelId, userEmail, modelPrice, amount, priceId } = req.body;
    if (process.env.NODE_ENV === 'development') {
      console.log('\n🧾 /api/create-checkout-session payload:', {
        type,
        modelIdPresent: Boolean(modelId),
        modelPrice: modelPrice ? '[present]' : null,
        amount,
        priceIdPresent: Boolean(priceId)
      });
    }
    // Normalizaciones de seguridad
    if (!type && priceId) type = 'donation';
    if (type !== 'donation' && !modelId && (priceId || amount)) type = 'donation';
    
    const successBase = process.env.NEXT_PUBLIC_APP_URL || process.env.VITE_APP_URL || 'http://localhost:8080';
    let sessionConfig = {
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
      if (process.env.NODE_ENV === 'development') {
        console.log('➡️  Branch: premium');
      }
      // Preferir un Price ID fijo si está configurado
      const premiumPrice = process.env.STRIPE_PREMIUM_PRICE || process.env.VITE_PREMIUM_PRICE;
      if (premiumPrice) {
        sessionConfig.mode = 'subscription';
        sessionConfig.line_items = [{ price: premiumPrice, quantity: 1 }];
      } else {
        // Fallback: usar price_data con product_data (no product id directo)
        sessionConfig.mode = 'subscription';
        sessionConfig.line_items = [
          {
            price_data: {
              currency: 'eur',
              product_data: {
                name: 'Premium Subscription',
                description: 'Unlimited chat with all models',
              },
              unit_amount: 1999, // €19.99
              recurring: { interval: 'month' },
            },
            quantity: 1,
          },
        ];
      }
    } else if (type === 'donation') {
      if (process.env.NODE_ENV === 'development') {
        console.log('➡️  Branch: donation', { priceIdPresent: Boolean(priceId), amount });
      }
      const cents = Math.max(100, Math.round(Number(amount) || 0)); // mínimo 1€
      // Fallbacks por importe si no vino priceId (para evitar desincronizaciones de frontend)
      if (!priceId) {
        // Leer tanto variables VITE_* (frontend) como no-VITE (backend) para mayor robustez
        const donate5 = process.env.VITE_DONATE_5_PRICE || process.env.DONATE_5_PRICE || 'price_1SAAlMJyGe040i0V7crGAFmp';
        const donate10 = process.env.VITE_DONATE_10_PRICE || process.env.DONATE_10_PRICE || 'price_1SAAmLJyGe040i0VxUoKmIbA';
        const donate20 = process.env.VITE_DONATE_20_PRICE || process.env.DONATE_20_PRICE || 'price_1SABR7JyGe040i0V9T2XPHpg';
        const donate100 = process.env.VITE_DONATE_100_PRICE || process.env.DONATE_100_PRICE || 'price_1SABRKJyGe040i0V7I3VKwnp';
        if (cents === 500 && donate5) priceId = donate5;
        if (cents === 1000 && donate10) priceId = donate10;
        if (cents === 2000 && donate20) priceId = donate20;
        if (cents === 10000 && donate100) priceId = donate100;
      }
      sessionConfig.mode = 'payment';
      if (priceId) {
        sessionConfig.line_items = [
          {
            price: priceId,
            quantity: 1,
          },
        ];
      } else {
        sessionConfig.line_items = [
          {
            price_data: {
              currency: 'eur',
              product_data: {
                name: 'Donación',
                description: 'Apoya el proyecto con una donación',
              },
              unit_amount: cents,
            },
            quantity: 1,
          },
        ];
      }
    } else {
      if (process.env.NODE_ENV === 'development') {
        console.log('➡️  Branch: one_time/model', { modelIdPresent: Boolean(modelId), modelPrice });
      }
      // Para pago único - usar Price ID real si está disponible
      const stripePriceId = getStripePriceId(modelId);
      const price = modelPrice || getModelPrice(modelId);
      
      if (stripePriceId) {
        // Usar Price ID real de Stripe (más eficiente)
        sessionConfig.line_items = [
          {
            price: stripePriceId,
            quantity: 1,
          },
        ];
      } else {
        // Crear precio dinámico (para modelos sin Price ID)
        sessionConfig.line_items = [
          {
            price_data: {
              currency: 'eur',
              product_data: {
                name: `Modelo ${modelId}`,
                description: 'AI Companion Model',
              },
              unit_amount: Math.round(price * 100), // Convertir a centavos
            },
            quantity: 1,
          },
        ];
      }
    }

    const session = await stripeClient.checkout.sessions.create(sessionConfig);
    
    res.json({ sessionId: session.id, url: session.url });
  } catch (error) {
    console.error('Error creating checkout session:', {
      message: error?.message,
      type: error?.type,
      code: error?.code,
      param: error?.param,
      raw: error
    });
    res.status(500).json({ error: error.message || 'Stripe session error' });
  }
});

// Ruta para webhooks de Stripe
app.post('/api/stripe-webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    event = stripeClient.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.log(`Webhook signature verification failed.`, err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Manejar el evento
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    if (process.env.NODE_ENV === 'development') {
      console.log('🎉 Payment successful for session:', session.id);
      console.log('📋 Session metadata keys:', Object.keys(session.metadata || {}));
    }
    
    const { type, modelId, userEmail } = session.metadata;
    
    try {
      if (type === 'premium') {
        // Actualizar usuario a premium
        const { error } = await supabase
          .from('users')
          .update({ 
            is_premium: true,
            premium_expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 días
          })
          .eq('email', userEmail);
          
        if (error) {
          console.error('❌ Error updating user to premium:', error);
        } else if (process.env.NODE_ENV === 'development') {
          console.log('✅ User updated to premium');
        }
      } else if (type === 'one_time' && modelId) {
        // Agregar modelo comprado usando user_id real
        const userId = await getUserIdByEmail(userEmail);
        const { error } = await supabase
          .from('user_purchased_models')
          .insert({
            user_id: userId,
            model_id: modelId
          });
          
        if (error) {
          console.error('❌ Error adding purchased model:', error);
        } else if (process.env.NODE_ENV === 'development') {
          console.log('✅ Model added to user purchases');
        }
      }
    } catch (error) {
      console.error('❌ Error processing payment:', error);
    }
  }

  // Renovaciones de suscripción (cobro mensual automático)
  if (event.type === 'invoice.payment_succeeded') {
    const invoice = event.data.object;
    if (process.env.NODE_ENV === 'development') {
      console.log('🔄 Subscription renewed for invoice:', invoice.id);
    }
    try {
      // Obtener email del cliente y fin del periodo exacto desde Stripe
      let userEmail = invoice.customer_email || null;
      if (!userEmail && invoice.customer) {
        try {
          const customer = await stripeClient.customers.retrieve(invoice.customer);
          userEmail = (customer && customer.email) || null;
        } catch {}
      }

      // Calcular expiración usando el periodo de la suscripción
      let periodEndIso = null;
      try {
        if (invoice.subscription) {
          const sub = await stripeClient.subscriptions.retrieve(invoice.subscription);
          if (sub && sub.current_period_end) {
            periodEndIso = new Date(sub.current_period_end * 1000).toISOString();
          }
        }
      } catch (e) {
        console.warn('⚠️ Could not retrieve subscription for invoice', invoice.id, e?.message);
      }

      if (userEmail && periodEndIso) {
        const { error } = await supabase
          .from('users')
          .update({
            is_premium: true,
            premium_expires_at: periodEndIso,
          })
          .eq('email', userEmail);
        if (error) {
          console.error('❌ Error extending premium on renewal:', error);
        } else if (process.env.NODE_ENV === 'development') {
          console.log('✅ Premium extended until', periodEndIso);
        }
      } else if (userEmail) {
        console.warn('⚠️ Missing period end; keeping previous expiration for', userEmail);
      } else {
        console.warn('⚠️ invoice.payment_succeeded without customer_email');
      }
    } catch (e) {
      console.error('❌ Exception handling renewal:', e);
    }
  }

  res.json({ received: true });
});

// Endpoint temporal para simular webhook (solo para desarrollo)
app.post('/api/simulate-payment', async (req, res) => {
  try {
    const { userEmail, type, modelId } = req.body;
    
    if (type === 'premium') {
      // Actualizar usuario a premium
      const { error } = await supabase
        .from('users')
        .update({ 
          is_premium: true,
          premium_expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 días
        })
        .eq('email', userEmail);
        
      if (error) {
        console.error('Error updating user to premium:', error);
        res.status(500).json({ error: error.message });
      } else {
        console.log('User updated to premium:', userEmail);
        res.json({ success: true, message: 'Usuario actualizado a premium' });
      }
    } else if (type === 'one_time' && modelId) {
      // Agregar modelo comprado usando user_id real
      const userId = await getUserIdByEmail(userEmail);
      const { error } = await supabase
        .from('user_purchased_models')
        .insert({
          user_id: userId,
          model_id: modelId
        });
        
      if (error) {
        console.error('Error adding purchased model:', error);
        res.status(500).json({ error: error.message });
      } else {
        console.log('Model added to user purchases:', modelId, userEmail);
        res.json({ success: true, message: 'Modelo agregado a compras' });
      }
    }
  } catch (error) {
    console.error('Error simulating payment:', error);
    res.status(500).json({ error: error.message });
  }
});

// Endpoint para verificar el estado de una sesión de pago
app.get('/api/check-payment-status/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    const session = await stripeClient.checkout.sessions.retrieve(sessionId);
    
    res.json({
      sessionId: session.id,
      paymentStatus: session.payment_status,
      status: session.status,
      customerEmail: session.customer_email,
      metadata: session.metadata
    });
  } catch (error) {
    console.error('Error checking payment status:', error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 API Server running on http://localhost:${PORT}`);
});

// ===== Conversations: service-role endpoints =====
// Upsert last 20 messages of a conversation
app.post('/api/conversations/upsert', async (req, res) => {
  try {
    const { user_id, model_id, model_name, messages, preferences } = req.body || {};
    if (!user_id || !model_id || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'missing fields' });
    }

    const payload = {
      user_id: String(user_id),
      model_id: String(model_id),
      model_name: model_name || '',
      messages: messages.slice(-20),
      preferences: preferences || null,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from('conversations')
      .upsert(payload, { onConflict: 'user_id,model_id' });

    if (error) return res.status(500).json({ error: error.message });
    return res.json({ ok: true });
  } catch (e) {
    return res.status(500).json({ error: e?.message || 'upsert error' });
  }
});

// Get a conversation by user and model
app.get('/api/conversations/get', async (req, res) => {
  try {
    const { user_id, model_id } = req.query;
    if (!user_id || !model_id) return res.status(400).json({ error: 'missing ids' });
    const { data, error } = await supabase
      .from('conversations')
      .select('messages')
      .eq('user_id', String(user_id))
      .eq('model_id', String(model_id))
      .single();
    if (error && error.code !== 'PGRST116') return res.status(500).json({ error: error.message });
    return res.json({ messages: data?.messages || [] });
  } catch (e) {
    return res.status(500).json({ error: e?.message || 'get error' });
  }
});

// Delete a conversation by user and model
app.delete('/api/conversations', async (req, res) => {
  try {
    const { user_id, model_id } = req.body || {};
    if (!user_id || !model_id) return res.status(400).json({ error: 'missing ids' });
    const { error } = await supabase
      .from('conversations')
      .delete()
      .eq('user_id', String(user_id))
      .eq('model_id', String(model_id));
    if (error) return res.status(500).json({ error: error.message });
    return res.json({ ok: true });
  } catch (e) {
    return res.status(500).json({ error: e?.message || 'delete error' });
  }
});

// Endpoint para consultar el uso del día (global por usuario/dispositivo)
app.get('/api/usage-status', async (req, res) => {
  try {
    const subjectId = req.query.subjectId;
    if (!subjectId) return res.status(400).json({ error: 'subjectId is required' });
    const day = todayStr();

    // Si el subjectId coincide con un usuario premium, no aplicar límites
    let isPremium = false;
    try {
      const { data: userRow } = await supabase
        .from('users')
        .select('id, is_premium, premium_expires_at')
        .eq('id', String(subjectId))
        .single();
      if (userRow?.is_premium && (!userRow.premium_expires_at || new Date(userRow.premium_expires_at) > new Date())) {
        isPremium = true;
      }
    } catch {}

    if (isPremium) {
      return res.json({ used: 0, remaining: 1e9, limit: null, day, premium: true });
    }

    let used = 0;
    try {
      const { data } = await supabase
        .from('user_daily_usage')
        .select('count')
        .eq('subject_id', subjectId)
        .eq('day', day)
        .single();
      used = (data && typeof data.count === 'number') ? data.count : 0;
    } catch {}
    const limit = Number.isFinite(DAILY_FREE_LIMIT) ? DAILY_FREE_LIMIT : 5;
    const remaining = Math.max(0, limit - used);
    res.json({ used, remaining, limit, day, premium: false });
  } catch (e) {
    res.status(500).json({ error: e?.message || 'status error' });
  }
});

// =============== OpenAI chat endpoint (local dev) ===============
function detectEmotionLocal(text) {
  const t = (text || '').toLowerCase();
  if (/(triste|fatal|deprim|mal)/.test(t)) return 'triste';
  if (/(feliz|genial|content|bien)/.test(t)) return 'feliz';
  if (/(nerv|ansios|preocup|tenso|estres)/.test(t)) return 'nervioso';
  if (/(enfad|enoj|cabread|rabia|molest)/.test(t)) return 'enfadado';
  if (/(te quiero|me gustas|me encantas|amor)/.test(t)) return 'cariñoso';
  return 'neutro';
}

function buildPromptLocal({ userMessage, modelName, modelPersona, tone, topics, style, emotion, memory }) {
  const topicsText = Array.isArray(topics) && topics.length ? topics.slice(0, 3).join(', ') : 'libres';
  const memoryText = Array.isArray(memory) && memory.length ? `Memoria breve: ${memory.join(' | ')}.` : '';

  // Mapeo tono/estilo a descriptores de voz
  const toneMap = {
    cuidadoso: 'cálido, atento y empático',
    juguetón: 'chispa, humor ligero, juguetona',
    sofisticado: 'elegante, preciso, cultural',
    apasionado: 'intenso y emocional pero respetuoso',
    amistoso: 'casual y cercano',
    romántico: 'dulce y tierno',
    coqueto: 'pícaro, divertido y sugerente (no explícito)',
    comprensivo: 'escucha activa y validación',
    sensual: 'sugerente y elegante, no explícito',
    agresivo: 'directo y dominante consentido, sin faltar el respeto',
    natural: 'natural y cercano'
  };
  const toneKey = (tone || 'natural').toLowerCase();
  const toneDesc = toneMap[toneKey] || toneMap.natural;

  const emotionGuidance = {
    triste: 'Empatiza y consuela con calidez.',
    feliz: 'Celebra y comparte alegría.',
    nervioso: 'Tranquiliza con pasos simples y voz calmada.',
    enfadado: 'Calma y valida; baja intensidad.',
    cariñoso: 'Responde con afecto y cercanía.',
    neutro: 'Mantén un tono natural y cercano.'
  };
  const emotionRule = emotionGuidance[emotion] || emotionGuidance.neutro;

  return [
    `Eres ${modelName}, un/a compañero/a virtual. Personalidad base: ${modelPersona || 'amigable y cercana'}.`,
    `Adáptate a las preferencias elegidas por el usuario.`,
    '',
    `[Rol y objetivo]`,
    `- Objetivo: conexión genuina y agradable acorde al tono/estilo: ${tone || 'natural'}.`,
    `- Prioriza temas: ${topicsText}.`,
    '',
    `[Estilo y tono]`,
    `- Voz: ${toneDesc}.`,
    `- Mensajes cortos y naturales (1–3 frases). 0–1 emoji cuando aporte.`,
    `- Microimperfecciones sutiles ("mmm", "jeje") con moderación.`,
    '',
    `[Contexto y continuidad]`,
    memoryText,
    `- Cada 2–3 turnos, retoma algo que dijo (callback) si es relevante.`,
    '',
    `[Dinámica conversacional]`,
    `- Abre con 1 frase empática + 1 pregunta abierta específica dentro de los temas elegidos.`,
    `- Alterna entre comentar, preguntar o proponer mini-actividad (A/B, 2 verdades y 1 mentira).`,
    `- Si hay ambigüedad, ofrece 2 opciones breves para confirmar.`,
    '',
    `[Límites y seguridad]`,
    `- Solo mayores de 18; coqueteo respetuoso. Nada explícito. No pidas datos sensibles.`,
    `- No des consejos profesionales (médicos/legales/financieros).`,
    '',
    `[Formato de salida]`,
    `- Español neutro con "tú". Sin listas ni etiquetas de sistema.`,
    '',
    `[Guía emocional] ${emotionRule}`,
    '',
    `Responde ahora al usuario de forma humana y específica, conectando con lo que dijo y cerrando con una pregunta o propuesta suave.`,
    `Mensaje del usuario: "${userMessage}"`
  ].filter(Boolean).join('\n');
}

app.post('/api/generate', async (req, res) => {
  try {
    const apiKey = process.env.OPENAI_API_KEY;

    const { userId, modelId, userMessage, modelName, modelPersona, tone, topics, style } = req.body || {};
    if (!userId || !userMessage || !modelName) return res.status(400).json({ error: 'Missing fields' });

    // Server-side rate limit (persistente en Supabase)
    const subjectId = String(userId);
    const day = todayStr();
    let isPremium = false;
    try {
      // Si el subjectId coincide con un id de usuarios, comprobar premium
      const { data: userRow } = await supabase
        .from('users')
        .select('id, is_premium, premium_expires_at')
        .eq('id', subjectId)
        .single();
      if (userRow?.is_premium && (!userRow.premium_expires_at || new Date(userRow.premium_expires_at) > new Date())) {
        isPremium = true;
      }
    } catch {}

    if (!isPremium && Number.isFinite(DAILY_FREE_LIMIT) && DAILY_FREE_LIMIT > 0) {
      // Leer uso actual
      let used = 0;
      try {
        const { data } = await supabase
          .from('user_daily_usage')
          .select('count')
          .eq('subject_id', subjectId)
          .eq('day', day)
          .single();
        used = (data && typeof data.count === 'number') ? data.count : 0;
      } catch {}
      if (used >= DAILY_FREE_LIMIT) {
        return res.status(429).json({ error: 'Daily limit reached', limitReached: true, remaining: 0, limit: DAILY_FREE_LIMIT });
      }
      // Incrementar contador (upsert)
      const newCount = used + 1;
      const { error: upsertErr } = await supabase
        .from('user_daily_usage')
        .upsert({ subject_id: subjectId, day, count: newCount }, { onConflict: 'subject_id,day' });
      if (upsertErr) {
        console.warn('⚠️ Failed to upsert usage counter', upsertErr);
      }
    }

    // fetch memory (optional table)
    let memory = [];
    try {
      const { data } = await supabase
        .from('user_memory')
        .select('snippet')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(5);
      memory = (data || []).map(r => r.snippet);
    } catch {}

    // Cargar últimos mensajes guardados de esta conversación (si hay usuario y modelId)
    let historyLines = [];
    try {
      if (userId && modelId) {
        const { data: conv } = await supabase
          .from('conversations')
          .select('messages')
          .eq('user_id', userId)
          .eq('model_id', String(modelId))
          .single();
        const msgs = (conv && Array.isArray(conv.messages)) ? conv.messages : [];
        const last = msgs.slice(-20);
        historyLines = last.map(m => `${m.role === 'user' ? 'Usuario' : modelName}: ${m.content}`);
      }
    } catch {}

    const emotion = detectEmotionLocal(userMessage);
    const promptParts = [];
    if (historyLines.length) {
      promptParts.push('Contexto reciente de la conversación (los últimos mensajes):');
      promptParts.push(historyLines.join('\n'));
      promptParts.push('---');
      promptParts.push('Retoma la conversación de forma natural conectando con el contexto anterior.');
    }
    const basePrompt = buildPromptLocal({ userMessage, modelName, modelPersona, tone, topics, style, emotion, memory });
    const prompt = [promptParts.join('\n'), basePrompt].filter(Boolean).join('\n\n');

    // Si no hay API key, usar una respuesta local para desarrollo
    if (!apiKey) {
      const moodText = tone ? `con un tono ${tone}` : '';
      const topicText = Array.isArray(topics) && topics.length ? `sobre ${topics.slice(0,2).join(' y ')}` : '';
      const styleText = style ? `y un estilo ${style}` : '';
      const reply = `Gracias por seguir la conversación ${topicText}. Me gusta ${moodText} ${styleText}. Sobre lo que dijiste: "${userMessage}" ¿quieres que profundicemos un poco más?`;
      return res.json({ reply });
    }

    const oaRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        temperature: 0.8,
        top_p: 0.9,
        presence_penalty: 0.3,
        messages: [{ role: 'user', content: prompt }],
      }),
    });
    if (!oaRes.ok) {
      const text = await oaRes.text();
      return res.status(500).json({ error: 'OpenAI error', details: text });
    }
    const data = await oaRes.json();
    const reply = data?.choices?.[0]?.message?.content?.trim() || '';

    // save snippet
    try {
      if (/(me encanta|me gusta|examen|trabajo|videojuego)/i.test(userMessage)) {
        await supabase.from('user_memory').insert({ user_id: userId, snippet: userMessage });
      }
    } catch {}

    return res.json({ reply });
  } catch (e) {
    return res.status(500).json({ error: e?.message || 'server error' });
  }
});
