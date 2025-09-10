import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { ModelCard } from "@/components/ModelCard";
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
    price: "4.99"
  },
  {
    id: "8",
    name: "Yu",
    image_url: "https://companion-ia-2.vercel.app/models/Yu.jpg",
    description: "Una compañera gamer única y especializada, experta en juegos indie y aventuras únicas.",
    category: "Gamer",
    tags: ["gamer", "indie", "aventuras"],
    is_premium: false,
    is_extra_premium: false,
    is_locked: false,
    rating: 4.5,
    conversations: 720,
    price: undefined
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
    key: "romanticas"
  },
  {
    title: "Calientes",
    description: "Sensuales, atrevidas, solo premium",
    key: "calientes"
  },
  {
    title: "Gamer",
    description: "Divertidas, outfit casual con headset",
    key: "gamer"
  },
  {
    title: "Elegantes",
    description: "Sofisticadas, ropa de noche",
    key: "elegantes"
  },
  {
    title: "Intelectuales",
    description: "Con gafas, vibe de escritora/estudiante",
    key: "intelectuales"
  },
  {
    title: "Misteriosas",
    description: "Oscuras, estilo gótico",
    key: "misteriosas"
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
  const [companions, setCompanions] = useState<Companion[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedModel, setSelectedModel] = useState<Model | null>(null);
  const [showPersonalization, setShowPersonalization] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [chatPreferences, setChatPreferences] = useState<ChatPreferences | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [showModelEditor, setShowModelEditor] = useState(false);
  const [editingModel, setEditingModel] = useState<Model | null>(null);
  const [userIsPremium, setUserIsPremium] = useState(false);

  // Cargar companions desde Supabase o usar datos locales
  useEffect(() => {
    async function loadCompanions() {
      try {
        const { data, error } = await supabase.from("companions").select("*");
        if (error) {
          console.warn("Error cargando companions desde Supabase, usando datos locales:", error);
          setCompanions(localCompanions);
        } else if (data && data.length > 0) {
          setCompanions(data);
        } else {
          console.info("No hay datos en Supabase, usando datos locales");
          setCompanions(localCompanions);
        }
      } catch (err) {
        console.warn("Error inesperado, usando datos locales:", err);
        setCompanions(localCompanions);
      } finally {
        setLoading(false);
      }
    }
    loadCompanions();
  }, []);

  // Filtrar companions por búsqueda
  const filteredCompanions = companions.filter(companion => {
    const matchesSearch = companion.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         companion.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         companion.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesSearch;
  });

  // Filtrar por categoría seleccionada
  const companionsByCategory = filteredCompanions.filter(companion => 
    selectedCategory === "all" || companion.category === selectedCategory
  );

  const allModels = companions.map(companionToModel);

  const handleModelSelect = (modelId: string) => {
    const model = allModels.find(m => m.id === modelId);
    if (model && !model.isLocked) {
      setSelectedModel(model);
      setShowPersonalization(true);
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
    setUserIsPremium(true);
    console.log("Usuario actualizado a Premium");
  };

  const handleSaveModel = (model: Model) => {
    console.log("Modelo guardado:", model);
    setShowModelEditor(false);
    setEditingModel(null);
  };

  const handleEditModel = (model: Model) => {
    setEditingModel(model);
    setShowModelEditor(true);
  };

  const handleCreateModel = () => {
    setEditingModel(null);
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
        modelImage={selectedModel.image}
        preferences={chatPreferences}
        onBack={handleBackToGallery}
        isPremiumModel={selectedModel.isPremium}
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
                Usuario Gratuito
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
              {categories.length} categorías con {companions.length} modelos
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
            const categoryCompanions = companions.filter(c => c.category === category.key);
            
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
                {categoryCompanions.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 px-4">
                    {categoryCompanions.slice(0, 4).map((companion, modelIndex) => {
                      const model = companionToModel(companion);
                      return (
                        <div 
                          key={companion.id} 
                          className="animate-fade-in relative group" 
                          style={{ animationDelay: `${(categoryIndex * 0.2) + (modelIndex * 0.05)}s` }}
                        >
                          <div className="relative">
                            <ModelCard
                              {...model}
                              onSelect={handleModelSelect}
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
        {filteredCompanions.length === 0 && companions.length > 0 && (
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
          modelImage={selectedModel.image}
          userIsPremium={userIsPremium}
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
        model={editingModel}
      />

    </div>
  );
};

export default Index;