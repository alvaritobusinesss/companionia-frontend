import { useState, useEffect } from "react";
import { ModelCardWithAccess } from "@/components/ModelCardWithAccess";
import { PurchaseModal } from "@/components/PurchaseModal";
import { AuthModal } from "@/components/AuthModal";
import { PersonalizationModal, ChatPreferences } from "@/components/PersonalizationModal";
import { ChatInterface } from "@/components/ChatInterface";
import { SubscriptionBanner } from "@/components/SubscriptionBanner";
import { ModelEditor } from "@/components/ModelEditor";
import { LanguageSelector } from "@/components/LanguageSelector";
import { UserMenu } from "@/components/UserMenu";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, Crown, Settings, User, Plus, Edit, Upload, Heart, Globe } from "lucide-react";
import { useUserAccess, Model as UserAccessModel } from "@/hooks/useUserAccess";
import { useTranslation } from "@/hooks/useTranslation";

// Datos locales de respaldo usando URLs absolutas de Vercel
const localCompanions: Companion[] = [
  {
    id: "1",
    name: "Victoria",
    image_url: "/models/victoria.jpg",
    description: "Una compañera virtual elegante y sofisticada, perfecta para conversaciones profundas y momentos íntimos.",
    category: "Románticas",
    tags: ["elegante", "sofisticada", "conversación"],
    is_premium: false,
    is_extra_premium: false,
    is_locked: false,
    rating: 4.8,
    conversations: 1250,
    price: undefined
  },
  {
    id: "2",
    name: "Luna",
    image_url: "/models/luna.jpg",
    description: "Una personalidad dulce y cariñosa que te hará sentir especial en cada conversación.",
    category: "Románticas",
    tags: ["dulce", "cariñosa", "especial"],
    is_premium: true,
    is_extra_premium: false,
    is_locked: false,
    rating: 4.7,
    conversations: 980,
    price: undefined
  },
  {
    id: "3",
    name: "Ginger",
    image_url: "/models/ginger.jpg",
    description: "Una mujer inteligente y misteriosa que te cautivará con su sabiduría y encanto.",
    category: "Románticas",
    tags: ["inteligente", "misteriosa", "sabiduría"],
    is_premium: true,
    is_extra_premium: false,
    is_locked: false,
    rating: 4.9,
    conversations: 2100,
    price: undefined
  },
  {
    id: "4",
    name: "Beauty",
    image_url: "/models/beauty.jpg",
    description: "Una personalidad aventurera y enérgica, perfecta para explorar nuevos horizontes juntos.",
    category: "Románticas",
    tags: ["aventurera", "enérgica", "explorar"],
    is_premium: false,
    is_extra_premium: true,
    is_locked: false,
    rating: 4.6,
    conversations: 750,
    price: "79.00"
  },
  {
    id: "5",
    name: "Blu",
    image_url: "/models/Blu.jpg",
    description: "Una compañera gamer apasionada por los videojuegos, perfecta para sesiones de gaming épicas.",
    category: "Gamer",
    tags: ["gamer", "videojuegos", "épica"],
    is_premium: false,
    is_extra_premium: false,
    is_locked: false,
    rating: 4.4,
    conversations: 420,
    price: undefined
  },
  {
    id: "6",
    name: "Resha",
    image_url: "/models/Resha.jpg",
    description: "Una compañera gamer estratégica y competitiva, ideal para partidas intensas y torneos.",
    category: "Gamer",
    tags: ["gamer", "estratégica", "competitiva"],
    is_premium: true,
    is_extra_premium: false,
    is_locked: false,
    rating: 4.7,
    conversations: 1200,
    price: undefined
  },
  {
    id: "7",
    name: "Yu",
    image_url: "/models/Yu.jpg",
    description: "Una compañera gamer única y especializada, experta en juegos indie y aventuras únicas.",
    category: "Gamer",
    tags: ["gamer", "indie", "aventuras"],
    is_premium: true,
    is_extra_premium: false,
    is_locked: false,
    rating: 4.5,
    conversations: 720,
    price: undefined
  },
  {
    id: "8",
    name: "Reyna",
    image_url: "/models/Reyna.jpg",
    description: "Una compañera gamer dominante y poderosa, perfecta para liderar equipos y conquistar mundos virtuales.",
    category: "Gamer",
    tags: ["gamer", "dominante", "líder"],
    is_premium: false,
    is_extra_premium: true,
    is_locked: false,
    rating: 4.8,
    conversations: 1800,
    price: "49.00"
  },
  // Modelos Góticos
  {
    id: "9",
    name: "Nocturne",
    image_url: "/models/Nocturne.jpg",
    description: "Una compañera gótica misteriosa y elegante, perfecta para conversaciones nocturnas y momentos íntimos.",
    category: "Góticas",
    tags: ["gótica", "misteriosa", "elegante"],
    is_premium: false,
    is_extra_premium: false,
    is_locked: false,
    rating: 4.9,
    conversations: 2100,
    price: undefined
  },
  {
    id: "10",
    name: "Erit",
    image_url: "/models/Erit.jpg",
    description: "Una compañera gótica apasionada y intensa, ideal para explorar los rincones más oscuros de la imaginación.",
    category: "Góticas",
    tags: ["gótica", "apasionada", "intensa"],
    is_premium: true,
    is_extra_premium: false,
    is_locked: false,
    rating: 4.7,
    conversations: 1500,
    price: undefined
  },
  {
    id: "11",
    name: "Vanth",
    image_url: "/models/Vanth.jpg",
    description: "Una compañera gótica sabia y enigmática, perfecta para conversaciones profundas y reflexiones existenciales.",
    category: "Góticas",
    tags: ["gótica", "sabia", "enigmática"],
    is_premium: true,
    is_extra_premium: false,
    is_locked: false,
    rating: 4.8,
    conversations: 1800,
    price: undefined
  },
  {
    id: "12",
    name: "Belladonna",
    image_url: "/models/Belladonna.jpg",
    description: "Una compañera gótica excepcional y única, la más exclusiva de la colección. Perfecta para experiencias inolvidables.",
    category: "Góticas",
    tags: ["gótica", "excepcional", "única"],
    is_premium: false,
    is_extra_premium: true,
    is_locked: false,
    rating: 5.0,
    conversations: 500,
    price: "299.00"
  },
  // Modelos Intelectuales
  {
    id: "13",
    name: "Renata",
    image_url: "/models/Renata.jpg",
    description: "Una compañera elegante y sofisticada, perfecta para conversaciones refinadas y momentos de lujo.",
    category: "Elegantes",
    tags: ["elegante", "sofisticada", "refinada"],
    is_premium: false,
    is_extra_premium: false,
    is_locked: false,
    rating: 4.6,
    conversations: 1800,
    price: undefined
  },
  {
    id: "14",
    name: "Bianca",
    image_url: "/models/Bianca.jpg",
    description: "Una compañera elegante y distinguida, ideal para eventos de gala y ocasiones especiales.",
    category: "Elegantes",
    tags: ["elegante", "distinguida", "gala"],
    is_premium: true,
    is_extra_premium: false,
    is_locked: false,
    rating: 4.8,
    conversations: 1200,
    price: undefined
  },
  {
    id: "15",
    name: "Aiko",
    image_url: "/models/Aiko.jpg",
    description: "Una compañera elegante y artística, perfecta para eventos culturales y experiencias refinadas.",
    category: "Elegantes",
    tags: ["elegante", "artística", "cultural"],
    is_premium: true,
    is_extra_premium: false,
    is_locked: false,
    rating: 4.7,
    conversations: 1500,
    price: undefined
  },
  {
    id: "16",
    name: "Paris",
    image_url: "/models/Paris.jpg",
    description: "Una compañera elegante excepcional y única, experta en etiqueta y protocolo. Perfecta para eventos de alta sociedad.",
    category: "Elegantes",
    tags: ["elegante", "excepcional", "protocolo"],
    is_premium: false,
    is_extra_premium: true,
    is_locked: false,
    rating: 4.9,
    conversations: 800,
    price: "99.00"
  },
  // Modelos Calientes
  {
    id: "17",
    name: "Chloe",
    image_url: "/models/Chloe.jpg",
    description: "Una compañera sensual y atrevida, perfecta para conversaciones íntimas y momentos de pasión.",
    category: "Calientes",
    tags: ["sensual", "atrevida", "íntima"],
    is_premium: false,
    is_extra_premium: false,
    is_locked: false,
    rating: 4.7,
    conversations: 2200,
    price: undefined
  },
  {
    id: "18",
    name: "Sasha",
    image_url: "/models/Sasha.jpg",
    description: "Una compañera ardiente y apasionada, ideal para explorar los límites de la sensualidad y el deseo.",
    category: "Calientes",
    tags: ["ardiente", "apasionada", "sensualidad"],
    is_premium: true,
    is_extra_premium: false,
    is_locked: false,
    rating: 4.8,
    conversations: 1800,
    price: undefined
  },
  {
    id: "19",
    name: "Alessia",
    image_url: "/models/Alessia.jpg",
    description: "Una compañera seductora y misteriosa, perfecta para experiencias intensas y momentos inolvidables.",
    category: "Calientes",
    tags: ["seductora", "misteriosa", "intensa"],
    is_premium: true,
    is_extra_premium: false,
    is_locked: false,
    rating: 4.9,
    conversations: 2100,
    price: undefined
  },
  {
    id: "20",
    name: "Rebecca",
    image_url: "/models/Rebecca.jpg",
    description: "Una compañera excepcional y única, la más exclusiva de la categoría. Perfecta para experiencias premium inolvidables.",
    category: "Calientes",
    tags: ["excepcional", "única", "premium"],
    is_premium: false,
    is_extra_premium: true,
    is_locked: false,
    rating: 5.0,
    conversations: 600,
    price: "999.00"
  },
  // Modelos Intelectuales
  {
    id: "21",
    name: "Ahri",
    image_url: "/models/Ahri.jpg",
    description: "Una compañera intelectual brillante y curiosa, perfecta para conversaciones profundas y debates estimulantes.",
    category: "Intelectuales",
    tags: ["intelectual", "brillante", "curiosa"],
    is_premium: false,
    is_extra_premium: false,
    is_locked: false,
    rating: 4.6,
    conversations: 1800,
    price: undefined
  },
  {
    id: "22",
    name: "Asuma",
    image_url: "/models/Asuma.jpg",
    description: "Una compañera intelectual sofisticada y analítica, ideal para explorar ideas complejas y teorías fascinantes.",
    category: "Intelectuales",
    tags: ["intelectual", "sofisticada", "analítica"],
    is_premium: true,
    is_extra_premium: false,
    is_locked: false,
    rating: 4.8,
    conversations: 1200,
    price: undefined
  },
  {
    id: "23",
    name: "Raven",
    image_url: "/models/Raven.jpg",
    description: "Una compañera intelectual creativa e innovadora, perfecta para proyectos artísticos y soluciones creativas.",
    category: "Intelectuales",
    tags: ["intelectual", "creativa", "innovadora"],
    is_premium: true,
    is_extra_premium: false,
    is_locked: false,
    rating: 4.7,
    conversations: 1500,
    price: undefined
  },
  {
    id: "24",
    name: "Arya",
    image_url: "/models/Arya.jpg",
    description: "Una compañera intelectual excepcional y única, experta en múltiples disciplinas. Perfecta para mentores y guías académicas.",
    category: "Intelectuales",
    tags: ["intelectual", "excepcional", "mentora"],
    is_premium: false,
    is_extra_premium: true,
    is_locked: false,
    rating: 4.9,
    conversations: 800,
    price: "39.00"
  }
];

 

