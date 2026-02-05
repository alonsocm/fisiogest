'use client';

import { useMemo } from 'react';
import type { Appointment } from '@/types/database.types';
import { formatTime } from '@/lib/utils';
import {
  DAYS,
  HOUR_SLOTS,
  FIRST_HOUR,
  SLOT_HEIGHT,
  getWeekDates,
  isSameDay,
  formatHour,
  getTopPosition,
  getBlockHeight,
  getStatusBorderColor,
  layoutAppointments,
} from './calendar-helpers';

interface CalendarWeekViewProps {
  appointments: Appointment[];
  appointmentsByDate: Record<string, Appointment[]>;
  currentDate: Date;
  selectedDate: Date | null;
  onDateSelect: (date: Date) => void;
  onAppointmentClick: (appointment: Appointment) => void;
  onNewAppointment: (date: Date) => void;
}

export function CalendarWeekView({
  appointments,
  appointmentsByDate,
  currentDate,
  selectedDate,
  onDateSelect,
  onAppointmentClick,
  onNewAppointment,
}: CalendarWeekViewProps) {
  const today = new Date();
  const weekDates = useMemo(() => getWeekDates(currentDate), [currentDate]);

  // Current time indicator position
  const nowMinutes = today.getHours() * 60 + today.getMinutes();
  const nowTop = ((nowMinutes - FIRST_HOUR * 60) / 60) * SLOT_HEIGHT;
  const showNowLine =
    nowMinutes >= FIRST_HOUR * 60 &&
    nowMinutes <= (FIRST_HOUR + HOUR_SLOTS.length) * 60 &&
    weekDates.some((d) => isSameDay(d, today));

  const handleCellClick = (date: Date, hour: number) => {
    const newDate = new Date(date);
    newDate.setHours(hour, 0, 0, 0);
    onNewAppointment(newDate);
  };

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[700px]">
        {/* Day headers */}
        <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b">
          <div className="p-2" /> {/* Time gutter */}
          {weekDates.map((date, i) => {
            const isToday = isSameDay(date, today);
            const isSelected = selectedDate ? isSameDay(date, selectedDate) : false;
            // weekDates starts on Monday: index 0=Mon(DAYS[1]), ..., 6=Sun(DAYS[0])
            const dayLabel = DAYS[(i + 1) % 7];

            return (
              <button
                key={i}
                onClick={() => onDateSelect(date)}
                className={`p-2 text-center border-l transition-colors hover:bg-muted/50 ${
                  isSelected ? 'bg-muted' : ''
                }`}
              >
                <p className="text-xs text-muted-foreground">{dayLabel}</p>
                <p
                  className={`text-sm font-medium w-7 h-7 flex items-center justify-center mx-auto rounded-full ${
                    isToday
                      ? 'bg-primary text-primary-foreground'
                      : ''
                  }`}
                >
                  {date.getDate()}
                </p>
              </button>
            );
          })}
        </div>

        {/* Time grid */}
        <div className="relative" style={{ height: HOUR_SLOTS.length * SLOT_HEIGHT }}>
          {/* Hour rows */}
          {HOUR_SLOTS.map((hour) => (
            <div
              key={hour}
              className="absolute w-full border-b border-dashed border-muted"
              style={{ top: (hour - FIRST_HOUR) * SLOT_HEIGHT }}
            >
              <div className="grid grid-cols-[60px_repeat(7,1fr)]" style={{ height: SLOT_HEIGHT }}>
                <div className="pr-2 text-right">
                  <span className="text-xs text-muted-foreground -mt-2 block">
                    {formatHour(hour)}
                  </span>
                </div>
                {weekDates.map((date, i) => (
                  <div
                    key={i}
                    className="border-l hover:bg-muted/30 cursor-pointer transition-colors"
                    onClick={() => handleCellClick(date, hour)}
                  />
                ))}
              </div>
            </div>
          ))}

          {/* Appointments */}
          <div className="absolute inset-0 grid grid-cols-[60px_repeat(7,1fr)] pointer-events-none">
            <div /> {/* Time gutter */}
            {weekDates.map((date, dayIndex) => {
              const dateKey = date.toDateString();
              const dayAppointments = (appointmentsByDate[dateKey] || []).filter(
                (apt) => !['cancelled', 'no_show'].includes(apt.status)
              );
              const layout = layoutAppointments(dayAppointments);

              return (
                <div key={dayIndex} className="relative border-l">
                  {dayAppointments.map((apt) => {
                    const start = new Date(apt.start_time);
                    const end = new Date(apt.end_time);
                    const top = getTopPosition(start);
                    const height = Math.max(getBlockHeight(start, end), 20);
                    const { colIndex, totalCols } = layout.get(apt.id) || {
                      colIndex: 0,
                      totalCols: 1,
                    };
                    const widthPercent = 100 / totalCols;
                    const leftPercent = colIndex * widthPercent;

                    return (
                      <div
                        key={apt.id}
                        className={`absolute border-l-2 rounded-r-md px-1 py-0.5 overflow-hidden cursor-pointer pointer-events-auto transition-opacity hover:opacity-80 ${getStatusBorderColor(apt.status)}`}
                        style={{
                          top: `${top}px`,
                          height: `${height}px`,
                          left: `${leftPercent}%`,
                          width: `calc(${widthPercent}% - 2px)`,
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          onAppointmentClick(apt);
                        }}
                      >
                        <p className="text-[10px] font-medium truncate">
                          {apt.title}
                        </p>
                        <p className="text-[10px] text-muted-foreground truncate">
                          {formatTime(apt.start_time)}
                        </p>
                        {height > 40 && apt.patient && (
                          <p className="text-[10px] text-muted-foreground truncate">
                            {apt.patient.full_name}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}
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
      </div>
    </div>
  );
}
