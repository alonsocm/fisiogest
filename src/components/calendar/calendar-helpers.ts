import type { Appointment, AppointmentStatus } from '@/types/database.types';

export const DAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
export const DAYS_FULL = [
  'Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado',
];
export const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

// 7:00 to 20:00
export const HOUR_SLOTS = Array.from({ length: 14 }, (_, i) => i + 7);
export const FIRST_HOUR = 7;
export const SLOT_HEIGHT = 60; // px per hour

export function getStatusColor(status: AppointmentStatus): string {
  switch (status) {
    case 'scheduled':
      return 'bg-blue-500';
    case 'confirmed':
      return 'bg-green-500';
    case 'in_progress':
      return 'bg-yellow-500';
    case 'completed':
      return 'bg-gray-500';
    case 'cancelled':
      return 'bg-red-500';
    case 'no_show':
      return 'bg-orange-500';
    default:
      return 'bg-gray-500';
  }
}

export function getStatusBorderColor(status: AppointmentStatus): string {
  switch (status) {
    case 'scheduled':
      return 'border-blue-500 bg-blue-50 dark:bg-blue-950/30';
    case 'confirmed':
      return 'border-green-500 bg-green-50 dark:bg-green-950/30';
    case 'in_progress':
      return 'border-yellow-500 bg-yellow-50 dark:bg-yellow-950/30';
    case 'completed':
      return 'border-gray-400 bg-gray-50 dark:bg-gray-950/30';
    case 'cancelled':
      return 'border-red-500 bg-red-50 dark:bg-red-950/30';
    case 'no_show':
      return 'border-orange-500 bg-orange-50 dark:bg-orange-950/30';
    default:
      return 'border-gray-400 bg-gray-50 dark:bg-gray-950/30';
  }
}

/** Get Monday-start week dates for a given date */
export function getWeekDates(date: Date): Date[] {
  const d = new Date(date);
  const dayOfWeek = d.getDay(); // 0=Sun
  const monday = new Date(d);
  monday.setDate(d.getDate() - ((dayOfWeek + 6) % 7));
  return Array.from({ length: 7 }, (_, i) => {
    const dt = new Date(monday);
    dt.setDate(monday.getDate() + i);
    return dt;
  });
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getDate() === b.getDate() &&
    a.getMonth() === b.getMonth() &&
    a.getFullYear() === b.getFullYear()
  );
}

export function formatHour(hour: number): string {
  if (hour === 0) return '12 AM';
  if (hour < 12) return `${hour} AM`;
  if (hour === 12) return '12 PM';
  return `${hour - 12} PM`;
}

/** Get top position in px for a given time within the grid */
export function getTopPosition(date: Date): number {
  const minutes = date.getHours() * 60 + date.getMinutes();
  return ((minutes - FIRST_HOUR * 60) / 60) * SLOT_HEIGHT;
}

/** Get height in px for a duration between two times */
export function getBlockHeight(startDate: Date, endDate: Date): number {
  const startMinutes = startDate.getHours() * 60 + startDate.getMinutes();
  const endMinutes = endDate.getHours() * 60 + endDate.getMinutes();
  return ((endMinutes - startMinutes) / 60) * SLOT_HEIGHT;
}

/** Group overlapping appointments and return column index + total columns for each */
export function layoutAppointments(
  appointments: Appointment[]
): Map<string, { colIndex: number; totalCols: number }> {
  const layout = new Map<string, { colIndex: number; totalCols: number }>();

  if (appointments.length === 0) return layout;

  const sorted = [...appointments].sort(
    (a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
  );

  // Build overlap groups
  const groups: Appointment[][] = [];
  let currentGroup: Appointment[] = [sorted[0]];
  let groupEnd = new Date(sorted[0].end_time).getTime();

  for (let i = 1; i < sorted.length; i++) {
    const apt = sorted[i];
    const aptStart = new Date(apt.start_time).getTime();

    if (aptStart < groupEnd) {
      // Overlaps with current group
      currentGroup.push(apt);
      groupEnd = Math.max(groupEnd, new Date(apt.end_time).getTime());
    } else {
      groups.push(currentGroup);
      currentGroup = [apt];
      groupEnd = new Date(apt.end_time).getTime();
    }
  }
  groups.push(currentGroup);

  // Assign columns within each group
  for (const group of groups) {
    const totalCols = group.length;
    group.forEach((apt, colIndex) => {
      layout.set(apt.id, { colIndex, totalCols });
    });
  }

  return layout;
}
