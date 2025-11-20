import { useEffect, useRef, useState, memo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Crown, Lock, Star, CreditCard, User } from "lucide-react";
import { Model, UserAccess, User as UserType } from "@/hooks/useUserAccess";
import { useTranslation } from "@/hooks/useTranslation";
import { getPersonaByName } from "@/data/personas";

interface ModelCardWithAccessProps {
  model: Model;
  userAccess: UserAccess;
  user: UserType | null;
  onSelect: (modelId: string) => void;
  onPurchase: (modelId: string) => void;
}

function ModelCardWithAccessComponent({ 
  model, 
  userAccess,
  user,
  onSelect, 
  onPurchase 
}: ModelCardWithAccessProps) {
  const { t, ta, language } = useTranslation();
  const formatUSD = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value || 0);
  const [visible, setVisible] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const [imgSrc, setImgSrc] = useState(() => {
    const url = model.image_url || '';
    return url.endsWith('.jpg') ? url.replace(/\.jpg$/i, '.webp') : url;
  });
  
  // Modelos con ficha enriquecida (atributos + nacionalidad + sin chips)
  const isEnhancedCard = (
    model.id === "1" || model.id === "2" || model.id === "3" || model.id === "4" ||
    model.id === "5" || model.id === "6" || model.id === "7" || model.id === "8" ||
    model.id === "9" || model.id === "10" || model.id === "11" || model.id === "12" ||
    model.id === "13" || model.id === "14" || model.id === "15" || model.id === "16" ||
    model.id === "17" || model.id === "18" || model.id === "19" || model.id === "20" ||
    model.id === "21" || model.id === "22" || model.id === "23" || model.id === "24"
  );
  const persona = getPersonaByName(model.name);

  // Helpers mínimos para bandera por país (ES -> ISO -> emoji)
  function countryFromCity(cityField?: string): string | null {
    if (!cityField) return null;
    const parts = String(cityField).split(",");
    const country = parts[1]?.trim() || null;
    return country;
  }

  // Traducciones ligeras para atributos
  function translateConnector(key: string): string {
    const L = language;
    const map: Record<string, Record<string, string>> = {
      amante_de: { es: 'Amante de', en: 'Loves', ar: 'تعشق', ja: '〜が大好き', pt: 'Amante de', tr: 'Bayılır' },
      enamorada_del: { es: 'Enamorada del', en: 'In love with', ar: 'واقعة في حب', ja: 'に恋している', pt: 'Apaixonada por', tr: 'Aşık' },
      enamorada_de: { es: 'Enamorada de', en: 'In love with', ar: 'واقعة في حب', ja: 'に恋している', pt: 'Apaixonada por', tr: 'Aşık' },
      apasionada_por: { es: 'Apasionada por', en: 'Passionate about', ar: 'شغوفة بـ', ja: 'に情熱的', pt: 'Apaixonada por', tr: 'Tutkulu olduğu' },
      le_encantan: { es: 'Le encantan', en: 'She loves', ar: 'تعشق', ja: '大好き', pt: 'Adora', tr: 'Çok sever' },
      fan_de: { es: 'Fan de', en: 'Fan of', ar: 'من معجبي', ja: 'ファン', pt: 'Fã de', tr: 'Hayranı' },
      devota_del: { es: 'Devota del', en: 'Devoted to', ar: 'مخلصة لـ', ja: 'に献身的', pt: 'Devota de', tr: 'Adanmış' },
      devota_de: { es: 'Devota de', en: 'Devoted to', ar: 'مخلصة لـ', ja: 'に献身的', pt: 'Devota de', tr: 'Adanmış' },
      entusiasta_del: { es: 'Entusiasta del', en: 'Enthusiast of', ar: 'شغوف بـ', ja: '愛好家', pt: 'Entusiasta de', tr: 'Meraklısı' },
      le_inspira: { es: 'Le inspira', en: 'Inspired by', ar: 'تستمد الإلهام من', ja: 'にインスパイアされる', pt: 'Inspirada por', tr: 'İlham alır' },
      fascinada_por: { es: 'Fascinada por', en: 'Fascinated by', ar: 'مفتونة بـ', ja: 'に魅了される', pt: 'Fascinada por', tr: 'Büyülenmiş' },
      obsesionada_con: { es: 'Obsesionada con', en: 'Obsessed with', ar: 'مهووسة بـ', ja: 'に夢中', pt: 'Obcecada por', tr: 'Takıntılı' },
      disfruta_de: { es: 'Disfruta de', en: 'Enjoys', ar: 'تستمتع بـ', ja: 'を楽しむ', pt: 'Gosta de', tr: 'Sever' },
      experta_en: { es: 'Experta en', en: 'Expert in', ar: 'خبيرة في', ja: 'に詳しい', pt: 'Especialista em', tr: 'Uzman' },
      inspirada_por: { es: 'Inspirada por', en: 'Inspired by', ar: 'مستوحاة من', ja: 'にインスパイア', pt: 'Inspirada por', tr: 'İlham alan' },
    };
    return (map[key]?.[L] || map[key]?.es || '').trim();
  }

  function translateProfession(s?: string): string {
    if (!s) return '';
    const L = language;
    const key = s.toLowerCase();
    const dict: Record<string, Record<string, string>> = {
      'fotógrafa freelance': { en: 'Freelance photographer', pt: 'Fotógrafa freelancer', ar: 'مصورة حرة', ja: 'フリーランス写真家', tr: 'Serbest fotoğrafçı', es: 'Fotógrafa freelance' },
      'profesora de arte': { en: 'Art teacher', pt: 'Professora de arte', ar: 'معلمة فنون', ja: '美術教師', tr: 'Sanat öğretmeni', es: 'Profesora de arte' },
      'escritora de cuentos cortos': { en: 'Short story writer', pt: 'Escritora de contos', ar: 'كاتبة قصص قصيرة', ja: '短編作家', tr: 'Kısa öykü yazarı', es: 'Escritora de cuentos cortos' },
      'florista': { en: 'Florist', pt: 'Florista', ar: 'بائعة زهور', ja: 'フローリスト', tr: 'Çiçekçi', es: 'Florista' },
      'streamer': { en: 'Streamer', pt: 'Streamer', ar: 'ستريمر', ja: '配信者', tr: 'Yayıncı', es: 'Streamer' },
      'desarrolladora indie': { en: 'Indie game developer', pt: 'Desenvolvedora indie', ar: 'مطورة ألعاب مستقلة', ja: 'インディー開発者', tr: 'Indie geliştirici', es: 'Desarrolladora indie' },
      'artista conceptual': { en: 'Concept artist', pt: 'Artista conceitual', ar: 'فنانة مفاهيم', ja: 'コンセプトアーティスト', tr: 'Konsept sanatçısı', es: 'Artista conceptual' },
      'coach esports': { en: 'eSports coach', pt: 'Treinadora de eSports', ar: 'مدربة رياضات إلكترونية', ja: 'eスポーツコーチ', tr: 'eSpor koçu', es: 'Coach eSports' },
      'coach de equipos esports': { en: 'eSports team coach', pt: 'Treinadora de equipe de eSports', ar: 'مدربة فريق رياضات إلكترونية', ja: 'eスポーツチームコーチ', tr: 'eSpor takım koçu', es: 'Coach de equipos eSports' },
      'diseñadora de moda': { en: 'Fashion designer', pt: 'Designer de moda', ar: 'مصممة أزياء', ja: 'ファッションデザイナー', tr: 'Moda tasarımcısı', es: 'Diseñadora de moda' },
      'productora de cine': { en: 'Film producer', pt: 'Produtora de cinema', ar: 'منتِجة أفلام', ja: '映画プロデューサー', tr: 'Film yapımcısı', es: 'Productora de cine' },
      'productora de cine independiente': { en: 'Independent film producer', pt: 'Produtora de cinema independente', ar: 'منتِجة أفلام مستقلة', ja: 'インディー映画プロデューサー', tr: 'Bağımsız film yapımcısı', es: 'Productora de cine independiente' },
      'periodista': { en: 'Journalist', pt: 'Jornalista', ar: 'صحفية', ja: 'ジャーナリスト', tr: 'Gazeteci', es: 'Periodista' },
      'estudiante': { en: 'Student', pt: 'Estudante', ar: 'طالبة', ja: '学生', tr: 'Öğrenci', es: 'Estudiante' },
      'bailarina y modelo': { en: 'Dancer and model', pt: 'Bailarina e modelo', ar: 'راقصة وعارضة', ja: 'ダンサー・モデル', tr: 'Dansçı ve model', es: 'Bailarina y modelo' },
      'coreógrafa': { en: 'Choreographer', pt: 'Coreógrafa', ar: 'مصممة رقص', ja: '振付師', tr: 'Koreograf', es: 'Coreógrafa' },
      'fashion designer': { en: 'Fashion designer', pt: 'Designer de moda', ar: 'مصممة أزياء', ja: 'ファッションデザイナー', tr: 'Moda tasarımcısı', es: 'Diseñadora de moda' },
      'organizadora de eventos de moda': { en: 'Fashion event organizer', pt: 'Organizadora de eventos de moda', ar: 'منظمة فعاليات موضة', ja: 'ファッションイベント主催', tr: 'Moda etkinliği organizatörü', es: 'Organizadora de eventos de moda' },
      'relaciones públicas en un hotel de lujo': { en: 'Public relations at a luxury hotel', pt: 'Relações públicas em hotel de luxo', ar: 'علاقات عامة في فندق فاخر', ja: '高級ホテルのPR', tr: 'Lüks otelde halkla ilişkiler', es: 'Relaciones públicas en un hotel de lujo' },
      'pianista de jazz': { en: 'Jazz pianist', pt: 'Pianista de jazz', ar: 'عازفة بيانو جاز', ja: 'ジャズピアニスト', tr: 'Caz piyanisti', es: 'Pianista de jazz' },
      'consultora de imagen y etiqueta': { en: 'Image and etiquette consultant', pt: 'Consultora de imagem e etiqueta', ar: 'مستشارة صورة وإتيكيت', ja: 'イメージ・マナーコンサルタント', tr: 'İmaj ve görgü danışmanı', es: 'Consultora de imagen y etiqueta' },
      'directora artística de una galería underground': { en: 'Art director of an underground gallery', pt: 'Diretora artística de uma galeria underground', ar: 'مديرة فنية لمعرض أندرغراوند', ja: 'アンダーグラウンドギャラリーのアートディレクター', tr: 'Yeraltı galerisi sanat direktörü', es: 'Directora artística de una galería underground' },
      'escritora y crítica literaria': { en: 'Writer and literary critic', pt: 'Escritora e crítica literária', ar: 'كاتبة وناقدة أدبية', ja: '作家・文芸評論家', tr: 'Yazar ve edebiyat eleştirmeni', es: 'Escritora y crítica literaria' },
      'investigadora de literatura comparada': { en: 'Comparative literature researcher', pt: 'Pesquisadora de literatura comparada', ar: 'باحثة في الأدب المقارن', ja: '比較文学研究者', tr: 'Karşılaştırmalı edebiyat araştırmacısı', es: 'Investigadora de literatura comparada' },
      'ilustradora y crítica cultural': { en: 'Illustrator and cultural critic', pt: 'Ilustradora e crítica cultural', ar: 'رسامة وناقدة ثقافية', ja: 'イラストレーター・文化批評家', tr: 'İllüstratör ve kültür eleştirmeni', es: 'Ilustradora y crítica cultural' },
      'mentora y conferencista en innovación y pensamiento crítico': { en: 'Mentor and speaker in innovation and critical thinking', pt: 'Mentora e palestrante em inovação e pensamento crítico', ar: 'مرشدة ومحاضِرة في الابتكار والتفكير النقدي', ja: 'イノベーションと批判的思考のメンター・講演者', tr: 'İnovasyon ve eleştirel düşünce mentoru ve konuşmacı', es: 'Mentora y conferencista en innovación y pensamiento crítico' },
      'organizadora de eventos': { en: 'Event organizer', pt: 'Organizadora de eventos', ar: 'منظمة فعاليات', ja: 'イベント主催者', tr: 'Etkinlik organizatörü', es: 'Organizadora de eventos' },
      'directora artística': { en: 'Art director', pt: 'Diretora de arte', ar: 'مديرة فنية', ja: 'アートディレクター', tr: 'Sanat direktörü', es: 'Directora artística' },
      'estudiante de filosofía': { en: 'Philosophy student', pt: 'Estudante de filosofia', ar: 'طالبة فلسفة', ja: '哲学の学生', tr: 'Felsefe öğrencisi', es: 'Estudiante de filosofía' },
      'investigadora': { en: 'Researcher', pt: 'Pesquisadora', ar: 'باحثة', ja: '研究者', tr: 'Araştırmacı', es: 'Investigadora' },
      'ilustradora': { en: 'Illustrator', pt: 'Ilustradora', ar: 'رسامة', ja: 'イラストレーター', tr: 'İllüstratör', es: 'Ilustradora' },
    };
    const translated = dict[key]?.[L];
    return translated ? translated : s;
  }

  function translateTone(text?: string): string {
    if (!text) return '';
    const L = language;
    // Normaliza separadores: ' y ', 'pero', '&', ',', '/', '•' -> '|'
    const normalized = text
      .toLowerCase()
      .replace(/\s*pero\s*/g, '|')
      .replace(/\s*y\s*/g, '|')
      .replace(/[,&/•]+/g, '|');
    const rawTokens = normalized.split('|').map(s => s.trim()).filter(Boolean);
    const toneDict: Record<string, Record<string, string>> = {
      'romántica': { en: 'romantic', pt: 'romântica', ar: 'رومانسية', ja: 'ロマンチック', tr: 'romantik', es: 'romántica' },
      'romantica': { en: 'romantic', pt: 'romântica', ar: 'رومانسية', ja: 'ロマンチック', tr: 'romantik', es: 'romántica' },
      'romántico': { en: 'romantic', pt: 'romântico', ar: 'رومانسي', ja: 'ロマンチック', tr: 'romantik', es: 'romántico' },
      'romantico': { en: 'romantic', pt: 'romântico', ar: 'رومانسي', ja: 'ロマンチック', tr: 'romantik', es: 'romántico' },
      'cálida': { en: 'warm', pt: 'calorosa', ar: 'دافئة', ja: 'あたたかい', tr: 'sıcak', es: 'cálida' },
      'calida': { en: 'warm', pt: 'calorosa', ar: 'دافئة', ja: 'あたたかい', tr: 'sıcak', es: 'cálida' },
      'cálido': { en: 'warm', pt: 'caloroso', ar: 'دافئ', ja: 'あたたかい', tr: 'sıcak', es: 'cálido' },
      'calido': { en: 'warm', pt: 'caloroso', ar: 'دافئ', ja: 'あたたかい', tr: 'sıcak', es: 'cálido' },
      'serena': { en: 'calm', pt: 'serena', ar: 'هادئة', ja: '穏やか', tr: 'sakin', es: 'serena' },
      'ligera': { en: 'light', pt: 'leve', ar: 'خفيفة', ja: '軽やか', tr: 'hafif', es: 'ligera' },
      'amable': { en: 'kind', pt: 'amável', ar: 'لطيفة', ja: '優しい', tr: 'nazik', es: 'amable' },
      'introspectiva': { en: 'introspective', pt: 'introspectiva', ar: 'متأملة', ja: '内省的', tr: 'içe dönük', es: 'introspectiva' },
      'sensual': { en: 'sensual', pt: 'sensual', ar: 'حسية', ja: '官能的', tr: 'tutkulu', es: 'sensual' },
      'sofisticada': { en: 'sophisticated', pt: 'sofisticada', ar: 'راقية', ja: '洗練された', tr: 'sofistike', es: 'sofisticada' },
      'seductora': { en: 'seductive', pt: 'sedutora', ar: 'فاتنة', ja: '魅惑的', tr: 'baştan çıkarıcı', es: 'seductora' },
      'seductor': { en: 'seductive', pt: 'sedutor', ar: 'فاتن', ja: '魅惑的', tr: 'baştan çıkarıcı', es: 'seductor' },
      'intelectual': { en: 'intellectual', pt: 'intelectual', ar: 'مثقفة', ja: '知的', tr: 'entelektüel', es: 'intelectual' },
      'misteriosa': { en: 'mysterious', pt: 'misteriosa', ar: 'غامضة', ja: 'ミステリアス', tr: 'gizemli', es: 'misteriosa' },
      'elegante': { en: 'elegant', pt: 'elegante', ar: 'أنيقة', ja: 'エレガント', tr: 'zarif', es: 'elegante' },
      'apasionada': { en: 'passionate', pt: 'apaixonada', ar: 'شغوفة', ja: '情熱的', tr: 'tutkulu', es: 'apasionada' },
      'segura': { en: 'confident', pt: 'segura', ar: 'واثقة', ja: '自信に満ちた', tr: 'özgüvenli', es: 'segura' },
      'motivadora': { en: 'motivating', pt: 'motivadora', ar: 'محفزة', ja: 'モチベーター', tr: 'motive edici', es: 'motivadora' },
      'relajada': { en: 'relaxed', pt: 'relaxada', ar: 'مسترخية', ja: 'リラックス', tr: 'rahat', es: 'relajada' },
      'técnica': { en: 'technical', pt: 'técnica', ar: 'تقنية', ja: 'テクニカル', tr: 'teknik', es: 'técnica' },
      'tecnica': { en: 'technical', pt: 'técnica', ar: 'تقنية', ja: 'テクニカル', tr: 'teknik', es: 'técnica' },
      'poética': { en: 'poetic', pt: 'poética', ar: 'شعرية', ja: '詩的', tr: 'şiirsel', es: 'poética' },
      'poetica': { en: 'poetic', pt: 'poética', ar: 'شعرية', ja: '詩的', tr: 'şiirsel', es: 'poética' },
      'minimalista': { en: 'minimalist', pt: 'minimalista', ar: 'بسيطة', ja: 'ミニマル', tr: 'minimalist', es: 'minimalista' },
      'racional': { en: 'rational', pt: 'racional', ar: 'عقلانية', ja: '理性的', tr: 'rasyonel', es: 'racional' },
      'inspiradora': { en: 'inspiring', pt: 'inspiradora', ar: 'ملهمة', ja: 'インスピレーション', tr: 'ilham verici', es: 'inspiradora' },
      'calmada': { en: 'calm', pt: 'calma', ar: 'هادئة', ja: '落ち着いた', tr: 'sakin', es: 'calmada' },
      'visual': { en: 'visual', pt: 'visual', ar: 'بصرية', ja: 'ビジュアル', tr: 'görsel', es: 'visual' },
      'oscura': { en: 'dark', pt: 'sombria', ar: 'داكنة', ja: 'ダーク', tr: 'karanlık', es: 'oscura' },
      'profunda': { en: 'profound', pt: 'profunda', ar: 'عميقة', ja: '深い', tr: 'derin', es: 'profunda' },
      'emocional': { en: 'emotional', pt: 'emocional', ar: 'عاطفية', ja: 'エモーショナル', tr: 'duygusal', es: 'emocional' },
      'sabia': { en: 'wise', pt: 'sábia', ar: 'حكيمة', ja: '賢い', tr: 'bilge', es: 'sabia' },
      'enigmática': { en: 'enigmatic', pt: 'enigmática', ar: 'غامضة', ja: '謎めいた', tr: 'gizemli', es: 'enigmática' },
      'dominante': { en: 'dominant', pt: 'dominante', ar: 'مهيمنة', ja: 'ドミナント', tr: 'baskın', es: 'dominante' },
      'encantadora': { en: 'charming', pt: 'encantadora', ar: 'ساحرة', ja: '魅力的', tr: 'çekici', es: 'encantadora' },
      'encantador': { en: 'charming', pt: 'encantador', ar: 'ساحر', ja: '魅力的', tr: 'çekici', es: 'encantador' },
      'joven': { en: 'young', pt: 'jovem', ar: 'شابّة', ja: '若々しい', tr: 'genç', es: 'joven' },
      'enérgica': { en: 'energetic', pt: 'energética', ar: 'نشيطة', ja: 'エネルギッシュ', tr: 'enerjik', es: 'enérgica' },
      'energica': { en: 'energetic', pt: 'energética', ar: 'نشيطة', ja: 'エネルギッシュ', tr: 'enerjik', es: 'enérgica' },
      'tranquila': { en: 'calm', pt: 'tranquila', ar: 'هادئة', ja: '落ち着いた', tr: 'sakin', es: 'tranquila' },
      'reflexiva': { en: 'reflective', pt: 'reflexiva', ar: 'تأملية', ja: '思慮深い', tr: 'düşünceli', es: 'reflexiva' },
      'positiva': { en: 'positive', pt: 'positiva', ar: 'إيجابية', ja: '前向き', tr: 'pozitif', es: 'positiva' },
      'directa': { en: 'direct', pt: 'direta', ar: 'مباشرة', ja: '率直', tr: 'doğrudan', es: 'directa' },
      'atrevido': { en: 'bold', pt: 'ousado', ar: 'جريء', ja: '大胆', tr: 'cesur', es: 'atrevido' },
      'jugueton': { en: 'playful', pt: 'brincalhão', ar: 'لعوب', ja: 'おちゃめ', tr: 'oyuncu', es: 'juguetón' },
      'juguetón': { en: 'playful', pt: 'brincalhão', ar: 'لعوب', ja: 'おちゃめ', tr: 'oyuncu', es: 'juguetón' },
    };
    const joiner = L === 'en' ? ' & ' : L === 'pt' ? ' e ' : L === 'tr' ? ' ve ' : L === 'ja' ? ' ・ ' : L === 'ar' ? ' و ' : ' y ';
    const localized = rawTokens.map(tok => toneDict[tok]?.[L] || tok).join(joiner);
    return capitalizeFirst(localized);
  }

  function translateLikeTarget(s?: string): string {
    if (!s) return '';
    const L = language;
    const raw = s.toLowerCase().trim();
    const key = raw.replace(/^(el|la|los|las)\s+/i, '').trim();
    const dict: Record<string, Record<string, string>> = {
      'los días de lluvia': { en: 'rainy days', pt: 'dias chuvosos', ar: 'أيام المطر', ja: '雨の日', tr: 'yağmurlu günler', es: 'los días de lluvia' },
      'el mar': { en: 'the sea', pt: 'o mar', ar: 'البحر', ja: '海', tr: 'deniz', es: 'el mar' },
      'mar': { en: 'sea', pt: 'mar', ar: 'بحر', ja: '海', tr: 'deniz', es: 'mar' },
      'la literatura': { en: 'literature', pt: 'literatura', ar: 'الأدب', ja: '文学', tr: 'edebiyat', es: 'la literatura' },
      'literatura': { en: 'literature', pt: 'literatura', ar: 'الأدب', ja: '文学', tr: 'edebiyat', es: 'literatura' },
      'las flores': { en: 'flowers', pt: 'flores', ar: 'الزهور', ja: '花', tr: 'çiçekler', es: 'las flores' },
      'flores': { en: 'flowers', pt: 'flores', ar: 'زهور', ja: '花', tr: 'çiçekler', es: 'flores' },
      'el café': { en: 'coffee', pt: 'café', ar: 'القهوة', ja: 'コーヒー', tr: 'kahve', es: 'el café' },
      'café': { en: 'coffee', pt: 'café', ar: 'قهوة', ja: 'コーヒー', tr: 'kahve', es: 'café' },
      'café fuerte': { en: 'strong coffee', pt: 'café forte', ar: 'قهوة قوية', ja: '濃いコーヒー', tr: 'sert kahve', es: 'café fuerte' },
      'café con canela': { en: 'coffee with cinnamon', pt: 'café com canela', ar: 'قهوة بالقرفة', ja: 'シナモンコーヒー', tr: 'tarçınlı kahve', es: 'café con canela' },
      'la moda': { en: 'fashion', pt: 'moda', ar: 'الموضة', ja: 'ファッション', tr: 'moda', es: 'la moda' },
      'moda': { en: 'fashion', pt: 'moda', ar: 'موضة', ja: 'ファッション', tr: 'moda', es: 'moda' },
      'la estética': { en: 'aesthetics', pt: 'estética', ar: 'الجماليات', ja: '美学', tr: 'estetik', es: 'la estética' },
      'estética': { en: 'aesthetics', pt: 'estética', ar: 'الجماليات', ja: '美学', tr: 'estetik', es: 'estética' },
      'el cine clásico': { en: 'classic cinema', pt: 'cinema clássico', ar: 'السينما الكلاسيكية', ja: 'クラシック映画', tr: 'klasik sinema', es: 'el cine clásico' },
      'cine clásico': { en: 'classic cinema', pt: 'cinema clássico', ar: 'السينما الكلاسيكية', ja: 'クラシック映画', tr: 'klasik sinema', es: 'cine clásico' },
      'los videojuegos': { en: 'video games', pt: 'videojogos', ar: 'ألعاب الفيديو', ja: 'ビデオゲーム', tr: 'video oyunları', es: 'los videojuegos' },
      'videojuegos': { en: 'video games', pt: 'videojogos', ar: 'ألعاب الفيديو', ja: 'ビデオゲーム', tr: 'video oyunları', es: 'videojuegos' },
      'eSports': { en: 'eSports', pt: 'eSports', ar: 'الرياضات الإلكترونية', ja: 'eスポーツ', tr: 'eSpor', es: 'eSports' },
      'puzzles': { en: 'puzzles', pt: 'quebra-cabeças', ar: 'ألعاب الألغاز', ja: 'パズル', tr: 'bulmacalar', es: 'puzzles' },
      'anime': { en: 'anime', pt: 'anime', ar: 'أنمي', ja: 'アニメ', tr: 'anime', es: 'anime' },
      'arte clásico': { en: 'classical art', pt: 'arte clássico', ar: 'فن كلاسيكي', ja: '古典美術', tr: 'klasik sanat', es: 'arte clásico' },
      'arte moderno': { en: 'modern art', pt: 'arte moderno', ar: 'فن حديث', ja: '現代アート', tr: 'modern sanat', es: 'arte moderno' },
      'filosofía': { en: 'philosophy', pt: 'filosofia', ar: 'الفلسفة', ja: '哲学', tr: 'felsefe', es: 'filosofía' },
      'libros': { en: 'books', pt: 'livros', ar: 'الكتب', ja: '本', tr: 'kitaplar', es: 'libros' },
      'ensayos literarios': { en: 'literary essays', pt: 'ensaios literários', ar: 'مقالات أدبية', ja: '文学エッセイ', tr: 'edebi denemeler', es: 'ensayos literarios' },
      'charlas': { en: 'talks', pt: 'palestras', ar: 'أحاديث', ja: 'トーク', tr: 'sohbetler', es: 'charlas' },
      'charlas ted': { en: 'TED talks', pt: 'palestras TED', ar: 'أحاديث TED', ja: 'TEDトーク', tr: 'TED konuşmaları', es: 'charlas TED' },
      'estrategia': { en: 'strategy', pt: 'estratégia', ar: 'استراتيجية', ja: '戦略', tr: 'strateji', es: 'estrategia' },
      'vino tinto': { en: 'red wine', pt: 'vinho tinto', ar: 'نبيذ أحمر', ja: '赤ワイン', tr: 'kırmızı şarap', es: 'vino tinto' },
      'música': { en: 'music', pt: 'música', ar: 'الموسيقى', ja: '音楽', tr: 'müzik', es: 'música' },
      'pintura al óleo': { en: 'oil painting', pt: 'pintura a óleo', ar: 'رسم زيتي', ja: '油絵', tr: 'yağlı boya', es: 'pintura al óleo' },
      'óleo': { en: 'oil painting', pt: 'óleo', ar: 'زيتي', ja: '油絵', tr: 'yağlıboya', es: 'óleo' },
      'retratos': { en: 'portraits', pt: 'retratos', ar: 'بورتريهات', ja: 'ポートレート', tr: 'portreler', es: 'retratos' },
      'literatura gótica': { en: 'gothic literature', pt: 'literatura gótica', ar: 'أدب قوطي', ja: 'ゴシック文学', tr: 'gotik edebiyat', es: 'literatura gótica' },
      'vino': { en: 'wine', pt: 'vinho', ar: 'نبيذ', ja: 'ワイン', tr: 'şarap', es: 'vino' },
      'moda alternativa': { en: 'alternative fashion', pt: 'moda alternativa', ar: 'موضة بديلة', ja: 'オルタナ系ファッション', tr: 'alternatif moda', es: 'moda alternativa' },
      'charlas inspiradoras': { en: 'inspiring talks', pt: 'palestras inspiradoras', ar: 'أحاديث ملهمة', ja: 'インスパイアなトーク', tr: 'ilham verici konuşmalar', es: 'charlas inspiradoras' },
      'champagne': { en: 'champagne', pt: 'champanhe', ar: 'شمبانيا', ja: 'シャンパン', tr: 'şampanya', es: 'champagne' },
      'poesía': { en: 'poetry', pt: 'poesia', ar: 'شعر', ja: '詩', tr: 'şiir', es: 'poesía' },
      'ensayos': { en: 'essays', pt: 'ensaios', ar: 'مقالات', ja: 'エッセイ', tr: 'denemeler', es: 'ensayos' },
      'cenas formales': { en: 'formal dinners', pt: 'jantares formais', ar: 'عشاء رسمي', ja: 'フォーマルディナー', tr: 'resmî yemekler', es: 'cenas formales' },
    };
    if (dict[raw]?.[L]) return dict[raw][L];
    if (dict[key]?.[L]) return dict[key][L];
    // Fallback de palabras sueltas comunes
    const singleMap: Record<string, Record<string,string>> = {
      'mar': { ja: '海', en: 'sea', pt: 'mar', ar: 'بحر', tr: 'deniz', es: 'mar' },
      'literatura': { ja: '文学', en: 'literature', pt: 'literatura', ar: 'الأدب', tr: 'edebiyat', es: 'literatura' },
      'flores': { ja: '花', en: 'flowers', pt: 'flores', ar: 'زهور', tr: 'çiçekler', es: 'flores' },
      'café': { ja: 'コーヒー', en: 'coffee', pt: 'café', ar: 'قهوة', tr: 'kahve', es: 'café' },
      'videojuegos': { ja: 'ビデオゲーム', en: 'video games', pt: 'videojogos', ar: 'ألعاب الفيديو', tr: 'video oyunları', es: 'videojuegos' },
      'música': { ja: '音楽', en: 'music', pt: 'música', ar: 'الموسيقى', tr: 'müzik', es: 'música' },
      'moda': { ja: 'ファッション', en: 'fashion', pt: 'moda', ar: 'موضة', tr: 'moda', es: 'moda' },
      'estética': { ja: '美学', en: 'aesthetics', pt: 'estética', ar: 'الجماليات', tr: 'estetik', es: 'estética' },
    };
    return singleMap[key]?.[L] || s;
  }
  const COUNTRY_TO_CODE: Record<string, string> = {
    "Italia": "IT",
    "Portugal": "PT",
    "Estados Unidos": "US",
    "Rusia": "RU",
    "Alemania": "DE",
    "Canadá": "CA",
    "Corea del Sur": "KR",
    "España": "ES",
    "República Checa": "CZ",
    "Hungría": "HU",
    "Austria": "AT",
    "Reino Unido": "GB",
    "Francia": "FR",
    "Japón": "JP",
    "Suecia": "SE",
    "Argentina": "AR",
  };
  function emojiFlagFromCode(code?: string | null): string | null {
    if (!code) return null;
    const cc = code.toUpperCase();
    if (cc.length !== 2) return null;
    const A = 127397; // regional indicator base
    return String.fromCodePoint(cc.charCodeAt(0) + A) + String.fromCodePoint(cc.charCodeAt(1) + A);
  }
  const countryName = countryFromCity(persona?.city);
  // Subdivisión especial: Escocia -> usar bandera negra simple por estabilidad
  const flagEmoji = countryName === 'Escocia'
    ? '🏴'
    : (emojiFlagFromCode(countryName ? COUNTRY_TO_CODE[countryName] : undefined) || null);

  // Helpers para atributos mostrados (solo primeros 4)
  function capitalizeFirst(s?: string) {
    if (!s) return '';
    return s.charAt(0).toUpperCase() + s.slice(1);
  }
  function feminizeTone(text?: string) {
    if (!text) return '';
    const map: Record<string, string> = {
      'romántico': 'romántica',
      'cálido': 'cálida',
      'sereno': 'serena',
      'ligero': 'ligera',
      'amable': 'amable',
      'introspectivo': 'introspectiva',
      'dominante': 'dominante',
      'seguro': 'segura',
      'profundo': 'profunda',
      'oscuro': 'oscura',
      'poético': 'poética',
      'sofisticado': 'sofisticada',
      'intelectual': 'intelectual',
      'juguetón': 'juguetona',
      'atractivo': 'atractiva',
    };
    let out = ' ' + text.toLowerCase() + ' ';
    Object.entries(map).forEach(([k, v]) => {
      out = out.replace(new RegExp(`\\b${k}\\b`, 'g'), v);
    });
    return out.trim();
  }
  function emojiForPhrase(s?: string) {
    const x = (s || '').toLowerCase();
    if (x.includes('café')) return '☕️';
    if (x.includes('mar') || x.includes('playa')) return '🌊';
    if (x.includes('literatura') || x.includes('libro')) return '📚';
    if (x.includes('flores') || x.includes('flor')) return '🌸';
    if (x.includes('música') || x.includes('jazz')) return '🎵';
    if (x.includes('foto') || x.includes('fotógraf')) return '📸';
    if (x.includes('moda') || x.includes('diseñ')) return '👗';
    if (x.includes('arte') || x.includes('pint')) return '🎨';
    if (x.includes('ópera') || x.includes('opera')) return '🎼';
    if (x.includes('museo') || x.includes('galería') || x.includes('galeria')) return '🏛️';
    if (x.includes('perfume')) return '💄';
    if (x.includes('vino')) return '🍷';
    if (x.includes('gato')) return '🐱';
    if (x.includes('juego') || x.includes('gamer') || x.includes('indie')) return '🎮';
    if (x.includes('sushi')) return '🍣';
    if (x.includes('lo-fi') || x.includes('lofi') || x.includes('auriculares') || x.includes('playlist')) return '🎧';
    if (x.includes('estrateg')) return '♟️';
    return '✨';
  }
  
  const handleClick = () => {
    if (userAccess.hasAccess) {
      onSelect(model.id);
    } else {
      onPurchase(model.id);
    }
  };

  const getBadgeVariant = () => {
    if (userAccess.hasAccess) {
      return model.type === 'free' ? 'secondary' : 'default';
    }
    return 'destructive';
  };

  const getBadgeText = () => {
    if (userAccess.hasAccess) {
      return model.type === 'free' ? t('model.free') : t('model.unlocked');
    }
    
    switch (model.type) {
      case 'premium':
        return t('model.premium');
      case 'one_time':
        return model.price ? `${formatUSD(Number(model.price || 0))}` : t('model.oneTime');
      default:
        return t('model.free');
    }
  };

  const getBadgeIcon = () => {
    if (userAccess.hasAccess) {
      return null;
    }
    
    switch (model.type) {
      case 'premium':
        return <Crown className="w-3 h-3" />;
      case 'one_time':
        return <CreditCard className="w-3 h-3" />;
      default:
        return <Lock className="w-3 h-3" />;
    }
  };

  // Cargar imagen solo cuando el card entra en viewport
  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;
    const obs = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting) {
        setVisible(true);
        obs.disconnect();
      }
    }, { root: null, rootMargin: '100px', threshold: 0.1 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div className="relative group" ref={cardRef}>
      {/* Glow continuo siempre activo para premium y one_time */}
      {visible && (model.type === 'premium' || model.type === 'one_time') && (
        <div
          className={`pointer-events-none absolute -inset-6 rounded-3xl blur-2xl z-0 transition-transform duration-200 group-hover:scale-[1.02] ${
            model.type === 'premium'
              ? 'bg-fuchsia-500/35 opacity-70' /* premium: sin animación */
              : 'bg-amber-300/40 opacity-70'
          }`}
          aria-hidden="true"
        />
      )}
      {visible && (model.type === 'premium' || model.type === 'one_time') && (
        <div
          className={`pointer-events-none absolute -inset-2 rounded-2xl z-0 transition-transform duration-200 group-hover:scale-[1.02] ${
            model.type === 'premium'
              ? 'ring-4 ring-fuchsia-400/50'
              : 'ring-4 ring-yellow-300/60'
          }`}
        />
      )}
      <Card 
        className={`relative z-10 cursor-pointer transition-transform duration-200 group-hover:scale-[1.02] hover:shadow-md ${
        !userAccess.hasAccess && model.type === 'premium' 
          ? 'shadow-[0_0_30px_12px_rgba(147,51,234,0.28)]' 
          : !userAccess.hasAccess && model.type === 'one_time'
          ? 'shadow-[0_0_30px_12px_rgba(251,191,36,0.28)]'
          : ''
      }`}
      onClick={handleClick}
    >
      <CardContent className="p-0 flex flex-col h-full">
        {/* Imagen del modelo */}
        <div className="relative aspect-[3/4] overflow-hidden rounded-t-lg" style={{ contentVisibility: 'auto', containIntrinsicSize: '400px 533px' }}>
          <img 
            src={imgSrc}
            alt={model.name}
            loading="lazy"
            decoding="async"
            fetchPriority="low"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 300px"
            width={400}
            height={533}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
            onError={(e) => {
              const url = model.image_url || '';
              if ((e.currentTarget as HTMLImageElement).src !== url) {
                setImgSrc(url);
              }
            }}
          />
          
          {/* Overlay de bloqueo - solo para modelos premium y one_time */}
          {visible && !userAccess.hasAccess && model.type !== 'free' && (
            <div className={`absolute inset-0 flex items-center justify-center ${model.type === 'premium' ? 'bg-gradient-to-br from-purple-900 via-fuchsia-900 to-purple-950 shadow-[0_0_60px_20px_rgba(147,51,234,0.45)_inset]' : model.type === 'one_time' ? 'bg-gradient-to-br from-yellow-900 via-amber-900 to-yellow-950 shadow-[0_0_60px_20px_rgba(251,191,36,0.45)_inset]' : 'bg-black/70'} rounded-t-lg overflow-hidden`}>
              {model.type === 'premium' && (
                <>
                  {/* Halo exterior brillante y animado */}
                  <div className="pointer-events-none absolute -inset-6 rounded-2xl bg-purple-600/25 blur-2xl" />
                  {/* Borde glow animado */}
                  <div className="pointer-events-none absolute inset-0 rounded-t-lg ring-2 ring-fuchsia-400/25" />
                </>
              )}
              {model.type === 'one_time' && (
                <>
                  {/* Halo exterior dorado y animado */}
                  <div className="pointer-events-none absolute -inset-6 rounded-2xl bg-yellow-600/30 blur-2xl" />
                  {/* Borde glow dorado animado */}
                  <div className="pointer-events-none absolute inset-0 rounded-t-lg ring-2 ring-yellow-400/30" />
                </>
              )}
              <div className="relative text-center text-white z-10">
                {model.type === 'premium' ? (
                  <Crown className="w-8 h-8 mx-auto mb-2 text-yellow-300" />
                ) : (
                  <Lock className="w-8 h-8 mx-auto mb-2 text-red-400" />
                )}
                <p className="text-sm font-medium">
                  {model.type === 'premium' ? t('model.premium') : model.price ? `${formatUSD(Number(model.price || 0))}` : t('model.locked')}
                </p>
              </div>
            </div>
          )}

          {/* Badge de tipo */}
          <div className="absolute top-2 inline-start-2">
            <Badge 
              variant={getBadgeVariant()}
              className="flex items-center gap-1 text-xs"
            >
              {getBadgeIcon()}
              {getBadgeText()}
            </Badge>
          </div>

          {/* Rating */}
          <div className="absolute bottom-2 inline-end-2 flex items-center gap-1 bg-background/80 backdrop-blur-sm rounded-full px-2 py-1">
            <Star className="w-3 h-3 text-primary fill-current" />
            <span className="text-xs font-medium">{model.rating}</span>
          </div>
        </div>

        {/* Información del modelo */}
        <div className="p-4 flex flex-col h-full">
          <h3 className="font-bold text-lg text-foreground uppercase tracking-wide mb-2">
            {model.name}
          </h3>
          
          {isEnhancedCard ? (
            // Atributos compactos (profesión • tono • afición)
            <p className="text-sm text-foreground/90 mb-3 min-h-[60px] line-clamp-3">
              {(() => {
                const attrs: string[] = [];
                if (persona?.profession) {
                  const profTr = translateProfession(persona.profession);
                  const prof = `${capitalizeFirst(profTr)} ${emojiForPhrase(persona.profession)}`.trim();
                  attrs.push(prof);
                }
                if (persona?.toneBase) {
                  const toneTxt = translateTone(feminizeTone(persona.toneBase));
                  attrs.push(toneTxt);
                }
                if (persona?.likes && persona.likes.length) {
                  const like0 = String(persona.likes[0]).trim();
                  const noArticle = like0.replace(/^(el|la|los|las)\s+/i, '').trim();
                  let connectorKey = '' as
                    | 'amante_de' | 'enamorada_del' | 'apasionada_por' | 'le_encantan' | 'fan_de' | 'entusiasta_del' | 'le_inspira' | 'fascinada_por' | 'devota_de' | 'devota_del' | 'disfruta_de' | 'experta_en' | 'obsesionada_con' | 'enamorada_de' | 'inspirada_por';
                  if (isEnhancedCard) {
                    if (model.id === '1') connectorKey = 'amante_de';
                    else if (model.id === '2') connectorKey = 'enamorada_del';
                    else if (model.id === '3') connectorKey = 'apasionada_por';
                    else if (model.id === '4') connectorKey = 'le_encantan';
                    else if (model.id === '5') connectorKey = 'fan_de';
                    else if (model.id === '6') connectorKey = 'amante_de';
                    else if (model.id === '7') connectorKey = 'entusiasta_del';
                    else if (model.id === '8') connectorKey = 'le_inspira';
                    else if (model.id === '9') connectorKey = 'fascinada_por';
                    else if (model.id === '10') connectorKey = 'amante_de';
                    else if (model.id === '11') connectorKey = 'apasionada_por';
                    else if (model.id === '12') connectorKey = 'devota_de';
                    else if (model.id === '13') connectorKey = 'amante_de';
                    else if (model.id === '14') connectorKey = 'disfruta_de';
                    else if (model.id === '15') connectorKey = 'enamorada_de';
                    else if (model.id === '16') connectorKey = 'experta_en';
                    else if (model.id === '17') connectorKey = 'fan_de';
                    else if (model.id === '18') connectorKey = 'devota_del';
                    else if (model.id === '19') connectorKey = 'obsesionada_con';
                    else if (model.id === '20') connectorKey = 'enamorada_de';
                    else if (model.id === '21') connectorKey = 'amante_de';
                    else if (model.id === '22') connectorKey = 'devota_de';
                    else if (model.id === '23') connectorKey = 'obsesionada_con';
                    else if (model.id === '24') connectorKey = 'inspirada_por';
                  }
                  const connector = translateConnector(connectorKey || 'amante_de');
                  const baseTarget = language === 'es' ? (connectorKey?.endsWith('_del') ? noArticle : like0) : noArticle;
                  const likeTargetLocalized = translateLikeTarget(baseTarget);
                  const like = language === 'ja'
                    ? `${likeTargetLocalized}${connector} ${emojiForPhrase(like0)}`.trim()
                    : `${connector} ${likeTargetLocalized} ${emojiForPhrase(like0)}`.trim();
                  attrs.push(like);
                }
                return attrs.join(' • ');
              })()}
            </p>
          ) : (
            <p className="text-sm text-muted-foreground line-clamp-2 mb-3 min-h-[48px]">
              {(() => {
                const key = `models.${model.id}.description`;
                const localized = t(key);
                return localized === key ? model.description : localized;
              })()}
            </p>
          )}

          {/* Línea meta: bandera + ciudad, solo para los 4 primeros */}
          {isEnhancedCard && persona?.city && (
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-2 min-h-[16px]">
              {flagEmoji && <span aria-hidden>{flagEmoji}</span>}
              <span className="truncate">{persona.city}</span>
            </div>
          )}
          
          {/* Tags: ocultar para las tarjetas enriquecidas; mantener para el resto */}
          {!isEnhancedCard && (
            <div className="flex flex-wrap gap-1 mb-3 min-h-[28px]">
              {(() => {
                const localized = ta(`models.${model.id}.tags`);
                const tags = (localized && localized.length > 0) ? localized : model.tags;
                return (tags as string[]).slice(0, 3).map((tag) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="text-xs px-2 py-1"
                  >
                    {tag}
                  </Badge>
                ));
              })()}
            </div>
          )}

          {/* Botón de acción */}
          <Button 
            className={`w-full ${
              userAccess.hasAccess 
                ? 'bg-white text-gray-900 hover:bg-gray-100 border border-gray-200 shadow'
                : model.type === 'premium'
                  ? 'bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white shadow-lg'
                  : model.type === 'one_time'
                    ? 'relative bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-white shadow-lg'
                    : 'bg-yellow-500 hover:bg-yellow-600 text-white'
            }`}
            onClick={handleClick}
          >
            {userAccess.hasAccess ? (
              `${t('model.talkWith')} ${model.name}`
            ) : model.type === 'free' && !user ? (
              <>
                <User className="w-4 h-4 mr-2" />
                {t('model.login')}
              </>
            ) : model.type === 'premium' ? (
              <>
                <Crown className="w-4 h-4 mr-2" />
                {t('chat.upgradeToPremium')}
              </>
            ) : (
              <>
                <CreditCard className="w-4 h-4 mr-2" />
                {model.price ? `${t('model.buyFor')} ${formatUSD(Number(model.price || 0))}` : t('model.buy')}
              </>
            )}
          </Button>
          {/* Glow para pago único */}
          {visible && !userAccess.hasAccess && model.type === 'one_time' && (
            <div className="pointer-events-none absolute inset-x-4 -bottom-1 h-8 blur-lg rounded-full bg-gradient-to-r from-yellow-300 via-amber-300 to-yellow-300 opacity-60"></div>
          )}
        </div>
      </CardContent>
      </Card>
    </div>
  );
}

// Evitar re-renderizados innecesarios
function areEqual(prev: ModelCardWithAccessProps, next: ModelCardWithAccessProps) {
  const a = prev.model;
  const b = next.model;
  return (
    a.id === b.id &&
    a.name === b.name &&
    a.image_url === b.image_url &&
    a.type === b.type &&
    a.price === b.price &&
    a.rating === b.rating &&
    prev.userAccess.hasAccess === next.userAccess.hasAccess &&
    (!!prev.user === !!next.user)
  );
}

export const ModelCardWithAccess = memo(ModelCardWithAccessComponent, areEqual);
