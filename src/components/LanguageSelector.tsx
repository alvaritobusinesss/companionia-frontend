import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Globe, Check } from 'lucide-react';
import { useTranslation, SupportedLanguage } from '@/hooks/useTranslation';

interface LanguageSelectorProps {
  onLanguageSelected?: () => void;
}

const languages = [
  {
    code: 'es' as SupportedLanguage,
    name: 'Español',
    flag: '🇪🇸',
    nativeName: 'Español'
  },
  {
    code: 'en' as SupportedLanguage,
    name: 'English',
    flag: '🇺🇸',
    nativeName: 'English'
  },
  {
    code: 'ar' as SupportedLanguage,
    name: 'Arabic',
    flag: '🇸🇦',
    nativeName: 'العربية'
  },
  {
    code: 'ja' as SupportedLanguage,
    name: 'Japanese',
    flag: '🇯🇵',
    nativeName: '日本語'
  }
];

export function LanguageSelector({ onLanguageSelected }: LanguageSelectorProps) {
  const { language, changeLanguage, t, isLoading } = useTranslation();
  const [selectedLanguage, setSelectedLanguage] = useState<SupportedLanguage | null>(null);

  const handleLanguageSelect = (langCode: SupportedLanguage) => {
    setSelectedLanguage(langCode);
    changeLanguage(langCode);
    
    // Pequeño delay para mostrar la selección antes de continuar
    setTimeout(() => {
      // Recargar para que toda la app lea el idioma desde localStorage
      // (hasta que movamos el estado a un Context global)
      if (onLanguageSelected) onLanguageSelected();
      window.location.reload();
    }, 500);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl bg-white/10 backdrop-blur-sm border-white/20">
        <CardContent className="p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Globe className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">
              AI ChatHer
            </h1>
            <p className="text-white/80 text-lg">
              Choose your language / Elige tu idioma
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {languages.map((lang) => (
              <Button
                key={lang.code}
                variant={selectedLanguage === lang.code ? "default" : "outline"}
                className={`
                  h-20 p-4 text-left justify-start transition-all duration-300
                  ${selectedLanguage === lang.code 
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0 shadow-lg scale-105' 
                    : 'bg-white/10 text-white border-white/30 hover:bg-white/20 hover:scale-105'
                  }
                `}
                onClick={() => handleLanguageSelect(lang.code)}
              >
                <div className="flex items-center gap-4 w-full">
                  <div className="text-3xl">{lang.flag}</div>
                  <div className="flex-1">
                    <div className="font-semibold text-lg">{lang.name}</div>
                    <div className="text-sm opacity-80">{lang.nativeName}</div>
                  </div>
                  {selectedLanguage === lang.code && (
                    <Check className="w-6 h-6 text-white" />
                  )}
                </div>
              </Button>
            ))}
          </div>

          <div className="text-center mt-8">
            <p className="text-white/60 text-sm">
              Your choice will be saved for future visits
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
