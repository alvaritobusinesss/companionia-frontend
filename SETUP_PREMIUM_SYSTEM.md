# 🚀 Sistema Premium - Setup Completo

## 📋 Resumen del Sistema Implementado

Se ha implementado un sistema completo de modelos con diferentes niveles de acceso:

### 🎯 **Tipos de Modelos**
- **Gratis**: Acceso libre para todos los usuarios
- **Premium**: Requiere suscripción mensual (€9.99/mes)
- **Pago único**: Compra individual por modelo (€4.99-€9.99)

### 🗄️ **Base de Datos (Supabase)**

#### Tabla `users`
```sql
- id (UUID, PK)
- email (TEXT, UNIQUE)
- is_premium (BOOLEAN)
- purchased_models (UUID[])
- created_at, updated_at
```

#### Tabla `models`
```sql
- id (UUID, PK)
- name (TEXT)
- category (TEXT)
- type (free|premium|one_time)
- price (DECIMAL, solo para one_time)
- image_url, description, tags, rating, conversations
- created_at, updated_at
```

## 🛠️ **Setup Paso a Paso**

### 1. **Configurar Supabase**
```bash
# Ejecutar el schema SQL
psql -h your-supabase-host -U postgres -d postgres -f supabase-schema.sql
```

### 2. **Configurar Stripe**
1. Crear cuenta en [Stripe Dashboard](https://dashboard.stripe.com)
2. Obtener las claves API (test/live)
3. Configurar webhook endpoint: `https://tu-dominio.com/api/stripe-webhook`

### 3. **Variables de Entorno**
Crear archivo `.env.local`:
```env
# Supabase
VITE_SUPABASE_URL=tu_supabase_url
VITE_SUPABASE_ANON_KEY=tu_supabase_anon_key

# Stripe
STRIPE_SECRET_KEY=sk_test_tu_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_tu_webhook_secret
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_tu_stripe_publishable_key
NEXT_PUBLIC_APP_URL=https://tu-dominio.com
```

### 4. **Configurar Webhook de Stripe**
- URL: `https://tu-dominio.com/api/stripe-webhook`
- Eventos: `checkout.session.completed`, `invoice.payment_succeeded`, `customer.subscription.deleted`

## 🎨 **Componentes Creados**

### `useUserAccess` Hook
```typescript
const { user, checkModelAccess, refreshUser } = useUserAccess();
```

### `ModelCardWithAccess` Component
- Muestra locks 🔒 para modelos bloqueados
- Botones de compra contextuales
- Estados visuales diferentes por tipo

### `PurchaseModal` Component
- Modal para suscripción premium
- Modal para compra única
- Integración con Stripe Checkout

## 🔧 **API Routes**

### `/api/create-checkout-session`
- Crea sesiones de Stripe Checkout
- Maneja suscripciones y compras únicas

### `/api/stripe-webhook`
- Procesa eventos de Stripe
- Actualiza estado de usuarios en Supabase

## 🎯 **Flujo de Usuario**

1. **Usuario ve modelos** → Algunos con locks 🔒
2. **Click en modelo bloqueado** → Abre modal de compra
3. **Selecciona tipo de compra** → Premium o pago único
4. **Redirige a Stripe** → Proceso de pago
5. **Webhook actualiza BD** → Usuario desbloquea acceso
6. **Usuario puede chatear** → Con modelo desbloqueado

## 🧪 **Testing**

### Datos de Prueba
```sql
-- Usuario de prueba
INSERT INTO users (email, is_premium, purchased_models) 
VALUES ('test@example.com', false, '{}');

-- Modelos de prueba ya incluidos en schema
```

### Tarjetas de Prueba Stripe
- **Éxito**: `4242 4242 4242 4242`
- **Declinada**: `4000 0000 0000 0002`

## 🚀 **Deploy**

### Vercel
1. Conectar repositorio
2. Configurar variables de entorno
3. Deploy automático

### Variables de Entorno en Vercel
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `NEXT_PUBLIC_APP_URL`

## 📊 **Monitoreo**

### Stripe Dashboard
- Verificar pagos exitosos
- Monitorear webhooks
- Revisar suscripciones

### Supabase Dashboard
- Verificar actualizaciones de usuarios
- Monitorear tabla `users`
- Revisar logs de webhooks

## 🔒 **Seguridad**

- ✅ Validación de webhooks con firma
- ✅ Verificación de acceso en frontend y backend
- ✅ Sanitización de inputs
- ✅ Rate limiting en APIs

## 📈 **Métricas**

### KPIs a Monitorear
- Conversión de usuarios gratuitos a premium
- Tasa de compra de modelos individuales
- Retención de suscripciones
- Revenue por usuario

## 🆘 **Soporte**

### Problemas Comunes
1. **Webhook no funciona**: Verificar URL y secret
2. **Usuarios no se actualizan**: Revisar logs de Supabase
3. **Pagos no procesan**: Verificar claves de Stripe
4. **Modelos no se desbloquean**: Revisar lógica de acceso

### Debug
```typescript
// En consola del navegador
console.log('User access:', checkModelAccess(model));
console.log('User data:', user);
```

---

## ✅ **Checklist de Implementación**

- [x] Schema de base de datos
- [x] Hook de acceso de usuario
- [x] Componente de tarjeta con locks
- [x] Modal de compra
- [x] API de Stripe Checkout
- [x] Webhook de Stripe
- [x] Integración completa
- [x] Documentación

**¡Sistema listo para producción! 🎉**
