# Deploy en Vercel (Vite + API en `/api`)

Este proyecto usa Vite para el frontend y funciones serverless en Vercel bajo `api/*.ts`.

Actualmente, el sistema de pagos está deshabilitado. La aplicación funciona sin dependencias de pago.

## 1) Variables de entorno requeridas (Production y Preview)
Configura en Vercel > Project > Settings > Environment Variables:

- VITE_API_URL (opcional)
- VITE_APP_URL (opcional)
- VITE_SUPABASE_URL (si usas Supabase)
- VITE_SUPABASE_ANON_KEY (si usas Supabase)

## 2) Runtime de funciones
El archivo `vercel.json` define el runtime y las rewrites para servir `index.html` y las APIs en `/api`.

## 3) Ubicación de handlers
- Los handlers de Vercel deben estar en `api/*.ts` o `api/*.js`.
- Cualquier lógica auxiliar puede vivir en `src/**` y ser importada por los handlers.

## 4) Health check
`GET /api/health` devuelve un ping con información básica del runtime y la hora del servidor.

## 5) Turborepo (passthrough de envs)
`turbo.json` pasa `NEXT_PUBLIC_*` y `VITE_*` al build para evitar problemas de caché.

## 6) Redeploy con caché limpia
Tras crear/editar envs o `turbo.json`/`vercel.json`:
- Haz "Redeploy" con "Clear build cache".
- Verifica que la app cargue correctamente.

## 7) Commit
Mensaje sugerido:
```
chore: actualizar deploy docs y deshabilitar pagos
```
