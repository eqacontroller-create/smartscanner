import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { ProfileAvatar } from './ProfileAvatar';

export interface ProfileFormData {
  displayName: string | null;
  avatarUrl: string | null;
  phone: string | null;
  city: string | null;
  driverType: string;
}

interface EditProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData: ProfileFormData;
  email?: string;
  userId?: string;
  onSave: (data: ProfileFormData) => Promise<void>;
}

const driverTypes = [
  { value: 'particular', label: 'Particular' },
  { value: 'uber', label: 'Uber' },
  { value: '99', label: '99' },
  { value: 'taxi', label: 'Táxi' },
  { value: 'frota', label: 'Frota/Empresa' },
];

export const EditProfileDialog: React.FC<EditProfileDialogProps> = ({
  open,
  onOpenChange,
  initialData,
  email,
  userId,
  onSave,
}) => {
  const [formData, setFormData] = useState<ProfileFormData>(initialData);
  const [saving, setSaving] = useState(false);

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setFormData(initialData);
    }
  }, [open, initialData]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(formData);
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarChange = (url: string) => {
    setFormData(prev => ({ ...prev, avatarUrl: url }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Editar Perfil</DialogTitle>
          <DialogDescription>
            Atualize suas informações pessoais. Seus dados são sincronizados automaticamente.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          {/* Avatar com upload */}
          <div className="flex flex-col items-center gap-2">
            <ProfileAvatar
              avatarUrl={formData.avatarUrl}
              displayName={formData.displayName}
              email={email}
              size="xl"
              editable
              userId={userId}
              onAvatarChange={handleAvatarChange}
            />
            <span className="text-xs text-muted-foreground">
              Clique para alterar a foto
            </span>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="displayName">Nome de exibição</Label>
            <Input
              id="displayName"
              placeholder="Como você quer ser chamado?"
              value={formData.displayName || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, displayName: e.target.value || null }))}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="phone">Telefone (opcional)</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="(11) 99999-9999"
              value={formData.phone || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value || null }))}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="city">Cidade (opcional)</Label>
            <Input
              id="city"
              placeholder="São Paulo, SP"
              value={formData.city || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value || null }))}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="driverType">Tipo de motorista</Label>
            <Select
              value={formData.driverType}
              onValueChange={(value) => setFormData(prev => ({ ...prev, driverType: value }))}
            >
              <SelectTrigger id="driverType">
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent>
                {driverTypes.map(type => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              'Salvar'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
