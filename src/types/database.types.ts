// =============================================
// FisioGest - Tipos de Base de Datos
// =============================================
// Tipos generados basados en el schema de Supabase

export type Gender = 'M' | 'F' | 'Otro' | 'No especificado';
export type PatientStatus = 'active' | 'inactive' | 'discharged';
export type AppointmentStatus = 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
export type AppointmentType = 'evaluation' | 'session' | 'follow_up' | 'discharge';
export type ProgressStatus = 'improving' | 'stable' | 'worsening' | 'recovered';

// =============================================
// Therapist (Terapeuta)
// =============================================
export interface Therapist {
  id: string;
  email: string;
  full_name: string;
  phone: string | null;
  license_number: string | null;
  clinic_name: string | null;
  clinic_address: string | null;
  specialty: string;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface TherapistInsert {
  id: string;
  email: string;
  full_name: string;
  phone?: string | null;
  license_number?: string | null;
  clinic_name?: string | null;
  clinic_address?: string | null;
  specialty?: string;
  avatar_url?: string | null;
}

export interface TherapistUpdate {
  email?: string;
  full_name?: string;
  phone?: string | null;
  license_number?: string | null;
  clinic_name?: string | null;
  clinic_address?: string | null;
  specialty?: string;
  avatar_url?: string | null;
}

// =============================================
// Patient (Paciente)
// =============================================
export interface MedicalHistory {
  [key: string]: unknown;
}

export interface Patient {
  id: string;
  therapist_id: string;
  full_name: string;
  email: string | null;
  phone: string;
  date_of_birth: string | null;
  gender: Gender | null;
  address: string | null;
  occupation: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  medical_history: MedicalHistory;
  allergies: string[] | null;
  current_medications: string[] | null;
  previous_surgeries: string[] | null;
  chronic_conditions: string[] | null;
  initial_complaint: string | null;
  diagnosis: string | null;
  status: PatientStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface PatientInsert {
  therapist_id: string;
  full_name: string;
  phone: string;
  email?: string | null;
  date_of_birth?: string | null;
  gender?: Gender | null;
  address?: string | null;
  occupation?: string | null;
  emergency_contact_name?: string | null;
  emergency_contact_phone?: string | null;
  medical_history?: MedicalHistory;
  allergies?: string[] | null;
  current_medications?: string[] | null;
  previous_surgeries?: string[] | null;
  chronic_conditions?: string[] | null;
  initial_complaint?: string | null;
  diagnosis?: string | null;
  status?: PatientStatus;
  notes?: string | null;
}

export interface PatientUpdate {
  full_name?: string;
  email?: string | null;
  phone?: string;
  date_of_birth?: string | null;
  gender?: Gender | null;
  address?: string | null;
  occupation?: string | null;
  emergency_contact_name?: string | null;
  emergency_contact_phone?: string | null;
  medical_history?: MedicalHistory;
  allergies?: string[] | null;
  current_medications?: string[] | null;
  previous_surgeries?: string[] | null;
  chronic_conditions?: string[] | null;
  initial_complaint?: string | null;
  diagnosis?: string | null;
  status?: PatientStatus;
  notes?: string | null;
}

// =============================================
// Appointment (Cita)
// =============================================
export interface Appointment {
  id: string;
  therapist_id: string;
  patient_id: string;
  title: string;
  description: string | null;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  status: AppointmentStatus;
  appointment_type: AppointmentType;
  reminder_sent: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
  // Relaciones opcionales
  patient?: Patient;
}

export interface AppointmentInsert {
  therapist_id: string;
  patient_id: string;
  title: string;
  start_time: string;
  end_time: string;
  description?: string | null;
  status?: AppointmentStatus;
  appointment_type?: AppointmentType;
  notes?: string | null;
}

export interface AppointmentUpdate {
  patient_id?: string;
  title?: string;
  description?: string | null;
  start_time?: string;
  end_time?: string;
  status?: AppointmentStatus;
  appointment_type?: AppointmentType;
  reminder_sent?: boolean;
  notes?: string | null;
}

// =============================================
// Clinical Note (Nota Clínica)
// =============================================
export interface PrescribedExercise {
  name: string;
  sets?: number;
  reps?: number;
  duration?: string;
  frequency?: string;
  instructions?: string;
}

export interface ClinicalNote {
  id: string;
  therapist_id: string;
  patient_id: string;
  appointment_id: string | null;
  session_date: string;
  pain_level_before: number | null;
  pain_level_after: number | null;
  pain_location: string | null;
  subjective: string | null;
  objective: string | null;
  assessment: string | null;
  plan: string | null;
  treatment_performed: string | null;
  techniques_used: string[] | null;
  exercises_prescribed: PrescribedExercise[];
  session_duration_minutes: number | null;
  progress_status: ProgressStatus | null;
  next_session_recommendation: string | null;
  created_at: string;
  updated_at: string;
  // Relaciones opcionales
  patient?: Patient;
}

export interface ClinicalNoteInsert {
  therapist_id: string;
  patient_id: string;
  appointment_id?: string | null;
  session_date?: string;
  pain_level_before?: number | null;
  pain_level_after?: number | null;
  pain_location?: string | null;
  subjective?: string | null;
  objective?: string | null;
  assessment?: string | null;
  plan?: string | null;
  treatment_performed?: string | null;
  techniques_used?: string[] | null;
  exercises_prescribed?: PrescribedExercise[];
  session_duration_minutes?: number | null;
  progress_status?: ProgressStatus | null;
  next_session_recommendation?: string | null;
}

export interface ClinicalNoteUpdate {
  appointment_id?: string | null;
  session_date?: string;
  pain_level_before?: number | null;
  pain_level_after?: number | null;
  pain_location?: string | null;
  subjective?: string | null;
  objective?: string | null;
  assessment?: string | null;
  plan?: string | null;
  treatment_performed?: string | null;
  techniques_used?: string[] | null;
  exercises_prescribed?: PrescribedExercise[];
  session_duration_minutes?: number | null;
  progress_status?: ProgressStatus | null;
  next_session_recommendation?: string | null;
}

// =============================================
// Vistas y tipos compuestos
// =============================================
export interface TodayAppointment {
  id: string;
  therapist_id: string;
  patient_id: string;
  patient_name: string;
  patient_phone: string;
  title: string;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  status: AppointmentStatus;
  appointment_type: AppointmentType;
  notes: string | null;
}

export interface TherapistStats {
  therapist_id: string;
  active_patients: number;
  total_patients: number;
  today_appointments: number;
  week_appointments: number;
}

// =============================================
// Tipos para formularios
// =============================================
export interface PatientFormData {
  full_name: string;
  email: string;
  phone: string;
  date_of_birth: string;
  gender: Gender;
  address: string;
  occupation: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  allergies: string;
  current_medications: string;
  chronic_conditions: string;
  initial_complaint: string;
  diagnosis: string;
  notes: string;
}

export interface ClinicalNoteFormData {
  patient_id: string;
  session_date: string;
  pain_level_before: number;
  pain_level_after: number;
  pain_location: string;
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
  treatment_performed: string;
  techniques_used: string;
  session_duration_minutes: number;
  progress_status: ProgressStatus;
  next_session_recommendation: string;
}

export interface AppointmentFormData {
  patient_id: string;
  title: string;
  description: string;
  date: string;
  start_time: string;
  end_time: string;
  appointment_type: AppointmentType;
  notes: string;
}

// =============================================
// Tipo para respuestas de API
// =============================================
export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  count: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
