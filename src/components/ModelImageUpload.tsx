import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Upload, X, Image as ImageIcon } from "lucide-react";

interface ModelImageUploadProps {
  currentImage?: string;
  onImageChange: (imageUrl: string) => void;
  onRemoveImage?: () => void;
  disabled?: boolean;
}

export function ModelImageUpload({ 
  currentImage, 
  onImageChange, 
  onRemoveImage, 
  disabled = false 
}: ModelImageUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Por favor selecciona solo archivos de imagen');
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      alert('El archivo es demasiado grande. Máximo 5MB');
      return;
    }

    console.log("ModelImageUpload: Procesando archivo", file.name, file.size);
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      console.log("ModelImageUpload: Imagen cargada exitosamente", result.substring(0, 50) + "...");
      onImageChange(result);
    };
    reader.onerror = (e) => {
      console.error("ModelImageUpload: Error al cargar imagen", e);
      alert('Error al cargar la imagen. Inténtalo de nuevo.');
    };
    reader.readAsDataURL(file);
  };

  const onButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-4">
      {currentImage ? (
        <Card className="relative group overflow-hidden">
          <CardContent className="p-0">
            <div className="relative">
              <img
                src={currentImage}
                alt="Imagen del modelo"
                className="w-full h-48 object-cover"
              />
              <div className="absolute inset-0 bg-background/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={onButtonClick}
                  disabled={disabled}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Cambiar
                </Button>
                {onRemoveImage && (
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={onRemoveImage}
                    disabled={disabled}
                  >
                    <X className="w-4 h-4 mr-2" />
                    Quitar
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card 
          className={`border-dashed border-2 transition-colors cursor-pointer ${
            dragActive 
              ? 'border-primary bg-primary/5' 
              : 'border-muted-foreground/25 hover:border-primary/50'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={!disabled ? onButtonClick : undefined}
        >
          <CardContent className="p-8 text-center">
            <ImageIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Subir imagen del modelo</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Arrastra y suelta una imagen aquí o haz clic para seleccionar
            </p>
            <Badge variant="secondary" className="text-xs">
              JPG, PNG, GIF - Máximo 5MB
            </Badge>
          </CardContent>
        </Card>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleChange}
        className="hidden"
        disabled={disabled}
      />
    </div>
  );
}