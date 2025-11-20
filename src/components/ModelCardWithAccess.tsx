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
  const { t, ta } = useTranslation();
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
                  const prof = `${capitalizeFirst(persona.profession)} ${emojiForPhrase(persona.profession)}`.trim();
                  attrs.push(prof);
                }
                if (persona?.toneBase) {
                  const toneTxt = capitalizeFirst(feminizeTone(persona.toneBase));
                  attrs.push(toneTxt);
                }
                if (persona?.likes && persona.likes.length) {
                  const like0 = String(persona.likes[0]).trim();
                  let likePhrase = '';
                  if (isEnhancedCard) {
                    if (model.id === '1') { // Victoria
                      likePhrase = `Amante de ${like0}`;
                    } else if (model.id === '2') { // Luna
                      likePhrase = `Enamorada del ${like0.replace(/^el\s+/i, '').trim()}`;
                    } else if (model.id === '3') { // Ginger
                      likePhrase = `Apasionada por ${like0}`;
                    } else if (model.id === '4') { // Beauty
                      likePhrase = `Le encantan ${like0.replace(/^las\s+/i, 'las ').replace(/^los\s+/i, 'los ').trim()}`;
                    } else if (model.id === '5') { // Blu
                      likePhrase = `Fan de ${like0}`;
                    } else if (model.id === '6') { // Resha
                      likePhrase = `Amante de ${like0}`;
                    } else if (model.id === '7') { // Yu
                      likePhrase = `Entusiasta del ${like0.replace(/^el\s+/i, '').trim()}`;
                    } else if (model.id === '8') { // Reyna
                      likePhrase = `Le inspira ${like0}`;
                    } else if (model.id === '9') { // Nocturne
                      likePhrase = `Fascinada por ${like0}`;
                    } else if (model.id === '10') { // Erit
                      likePhrase = `Amante de ${like0}`;
                    } else if (model.id === '11') { // Vanth
                      likePhrase = `Apasionada por ${like0}`;
                    } else if (model.id === '12') { // Belladonna
                      likePhrase = `Devota de ${like0}`;
                    } else if (model.id === '13') { // Renata
                      likePhrase = `Amante de ${like0}`;
                    } else if (model.id === '14') { // Bianca
                      likePhrase = `Disfruta de ${like0}`;
                    } else if (model.id === '15') { // Aiko
                      likePhrase = `Enamorada de ${like0}`;
                    } else if (model.id === '16') { // Paris
                      likePhrase = `Experta en ${like0}`;
                    } else if (model.id === '17') { // Chloe
                      likePhrase = `Fan de ${like0}`;
                    } else if (model.id === '18') { // Sasha
                      likePhrase = `Devota del ${like0.replace(/^el\s+/i, '').trim()}`;
                    } else if (model.id === '19') { // Alessia
                      likePhrase = `Obsesionada con ${like0}`;
                    } else if (model.id === '20') { // Rebecca
                      likePhrase = `Enamorada de ${like0}`;
                    } else if (model.id === '21') { // Ahri
                      likePhrase = `Amante de ${like0}`;
                    } else if (model.id === '22') { // Asuma
                      likePhrase = `Devota de ${like0}`;
                    } else if (model.id === '23') { // Raven
                      likePhrase = `Obsesionada con ${like0}`;
                    } else if (model.id === '24') { // Arya
                      likePhrase = `Inspirada por ${like0}`;
                    }
                  }
                  const like = `${likePhrase || capitalizeFirst(like0)} ${emojiForPhrase(like0)}`.trim();
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
