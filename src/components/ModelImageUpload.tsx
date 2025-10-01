import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, X } from 'lucide-react';

interface ModelImageUploadProps {
  currentImage?: string;
  onImageChange: (imageUrl: string) => void;
}

export function ModelImageUpload({ currentImage, onImageChange }: ModelImageUploadProps) {
  const [imageUrl, setImageUrl] = useState(currentImage || '');

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    setImageUrl(url);
    onImageChange(url);
  };

  const handleClear = () => {
    setImageUrl('');
    onImageChange('');
  };

  return (
    <div className="space-y-4">
      <Label htmlFor="image-url">URL de la imagen</Label>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Upload className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            id="image-url"
            type="url"
            placeholder="https://ejemplo.com/imagen.jpg"
            value={imageUrl}
            onChange={handleImageChange}
            className="pl-10"
          />
        </div>
        {imageUrl && (
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={handleClear}
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>
      
      {imageUrl && (
        <div className="mt-4">
          <Label>Vista previa:</Label>
          <div className="mt-2 w-32 h-32 border rounded-lg overflow-hidden">
            <img
              src={imageUrl}
              alt="Preview"
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.src = '/placeholder.svg';
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}













