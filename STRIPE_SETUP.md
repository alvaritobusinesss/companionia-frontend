# Configuración de Stripe

## 1. Crear cuenta en Stripe

1. Ve a [stripe.com](https://stripe.com) y crea una cuenta
2. Activa tu cuenta verificando tu email y completando la información requerida

## 2. Obtener las claves de API

### Claves de prueba (Test Mode)
1. En el dashboard de Stripe, ve a **Developers > API keys**
2. Copia las siguientes claves:
   - **Publishable key** (pk_test_...)
   - **Secret key** (sk_test_...)

### Configurar variables de entorno
Crea un archivo `.env.local` en la raíz del proyecto con:

```env
# Stripe
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_tu_clave_publica_aqui
STRIPE_SECRET_KEY=sk_test_tu_clave_secreta_aqui
STRIPE_WEBHOOK_SECRET=whsec_tu_webhook_secret_aqui

# App
NEXT_PUBLIC_APP_URL=http://localhost:8080
```

## 3. Configurar Webhooks

### Crear endpoint de webhook
1. En el dashboard de Stripe, ve a **Developers > Webhooks**
2. Haz clic en **Add endpoint**
3. URL del endpoint: `https://tu-dominio.com/api/stripe-webhook`
4. Eventos a escuchar:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`

### Obtener webhook secret
1. Después de crear el webhook, haz clic en él
2. En la sección **Signing secret**, copia el secret
3. Agrégala a tu archivo `.env.local`

## 4. Configurar productos en Stripe

### Producto Premium
1. Ve a **Products** en el dashboard de Stripe
2. Crea un nuevo producto:
   - **Name**: "Suscripción Premium AI Companions"
   - **Description**: "Acceso completo a todos los modelos premium"
   - **Pricing**: €19.99/mes (recurring)

### Productos de modelos individuales
Para cada modelo de pago único, crea un producto:
1. **Name**: "[Nombre del Modelo] - AI Companion"
2. **Description**: Descripción del modelo
3. **Pricing**: Precio en euros (one-time)

## 5. Configurar Supabase

### Tabla user_purchased_models
Crea esta tabla en Supabase:

```sql
CREATE TABLE user_purchased_models (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  model_id TEXT NOT NULL,
  purchased_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_user_purchased_models_user_id ON user_purchased_models(user_id);
CREATE INDEX idx_user_purchased_models_model_id ON user_purchased_models(model_id);

-- RLS
ALTER TABLE user_purchased_models ENABLE ROW LEVEL SECURITY;

-- Políticas
CREATE POLICY "Users can view their own purchased models" ON user_purchased_models
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own purchased models" ON user_purchased_models
  FOR INSERT WITH CHECK (auth.uid() = user_id);
```

### Actualizar tabla users
Agrega estas columnas a la tabla `users`:

```sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS premium_expires_at TIMESTAMP WITH TIME ZONE;
```

## 6. Probar la integración

### Modo de prueba
1. Usa las claves de prueba (pk_test_ y sk_test_)
2. Usa tarjetas de prueba de Stripe:
   - **Éxito**: 4242 4242 4242 4242
   - **Fallo**: 4000 0000 0000 0002
   - **Requiere autenticación**: 4000 0025 0000 3155

### Verificar webhooks
1. En el dashboard de Stripe, ve a **Developers > Webhooks**
2. Haz clic en tu webhook
3. Ve a **Recent deliveries** para ver si los eventos se están enviando correctamente

## 7. Pasar a producción

### Claves de producción
1. Cambia a **Live mode** en Stripe
2. Obtén las claves de producción (pk_live_ y sk_live_)
3. Actualiza tu archivo `.env.local`

### Webhook de producción
1. Actualiza la URL del webhook a tu dominio de producción
2. Obtén el nuevo webhook secret
3. Actualiza la variable `STRIPE_WEBHOOK_SECRET`

## 8. Monitoreo

### Dashboard de Stripe
- Monitorea pagos, suscripciones y webhooks
- Revisa logs de errores regularmente

### Logs de la aplicación
- Verifica que los webhooks se procesen correctamente
- Monitorea errores en la consola del servidor

## Troubleshooting

### Webhook no funciona
1. Verifica que la URL sea accesible públicamente
2. Revisa que el webhook secret sea correcto
3. Verifica que los eventos estén configurados correctamente

### Pagos no se procesan
1. Verifica que las claves de API sean correctas
2. Revisa que los productos estén configurados en Stripe
3. Verifica que las URLs de éxito/cancelación sean correctas

### Usuarios no se actualizan
1. Verifica que el webhook se esté ejecutando
2. Revisa los logs de Supabase
3. Verifica que las políticas RLS permitan las actualizaciones








