-- Crear tabla companions si no existe
CREATE TABLE IF NOT EXISTS companions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  image_url TEXT,
  description TEXT,
  category TEXT,
  tags TEXT[],
  is_premium BOOLEAN DEFAULT false,
  is_extra_premium BOOLEAN DEFAULT false,
  is_locked BOOLEAN DEFAULT false,
  rating DECIMAL(3,1) DEFAULT 4.5,
  conversations INTEGER DEFAULT 0,
  price TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insertar datos de ejemplo
INSERT INTO companions (name, image_url, description, category, tags, is_premium, is_extra_premium, is_locked, rating, conversations, price) VALUES
('Aria', '/models/aria.jpg', 'Una compañera virtual elegante y sofisticada, perfecta para conversaciones profundas y momentos íntimos.', 'Románticas', ARRAY['elegante', 'sofisticada', 'conversación'], false, false, false, 4.8, 1250, null),
('Luna', '/models/luna.jpg', 'Una personalidad dulce y cariñosa que te hará sentir especial en cada conversación.', 'Románticas', ARRAY['dulce', 'cariñosa', 'especial'], false, false, false, 4.7, 980, null),
('Sofia', '/models/sofia.jpg', 'Una mujer inteligente y misteriosa que te cautivará con su sabiduría y encanto.', 'Románticas', ARRAY['inteligente', 'misteriosa', 'sabiduría'], true, false, false, 4.9, 2100, null),
('Jade', '/models/jade.jpg', 'Una personalidad aventurera y enérgica, perfecta para explorar nuevos horizontes juntos.', 'Aventureras', ARRAY['aventurera', 'enérgica', 'explorar'], false, false, false, 4.6, 750, null),
('Nova', '/models/nova.jpg', 'Una compañera futurista y tecnológica, ideal para conversaciones sobre innovación y progreso.', 'Futuristas', ARRAY['futurista', 'tecnológica', 'innovación'], true, true, false, 5.0, 3500, '9.99'),
('Beauty', '/models/beauty.jpg', 'Una personalidad hermosa y encantadora que te hará sentir como en un cuento de hadas.', 'Románticas', ARRAY['hermosa', 'encantadora', 'cuento'], false, false, false, 4.5, 650, null),
('Blu', '/models/Blu.jpg', 'Una compañera artística y creativa, perfecta para explorar el mundo del arte y la creatividad.', 'Artísticas', ARRAY['artística', 'creativa', 'arte'], false, false, false, 4.4, 420, null),
('Ginger', '/models/ginger.jpg', 'Una personalidad cálida y acogedora que te hará sentir como en casa.', 'Acogedoras', ARRAY['cálida', 'acogedora', 'hogar'], false, false, false, 4.3, 380, null),
('Resha', '/models/Resha.jpg', 'Una compañera espiritual y sabia, ideal para conversaciones profundas sobre la vida.', 'Espirituales', ARRAY['espiritual', 'sabia', 'profunda'], true, false, false, 4.7, 1200, null),
('Reyna', '/models/Reyna.jpg', 'Una personalidad real y majestuosa que te hará sentir como un rey.', 'Reales', ARRAY['real', 'majestuosa', 'rey'], false, true, false, 4.8, 1800, '4.99'),
('Victoria', '/models/victoria.jpg', 'Una compañera victoriosa y triunfante, perfecta para celebrar tus logros.', 'Triunfadoras', ARRAY['victoriosa', 'triunfante', 'logros'], false, false, false, 4.6, 890, null),
('Yu', '/models/Yu.jpg', 'Una personalidad única y especial que te sorprenderá con su originalidad.', 'Únicas', ARRAY['única', 'especial', 'originalidad'], false, false, false, 4.5, 720, null);

-- Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_companions_category ON companions(category);
CREATE INDEX IF NOT EXISTS idx_companions_rating ON companions(rating);
CREATE INDEX IF NOT EXISTS idx_companions_premium ON companions(is_premium);
