import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { ModelCardWithAccess } from "@/components/ModelCardWithAccess";
import { PurchaseModal } from "@/components/PurchaseModal";
import { PersonalizationModal, ChatPreferences } from "@/components/PersonalizationModal";
import { ChatInterface } from "@/components/ChatInterface";
import { SubscriptionBanner } from "@/components/SubscriptionBanner";
import { SaveStatus } from "@/components/SaveStatus";
import { ModelEditor } from "@/components/ModelEditor";
import { ImageUpload } from "@/components/ImageUpload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, Crown, Settings, User, Plus, Edit, Upload } from "lucide-react";
import { useUserAccess, Model as UserAccessModel } from "@/hooks/useUserAccess";

// Datos locales de respaldo usando URLs absolutas de Vercel
const localCompanions: Companion[] = [
  {
    id: "1",
    name: "Victoria",
    image_url: "https://companion-ia-2.vercel.app/models/victoria.jpg",
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
    image_url: "https://companion-ia-2.vercel.app/models/luna.jpg",
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
    image_url: "https://companion-ia-2.vercel.app/models/ginger.jpg",
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
    image_url: "https://companion-ia-2.vercel.app/models/beauty.jpg",
    description: "Una personalidad aventurera y enérgica, perfecta para explorar nuevos horizontes juntos.",
    category: "Románticas",
    tags: ["aventurera", "enérgica", "explorar"],
    is_premium: false,
    is_extra_premium: true,
    is_locked: false,
    rating: 4.6,
    conversations: 750,
    price: undefined
  },
  {
    id: "5",
    name: "Blu",
    image_url: "https://companion-ia-2.vercel.app/models/Blu.jpg",
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
    image_url: "https://companion-ia-2.vercel.app/models/Resha.jpg",
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
    image_url: "https://companion-ia-2.vercel.app/models/Yu.jpg",
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
    image_url: "https://companion-ia-2.vercel.app/models/Reyna.jpg",
    description: "Una compañera gamer dominante y poderosa, perfecta para liderar equipos y conquistar mundos virtuales.",
    category: "Gamer",
    tags: ["gamer", "dominante", "líder"],
    is_premium: false,
    is_extra_premium: true,
    is_locked: false,
    rating: 4.8,
    conversations: 1800,
    price: "9.99"
  },
  // Modelos Góticos
  {
    id: "9",
    name: "Nocturne",
    image_url: "https://companion-ia-2.vercel.app/models/Nocturne.jpg",
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
    image_url: "https://companion-ia-2.vercel.app/models/Erit.jpg",
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
    image_url: "https://companion-ia-2.vercel.app/models/Vanth.jpg",
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
    image_url: "https://companion-ia-2.vercel.app/models/Belladonna.jpg",
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
    image_url: "https://companion-ia-2.vercel.app/models/Renata.jpg",
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
    id: "14",
    name: "Bianca",
    image_url: "https://companion-ia-2.vercel.app/models/Bianca.jpg",
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
    id: "15",
    name: "Aiko",
    image_url: "https://companion-ia-2.vercel.app/models/Aiko.jpg",
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
    id: "16",
    name: "Paris",
    image_url: "https://companion-ia-2.vercel.app/models/Paris.jpg",
    description: "Una compañera intelectual excepcional y única, experta en múltiples disciplinas. Perfecta para mentores y guías académicas.",
    category: "Intelectuales",
    tags: ["intelectual", "excepcional", "mentora"],
    is_premium: false,
    is_extra_premium: true,
    is_locked: false,
    rating: 4.9,
    conversations: 800,
    price: "99.00"
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

// Categorías de modelos
const categories = [
  {
    title: "Románticas",
    description: "Dulces, cercanas, look clásico",
    key: "Románticas"
  },
  {
    title: "Calientes",
    description: "Sensuales, atrevidas, solo premium",
    key: "Calientes"
  },
  {
    title: "Gamer",
    description: "Divertidas, outfit casual con headset",
    key: "Gamer"
  },
  {
    title: "Elegantes",
    description: "Sofisticadas, ropa de noche",
    key: "Elegantes"
  },
  {
    title: "Intelectuales",
    description: "Con gafas, vibe de escritora/estudiante",
    key: "Intelectuales"
  },
  {
    title: "Misteriosas",
    description: "Oscuras, estilo gótico",
    key: "Misteriosas"
  },
  {
    title: "Góticas",
    description: "Misteriosas, elegantes, estilo gótico",
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
  
  const { user, loading: userLoading, checkModelAccess, refreshUser } = useUserAccess();

  // Cargar modelos desde Supabase o usar datos locales
  useEffect(() => {
    async function loadModels() {
      console.log("🔍 DEBUG: Iniciando carga de modelos");
      try {
        const { data, error } = await supabase.from("models").select("*");
        if (error) {
          console.warn("⚠️ Error cargando modelos desde Supabase, usando datos locales:", error);
          // Convertir datos locales al nuevo formato
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
        } else if (data && data.length > 0) {
          console.log("✅ Datos de Supabase cargados:", data);
          setModels(data as UserAccessModel[]);
        } else {
          console.info("ℹ️ No hay datos en Supabase, usando datos locales");
          console.log("🔍 DEBUG: Iniciando conversión de localCompanions");
          const localModels: UserAccessModel[] = localCompanions.map(companion => {
            const type = companion.is_premium ? 'premium' : companion.is_extra_premium ? 'one_time' : 'free';
            console.log(`🔍 DEBUG: ${companion.name} - is_premium: ${companion.is_premium}, is_extra_premium: ${companion.is_extra_premium}, type: ${type}`);
            return {
              id: companion.id,
              name: companion.name,
              category: companion.category,
              type: type,
              price: companion.price ? parseFloat(companion.price) : undefined,
              image_url: companion.image_url,
              description: companion.description,
              tags: companion.tags,
              rating: companion.rating,
              conversations: companion.conversations
            };
          });
          console.log("🔍 DEBUG: Modelos convertidos:", localModels);
          setModels(localModels);
        }
      } catch (err) {
        console.warn("❌ Error inesperado, usando datos locales:", err);
        console.log("🔍 DEBUG: Iniciando conversión en catch block");
        const localModels: UserAccessModel[] = localCompanions.map(companion => {
          const type = companion.is_premium ? 'premium' : companion.is_extra_premium ? 'one_time' : 'free';
          console.log(`🔍 DEBUG CATCH: ${companion.name} - is_premium: ${companion.is_premium}, is_extra_premium: ${companion.is_extra_premium}, type: ${type}`);
          return {
            id: companion.id,
            name: companion.name,
            category: companion.category,
            type: type,
            price: companion.price ? parseFloat(companion.price) : undefined,
            image_url: companion.image_url,
            description: companion.description,
            tags: companion.tags,
            rating: companion.rating,
            conversations: companion.conversations
          };
        });
        console.log("🔍 DEBUG CATCH: Modelos convertidos:", localModels);
        setModels(localModels);
      } finally {
        setLoading(false);
        console.log("🏁 Carga completada");
      }
    }
    loadModels();
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

  // Debug logs
  console.log("🔍 DEBUG: Models:", models);
  console.log("🔍 DEBUG: Filtered models:", filteredModels);
  console.log("🔍 DEBUG: Models by category:", modelsByCategory);
  console.log("🔍 DEBUG: Selected category:", selectedCategory);
  console.log("🔍 DEBUG: Search term:", searchTerm);

  const handleModelSelect = (modelId: string) => {
    const model = models.find(m => m.id === modelId);
    if (model) {
      const access = checkModelAccess(model);
      if (access.hasAccess) {
        setSelectedModel(model);
        setShowPersonalization(true);
      }
    }
  };

  const handlePurchase = async (modelId: string) => {
    const model = models.find(m => m.id === modelId);
    if (!model || !user) return;

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
      const response = await fetch('/api/create-checkout-session', {
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

      const { sessionId } = await response.json();
      
      if (sessionId) {
        // Redirigir a Stripe Checkout
        const stripe = await import('@stripe/stripe-js');
        const stripeInstance = await stripe.loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);
        
        if (stripeInstance) {
          await stripeInstance.redirectToCheckout({ sessionId });
        }
      }
    } catch (error) {
      console.error('Error creating checkout session:', error);
    }
  };

  const handleStartChat = (preferences: ChatPreferences) => {
    if (!selectedModel) {
      console.error('No hay modelo seleccionado');
      return;
    }
    setChatPreferences(preferences);
    setShowPersonalization(false);
    setShowChat(true);
  };

  const handleBackToGallery = () => {
    setShowChat(false);
    setSelectedModel(null);
    setChatPreferences(null);
  };

  const handleUpgrade = () => {
    // Esta función se maneja ahora a través del modal de compra
    setPurchaseType('premium');
    setShowPurchaseModal(true);
    console.log("Usuario actualizado a Premium");
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

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <h2 className="text-xl font-bold text-foreground mb-2">Cargando modelos...</h2>
          <p className="text-muted-foreground">Conectando con la base de datos</p>
        </div>
      </div>
    );
  }


  if (showChat && selectedModel && chatPreferences) {
    return (
      <ChatInterface
        modelName={selectedModel.name}
        modelImage={selectedModel.image_url}
        preferences={chatPreferences}
        onBack={handleBackToGallery}
        isPremiumModel={selectedModel.type === 'premium'}
      />
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
                AI Companions
              </h1>
            </div>
            
            <div className="flex items-center gap-3">
              <Badge variant="secondary" className="hidden sm:flex">
                <User className="w-3 h-3 mr-1" />
                {user?.is_premium ? 'Usuario Premium' : 'Usuario Gratuito'}
              </Badge>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => window.location.reload()}
                className="text-xs"
              >
                Recargar
              </Button>
              <Button variant="outline" size="sm" onClick={handleCreateModel}>
                <Plus className="w-4 h-4 mr-2" />
                Nuevo Modelo
              </Button>
              <Button variant="outline" size="icon">
                <Settings className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Hero Section */}
        <div className="text-center space-y-4 py-8">
          <h1 className="text-4xl md:text-6xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Galería de Companions
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Descubre tu compañera AI perfecta en nuestra colección exclusiva de cartas coleccionables
          </p>
          <div className="flex items-center justify-center gap-2 mt-4">
            <Crown className="w-5 h-5 text-primary" />
            <span className="text-sm text-muted-foreground">
              {categories.length} categorías con {models.length} modelos
            </span>
          </div>
        </div>

        {/* Subscription Banner */}
        <SubscriptionBanner onUpgrade={handleUpgrade} />

        {/* Search and Filters */}
        <div className="flex flex-col gap-4 max-w-4xl mx-auto">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Buscar por nombre, descripción o tags..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-input border-border"
            />
          </div>
          
          {/* Filtros de categoría */}
          <div className="flex flex-wrap gap-2 justify-center">
            <Button
              variant={selectedCategory === "all" ? "default" : "outline"}
              onClick={() => setSelectedCategory("all")}
              size="sm"
            >
              Todas
            </Button>
            {categories.map((category) => (
              <Button
                key={category.title}
                variant={selectedCategory === category.key ? "default" : "outline"}
                onClick={() => setSelectedCategory(category.key)}
                size="sm"
              >
                {category.title}
              </Button>
            ))}
          </div>
        </div>

        {/* Galería por categorías */}
        <div className="space-y-12">
          {categories.map((category, categoryIndex) => {
            const categoryModels = models.filter(m => m.category === category.key);
            console.log(`🔍 DEBUG: Categoría "${category.title}" (key: "${category.key}")`, {
              categoryModels,
              totalModels: models.length,
              models: models.map(m => ({ name: m.name, category: m.category }))
            });
            
            return (
              <div 
                key={category.title} 
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
            <h3 className="text-lg font-semibold text-foreground mb-2">No se encontraron modelos</h3>
            <p className="text-muted-foreground">Intenta con otros términos de búsqueda</p>
          </div>
        )}
      </main>

      {/* Personalization Modal */}
      {selectedModel && (
        <PersonalizationModal
          isOpen={showPersonalization}
          onClose={() => {
            setShowPersonalization(false);
            setSelectedModel(null);
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
        onPurchase={handlePurchaseConfirm}
      />

    </div>
  );
};

export default Index;