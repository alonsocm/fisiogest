'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import type {
  Appointment,
  AppointmentInsert,
  AppointmentUpdate,
  ApiResponse,
  TodayAppointment,
  AppointmentConflict,
  CreateAppointmentResponse,
} from '@/types/database.types';

// Contar citas en un rango de fechas
export async function getWeekAppointmentsCount(startISO: string, endISO: string): Promise<number> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return 0;

  const { count, error } = await supabase
    .from('appointments')
    .select('*', { count: 'exact', head: true })
    .eq('therapist_id', user.id)
    .gte('start_time', startISO)
    .lte('start_time', endISO)
    .not('status', 'in', '("cancelled","no_show")');

  if (error) {
    console.error('Error counting week appointments:', error);
    return 0;
  }

  return count || 0;
}

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

// Verificar conflictos de horarios
export async function checkAppointmentConflicts(
  startTime: string,
  endTime: string,
  excludeAppointmentId?: string
): Promise<AppointmentConflict[]> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  let query = supabase
    .from('appointments')
    .select(`
      id,
      title,
      start_time,
      end_time,
      patient:patients(full_name)
    `)
    .eq('therapist_id', user.id)
    .not('status', 'in', '("cancelled","no_show")')
    .or(`and(start_time.lt.${endTime},end_time.gt.${startTime})`);

  // Excluir la cita actual si estamos editando
  if (excludeAppointmentId) {
    query = query.neq('id', excludeAppointmentId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error checking conflicts:', error);
    return [];
  }

  return (data || []).map((apt) => {
    const patient = apt.patient as unknown as { full_name: string };
    return {
      id: apt.id,
      title: apt.title,
      patient_name: patient?.full_name || 'Sin paciente',
      start_time: apt.start_time,
      end_time: apt.end_time,
    };
  });
}

// Crear nueva cita
export async function createAppointment(
  appointmentData: Omit<AppointmentInsert, 'therapist_id'>,
  skipConflictCheck: boolean = false
): Promise<CreateAppointmentResponse> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { data: null, error: 'No autenticado', success: false };
  }

  // Verificar conflictos de horarios (si no se omite la verificación)
  if (!skipConflictCheck) {
    const conflicts = await checkAppointmentConflicts(
      appointmentData.start_time,
      appointmentData.end_time
    );

    if (conflicts.length > 0) {
      return {
        data: null,
        error: null,
        success: false,
        conflicts,
      };
    }
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
    .select('*, patient:patients(full_name)')
    .single();

  if (error) {
    console.error('Error updating appointment:', error);
    return { data: null, error: error.message, success: false };
  }

  // Si la cita está completada y se actualizó el precio, sincronizar el cargo
  if (data.status === 'completed' && appointmentData.price != null) {
    const newPrice = appointmentData.price;

    // Buscar cargo existente vinculado a esta cita
    const { data: existingCharge } = await supabase
      .from('payments')
      .select('id')
      .eq('appointment_id', id)
      .eq('type', 'charge')
      .single();

    const patient = data.patient as unknown as { full_name: string };
    const description = `Sesión - ${patient?.full_name || 'Paciente'}`;

    if (existingCharge && newPrice > 0) {
      // Actualizar cargo existente
      await supabase
        .from('payments')
        .update({ amount: newPrice, description })
        .eq('id', existingCharge.id);
    } else if (existingCharge && newPrice <= 0) {
      // Eliminar cargo si el precio es 0
      await supabase
        .from('payments')
        .delete()
        .eq('id', existingCharge.id);
    } else if (!existingCharge && newPrice > 0) {
      // Crear nuevo cargo
      const { createCharge } = await import('./payments');
      await createCharge(data.patient_id, id, newPrice, description);
    }
  }

  revalidatePath('/calendar');
  revalidatePath('/dashboard');
  revalidatePath('/financials');
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

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { data: null, error: 'No autenticado', success: false };
  }

  // Obtener la cita con su precio y datos del paciente
  const { data: appointment, error: fetchError } = await supabase
    .from('appointments')
    .select('*, patient:patients(full_name)')
    .eq('id', id)
    .single();

  if (fetchError || !appointment) {
    console.error('Error fetching appointment:', fetchError);
    return { data: null, error: 'Cita no encontrada', success: false };
  }

  // Actualizar estado de la cita
  const { error } = await supabase
    .from('appointments')
    .update({ status: 'completed' })
    .eq('id', id);

  if (error) {
    console.error('Error completing appointment:', error);
    return { data: null, error: error.message, success: false };
  }

  // Determinar el precio a cobrar
  let priceToCharge = appointment.price;

  // Si no hay precio en la cita, usar el precio predeterminado del terapeuta
  if (!priceToCharge || priceToCharge <= 0) {
    const { data: therapist } = await supabase
      .from('therapists')
      .select('default_session_price')
      .eq('id', user.id)
      .single();

    priceToCharge = therapist?.default_session_price || 0;
  }

  // Crear cargo si el precio es mayor a 0
  if (priceToCharge && priceToCharge > 0) {
    const { createCharge } = await import('./payments');
    const patient = appointment.patient as { full_name: string };
    await createCharge(
      appointment.patient_id,
      id,
      priceToCharge,
      `Sesión - ${patient?.full_name || 'Paciente'}`
    );
  }

  revalidatePath('/calendar');
  revalidatePath('/dashboard');
  revalidatePath(`/patients/${appointment.patient_id}`);
  return { data: null, error: null, success: true };
}
