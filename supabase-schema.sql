-- Tabla de usuarios
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  is_premium BOOLEAN DEFAULT false,
  purchased_models UUID[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de modelos
CREATE TABLE IF NOT EXISTS models (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('free', 'premium', 'one_time')),
  price DECIMAL(10,2),
  image_url TEXT,
  description TEXT,
  tags TEXT[],
  rating DECIMAL(3,1) DEFAULT 4.5,
  conversations INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT check_price_for_one_time CHECK (
    (type = 'one_time' AND price IS NOT NULL AND price > 0) OR
    (type != 'one_time' AND price IS NULL)
  )
);

-- Insertar datos de ejemplo
INSERT INTO models (name, category, type, price, image_url, description, tags, rating, conversations) VALUES
-- Románticas
('Victoria', 'Románticas', 'free', NULL, 'https://companion-ia-2.vercel.app/models/victoria.jpg', 'Una compañera virtual elegante y sofisticada, perfecta para conversaciones profundas y momentos íntimos.', ARRAY['elegante', 'sofisticada', 'conversación'], 4.8, 1250),
('Luna', 'Románticas', 'premium', NULL, 'https://companion-ia-2.vercel.app/models/luna.jpg', 'Una personalidad dulce y cariñosa que te hará sentir especial en cada conversación.', ARRAY['dulce', 'cariñosa', 'especial'], 4.7, 980),
('Ginger', 'Románticas', 'premium', NULL, 'https://companion-ia-2.vercel.app/models/ginger.jpg', 'Una mujer inteligente y misteriosa que te cautivará con su sabiduría y encanto.', ARRAY['inteligente', 'misteriosa', 'sabiduría'], 4.9, 2100),
('Beauty', 'Románticas', 'one_time', 9.99, 'https://companion-ia-2.vercel.app/models/beauty.jpg', 'Una personalidad aventurera y enérgica, perfecta para explorar nuevos horizontes juntos.', ARRAY['aventurera', 'enérgica', 'explorar'], 4.6, 750),

-- Gamer
('Blu', 'Gamer', 'free', NULL, 'https://companion-ia-2.vercel.app/models/Blu.jpg', 'Una compañera gamer apasionada por los videojuegos, perfecta para sesiones de gaming épicas.', ARRAY['gamer', 'videojuegos', 'épica'], 4.4, 420),
('Resha', 'Gamer', 'premium', NULL, 'https://companion-ia-2.vercel.app/models/Resha.jpg', 'Una compañera gamer estratégica y competitiva, ideal para partidas intensas y torneos.', ARRAY['gamer', 'estratégica', 'competitiva'], 4.7, 1200),
('Reyna', 'Gamer', 'one_time', 9.99, 'https://companion-ia-2.vercel.app/models/Reyna.jpg', 'Una compañera gamer dominante y poderosa, perfecta para liderar equipos y conquistar mundos virtuales.', ARRAY['gamer', 'dominante', 'líder'], 4.8, 1800),
('Yu', 'Gamer', 'premium', NULL, 'https://companion-ia-2.vercel.app/models/Yu.jpg', 'Una compañera gamer única y especializada, experta en juegos indie y aventuras únicas.', ARRAY['gamer', 'indie', 'aventuras'], 4.5, 720);

-- Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_models_category ON models(category);
CREATE INDEX IF NOT EXISTS idx_models_type ON models(type);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Función para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para actualizar updated_at automáticamente
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_models_updated_at BEFORE UPDATE ON models FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
