'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Save, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import type { Therapist } from '@/types/database.types';
import { updateTherapistProfile } from '@/actions/auth';

interface ProfileFormProps {
  therapist: Therapist;
}

export function ProfileForm({ therapist }: ProfileFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    full_name: therapist.full_name || '',
    email: therapist.email || '',
    phone: therapist.phone || '',
    specialty: therapist.specialty || '',
    license_number: therapist.license_number || '',
    clinic_name: therapist.clinic_name || '',
    clinic_address: therapist.clinic_address || '',
  });

  const handleChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setSuccess(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!formData.full_name.trim()) {
      setError('El nombre es requerido');
      return;
    }

    startTransition(async () => {
      const result = await updateTherapistProfile({
        full_name: formData.full_name.trim(),
        phone: formData.phone.trim() || null,
        specialty: formData.specialty.trim() || 'Fisioterapia',
        license_number: formData.license_number.trim() || null,
        clinic_name: formData.clinic_name.trim() || null,
        clinic_address: formData.clinic_address.trim() || null,
      });

      if (!result.success) {
        setError(result.error || 'Error al actualizar el perfil');
        return;
      }

      setSuccess(true);
      router.refresh();
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="flex items-center gap-2 p-4 text-sm text-destructive bg-destructive/10 rounded-md">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2 p-4 text-sm text-green-700 bg-green-50 dark:text-green-400 dark:bg-green-950/30 rounded-md">
          <CheckCircle2 className="h-4 w-4" />
          Perfil actualizado correctamente
        </div>
      )}

      {/* Datos Personales */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">Datos Personales</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="full_name">Nombre completo *</Label>
              <Input
                id="full_name"
                value={formData.full_name}
                onChange={(e) => handleChange('full_name', e.target.value)}
                placeholder="Dr. Juan Pérez"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Correo electrónico</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                disabled
                className="bg-muted"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="phone">Teléfono</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                placeholder="55 1234 5678"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="specialty">Especialidad</Label>
              <Input
                id="specialty"
                value={formData.specialty}
                onChange={(e) => handleChange('specialty', e.target.value)}
                placeholder="Fisioterapia"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="license_number">Número de cédula profesional</Label>
            <Input
              id="license_number"
              value={formData.license_number}
              onChange={(e) => handleChange('license_number', e.target.value)}
              placeholder="12345678"
            />
          </div>
        </CardContent>
      </Card>

      {/* Clínica */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">Clínica</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="clinic_name">Nombre de la clínica</Label>
            <Input
              id="clinic_name"
              value={formData.clinic_name}
              onChange={(e) => handleChange('clinic_name', e.target.value)}
              placeholder="Clínica de Fisioterapia XYZ"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="clinic_address">Dirección de la clínica</Label>
            <Input
              id="clinic_address"
              value={formData.clinic_address}
              onChange={(e) => handleChange('clinic_address', e.target.value)}
              placeholder="Calle, número, colonia, ciudad"
            />
          </div>
        </CardContent>
      </Card>

      {/* Botones de acción */}
      <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isPending}
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Guardando...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Guardar cambios
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