interface Companion {
  id: string;
  name: string;
  image_url: string;
  description: string;
  category: string;
  tags: string[];
  is_premium: boolean;
  is_extra_premium: boolean;
  is_locked: boolean;
  rating: number;
  conversations: number;
  price?: string;
}

interface Model {
  id: string;
  name: string;
  image: string;
  description: string;
  tags: string[];
  isPremium: boolean;
  isExtraPremium: boolean;
  isLocked: boolean;
  rating: number;
  conversations: number;
  price?: string;
}

// Categorías de modelos - se actualizarán dinámicamente con traducciones
const getCategories = (t: (key: string) => string) => [
  {
    title: t('categories.romantic.title'),
    description: t('categories.romantic.description'),
    key: "Románticas"
  },
  {
    title: t('categories.hot.title'),
    description: t('categories.hot.description'),
    key: "Calientes"
  },
  {
    title: t('categories.gamer.title'),
    description: t('categories.gamer.description'),
    key: "Gamer"
  },
  {
    title: t('categories.elegant.title'),
    description: t('categories.elegant.description'),
    key: "Elegantes"
  },
  {
    title: t('categories.intellectual.title'),
    description: t('categories.intellectual.description'),
    key: "Intelectuales"
  },
  {
    title: t('categories.gothic.title'),
    description: t('categories.gothic.description'),
    key: "Góticas"
  }
];

