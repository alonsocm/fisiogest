'use client';

import { useState, useEffect, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import Link from 'next/link';
import { Loader2, Trash2, Check, X, FileText, ExternalLink } from 'lucide-react';
import type { Appointment, AppointmentType, Patient, ClinicalNote } from '@/types/database.types';
import {
  createAppointment,
  updateAppointment,
  cancelAppointment,
  completeAppointment,
} from '@/actions/appointments';
import { getActivePatients } from '@/actions/patients';
import { getClinicalNoteByAppointmentId } from '@/actions/clinical-notes';
import { formatDateTime, formatDate } from '@/lib/utils';

interface AppointmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointment?: Appointment | null;
  defaultDate?: Date | null;
}

export function AppointmentDialog({
  open,
  onOpenChange,
  appointment,
  defaultDate,
}: AppointmentDialogProps) {
  const [isPending, startTransition] = useTransition();
  const [patients, setPatients] = useState<Pick<Patient, 'id' | 'full_name' | 'phone'>[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [linkedNote, setLinkedNote] = useState<ClinicalNote | null>(null);
  const [loadingNote, setLoadingNote] = useState(false);

  const [formData, setFormData] = useState({
    patient_id: '',
    title: '',
    description: '',
    date: '',
    start_time: '',
    end_time: '',
    appointment_type: 'session' as AppointmentType,
    notes: '',
  });

  useEffect(() => {
    if (open) {
      loadPatients();
      setLinkedNote(null);
      setLoadingNote(false);
      if (appointment) {
        const startDate = new Date(appointment.start_time);
        const endDate = new Date(appointment.end_time);
        setFormData({
          patient_id: appointment.patient_id,
          title: appointment.title,
          description: appointment.description || '',
          date: startDate.toISOString().split('T')[0],
          start_time: startDate.toTimeString().slice(0, 5),
          end_time: endDate.toTimeString().slice(0, 5),
          appointment_type: appointment.appointment_type,
          notes: appointment.notes || '',
        });

        // Fetch linked clinical note for completed appointments
        if (appointment.status === 'completed') {
          setLoadingNote(true);
          getClinicalNoteByAppointmentId(appointment.id).then((note) => {
            setLinkedNote(note);
            setLoadingNote(false);
          });
        }
      } else {
        const date = defaultDate || new Date();
        setFormData({
          patient_id: '',
          title: 'Sesión de fisioterapia',
          description: '',
          date: date.toISOString().split('T')[0],
          start_time: '09:00',
          end_time: '10:00',
          appointment_type: 'session',
          notes: '',
        });
      }
    }
  }, [open, appointment, defaultDate]);

  const loadPatients = async () => {
    const data = await getActivePatients();
    setPatients(data);
  };

  const handleChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.patient_id) {
      setError('Selecciona un paciente');
      return;
    }

    startTransition(async () => {
      const startTime = new Date(`${formData.date}T${formData.start_time}`);
      const endTime = new Date(`${formData.date}T${formData.end_time}`);

      if (endTime <= startTime) {
        setError('La hora de fin debe ser después de la hora de inicio');
        return;
      }

      const appointmentData = {
        patient_id: formData.patient_id,
        title: formData.title,
        description: formData.description || null,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        appointment_type: formData.appointment_type,
        notes: formData.notes || null,
      };

      let result;

      if (appointment) {
        result = await updateAppointment(appointment.id, appointmentData);
      } else {
        result = await createAppointment(appointmentData);
      }

      if (!result.success) {
        setError(result.error || 'Error al guardar la cita');
        return;
      }

      onOpenChange(false);
    });
  };

  const handleCancel = () => {
    if (!appointment) return;
    startTransition(async () => {
      await cancelAppointment(appointment.id);
      onOpenChange(false);
    });
  };

  const handleComplete = () => {
    if (!appointment) return;
    startTransition(async () => {
      await completeAppointment(appointment.id);
      onOpenChange(false);
    });
  };

  const isEditing = !!appointment;
  const canModify =
    !appointment ||
    !['completed', 'cancelled', 'no_show'].includes(appointment.status);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Editar Cita' : 'Nueva Cita'}
          </DialogTitle>
          {isEditing && appointment && (
            <DialogDescription>
              {formatDateTime(appointment.start_time)}
            </DialogDescription>
          )}
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 overflow-y-auto flex-1 pb-4">
          {error && (
            <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="patient_id">Paciente *</Label>
            <Select
              value={formData.patient_id}
              onValueChange={(value) => handleChange('patient_id', value)}
              disabled={!canModify}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un paciente" />
              </SelectTrigger>
              <SelectContent>
                {patients.map((patient) => (
                  <SelectItem key={patient.id} value={patient.id}>
                    {patient.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Título</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
              disabled={!canModify}
              required
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="date">Fecha</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => handleChange('date', e.target.value)}
                disabled={!canModify}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="start_time">Hora inicio</Label>
              <Input
                id="start_time"
                type="time"
                value={formData.start_time}
                onChange={(e) => handleChange('start_time', e.target.value)}
                disabled={!canModify}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end_time">Hora fin</Label>
              <Input
                id="end_time"
                type="time"
                value={formData.end_time}
                onChange={(e) => handleChange('end_time', e.target.value)}
                disabled={!canModify}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="appointment_type">Tipo de cita</Label>
            <Select
              value={formData.appointment_type}
              onValueChange={(value) => handleChange('appointment_type', value)}
              disabled={!canModify}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="evaluation">Evaluación</SelectItem>
                <SelectItem value="session">Sesión</SelectItem>
                <SelectItem value="follow_up">Seguimiento</SelectItem>
                <SelectItem value="discharge">Alta</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notas</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              placeholder="Notas adicionales..."
              rows={2}
              disabled={!canModify}
            />
          </div>

          {/* Linked clinical note section */}
          {isEditing && appointment?.status === 'completed' && (
            <div className="p-3 rounded-md border bg-muted/30 space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <FileText className="h-4 w-4" />
                Nota Clínica
              </div>
              {loadingNote ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Cargando...
                </div>
              ) : linkedNote ? (
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Nota del {formatDate(linkedNote.session_date)}
                  </p>
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/patients/${appointment.patient_id}/notes/${linkedNote.id}`}>
                      Ver nota
                      <ExternalLink className="h-3 w-3 ml-1" />
                    </Link>
                  </Button>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Sin nota clínica vinculada
                  </p>
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/patients/${appointment.patient_id}/notes/new?appointmentId=${appointment.id}`}>
                      Crear nota
                    </Link>
                  </Button>
                </div>
              )}
            </div>
          )}

          <div className="flex flex-col-reverse sm:flex-row gap-2 pt-4 border-t mt-4 sticky bottom-0 bg-background">
            {isEditing && canModify && (
              <>
                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleCancel}
                  disabled={isPending}
                  className="flex-1 sm:flex-none"
                >
                  <X className="h-4 w-4" />
                  Cancelar cita
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleComplete}
                  disabled={isPending}
                  className="flex-1 sm:flex-none"
                >
                  <Check className="h-4 w-4" />
                  Completar
                </Button>
              </>
            )}
            <Button type="submit" disabled={isPending || !canModify} className="flex-1 sm:flex-none">
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : isEditing ? (
                'Actualizar'
              ) : (
                'Crear cita'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
