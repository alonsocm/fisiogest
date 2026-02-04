'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import type { Therapist, TherapistUpdate, ApiResponse } from '@/types/database.types';

// Registro de nuevo terapeuta
export async function signUp(formData: FormData): Promise<ApiResponse<null>> {
  const supabase = await createClient();

  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const fullName = formData.get('fullName') as string;

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
    },
  });

  if (error) {
    return { data: null, error: error.message, success: false };
  }

  revalidatePath('/', 'layout');
  return { data: null, error: null, success: true };
}

// Login
export async function signIn(formData: FormData): Promise<ApiResponse<null>> {
  const supabase = await createClient();

  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { data: null, error: error.message, success: false };
  }

  revalidatePath('/', 'layout');
  return { data: null, error: null, success: true };
}

// Logout
export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath('/', 'layout');
  redirect('/login');
}

// Obtener perfil del terapeuta actual
export async function getCurrentTherapist(): Promise<Therapist | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data, error } = await supabase
    .from('therapists')
    .select('*')
    .eq('id', user.id)
    .single();

  if (error) {
    console.error('Error fetching therapist:', error);
    return null;
  }

  return data;
}

// Actualizar perfil del terapeuta
export async function updateTherapistProfile(
  profileData: TherapistUpdate
): Promise<ApiResponse<Therapist>> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { data: null, error: 'No autenticado', success: false };
  }

  const { data, error } = await supabase
    .from('therapists')
    .update(profileData)
    .eq('id', user.id)
    .select()
    .single();

  if (error) {
    console.error('Error updating profile:', error);
    return { data: null, error: error.message, success: false };
  }

  revalidatePath('/profile');
  return { data, error: null, success: true };
}

// Obtener estadísticas del dashboard
export async function getDashboardStats() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      activePatients: 0,
      totalPatients: 0,
      todayAppointments: 0,
      weekAppointments: 0,
    };
  }

  // Contar pacientes activos
  const { count: activePatients } = await supabase
    .from('patients')
    .select('*', { count: 'exact', head: true })
    .eq('therapist_id', user.id)
    .eq('status', 'active');

  // Contar total de pacientes
  const { count: totalPatients } = await supabase
    .from('patients')
    .select('*', { count: 'exact', head: true })
    .eq('therapist_id', user.id);

  // Contar citas de hoy
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0).toISOString();
  const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999).toISOString();

  const { count: todayAppointments } = await supabase
    .from('appointments')
    .select('*', { count: 'exact', head: true })
    .eq('therapist_id', user.id)
    .gte('start_time', startOfDay)
    .lte('start_time', endOfDay)
    .not('status', 'in', '("cancelled","no_show")');

  // Contar citas de la semana
  const startOfWeek = new Date();
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
  startOfWeek.setHours(0, 0, 0, 0);

  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(endOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);

  const { count: weekAppointments } = await supabase
    .from('appointments')
    .select('*', { count: 'exact', head: true })
    .eq('therapist_id', user.id)
    .gte('start_time', startOfWeek.toISOString())
    .lte('start_time', endOfWeek.toISOString())
    .not('status', 'in', '("cancelled","no_show")');

  return {
    activePatients: activePatients || 0,
    totalPatients: totalPatients || 0,
    todayAppointments: todayAppointments || 0,
    weekAppointments: weekAppointments || 0,
  };
}