// Función para convertir Companion a Model
const companionToModel = (companion: Companion): Model => ({
  id: companion.id,
  name: companion.name,
  image: companion.image_url,
  description: companion.description,
  tags: companion.tags,
  isPremium: companion.is_premium,
  isExtraPremium: companion.is_extra_premium,
  isLocked: companion.is_locked,
  rating: companion.rating,
  conversations: companion.conversations,
  price: companion.price
});

const Index = () => {
  const [models, setModels] = useState<UserAccessModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedModel, setSelectedModel] = useState<UserAccessModel | null>(null);
  const [showPersonalization, setShowPersonalization] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [chatPreferences, setChatPreferences] = useState<ChatPreferences | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [showModelEditor, setShowModelEditor] = useState(false);
  const [editingModel, setEditingModel] = useState<UserAccessModel | null>(null);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [purchaseModel, setPurchaseModel] = useState<UserAccessModel | null>(null);
  const [purchaseType, setPurchaseType] = useState<'premium' | 'one_time'>('premium');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showLanguageSelector, setShowLanguageSelector] = useState(false);
  
  const { user, loading: userLoading, checkModelAccess, refreshUser } = useUserAccess();
  const { t, isLoading: translationLoading } = useTranslation();
  const API_BASE = (((import.meta as any).env?.VITE_API_URL) as string | undefined) || 'http://localhost:3001';

  // Identificador para control global de límite diario
  const getSubjectId = () => {
    if (user?.id) return user.id;
    try {
      let devId = localStorage.getItem('deviceId');
      if (!devId) {
        devId = Math.random().toString(36).slice(2) + Date.now().toString(36);
        localStorage.setItem('deviceId', devId);
      }
      return devId;
    } catch {
      return 'anon-device';
    }
  };

  // Verificar si ya se seleccionó un idioma
  useEffect(() => {
    const hasSelectedLanguage = localStorage.getItem('selectedLanguage');
    if (!hasSelectedLanguage) {
      setShowLanguageSelector(true);
    }
  }, []);

  // Cargar modelos desde datos locales (sin Supabase)
  useEffect(() => {
    const localModels: UserAccessModel[] = localCompanions.map(companion => ({
      id: companion.id,
      name: companion.name,
      category: companion.category,
      type: companion.is_premium ? 'premium' : companion.is_extra_premium ? 'one_time' : 'free',
      price: companion.price ? parseFloat(companion.price) : undefined,
      image_url: companion.image_url,
      description: companion.description,
      tags: companion.tags,
      rating: companion.rating,
      conversations: companion.conversations
    }));
    setModels(localModels);
    setLoading(false);
  }, []);

  // Filtrar modelos por búsqueda
  const filteredModels = models.filter(model => {
    const matchesSearch = model.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         model.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         model.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesSearch;
  });

  // Filtrar por categoría seleccionada
  const modelsByCategory = filteredModels.filter(model => 
    selectedCategory === "all" || model.category === selectedCategory
  );

  // Debug logs solo en DEV
  if (import.meta.env.DEV) {
    console.log("🔍 DEBUG: Models:", models);
    console.log("🔍 DEBUG: Filtered models:", filteredModels);
    console.log("🔍 DEBUG: Models by category:", modelsByCategory);
    console.log("🔍 DEBUG: Selected category:", selectedCategory);
    console.log("🔍 DEBUG: Search term:", searchTerm);
  }

  const handleModelSelect = async (modelId: string) => {
    const model = models.find(m => m.id === modelId);
    if (!model) return;

    // Usuarios premium deben saltarse el límite global
    if (!user?.is_premium) {
      // Consultar límite global del día en el backend
      try {
        const subjectId = getSubjectId();
        const res = await fetch(`${API_BASE}/api/usage-status?subjectId=${encodeURIComponent(subjectId)}`);
        if (res.ok) {
          const info = await res.json();
          const remaining = typeof info?.remaining === 'number' ? info.remaining : null;
          const isPremiumServer = Boolean(info?.premium);
          if (!isPremiumServer && typeof remaining === 'number' && remaining <= 0) {
            // Sin mensajes disponibles: abrir modal de compra (premium por defecto)
            const access = checkModelAccess(model);
            setPurchaseType(access.reason === 'purchase_required' ? 'one_time' : 'premium');
            setPurchaseModel(model);
            setShowPurchaseModal(true);
            return;
          }
        }
      } catch (e) {
        console.warn('No se pudo verificar usage-status:', e);
      }
    }

    const access = checkModelAccess(model);
    if (access.hasAccess) {
      setSelectedModel(model);
      setShowPersonalization(true);
    } else if (!user) {
      // Si no hay usuario, mostrar modal de login
      setShowAuthModal(true);
    }
  };

  const handlePurchase = async (modelId: string) => {
    const model = models.find(m => m.id === modelId);
    if (!model) return;

    // Si no hay usuario, mostrar modal de login
    if (!user) {
      setShowAuthModal(true);
      return;
    }

    const access = checkModelAccess(model);
    
    if (access.reason === 'premium_required') {
      setPurchaseType('premium');
      setPurchaseModel(model);
      setShowPurchaseModal(true);
    } else if (access.reason === 'purchase_required') {
      setPurchaseType('one_time');
      setPurchaseModel(model);
      setShowPurchaseModal(true);
    }
  };

  const handlePurchaseConfirm = async (modelId: string) => {
    try {
      const response = await fetch(`${API_BASE}/api/create-checkout-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: purchaseType,
          modelId: purchaseType === 'one_time' ? modelId : undefined,
          userEmail: user?.email,
        }),
      });

      const { sessionId, url } = await response.json();
      
      if (url) {
        window.location.href = url;
        return;
      }

      if (sessionId) {
        // Redirigir a Stripe Checkout (usando Vite env o helper compartido)
        const stripe = await import('@stripe/stripe-js');
        const stripeInstance = await stripe.loadStripe((import.meta as any).env?.VITE_STRIPE_PUBLISHABLE_KEY!);
        if (stripeInstance) await stripeInstance.redirectToCheckout({ sessionId });
      }
    } catch (error) {
      console.error('Error creating checkout session:', error);
    }
  };

  const handleStartChat = (preferences: ChatPreferences) => {
      console.log('🚀 handleStartChat EJECUTÁNDOSE con:', preferences);
      console.log('🚀 selectedModel:', selectedModel);
      
      // Forzar apertura del chat
      setChatPreferences(preferences);
      setShowPersonalization(false);
      setShowChat(true);
      
      console.log('🚀 CHAT ABIERTO');
  };

  const handleBackToGallery = () => {
      setShowChat(false);
      setSelectedModel(null);
      setChatPreferences(null);
  };

  const handleUpgrade = () => {
    console.log('🔥 ABRIENDO MODAL PREMIUM');
    setPurchaseType('premium');
    setPurchaseModel({
      id: 'premium',
      name: 'Premium Subscription',
      category: 'premium',
      type: 'premium',
      price: 19.99,
      image_url: '/placeholder.svg',
      description: 'Acceso ilimitado a todas las modelos',
      tags: ['premium', 'unlimited'],
      rating: 5,
      conversations: 0
    });
    setShowPurchaseModal(true);
  };

  const handleSaveModel = (model: any) => {
    console.log("Modelo guardado:", model);
    setShowModelEditor(false);
    setEditingModel(null);
  };

  const handleEditModel = (model: UserAccessModel) => {
    setEditingModel(model);
    setShowModelEditor(true);
  };

  const handleCreateModel = () => {
    const newModel: UserAccessModel = {
      id: Date.now().toString(),
      name: "Nuevo Modelo",
      category: "Románticas",
      type: "free",
      image_url: "/placeholder.svg",
      description: "Descripción del nuevo modelo",
      tags: ["nuevo"],
      rating: 4.0,
      conversations: 0
    };
    setEditingModel(newModel);
    setShowModelEditor(true);
  };

  const handleCategoryClick = (categoryKey: string) => {
    setSelectedCategory(categoryKey);
    
    if (categoryKey === "all") {
      // Si es "Todas", scroll al inicio
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      // Scroll a la sección específica
      const element = document.getElementById(`category-${categoryKey}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  const handleAuthSuccess = (_userEmail?: string) => {
    // Refrescar datos del usuario después del login exitoso (local)
    refreshUser();
  };

  const handleRefreshUser = () => {
    console.log('🔄 Refrescando usuario manualmente...');
    refreshUser();
  };

  // Mostrar selector de idioma si es necesario
  if (showLanguageSelector) {
    return (
      <LanguageSelector 
        onLanguageSelected={() => setShowLanguageSelector(false)} 
      />
    );
  }

  // Loading state
  if (loading || translationLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <h2 className="text-xl font-bold text-foreground mb-2">{t('common.loading')}</h2>
          <p className="text-muted-foreground">Cargando datos locales</p>
        </div>
      </div>
    );
  }


  console.log('🔍 DIAGNÓSTICO:', {
    showChat,
    selectedModel: !!selectedModel,
    chatPreferences: !!chatPreferences,
    selectedModelName: selectedModel?.name,
    chatPreferencesData: chatPreferences,
    user: user,
    userId: user?.id,
    userLoading: userLoading
  });
  
  if (showChat && selectedModel && chatPreferences) {
    console.log('✅ TODAS LAS CONDICIONES CUMPLIDAS - MOSTRANDO CHAT');
    const donationUrl = import.meta.env.VITE_DONATION_URL || 'https://buy.stripe.com/test_14k02bJxGe040i0V8w';
    return (
      <div className="relative">
      <ChatInterface
        modelName={selectedModel.name}
          modelImage={selectedModel.image_url}
          modelVideo={(function(){
            const slug = selectedModel.name
              .toLowerCase()
              .normalize('NFD')
              .replace(/\p{Diacritic}/gu, '')
              .replace(/[^a-z0-9]+/g, '-')
              .replace(/^-+|-+$/g, '');
            return `/videos/${slug}-loop.mp4`;
          })()}
        preferences={chatPreferences}
        onBack={handleBackToGallery}
          isPremiumModel={selectedModel.type === 'premium'}
          userId={user?.id}
          modelId={selectedModel.id}
          userIsPremium={user?.is_premium || false}
          unlimitedForThisModel={(() => {
            const access = checkModelAccess(selectedModel);
            return access.hasAccess && selectedModel.type === 'one_time';
          })()}
          dailyMessageCount={user?.daily_message_count || 0}
          dailyLimit={5}
          onUpgradeToPremium={handleUpgrade}
        />

        {/* Donaciones rápidas eliminadas del header, ahora están dentro del área de modelo */}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
                <Crown className="w-5 h-5 text-primary-foreground" />
              </div>
              <h1 className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                {t('header.title')}
              </h1>
            </div>
            
            <div className="flex items-center gap-3">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setShowLanguageSelector(true)}
                className="text-xs"
              >
                <Globe className="w-3 h-3 mr-1" />
                {t('header.language')}
              </Button>
              
              {/* Estado de usuario: skeleton mientras carga */}
              {userLoading && (
                <div className="w-9 h-9 rounded-full bg-muted animate-pulse" aria-hidden />
              )}

              {/* Botón de login cuando no hay usuario y no está cargando */}
              {!user && !userLoading && (
                <Button 
                  variant="default"
                  size="sm"
                  onClick={() => setShowAuthModal(true)}
                  className="text-xs"
                >
                  <User className="w-3 h-3 mr-1" />
                  {t('auth.login')}
                </Button>
              )}

              {/* User Menu - Solo mostrar si hay usuario autenticado */}
              {user && (
                <UserMenu 
                  user={user} 
                  onSignOut={() => {
                    // Refrescar el estado del usuario después del logout
                    refreshUser();
                  }}
                />
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Hero Section */}
        <div className="text-center space-y-4 py-8">
          <h1 className="text-4xl md:text-6xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            {t('hero.title')}
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            {t('hero.subtitle')}
          </p>
          <div className="flex items-center justify-center gap-2 mt-4">
            <Crown className="w-5 h-5 text-primary" />
            <span className="text-sm text-muted-foreground">
              {getCategories(t).length} {t('hero.categories')} {models.length} {t('hero.models')}
            </span>
          </div>
        </div>

        {/* Subscription Banner (hidden for premium users) */}
        {!user?.is_premium && (
        <SubscriptionBanner onUpgrade={handleUpgrade} />
        )}

        {/* Search and Filters */}
        <div className="flex flex-col gap-4 max-w-4xl mx-auto">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder={t('search.placeholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-input border-border"
            />
          </div>
          
          {/* Filtros de categoría */}
          <div className="flex flex-wrap gap-2 justify-center">
            <Button
              variant={selectedCategory === "all" ? "default" : "outline"}
              onClick={() => handleCategoryClick("all")}
              size="sm"
            >
              {t('search.all')}
            </Button>
            {getCategories(t).map((category) => (
              <Button
                key={category.title}
                variant={selectedCategory === category.key ? "default" : "outline"}
                onClick={() => handleCategoryClick(category.key)}
                size="sm"
              >
                {category.title}
              </Button>
            ))}
          </div>
        </div>

        {/* Galería por categorías */}
        <div className="space-y-12">
          {getCategories(t).map((category, categoryIndex) => {
            const categoryModels = models.filter(m => m.category === category.key);
            console.log(`🔍 DEBUG: Categoría "${category.title}" (key: "${category.key}")`, {
              categoryModels,
              totalModels: models.length,
              models: models.map(m => ({ name: m.name, category: m.category }))
            });
            
            return (
              <div 
                key={category.title} 
                id={`category-${category.key}`}
                className="animate-fade-in"
                style={{ animationDelay: `${categoryIndex * 0.2}s` }}
              >
                {/* Título de la categoría */}
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-bold text-foreground mb-2">
                    {category.title}
                  </h2>
                  <p className="text-muted-foreground text-lg">
                    {category.description}
                  </p>
                </div>

                {/* Grid de modelos */}
                {categoryModels.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 px-4">
                    {categoryModels.slice(0, 4).map((model, modelIndex) => {
                      const userAccess = checkModelAccess(model);
                      return (
                        <div 
                          key={model.id} 
                          className="animate-fade-in relative group" 
                          style={{ animationDelay: `${(categoryIndex * 0.2) + (modelIndex * 0.05)}s` }}
                        >
                          <div className="relative">
                            <ModelCardWithAccess
                              model={model}
                              userAccess={userAccess}
                              user={user}
                              onSelect={handleModelSelect}
                              onPurchase={handlePurchase}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                      <Crown className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      No hay modelos en esta categoría
                    </h3>
                    <p className="text-muted-foreground">
                      Próximamente agregaremos más modelos a esta categoría
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Mensaje si no hay resultados */}
        {filteredModels.length === 0 && models.length > 0 && (
          <div className="text-center py-12">
            <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">{t('search.noResults')}</h3>
            <p className="text-muted-foreground">{t('search.noResultsDescription')}</p>
          </div>
        )}
      </main>

      {/* Personalization Modal */}
      {selectedModel && (
        <PersonalizationModal
          isOpen={showPersonalization}
          onClose={() => {
            setShowPersonalization(false);
          }}
          onStartChat={handleStartChat}
          modelName={selectedModel.name}
          modelImage={selectedModel.image_url}
          userIsPremium={user?.is_premium || false}
        />
      )}

      {/* Model Editor Modal */}
      <ModelEditor
        isOpen={showModelEditor}
        onClose={() => {
          setShowModelEditor(false);
          setEditingModel(null);
        }}
        onSave={handleSaveModel}
        model={editingModel ? {
          id: editingModel.id,
          name: editingModel.name,
          image: editingModel.image_url,
          description: editingModel.description,
          tags: editingModel.tags,
          isPremium: editingModel.type === 'premium',
          isLocked: editingModel.type !== 'free',
          rating: editingModel.rating,
          conversations: editingModel.conversations
        } : null}
      />

      {/* Purchase Modal */}
      <PurchaseModal
        isOpen={showPurchaseModal}
        onClose={() => setShowPurchaseModal(false)}
        model={purchaseModel}
        type={purchaseType}
        user={user}
        onPurchase={handlePurchaseConfirm}
      />

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={handleAuthSuccess}
      />

      {/* Footer Legal */}
      <footer className="bg-gray-900/50 backdrop-blur-sm border-t border-gray-700/50 mt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="flex items-center space-x-2">
              <Crown className="w-6 h-6 text-purple-400" />
              <span className="text-xl font-bold text-white">AI Companions</span>
            </div>
            
            <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-400">
              <a 
                href="/privacy-policy" 
                className="hover:text-white transition-colors"
              >
                {t('footer.privacyPolicy')}
              </a>
              <a 
                href="/terms-of-service" 
                className="hover:text-white transition-colors"
              >
                {t('footer.termsOfService')}
              </a>
              <a 
                href="/cookie-policy" 
                className="hover:text-white transition-colors"
              >
                {t('footer.cookiePolicy')}
              </a>
              <a 
                href="/legal-notice" 
                className="hover:text-white transition-colors"
              >
                {t('footer.legalNotice')}
              </a>
            </div>
            
            <div className="text-sm text-gray-500">
              {t('footer.copyright')}
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
};

export default Index;