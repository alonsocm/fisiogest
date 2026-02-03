'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Save, Loader2, AlertCircle } from 'lucide-react';
import type {
  ClinicalNote,
  ClinicalNoteFormData,
  ProgressStatus,
  Patient,
} from '@/types/database.types';
import { createClinicalNote, updateClinicalNote } from '@/actions/clinical-notes';
import { getPainLevelColor } from '@/lib/utils';

interface ClinicalNoteFormProps {
  patientId: string;
  patient?: Patient;
  existingNote?: ClinicalNote;
  appointmentId?: string;
}

export function ClinicalNoteForm({
  patientId,
  patient,
  existingNote,
  appointmentId,
}: ClinicalNoteFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<ClinicalNoteFormData>({
    patient_id: patientId,
    session_date: existingNote?.session_date || new Date().toISOString().split('T')[0],
    pain_level_before: existingNote?.pain_level_before ?? 5,
    pain_level_after: existingNote?.pain_level_after ?? 0,
    pain_location: existingNote?.pain_location || '',
    subjective: existingNote?.subjective || '',
    objective: existingNote?.objective || '',
    assessment: existingNote?.assessment || '',
    plan: existingNote?.plan || '',
    treatment_performed: existingNote?.treatment_performed || '',
    techniques_used: existingNote?.techniques_used?.join(', ') || '',
    session_duration_minutes: existingNote?.session_duration_minutes || 45,
    progress_status: existingNote?.progress_status || 'stable',
    next_session_recommendation: existingNote?.next_session_recommendation || '',
  });

  const handleChange = (
    field: keyof ClinicalNoteFormData,
    value: string | number
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      const noteData = {
        patient_id: patientId,
        appointment_id: appointmentId || null,
        session_date: formData.session_date,
        pain_level_before: formData.pain_level_before,
        pain_level_after: formData.pain_level_after,
        pain_location: formData.pain_location || null,
        subjective: formData.subjective || null,
        objective: formData.objective || null,
        assessment: formData.assessment || null,
        plan: formData.plan || null,
        treatment_performed: formData.treatment_performed || null,
        techniques_used: formData.techniques_used
          ? formData.techniques_used.split(',').map((t) => t.trim())
          : null,
        session_duration_minutes: formData.session_duration_minutes,
        progress_status: formData.progress_status as ProgressStatus,
        next_session_recommendation: formData.next_session_recommendation || null,
      };

      let result;

      if (existingNote) {
        result = await updateClinicalNote(existingNote.id, noteData);
      } else {
        result = await createClinicalNote(noteData);
      }

      if (!result.success) {
        setError(result.error || 'Error al guardar la nota');
        return;
      }

      router.push(`/patients/${patientId}`);
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

      {/* Información de la sesión */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">Información de la Sesión</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="session_date">Fecha de la sesión</Label>
              <Input
                id="session_date"
                type="date"
                value={formData.session_date}
                onChange={(e) => handleChange('session_date', e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="session_duration">Duración (minutos)</Label>
              <Input
                id="session_duration"
                type="number"
                min="15"
                max="180"
                step="15"
                value={formData.session_duration_minutes}
                onChange={(e) =>
                  handleChange('session_duration_minutes', parseInt(e.target.value))
                }
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="progress_status">Estado de progreso</Label>
            <Select
              value={formData.progress_status}
              onValueChange={(value) => handleChange('progress_status', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona el estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="improving">Mejorando</SelectItem>
                <SelectItem value="stable">Estable</SelectItem>
                <SelectItem value="worsening">Empeorando</SelectItem>
                <SelectItem value="recovered">Recuperado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Escala de dolor */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">Evaluación del Dolor</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="pain_location">Localización del dolor</Label>
            <Input
              id="pain_location"
              placeholder="Ej: Lumbar, Cervical, Rodilla derecha..."
              value={formData.pain_location}
              onChange={(e) => handleChange('pain_location', e.target.value)}
            />
          </div>

          <div className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Dolor al inicio de la sesión</Label>
                <span
                  className={`px-2 py-1 rounded-md font-semibold ${getPainLevelColor(formData.pain_level_before)}`}
                >
                  {formData.pain_level_before}/10
                </span>
              </div>
              <Slider
                value={[formData.pain_level_before]}
                onValueChange={(value) =>
                  handleChange('pain_level_before', value[0])
                }
                max={10}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Sin dolor</span>
                <span>Dolor moderado</span>
                <span>Dolor máximo</span>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Dolor al final de la sesión</Label>
                <span
                  className={`px-2 py-1 rounded-md font-semibold ${getPainLevelColor(formData.pain_level_after)}`}
                >
                  {formData.pain_level_after}/10
                </span>
              </div>
              <Slider
                value={[formData.pain_level_after]}
                onValueChange={(value) =>
                  handleChange('pain_level_after', value[0])
                }
                max={10}
                step={1}
                className="w-full"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notas SOAP */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">Notas SOAP</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="subjective">
              S - Subjetivo
              <span className="text-muted-foreground font-normal ml-2">
                (Lo que reporta el paciente)
              </span>
            </Label>
            <Textarea
              id="subjective"
              placeholder="Ej: El paciente refiere dolor persistente en la zona lumbar, especialmente al levantarse por las mañanas..."
              rows={3}
              value={formData.subjective}
              onChange={(e) => handleChange('subjective', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="objective">
              O - Objetivo
              <span className="text-muted-foreground font-normal ml-2">
                (Observaciones y mediciones)
              </span>
            </Label>
            <Textarea
              id="objective"
              placeholder="Ej: Rango de movimiento limitado en flexión lumbar (60°). Tensión muscular palpable en paravertebrales..."
              rows={3}
              value={formData.objective}
              onChange={(e) => handleChange('objective', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="assessment">
              A - Análisis
              <span className="text-muted-foreground font-normal ml-2">
                (Evaluación del terapeuta)
              </span>
            </Label>
            <Textarea
              id="assessment"
              placeholder="Ej: Paciente muestra mejoría en movilidad. Persiste contractura muscular que requiere trabajo adicional..."
              rows={3}
              value={formData.assessment}
              onChange={(e) => handleChange('assessment', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="plan">
              P - Plan
              <span className="text-muted-foreground font-normal ml-2">
                (Plan de tratamiento)
              </span>
            </Label>
            <Textarea
              id="plan"
              placeholder="Ej: Continuar con terapia manual 2 veces por semana. Agregar ejercicios de estabilización core..."
              rows={3}
              value={formData.plan}
              onChange={(e) => handleChange('plan', e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Tratamiento realizado */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">Tratamiento Realizado</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="treatment_performed">Descripción del tratamiento</Label>
            <Textarea
              id="treatment_performed"
              placeholder="Describe el tratamiento realizado durante la sesión..."
              rows={3}
              value={formData.treatment_performed}
              onChange={(e) => handleChange('treatment_performed', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="techniques_used">
              Técnicas aplicadas
              <span className="text-muted-foreground font-normal ml-2">
                (separadas por coma)
              </span>
            </Label>
            <Input
              id="techniques_used"
              placeholder="Ej: Masaje terapéutico, Punción seca, Ejercicio terapéutico, TENS"
              value={formData.techniques_used}
              onChange={(e) => handleChange('techniques_used', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="next_session">Recomendación próxima sesión</Label>
            <Textarea
              id="next_session"
              placeholder="Ej: Programar en 3-4 días. Enfocar en ejercicios de fortalecimiento..."
              rows={2}
              value={formData.next_session_recommendation}
              onChange={(e) =>
                handleChange('next_session_recommendation', e.target.value)
              }
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
              {existingNote ? 'Actualizar nota' : 'Guardar nota'}
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
