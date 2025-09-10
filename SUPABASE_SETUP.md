# Configuración de Supabase para AI Companions

## 🚀 Pasos para configurar la base de datos

### 1. Acceder a Supabase
1. Ve a [supabase.com](https://supabase.com)
2. Inicia sesión con tu cuenta
3. Ve a tu proyecto

### 2. Crear la tabla y datos
1. Ve a **SQL Editor** en el panel lateral
2. Copia y pega el contenido del archivo `supabase-setup.sql`
3. Haz clic en **Run** para ejecutar el script

### 3. Verificar la configuración
1. Ve a **Table Editor**
2. Verifica que la tabla `companions` existe
3. Verifica que hay datos en la tabla

### 4. Configurar variables de entorno en Vercel
1. Ve a tu proyecto en Vercel
2. Ve a **Settings** → **Environment Variables**
3. Agrega estas variables:
   ```
   VITE_SUPABASE_URL = tu_url_de_supabase
   VITE_SUPABASE_ANON_KEY = tu_clave_anonima_de_supabase
   ```

### 5. Redesplegar
Después de configurar todo, haz un nuevo push para redesplegar:
```bash
git add .
git commit -m "feat: add Supabase setup instructions"
git push origin main
```

## 📋 Estructura de la tabla companions

La tabla `companions` tiene las siguientes columnas:
- `id`: UUID único
- `name`: Nombre del compañero
- `image_url`: URL de la imagen
- `description`: Descripción del compañero
- `category`: Categoría (Románticas, Aventureras, etc.)
- `tags`: Array de etiquetas
- `is_premium`: Si es premium
- `is_extra_premium`: Si es extra premium
- `is_locked`: Si está bloqueado
- `rating`: Calificación (0-5)
- `conversations`: Número de conversaciones
- `price`: Precio (si aplica)

## 🎯 Datos de ejemplo incluidos

El script incluye 12 compañeros de ejemplo con diferentes categorías:
- **Románticas**: Aria, Luna, Sofia, Beauty
- **Aventureras**: Jade
- **Futuristas**: Nova
- **Artísticas**: Blu
- **Acogedoras**: Ginger
- **Espirituales**: Resha
- **Reales**: Reyna
- **Triunfadoras**: Victoria
- **Únicas**: Yu
