import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ModelImageUpload } from "./ModelImageUpload";
import { Save, Plus, X, Crown } from "lucide-react";
import { toast } from "sonner";

interface Model {
  id: string;
  name: string;
  image: string;
  description: string;
  tags: string[];
  isPremium: boolean;
  isLocked: boolean;
  rating: number;
  conversations: number;
}

interface ModelEditorProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (model: Model) => void;
  model?: Model | null;
}

export function ModelEditor({ isOpen, onClose, onSave, model }: ModelEditorProps) {
  const [formData, setFormData] = useState<Partial<Model>>({
    name: "",
    image: "",
    description: "",
    tags: [],
    isPremium: false,
    isLocked: false,
    rating: 4.5,
    conversations: 0,
  });
  const [newTag, setNewTag] = useState("");

  useEffect(() => {
    if (model) {
      setFormData(model);
    } else {
      setFormData({
        name: "",
        image: "",
        description: "",
        tags: [],
        isPremium: false,
        isLocked: false,
        rating: 4.5,
        conversations: 0,
      });
    }
  }, [model, isOpen]);

  const handleInputChange = (field: keyof Model, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAddTag = () => {
    if (newTag.trim() && formData.tags && !formData.tags.includes(newTag.trim())) {
      handleInputChange('tags', [...formData.tags, newTag.trim()]);
      setNewTag("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    if (formData.tags) {
      handleInputChange('tags', formData.tags.filter(tag => tag !== tagToRemove));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.description || !formData.image) {
      toast.error("Por favor completa todos los campos requeridos");
      return;
    }

    const modelToSave: Model = {
      id: model?.id || `model-${Date.now()}`,
      name: formData.name!,
      image: formData.image!,
      description: formData.description!,
      tags: formData.tags || [],
      isPremium: formData.isPremium!,
      isLocked: formData.isLocked!,
      rating: formData.rating!,
      conversations: formData.conversations!,
    };

    console.log("ModelEditor: Guardando modelo", modelToSave);
    onSave(modelToSave);
    toast.success(model ? "Modelo actualizado" : "Modelo creado");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {model ? "Editar Modelo" : "Crear Nuevo Modelo"}
            {formData.isPremium && <Crown className="w-5 h-5 text-premium" />}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Image Upload */}
          <div>
            <label className="text-sm font-medium mb-2 block">Imagen del Modelo *</label>
            <ModelImageUpload
              currentImage={formData.image}
              onImageChange={(imageUrl) => handleInputChange('image', imageUrl)}
              onRemoveImage={() => handleInputChange('image', '')}
            />
          </div>

          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Nombre *</label>
              <Input
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Nombre del modelo"
                required
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Rating</label>
              <Input
                type="number"
                min="1"
                max="5"
                step="0.1"
                value={formData.rating}
                onChange={(e) => handleInputChange('rating', parseFloat(e.target.value))}
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="text-sm font-medium mb-2 block">Descripción *</label>
            <Textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Describe la personalidad y características del modelo..."
              rows={3}
              required
            />
          </div>

          {/* Tags */}
          <div>
            <label className="text-sm font-medium mb-2 block">Etiquetas</label>
            <div className="flex flex-wrap gap-2 mb-3">
              {formData.tags?.map((tag) => (
                <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                  {tag}
                  <X 
                    className="w-3 h-3 cursor-pointer hover:text-destructive" 
                    onClick={() => handleRemoveTag(tag)}
                  />
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder="Añadir etiqueta..."
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
              />
              <Button type="button" onClick={handleAddTag} variant="outline">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Configuración</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium">Modelo Premium</label>
                  <p className="text-xs text-muted-foreground">Solo disponible para suscriptores</p>
                </div>
                <Switch
                  checked={formData.isPremium}
                  onCheckedChange={(checked) => handleInputChange('isPremium', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium">Bloqueado</label>
                  <p className="text-xs text-muted-foreground">Requiere desbloqueo para usar</p>
                </div>
                <Switch
                  checked={formData.isLocked}
                  onCheckedChange={(checked) => handleInputChange('isLocked', checked)}
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Conversaciones</label>
                <Input
                  type="number"
                  min="0"
                  value={formData.conversations}
                  onChange={(e) => handleInputChange('conversations', parseInt(e.target.value) || 0)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex gap-3 pt-6">
            <Button type="submit" className="flex-1">
              <Save className="w-4 h-4 mr-2" />
              {model ? "Actualizar" : "Crear"} Modelo
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}