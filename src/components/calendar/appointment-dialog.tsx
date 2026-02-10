'use client';

import { useState, useEffect, useTransition, useRef } from 'react';
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
import { Loader2, Trash2, Check, X, FileText, ExternalLink, AlertTriangle } from 'lucide-react';
import type { Appointment, AppointmentType, Patient, ClinicalNote, AppointmentConflict, PaymentMethod } from '@/types/database.types';
import {
  createAppointment,
  updateAppointment,
  cancelAppointment,
  completeAppointment,
} from '@/actions/appointments';
import { getActivePatients } from '@/actions/patients';
import { getClinicalNoteByAppointmentId } from '@/actions/clinical-notes';
import { formatDateTime, formatDate, formatTime } from '@/lib/utils';

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
  const [conflicts, setConflicts] = useState<AppointmentConflict[]>([]);
  const [showConflictWarning, setShowConflictWarning] = useState(false);
  const [showCompleteConfirm, setShowCompleteConfirm] = useState(false);
  const [completePaymentMethod, setCompletePaymentMethod] = useState<PaymentMethod | ''>('cash');
  const conflictRef = useRef<HTMLDivElement>(null);
  const completeRef = useRef<HTMLDivElement>(null);
  const [pendingAppointmentData, setPendingAppointmentData] = useState<{
    patient_id: string;
    title: string;
    description: string | null;
    start_time: string;
    end_time: string;
    appointment_type: AppointmentType;
    notes: string | null;
    price: number | null;
  } | null>(null);

  const [formData, setFormData] = useState({
    patient_id: '',
    title: '',
    description: '',
    date: '',
    start_time: '',
    end_time: '',
    appointment_type: 'session' as AppointmentType,
    notes: '',
    price: '',
  });

  useEffect(() => {
    if (open) {
      loadPatients();
      setLinkedNote(null);
      setLoadingNote(false);
      setConflicts([]);
      setShowConflictWarning(false);
      setShowCompleteConfirm(false);
      setCompletePaymentMethod('cash');
      setPendingAppointmentData(null);
      setError(null);
      if (appointment) {
        const startDate = new Date(appointment.start_time);
        const endDate = new Date(appointment.end_time);
        setFormData({
          patient_id: appointment.patient_id,
          title: appointment.title,
          description: appointment.description || '',
          date: `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}-${String(startDate.getDate()).padStart(2, '0')}`,
          start_time: startDate.toTimeString().slice(0, 5),
          end_time: endDate.toTimeString().slice(0, 5),
          appointment_type: appointment.appointment_type,
          notes: appointment.notes || '',
          price: appointment.price?.toString() || '',
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
          date: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`,
          start_time: '09:00',
          end_time: '10:00',
          appointment_type: 'session',
          notes: '',
          price: '',
        });
      }
    }
  }, [open, appointment, defaultDate]);

  useEffect(() => {
    if (showConflictWarning && conflictRef.current) {
      conflictRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [showConflictWarning]);

  useEffect(() => {
    if (showCompleteConfirm && completeRef.current) {
      completeRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [showCompleteConfirm]);

  const loadPatients = async () => {
    const data = await getActivePatients();
    setPatients(data);
  };

  const handleChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError(null);
  };

  const handleSubmit = (e: React.FormEvent, forceCreate: boolean = false) => {
    e.preventDefault();
    setError(null);
    setShowConflictWarning(false);

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
        price: formData.price ? parseFloat(formData.price) : null,
      };

      if (appointment) {
        const result = await updateAppointment(appointment.id, appointmentData);
        if (!result.success) {
          setError(result.error || 'Error al guardar la cita');
          return;
        }
      } else {
        const result = await createAppointment(appointmentData, forceCreate);

        // Si hay conflictos, mostrar advertencia
        if (!result.success && result.conflicts && result.conflicts.length > 0) {
          setConflicts(result.conflicts);
          setPendingAppointmentData(appointmentData);
          setShowConflictWarning(true);
          return;
        }

        if (!result.success) {
          setError(result.error || 'Error al guardar la cita');
          return;
        }
      }

      onOpenChange(false);
    });
  };

  const handleForceCreate = () => {
    if (!pendingAppointmentData) return;

    startTransition(async () => {
      const result = await createAppointment(pendingAppointmentData, true);

      if (!result.success) {
        setError(result.error || 'Error al guardar la cita');
        setShowConflictWarning(false);
        return;
      }

      onOpenChange(false);
    });
  };

  const handleCancelConflict = () => {
    setShowConflictWarning(false);
    setConflicts([]);
    setPendingAppointmentData(null);
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
    setShowCompleteConfirm(true);
  };

  const handleConfirmComplete = (withPayment: boolean) => {
    if (!appointment) return;
    startTransition(async () => {
      const method = withPayment && completePaymentMethod ? completePaymentMethod : undefined;
      await completeAppointment(appointment.id, method);
      onOpenChange(false);
    });
  };

  const isEditing = !!appointment;
  const canModify =
    !appointment ||
    !['completed', 'cancelled', 'no_show'].includes(appointment.status);
  const canEditPrice = canModify || appointment?.status === 'completed';

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

          <div className="grid gap-4 sm:grid-cols-2">
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
              <Label htmlFor="price">Precio de la sesión</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0"
                value={formData.price}
                onChange={(e) => handleChange('price', e.target.value)}
                placeholder="0.00"
                disabled={!canEditPrice}
              />
            </div>
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

          {/* Complete confirmation panel */}
          {showCompleteConfirm && (
            <div ref={completeRef} className="p-3 rounded-md border border-border bg-muted/30 space-y-3">
              <div className="text-sm font-medium">
                Completar cita
              </div>
              <div className="text-sm text-muted-foreground">
                {formData.price && parseFloat(formData.price) > 0
                  ? `Precio: ${parseFloat(formData.price).toFixed(2)} $`
                  : 'Sin precio definido'}
              </div>
              {formData.price && parseFloat(formData.price) > 0 && (
                <div className="space-y-2">
                  <Label>Método de pago</Label>
                  <Select
                    value={completePaymentMethod}
                    onValueChange={(value) => setCompletePaymentMethod(value as PaymentMethod)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona método de pago" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Efectivo</SelectItem>
                      <SelectItem value="card">Tarjeta</SelectItem>
                      <SelectItem value="transfer">Transferencia</SelectItem>
                      <SelectItem value="other">Otro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="flex flex-col gap-2 pt-1">
                {formData.price && parseFloat(formData.price) > 0 && (
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => handleConfirmComplete(true)}
                    disabled={isPending || !completePaymentMethod}
                  >
                    {isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Completando...
                      </>
                    ) : (
                      <>
                        <Check className="h-4 w-4" />
                        Completar y registrar pago
                      </>
                    )}
                  </Button>
                )}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleConfirmComplete(false)}
                  disabled={isPending}
                >
                  {isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Completando...
                    </>
                  ) : (
                    'Completar sin pago'
                  )}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowCompleteConfirm(false)}
                  disabled={isPending}
                >
                  Cancelar
                </Button>
              </div>
            </div>
          )}

          {/* Conflict warning */}
          {showConflictWarning && conflicts.length > 0 && (
            <div ref={conflictRef} className="p-3 rounded-md border border-amber-500/50 bg-amber-500/10 space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium text-amber-700 dark:text-amber-400">
                <AlertTriangle className="h-4 w-4" />
                Conflicto de horarios
              </div>
              <p className="text-sm text-muted-foreground">
                Ya existen citas programadas en este horario:
              </p>
              <ul className="space-y-1">
                {conflicts.map((conflict) => (
                  <li key={conflict.id} className="text-sm pl-2 border-l-2 border-amber-500/50">
                    <span className="font-medium">{conflict.patient_name}</span>
                    {' — '}
                    {formatTime(conflict.start_time)} a {formatTime(conflict.end_time)}
                  </li>
                ))}
              </ul>
              <div className="flex gap-2 pt-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleCancelConflict}
                  disabled={isPending}
                >
                  Cancelar
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={handleForceCreate}
                  disabled={isPending}
                >
                  {isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Creando...
                    </>
                  ) : (
                    'Crear de todas formas'
                  )}
                </Button>
              </div>
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
            <Button type="submit" disabled={isPending || !canEditPrice} className="flex-1 sm:flex-none">
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
