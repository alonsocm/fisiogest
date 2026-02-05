'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import type {
  ClinicalNote,
  ClinicalNoteInsert,
  ClinicalNoteUpdate,
  ApiResponse
} from '@/types/database.types';

// Obtener notas clínicas de un paciente
export async function getPatientClinicalNotes(patientId: string): Promise<ClinicalNote[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('clinical_notes')
    .select('*')
    .eq('patient_id', patientId)
    .order('session_date', { ascending: false });

  if (error) {
    console.error('Error fetching clinical notes:', error);
    return [];
  }

  return data || [];
}

// Obtener una nota clínica por ID
export async function getClinicalNoteById(id: string): Promise<ApiResponse<ClinicalNote>> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('clinical_notes')
    .select('*, patient:patients(full_name)')
    .eq('id', id)
    .single();

  if (error) {
    return { data: null, error: error.message, success: false };
  }

  return { data, error: null, success: true };
}

// Obtener nota clínica por appointment_id
export async function getClinicalNoteByAppointmentId(
  appointmentId: string
): Promise<ClinicalNote | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('clinical_notes')
    .select('*')
    .eq('appointment_id', appointmentId)
    .maybeSingle();

  if (error) {
    console.error('Error fetching clinical note by appointment:', error);
    return null;
  }

  return data;
}

// Crear nueva nota clínica
export async function createClinicalNote(
  noteData: Omit<ClinicalNoteInsert, 'therapist_id'>
): Promise<ApiResponse<ClinicalNote>> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { data: null, error: 'No autenticado', success: false };
  }

  const { data, error } = await supabase
    .from('clinical_notes')
    .insert({
      ...noteData,
      therapist_id: user.id,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating clinical note:', error);
    return { data: null, error: error.message, success: false };
  }

  revalidatePath(`/patients/${noteData.patient_id}`);
  return { data, error: null, success: true };
}

// Actualizar nota clínica
export async function updateClinicalNote(
  id: string,
  noteData: ClinicalNoteUpdate
): Promise<ApiResponse<ClinicalNote>> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('clinical_notes')
    .update(noteData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating clinical note:', error);
    return { data: null, error: error.message, success: false };
  }

  revalidatePath(`/patients/${data.patient_id}`);
  revalidatePath(`/clinical-notes/${id}`);
  return { data, error: null, success: true };
}

// Eliminar nota clínica
export async function deleteClinicalNote(
  id: string,
  patientId: string
): Promise<ApiResponse<null>> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('clinical_notes')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting clinical note:', error);
    return { data: null, error: error.message, success: false };
  }

  revalidatePath(`/patients/${patientId}`);
  return { data: null, error: null, success: true };
}

// Obtener últimas notas (para dashboard)
export async function getRecentClinicalNotes(limit: number = 5): Promise<ClinicalNote[]> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const { data, error } = await supabase
    .from('clinical_notes')
    .select('*, patient:patients(full_name)')
    .eq('therapist_id', user.id)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching recent notes:', error);
    return [];
  }

  return data || [];
}
