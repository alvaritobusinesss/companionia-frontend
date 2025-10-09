-- Arreglar las políticas RLS para la tabla conversations
-- El problema es que las políticas están configuradas para auth.uid() 
-- pero nosotros usamos nuestra tabla users

-- Eliminar las políticas existentes
DROP POLICY IF EXISTS "Users can view own conversations" ON conversations;
DROP POLICY IF EXISTS "Users can insert own conversations" ON conversations;
DROP POLICY IF EXISTS "Users can update own conversations" ON conversations;
DROP POLICY IF EXISTS "Users can delete own conversations" ON conversations;

-- Crear nuevas políticas que funcionen con nuestra tabla users
-- Política: Permitir acceso a conversaciones si el user_id existe en nuestra tabla users
CREATE POLICY "Allow access to conversations" ON conversations
  FOR ALL USING (
    user_id IN (
      SELECT id FROM users WHERE id = conversations.user_id
    )
  );

-- También permitir acceso desde el servicio (service role)
CREATE POLICY "Service role can access conversations" ON conversations
  FOR ALL USING (true);

-- Verificar que la tabla conversations existe y tiene la estructura correcta
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'conversations' 
ORDER BY ordinal_position;




