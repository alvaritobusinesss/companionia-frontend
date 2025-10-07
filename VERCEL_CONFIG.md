# Configuración de Variables de Entorno en Vercel

## Variables Requeridas

Para que la autenticación funcione correctamente en Vercel, necesitas configurar estas variables de entorno en el dashboard de Vercel:

### 1. Variables de Supabase
```
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu_clave_anonima_de_supabase
```

### 2. Variables de la aplicación
```
VITE_API_URL=https://tu-dominio-vercel.vercel.app
VITE_APP_URL=https://tu-dominio-vercel.vercel.app
```

## Configuración en Supabase

### 1. URLs de Redirección
En tu proyecto de Supabase, ve a Authentication > URL Configuration y añade:

**Site URL:**
```
https://tu-dominio-vercel.vercel.app
```

**Redirect URLs:**
```
https://tu-dominio-vercel.vercel.app
https://tu-dominio-vercel.vercel.app/auth
https://tu-dominio-vercel.vercel.app/**
```

### 2. Configuración CORS
En Authentication > Settings, asegúrate de que las URLs permitidas incluyan tu dominio de Vercel.

## Pasos para Configurar en Vercel

1. Ve a tu proyecto en Vercel Dashboard
2. Navega a Settings > Environment Variables
3. Añade cada variable con su valor correspondiente
4. Asegúrate de marcar las variables para todos los entornos (Production, Preview, Development)
5. Redeploy tu aplicación

## Diagnóstico

Visita `/diagnostics` en tu aplicación desplegada para verificar que todas las configuraciones estén correctas.

## Problemas Comunes

### Modal se queda cargando
- Verifica que las variables VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY estén configuradas
- Comprueba que las URLs de redirección en Supabase incluyan tu dominio de Vercel
- Revisa la consola del navegador para errores específicos

### Error de CORS
- Añade tu dominio de Vercel a las URLs permitidas en Supabase
- Asegúrate de usar HTTPS en producción

### Variables no definidas
- Verifica que las variables empiecen con VITE_ para que Vite las incluya en el build
- Redeploy después de añadir nuevas variables de entorno
