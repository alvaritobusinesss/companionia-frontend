import { useState, useEffect } from 'react';

export type SupportedLanguage = 'es' | 'en' | 'ar' | 'ja';

interface TranslationData {
  [key: string]: any;
}

const translations: Record<SupportedLanguage, TranslationData> = {
  es: {},
  en: {},
  ar: {},
  ja: {}
};

// Cargar traducciones dinámicamente
const loadTranslations = async (lang: SupportedLanguage): Promise<TranslationData> => {
  try {
    const module = await import(`../locales/${lang}.json`);
    return module.default;
  } catch (error) {
    console.error(`Error loading translations for ${lang}:`, error);
    return {};
  }
};

export const useTranslation = () => {
  const [language, setLanguage] = useState<SupportedLanguage>('es');
  const [translations, setTranslations] = useState<TranslationData>({});
  const [isLoading, setIsLoading] = useState(true);

  // Cargar idioma desde localStorage al inicializar
  useEffect(() => {
    const savedLanguage = localStorage.getItem('selectedLanguage') as SupportedLanguage;
    if (savedLanguage && (savedLanguage === 'es' || savedLanguage === 'en' || savedLanguage === 'ar' || savedLanguage === 'ja')) {
      setLanguage(savedLanguage);
    }
  }, []);

  // Cargar traducciones cuando cambie el idioma
  useEffect(() => {
    const loadTranslationsForLanguage = async () => {
      setIsLoading(true);
      try {
        const translationData = await loadTranslations(language);
        setTranslations(translationData);
        // Ajustar atributos del documento para RTL/LTR
        if (typeof document !== 'undefined') {
          document.documentElement.lang = language;
          document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
        }
      } catch (error) {
        console.error('Error loading translations:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadTranslationsForLanguage();
  }, [language]);

  const changeLanguage = (newLanguage: SupportedLanguage) => {
    setLanguage(newLanguage);
    localStorage.setItem('selectedLanguage', newLanguage);
  };

  const t = (key: string, params?: Record<string, string | number>): string => {
    const keys = key.split('.');
    let value: any = translations;
    
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        console.warn(`Translation key not found: ${key}`);
        return key; // Devolver la clave si no se encuentra la traducción
      }
    }

    if (typeof value !== 'string') {
      console.warn(`Translation value is not a string: ${key}`);
      return key;
    }

    // Reemplazar parámetros si se proporcionan
    if (params) {
      let result = value;
      for (const [key, val] of Object.entries(params)) {
        result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), String(val));
      }
      return result;
    }

    return value;
  };

  // Obtener arrays localizados (por ejemplo, listas de tags)
  const ta = (key: string): string[] => {
    const keys = key.split('.');
    let value: any = translations;
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        return [];
      }
    }
    return Array.isArray(value) ? (value as string[]) : [];
  };

  return {
    language,
    changeLanguage,
    t,
    ta,
    isLoading
  };
};
