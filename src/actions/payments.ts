'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import type {
  Payment,
  ApiResponse,
  PatientBalance,
  FinancialStats,
  PaymentMethod,
} from '@/types/database.types';

// Obtener balance de un paciente
export async function getPatientBalance(patientId: string): Promise<number> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return 0;

  const { data, error } = await supabase
    .from('payments')
    .select('amount, type')
    .eq('patient_id', patientId)
    .eq('therapist_id', user.id);

  if (error) {
    console.error('Error fetching patient balance:', error);
    return 0;
  }

  return (data || []).reduce((acc, payment) => {
    return acc + (payment.type === 'charge' ? payment.amount : -payment.amount);
  }, 0);
}

// Obtener historial de pagos de un paciente
export async function getPatientPayments(patientId: string): Promise<Payment[]> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const { data, error } = await supabase
    .from('payments')
    .select('*, appointment:appointments(title, start_time)')
    .eq('patient_id', patientId)
    .eq('therapist_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching patient payments:', error);
    return [];
  }

  return data || [];
}

// Crear un pago (dinero recibido)
export async function createPayment(paymentData: {
  patient_id: string;
  amount: number;
  payment_method: PaymentMethod;
  description?: string | null;
}): Promise<ApiResponse<Payment>> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { data: null, error: 'No autenticado', success: false };
  }

  const { data, error } = await supabase
    .from('payments')
    .insert({
      therapist_id: user.id,
      patient_id: paymentData.patient_id,
      amount: paymentData.amount,
      type: 'payment',
      payment_method: paymentData.payment_method,
      description: paymentData.description || 'Pago recibido',
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating payment:', error);
    return { data: null, error: error.message, success: false };
  }

  revalidatePath(`/patients/${paymentData.patient_id}`);
  revalidatePath('/financials');
  revalidatePath('/dashboard');
  return { data, error: null, success: true };
}

// Crear un cargo (por sesión completada)
export async function createCharge(
  patientId: string,
  appointmentId: string,
  amount: number,
  description?: string
): Promise<ApiResponse<Payment>> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { data: null, error: 'No autenticado', success: false };
  }

  const { data, error } = await supabase
    .from('payments')
    .insert({
      therapist_id: user.id,
      patient_id: patientId,
      appointment_id: appointmentId,
      amount,
      type: 'charge',
      description: description || 'Cargo por sesión',
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating charge:', error);
    return { data: null, error: error.message, success: false };
  }

  return { data, error: null, success: true };
}

// Obtener estadísticas financieras
export async function getFinancialStats(): Promise<FinancialStats> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      totalIncome: 0,
      monthlyIncome: 0,
      pendingBalance: 0,
      patientsWithBalance: 0,
    };
  }

  const { data: payments } = await supabase
    .from('payments')
    .select('amount, type, patient_id, created_at')
    .eq('therapist_id', user.id);

  if (!payments || payments.length === 0) {
    return {
      totalIncome: 0,
      monthlyIncome: 0,
      pendingBalance: 0,
      patientsWithBalance: 0,
    };
  }

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  let totalCharges = 0;
  let totalPayments = 0;
  let monthlyPayments = 0;
  const patientBalances: Record<string, number> = {};

  payments.forEach((p) => {
    // Calcular balance por paciente
    if (!patientBalances[p.patient_id]) {
      patientBalances[p.patient_id] = 0;
    }

    if (p.type === 'charge') {
      totalCharges += p.amount;
      patientBalances[p.patient_id] += p.amount;
    } else {
      totalPayments += p.amount;
      patientBalances[p.patient_id] -= p.amount;
      if (new Date(p.created_at) >= startOfMonth) {
        monthlyPayments += p.amount;
      }
    }
  });

  const patientsWithBalance = Object.values(patientBalances).filter(
    (b) => b > 0
  ).length;

  return {
    totalIncome: totalPayments,
    monthlyIncome: monthlyPayments,
    pendingBalance: totalCharges - totalPayments,
    patientsWithBalance,
  };
}

// Obtener pacientes con saldo pendiente
export async function getPatientsWithBalance(): Promise<PatientBalance[]> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const { data: payments } = await supabase
    .from('payments')
    .select('patient_id, amount, type, patients!inner(full_name, phone)')
    .eq('therapist_id', user.id);

  if (!payments || payments.length === 0) return [];

  const patientMap: Record<string, PatientBalance> = {};

  payments.forEach((p) => {
    const patient = p.patients as unknown as { full_name: string; phone: string };
    if (!patientMap[p.patient_id]) {
      patientMap[p.patient_id] = {
        patient_id: p.patient_id,
        therapist_id: user.id,
        full_name: patient.full_name,
        phone: patient.phone,
        total_charges: 0,
        total_payments: 0,
        balance: 0,
      };
    }

    if (p.type === 'charge') {
      patientMap[p.patient_id].total_charges += p.amount;
    } else {
      patientMap[p.patient_id].total_payments += p.amount;
    }
    patientMap[p.patient_id].balance =
      patientMap[p.patient_id].total_charges -
      patientMap[p.patient_id].total_payments;
  });

  return Object.values(patientMap)
    .filter((p) => p.balance > 0)
    .sort((a, b) => b.balance - a.balance);
}

// Eliminar un pago
export async function deletePayment(
  id: string,
  patientId: string
): Promise<ApiResponse<null>> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { data: null, error: 'No autenticado', success: false };
  }

  const { error } = await supabase
    .from('payments')
    .delete()
    .eq('id', id)
    .eq('therapist_id', user.id);

  if (error) {
    console.error('Error deleting payment:', error);
    return { data: null, error: error.message, success: false };
  }

  revalidatePath(`/patients/${patientId}`);
  revalidatePath('/financials');
  revalidatePath('/dashboard');
  return { data: null, error: null, success: true };
}
