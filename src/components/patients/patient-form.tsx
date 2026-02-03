'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Save, Loader2, AlertCircle } from 'lucide-react';
import type { Patient, Gender, PatientStatus } from '@/types/database.types';
import { createPatient, updatePatient } from '@/actions/patients';

interface PatientFormProps {
  existingPatient?: Patient;
}

export function PatientForm({ existingPatient }: PatientFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    full_name: existingPatient?.full_name || '',
    email: existingPatient?.email || '',
    phone: existingPatient?.phone || '',
    date_of_birth: existingPatient?.date_of_birth || '',
    gender: existingPatient?.gender || ('No especificado' as Gender),
    address: existingPatient?.address || '',
    occupation: existingPatient?.occupation || '',
    emergency_contact_name: existingPatient?.emergency_contact_name || '',
    emergency_contact_phone: existingPatient?.emergency_contact_phone || '',
    allergies: existingPatient?.allergies?.join(', ') || '',
    current_medications: existingPatient?.current_medications?.join(', ') || '',
    chronic_conditions: existingPatient?.chronic_conditions?.join(', ') || '',
    initial_complaint: existingPatient?.initial_complaint || '',
    diagnosis: existingPatient?.diagnosis || '',
    notes: existingPatient?.notes || '',
    status: existingPatient?.status || ('active' as PatientStatus),
  });

  const handleChange = (
    field: keyof typeof formData,
    value: string
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.full_name.trim()) {
      setError('El nombre es requerido');
      return;
    }

    if (!formData.phone.trim()) {
      setError('El teléfono es requerido');
      return;
    }

    startTransition(async () => {
      const patientData = {
        full_name: formData.full_name.trim(),
        email: formData.email.trim() || null,
        phone: formData.phone.trim(),
        date_of_birth: formData.date_of_birth || null,
        gender: formData.gender as Gender,
        address: formData.address.trim() || null,
        occupation: formData.occupation.trim() || null,
        emergency_contact_name: formData.emergency_contact_name.trim() || null,
        emergency_contact_phone: formData.emergency_contact_phone.trim() || null,
        allergies: formData.allergies
          ? formData.allergies.split(',').map((a) => a.trim())
          : null,
        current_medications: formData.current_medications
          ? formData.current_medications.split(',').map((m) => m.trim())
          : null,
        chronic_conditions: formData.chronic_conditions
          ? formData.chronic_conditions.split(',').map((c) => c.trim())
          : null,
        initial_complaint: formData.initial_complaint.trim() || null,
        diagnosis: formData.diagnosis.trim() || null,
        notes: formData.notes.trim() || null,
        status: formData.status as PatientStatus,
      };

      let result;

      if (existingPatient) {
        result = await updatePatient(existingPatient.id, patientData);
      } else {
        result = await createPatient(patientData);
      }

      if (!result.success) {
        setError(result.error || 'Error al guardar el paciente');
        return;
      }

      router.push('/patients');
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

      {/* Datos personales */}
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
                placeholder="Juan Pérez García"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Teléfono *</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                placeholder="55 1234 5678"
                required
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="email">Correo electrónico</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                placeholder="paciente@email.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="date_of_birth">Fecha de nacimiento</Label>
              <Input
                id="date_of_birth"
                type="date"
                value={formData.date_of_birth}
                onChange={(e) => handleChange('date_of_birth', e.target.value)}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="gender">Género</Label>
              <Select
                value={formData.gender}
                onValueChange={(value) => handleChange('gender', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="M">Masculino</SelectItem>
                  <SelectItem value="F">Femenino</SelectItem>
                  <SelectItem value="Otro">Otro</SelectItem>
                  <SelectItem value="No especificado">No especificado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="occupation">Ocupación</Label>
              <Input
                id="occupation"
                value={formData.occupation}
                onChange={(e) => handleChange('occupation', e.target.value)}
                placeholder="Ingeniero, Oficinista, etc."
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Dirección</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => handleChange('address', e.target.value)}
              placeholder="Calle, número, colonia, ciudad"
            />
          </div>
        </CardContent>
      </Card>

      {/* Contacto de emergencia */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">Contacto de Emergencia</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="emergency_contact_name">Nombre</Label>
              <Input
                id="emergency_contact_name"
                value={formData.emergency_contact_name}
                onChange={(e) =>
                  handleChange('emergency_contact_name', e.target.value)
                }
                placeholder="Nombre del contacto"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="emergency_contact_phone">Teléfono</Label>
              <Input
                id="emergency_contact_phone"
                type="tel"
                value={formData.emergency_contact_phone}
                onChange={(e) =>
                  handleChange('emergency_contact_phone', e.target.value)
                }
                placeholder="55 1234 5678"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Historial médico */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">Historial Médico</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="allergies">
              Alergias
              <span className="text-muted-foreground font-normal ml-2">
                (separadas por coma)
              </span>
            </Label>
            <Input
              id="allergies"
              value={formData.allergies}
              onChange={(e) => handleChange('allergies', e.target.value)}
              placeholder="Penicilina, Látex, etc."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="current_medications">
              Medicamentos actuales
              <span className="text-muted-foreground font-normal ml-2">
                (separados por coma)
              </span>
            </Label>
            <Input
              id="current_medications"
              value={formData.current_medications}
              onChange={(e) => handleChange('current_medications', e.target.value)}
              placeholder="Ibuprofeno, Omeprazol, etc."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="chronic_conditions">
              Condiciones crónicas
              <span className="text-muted-foreground font-normal ml-2">
                (separadas por coma)
              </span>
            </Label>
            <Input
              id="chronic_conditions"
              value={formData.chronic_conditions}
              onChange={(e) => handleChange('chronic_conditions', e.target.value)}
              placeholder="Hipertensión, Diabetes, etc."
            />
          </div>
        </CardContent>
      </Card>

      {/* Motivo de consulta */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">Motivo de Consulta</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="initial_complaint">Motivo de consulta inicial</Label>
            <Textarea
              id="initial_complaint"
              value={formData.initial_complaint}
              onChange={(e) => handleChange('initial_complaint', e.target.value)}
              placeholder="Describe el motivo por el que el paciente acude a consulta..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="diagnosis">Diagnóstico</Label>
            <Textarea
              id="diagnosis"
              value={formData.diagnosis}
              onChange={(e) => handleChange('diagnosis', e.target.value)}
              placeholder="Diagnóstico inicial..."
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notas adicionales</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              placeholder="Cualquier información adicional relevante..."
              rows={2}
            />
          </div>

          {existingPatient && (
            <div className="space-y-2">
              <Label htmlFor="status">Estado del paciente</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => handleChange('status', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Activo</SelectItem>
                  <SelectItem value="inactive">Inactivo</SelectItem>
                  <SelectItem value="discharged">Dado de alta</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
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
              {existingPatient ? 'Actualizar' : 'Guardar paciente'}
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
