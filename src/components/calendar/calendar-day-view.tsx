'use client';

import type { Appointment } from '@/types/database.types';
import { formatTime, formatAppointmentType } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { User } from 'lucide-react';
import {
  HOUR_SLOTS,
  FIRST_HOUR,
  SLOT_HEIGHT,
  isSameDay,
  formatHour,
  getTopPosition,
  getBlockHeight,
  getStatusBorderColor,
  layoutAppointments,
} from './calendar-helpers';

interface CalendarDayViewProps {
  appointments: Appointment[];
  appointmentsByDate: Record<string, Appointment[]>;
  currentDate: Date;
  selectedDate: Date | null;
  onDateSelect: (date: Date) => void;
  onAppointmentClick: (appointment: Appointment) => void;
  onNewAppointment: (date: Date) => void;
}

export function CalendarDayView({
  appointmentsByDate,
  currentDate,
  onAppointmentClick,
  onNewAppointment,
}: CalendarDayViewProps) {
  const today = new Date();
  const isToday = isSameDay(currentDate, today);

  // Current time indicator
  const nowMinutes = today.getHours() * 60 + today.getMinutes();
  const nowTop = ((nowMinutes - FIRST_HOUR * 60) / 60) * SLOT_HEIGHT;
  const showNowLine =
    isToday &&
    nowMinutes >= FIRST_HOUR * 60 &&
    nowMinutes <= (FIRST_HOUR + HOUR_SLOTS.length) * 60;

  const dateKey = currentDate.toDateString();
  const dayAppointments = (appointmentsByDate[dateKey] || []).filter(
    (apt) => !['cancelled', 'no_show'].includes(apt.status)
  );
  const layout = layoutAppointments(dayAppointments);

  const handleCellClick = (hour: number) => {
    const newDate = new Date(currentDate);
    newDate.setHours(hour, 0, 0, 0);
    onNewAppointment(newDate);
  };

  return (
    <div className="relative" style={{ height: HOUR_SLOTS.length * SLOT_HEIGHT }}>
      {/* Hour rows */}
      {HOUR_SLOTS.map((hour) => (
        <div
          key={hour}
          className="absolute w-full border-b border-dashed border-muted"
          style={{ top: (hour - FIRST_HOUR) * SLOT_HEIGHT }}
        >
          <div
            className="grid grid-cols-[60px_1fr]"
            style={{ height: SLOT_HEIGHT }}
          >
            <div className="pr-2 text-right">
              <span className="text-xs text-muted-foreground -mt-2 block">
                {formatHour(hour)}
              </span>
            </div>
            <div
              className="border-l hover:bg-muted/30 cursor-pointer transition-colors"
              onClick={() => handleCellClick(hour)}
            />
          </div>
        </div>
      ))}

      {/* Appointments */}
      <div className="absolute inset-0 grid grid-cols-[60px_1fr] pointer-events-none">
        <div /> {/* Time gutter */}
        <div className="relative border-l">
          {dayAppointments.map((apt) => {
            const start = new Date(apt.start_time);
            const end = new Date(apt.end_time);
            const top = getTopPosition(start);
            const height = Math.max(getBlockHeight(start, end), 30);
            const { colIndex, totalCols } = layout.get(apt.id) || {
              colIndex: 0,
              totalCols: 1,
            };
            const widthPercent = 100 / totalCols;
            const leftPercent = colIndex * widthPercent;

            return (
              <div
                key={apt.id}
                className={`absolute border-l-3 rounded-r-md px-3 py-1.5 overflow-hidden cursor-pointer pointer-events-auto transition-opacity hover:opacity-80 ${getStatusBorderColor(apt.status)}`}
                style={{
                  top: `${top}px`,
                  height: `${height}px`,
                  left: `${leftPercent}%`,
                  width: `calc(${widthPercent}% - 4px)`,
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  onAppointmentClick(apt);
                }}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium truncate">{apt.title}</p>
                  <Badge variant="outline" className="text-[10px] shrink-0">
                    {formatAppointmentType(apt.appointment_type)}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  {formatTime(apt.start_time)} - {formatTime(apt.end_time)}
                </p>
                {height > 50 && apt.patient && (
                  <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                    <User className="h-3 w-3" />
                    <span className="truncate">{apt.patient.full_name}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Current time indicator */}
      {showNowLine && (
        <div
          className="absolute left-[60px] right-0 z-10 pointer-events-none"
          style={{ top: `${nowTop}px` }}
        >
          <div className="relative">
            <div className="absolute -left-1.5 -top-1.5 w-3 h-3 rounded-full bg-red-500" />
            <div className="h-0.5 bg-red-500 w-full" />
          </div>
        </div>
      )}
    </div>
  );
}
