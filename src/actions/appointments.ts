'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import type {
  Appointment,
  AppointmentInsert,
  AppointmentUpdate,
  ApiResponse,
  TodayAppointment
} from '@/types/database.types';

// Obtener citas del día actual (recibe timestamps de inicio y fin)
export async function getTodayAppointments(startISO?: string, endISO?: string): Promise<TodayAppointment[]> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  // Si no se pasan fechas, usar el día actual en UTC
  const now = new Date();
  const startOfDay = startISO || new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0).toISOString();
  const endOfDay = endISO || new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999).toISOString();

  const { data, error } = await supabase
    .from('appointments')
    .select(`
      id,
      therapist_id,
      patient_id,
      title,
      start_time,
      end_time,
      duration_minutes,
      status,
      appointment_type,
      notes,
      patients!inner(full_name, phone)
    `)
    .eq('therapist_id', user.id)
    .gte('start_time', startOfDay)
    .lte('start_time', endOfDay)
    .not('status', 'in', '("cancelled","no_show")')
    .order('start_time');

  if (error) {
    console.error('Error fetching today appointments:', error);
    return [];
  }

  return (data || []).map((apt) => {
    const patient = apt.patients as unknown as { full_name: string; phone: string };
    return {
      ...apt,
      patient_name: patient.full_name,
      patient_phone: patient.phone,
    };
  });
}

// Obtener citas para un rango de fechas (calendario)
export async function getAppointmentsByDateRange(
  startDate: string,
  endDate: string
): Promise<Appointment[]> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const { data, error } = await supabase
    .from('appointments')
    .select(`
      *,
      patient:patients(id, full_name, phone)
    `)
    .eq('therapist_id', user.id)
    .gte('start_time', startDate)
    .lte('start_time', endDate)
    .order('start_time');

  if (error) {
    console.error('Error fetching appointments:', error);
    return [];
  }

  return data || [];
}

// Obtener citas de un paciente
export async function getPatientAppointments(patientId: string): Promise<Appointment[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('appointments')
    .select('*')
    .eq('patient_id', patientId)
    .order('start_time', { ascending: false });

  if (error) {
    console.error('Error fetching patient appointments:', error);
    return [];
  }

  return data || [];
}

// Crear nueva cita
export async function createAppointment(
  appointmentData: Omit<AppointmentInsert, 'therapist_id'>
): Promise<ApiResponse<Appointment>> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { data: null, error: 'No autenticado', success: false };
  }

  // Verificar que no haya conflicto de horarios
  const { data: conflicts } = await supabase
    .from('appointments')
    .select('id')
    .eq('therapist_id', user.id)
    .not('status', 'in', '("cancelled","no_show")')
    .or(`and(start_time.lt.${appointmentData.end_time},end_time.gt.${appointmentData.start_time})`);

  if (conflicts && conflicts.length > 0) {
    return {
      data: null,
      error: 'Ya existe una cita en ese horario',
      success: false
    };
  }

  const { data, error } = await supabase
    .from('appointments')
    .insert({
      ...appointmentData,
      therapist_id: user.id,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating appointment:', error);
    return { data: null, error: error.message, success: false };
  }

  revalidatePath('/calendar');
  revalidatePath('/dashboard');
  return { data, error: null, success: true };
}

// Actualizar cita
export async function updateAppointment(
  id: string,
  appointmentData: AppointmentUpdate
): Promise<ApiResponse<Appointment>> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('appointments')
    .update(appointmentData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating appointment:', error);
    return { data: null, error: error.message, success: false };
  }

  revalidatePath('/calendar');
  revalidatePath('/dashboard');
  return { data, error: null, success: true };
}

// Cancelar cita
export async function cancelAppointment(id: string): Promise<ApiResponse<null>> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('appointments')
    .update({ status: 'cancelled' })
    .eq('id', id);

  if (error) {
    console.error('Error cancelling appointment:', error);
    return { data: null, error: error.message, success: false };
  }

  revalidatePath('/calendar');
  revalidatePath('/dashboard');
  return { data: null, error: null, success: true };
}

// Marcar cita como completada
export async function completeAppointment(id: string): Promise<ApiResponse<null>> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('appointments')
    .update({ status: 'completed' })
    .eq('id', id);

  if (error) {
    console.error('Error completing appointment:', error);
    return { data: null, error: error.message, success: false };
  }

  revalidatePath('/calendar');
  revalidatePath('/dashboard');
  return { data: null, error: null, success: true };
}
