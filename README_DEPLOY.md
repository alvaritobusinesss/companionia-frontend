# Deploy en Vercel (Vite + API en `/api`)

Este proyecto usa Vite para el frontend y funciones serverless en Vercel bajo `api/*.ts`.

## 1) Variables de entorno requeridas (Production y Preview)
Crea estas 4 variables en Vercel > Project > Settings > Environment Variables:

- STRIPE_SECRET_KEY = sk_... (secreto de Stripe)
- STRIPE_WEBHOOK_SECRET = whsec_...
- STRIPE_PREMIUM_PRICE = price_...
- VITE_STRIPE_PUBLISHABLE_KEY = pk_...

Notas:
- Las 3 primeras son solo servidor (usadas en `api/*.ts`).
- La última es para el cliente (usada en `src/lib/stripe.ts`).

## 2) Runtime de funciones en Node.js 20
Archivo `vercel.json` en la raíz:

```json
{
  "version": 2,
  "functions": { "api/**": { "runtime": "nodejs20.x" } },
  "rewrites": [
    { "source": "/api/(.*)", "destination": "/api/$1" },
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

## 3) Ubicación de handlers
- Los handlers de Vercel deben estar en `api/*.ts` o `api/*.js`.
- Cualquier lógica auxiliar puede vivir en `src/**` y ser importada por los handlers (ej.: `api/stripe-webhook.ts` importa `src/api/stripe-webhook.ts`).

## 4) Unificación de envs
- Servidor: `process.env.STRIPE_SECRET_KEY`, `process.env.STRIPE_WEBHOOK_SECRET`, `process.env.STRIPE_PREMIUM_PRICE`.
- Cliente: `import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY`.

## 5) Health check
`GET /api/health` devuelve:
- `detectedStripeEnvKeys`: nombres detectados entre las 4 claves anteriores.
- `*_present`: flags booleanos por clave.

## 6) Turborepo (passthrough de envs)
Archivo `turbo.json` (Turbo 2.x) con `tasks.build.env` y `tasks.dev.env` para evitar que el caché oculte las envs usadas en build:

```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "dist/**"],
      "env": [
        "STRIPE_SECRET_KEY",
        "STRIPE_WEBHOOK_SECRET",
        "STRIPE_PREMIUM_PRICE",
        "VITE_STRIPE_PUBLISHABLE_KEY",
        "NEXT_PUBLIC_*",
        "VITE_*"
      ]
    },
    "dev": {
      "env": [
        "STRIPE_SECRET_KEY",
        "STRIPE_WEBHOOK_SECRET",
        "STRIPE_PREMIUM_PRICE",
        "VITE_STRIPE_PUBLISHABLE_KEY",
        "NEXT_PUBLIC_*",
        "VITE_*"
      ]
    }
  }
}
```

## 7) Redeploy con caché limpia
Tras crear/editar envs o `turbo.json`/`vercel.json`:
- Haz "Redeploy" con "Clear build cache".
- Verifica en logs del build la línea `[diagnose-env]` con las claves (solo nombres).
- Verifica `GET /api/health` en producción: `*_present: true` y `hasStripeSecretSkPrefix: true`.

## 8) Commit
Mensaje sugerido:
```
fix(vercel): force nodejs20.x for api/** + env wiring + health
```
