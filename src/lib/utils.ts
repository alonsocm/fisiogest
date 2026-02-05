import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Combinar clases de Tailwind de forma segura
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Formatear fecha a formato local (México/España)
export function formatDate(date: string | Date, options?: Intl.DateTimeFormatOptions): string {
  const defaultOptions: Intl.DateTimeFormatOptions = {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    ...options,
  };
  return new Date(date).toLocaleDateString('es-MX', defaultOptions);
}

// Formatear hora
export function formatTime(date: string | Date): string {
  return new Date(date).toLocaleTimeString('es-MX', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

// Formatear fecha y hora juntas
export function formatDateTime(date: string | Date): string {
  return `${formatDate(date)} ${formatTime(date)}`;
}

// Calcular edad a partir de fecha de nacimiento
export function calculateAge(birthDate: string | Date): number {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }

  return age;
}

// Formatear número de teléfono
export function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');

  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }

  return phone;
}

// Obtener iniciales de un nombre
export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((word) => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

// Capitalizar primera letra
export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

// Generar color basado en string (para avatares)
export function stringToColor(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }

  const colors = [
    'bg-blue-500',
    'bg-green-500',
    'bg-yellow-500',
    'bg-purple-500',
    'bg-pink-500',
    'bg-indigo-500',
    'bg-teal-500',
    'bg-orange-500',
  ];

  return colors[Math.abs(hash) % colors.length];
}

// Formatear estado de cita
export function formatAppointmentStatus(status: string): string {
  const statusMap: Record<string, string> = {
    scheduled: 'Programada',
    confirmed: 'Confirmada',
    in_progress: 'En curso',
    completed: 'Completada',
    cancelled: 'Cancelada',
    no_show: 'No asistió',
  };
  return statusMap[status] || status;
}

// Formatear tipo de cita
export function formatAppointmentType(type: string): string {
  const typeMap: Record<string, string> = {
    evaluation: 'Evaluación',
    session: 'Sesión',
    follow_up: 'Seguimiento',
    discharge: 'Alta',
  };
  return typeMap[type] || type;
}

// Formatear estado del paciente
export function formatPatientStatus(status: string): string {
  const statusMap: Record<string, string> = {
    active: 'Activo',
    inactive: 'Inactivo',
    discharged: 'Dado de alta',
  };
  return statusMap[status] || status;
}

// Formatear estado de progreso
export function formatProgressStatus(status: string): string {
  const statusMap: Record<string, string> = {
    improving: 'Mejorando',
    stable: 'Estable',
    worsening: 'Empeorando',
    recovered: 'Recuperado',
  };
  return statusMap[status] || status;
}

// Obtener color para escala de dolor
export function getPainLevelColor(level: number): string {
  if (level <= 3) return 'text-green-600 bg-green-100';
  if (level <= 6) return 'text-yellow-600 bg-yellow-100';
  return 'text-red-600 bg-red-100';
}

// Debounce function
export function debounce<T extends (...args: Parameters<T>) => ReturnType<T>>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;

  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// Truncar texto
export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length) + '...';
}

// Validar email
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Validar teléfono (10 dígitos)
export function isValidPhone(phone: string): boolean {
  const cleaned = phone.replace(/\D/g, '');
  return cleaned.length === 10;
}

// Formatear tipo de pago
export function formatPaymentType(type: string): string {
  const typeMap: Record<string, string> = {
    charge: 'Cargo',
    payment: 'Pago',
  };
  return typeMap[type] || type;
}

// Formatear método de pago
export function formatPaymentMethod(method: string): string {
  const methodMap: Record<string, string> = {
    cash: 'Efectivo',
    card: 'Tarjeta',
    transfer: 'Transferencia',
    other: 'Otro',
  };
  return methodMap[method] || method;
}

// Formatear moneda
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
  }).format(amount);
}
