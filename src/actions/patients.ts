'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import type { Patient, PatientInsert, PatientUpdate, ApiResponse, PaginatedResponse } from '@/types/database.types';

// Obtener todos los pacientes del terapeuta con paginación
export async function getPatients(
  page: number = 1,
  pageSize: number = 10,
  search?: string,
  status?: string
): Promise<PaginatedResponse<Patient>> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { data: [], count: 0, page, pageSize, totalPages: 0 };
  }

  let query = supabase
    .from('patients')
    .select('*', { count: 'exact' })
    .eq('therapist_id', user.id)
    .order('created_at', { ascending: false });

  // Filtro de búsqueda
  if (search) {
    query = query.or(`full_name.ilike.%${search}%,phone.ilike.%${search}%,email.ilike.%${search}%`);
  }

  // Filtro de estado
  if (status && status !== 'all') {
    query = query.eq('status', status);
  }

  // Paginación
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  query = query.range(from, to);

  const { data, error, count } = await query;

  if (error) {
    console.error('Error fetching patients:', error);
    return { data: [], count: 0, page, pageSize, totalPages: 0 };
  }

  return {
    data: data || [],
    count: count || 0,
    page,
    pageSize,
    totalPages: Math.ceil((count || 0) / pageSize),
  };
}

// Obtener un paciente por ID
export async function getPatientById(id: string): Promise<ApiResponse<Patient>> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('patients')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    return { data: null, error: error.message, success: false };
  }

  return { data, error: null, success: true };
}

// Crear nuevo paciente
export async function createPatient(
  patientData: Omit<PatientInsert, 'therapist_id'>
): Promise<ApiResponse<Patient>> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { data: null, error: 'No autenticado', success: false };
  }

  const { data, error } = await supabase
    .from('patients')
    .insert({
      ...patientData,
      therapist_id: user.id,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating patient:', error);
    return { data: null, error: error.message, success: false };
  }

  revalidatePath('/patients');
  revalidatePath('/dashboard');
  return { data, error: null, success: true };
}

// Actualizar paciente
export async function updatePatient(
  id: string,
  patientData: PatientUpdate
): Promise<ApiResponse<Patient>> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('patients')
    .update(patientData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating patient:', error);
    return { data: null, error: error.message, success: false };
  }

  revalidatePath('/patients');
  revalidatePath(`/patients/${id}`);
  return { data, error: null, success: true };
}

// Eliminar paciente
export async function deletePatient(id: string): Promise<ApiResponse<null>> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('patients')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting patient:', error);
    return { data: null, error: error.message, success: false };
  }

  revalidatePath('/patients');
  revalidatePath('/dashboard');
  return { data: null, error: null, success: true };
}

// Obtener pacientes activos (para selects)
export async function getActivePatients(): Promise<Pick<Patient, 'id' | 'full_name' | 'phone'>[]> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }

  const { data, error } = await supabase
    .from('patients')
    .select('id, full_name, phone')
    .eq('therapist_id', user.id)
    .eq('status', 'active')
    .order('full_name');

  if (error) {
    console.error('Error fetching active patients:', error);
    return [];
  }

  return data || [];
}
