'use client';

import { useState, useMemo, useEffect } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  User,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Appointment } from '@/types/database.types';
import {
  formatTime,
  formatAppointmentStatus,
  formatAppointmentType,
} from '@/lib/utils';
import {
  DAYS,
  DAYS_FULL,
  MONTHS,
  getStatusColor,
  getWeekDates,
  isSameDay,
} from './calendar-helpers';
import { CalendarWeekView } from './calendar-week-view';
import { CalendarDayView } from './calendar-day-view';

interface CalendarViewProps {
  appointments: Appointment[];
  onDateSelect?: (date: Date) => void;
  onAppointmentClick?: (appointment: Appointment) => void;
  onNewAppointment?: (date: Date) => void;
}

export function CalendarView({
  appointments,
  onDateSelect,
  onAppointmentClick,
  onNewAppointment,
}: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [view, setView] = useState<'month' | 'week' | 'day'>('month');

  // Sync selectedDate with currentDate in day view
  useEffect(() => {
    if (view === 'day') {
      setSelectedDate(new Date(currentDate));
    }
  }, [view, currentDate]);

  // Month view calculations
  const firstDayOfMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth(),
    1
  );
  const lastDayOfMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth() + 1,
    0
  );
  const daysInMonth = lastDayOfMonth.getDate();
  const startingDay = firstDayOfMonth.getDay();

  // Group appointments by date
  const appointmentsByDate = useMemo(() => {
    const grouped: Record<string, Appointment[]> = {};
    appointments.forEach((apt) => {
      const dateKey = new Date(apt.start_time).toDateString();
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(apt);
    });
    return grouped;
  }, [appointments]);

  // Selected date appointments (for sidebar)
  const selectedDateAppointments = useMemo(() => {
    if (!selectedDate) return [];
    const dateKey = selectedDate.toDateString();
    return (appointmentsByDate[dateKey] || []).sort(
      (a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
    );
  }, [selectedDate, appointmentsByDate]);

  // View-aware navigation
  const handlePrev = () => {
    if (view === 'month') {
      setCurrentDate(
        new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1)
      );
    } else if (view === 'week') {
      const d = new Date(currentDate);
      d.setDate(d.getDate() - 7);
      setCurrentDate(d);
    } else {
      const d = new Date(currentDate);
      d.setDate(d.getDate() - 1);
      setCurrentDate(d);
    }
  };

  const handleNext = () => {
    if (view === 'month') {
      setCurrentDate(
        new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1)
      );
    } else if (view === 'week') {
      const d = new Date(currentDate);
      d.setDate(d.getDate() + 7);
      setCurrentDate(d);
    } else {
      const d = new Date(currentDate);
      d.setDate(d.getDate() + 1);
      setCurrentDate(d);
    }
  };

  const handleToday = () => {
    setCurrentDate(new Date());
    setSelectedDate(new Date());
  };

  const handleDateClick = (day: number) => {
    const date = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      day
    );
    setSelectedDate(date);
    onDateSelect?.(date);
  };

  // View-aware header title
  const getHeaderTitle = () => {
    if (view === 'month') {
      return `${MONTHS[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
    }
    if (view === 'week') {
      const weekDates = getWeekDates(currentDate);
      const start = weekDates[0];
      const end = weekDates[6];
      if (start.getMonth() === end.getMonth()) {
        return `${start.getDate()} - ${end.getDate()} ${MONTHS[start.getMonth()]} ${start.getFullYear()}`;
      }
      return `${start.getDate()} ${MONTHS[start.getMonth()].slice(0, 3)} - ${end.getDate()} ${MONTHS[end.getMonth()].slice(0, 3)} ${end.getFullYear()}`;
    }
    // day
    return `${DAYS_FULL[currentDate.getDay()]} ${currentDate.getDate()} de ${MONTHS[currentDate.getMonth()]}, ${currentDate.getFullYear()}`;
  };

  // Month view helpers
  const isTodayDay = (day: number) => {
    const today = new Date();
    return (
      day === today.getDate() &&
      currentDate.getMonth() === today.getMonth() &&
      currentDate.getFullYear() === today.getFullYear()
    );
  };

  const isSelectedDay = (day: number) => {
    if (!selectedDate) return false;
    return (
      day === selectedDate.getDate() &&
      currentDate.getMonth() === selectedDate.getMonth() &&
      currentDate.getFullYear() === selectedDate.getFullYear()
    );
  };

  const hasAppointments = (day: number) => {
    const date = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      day
    );
    return appointmentsByDate[date.toDateString()]?.length > 0;
  };

  const getAppointmentCount = (day: number) => {
    const date = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      day
    );
    return appointmentsByDate[date.toDateString()]?.length || 0;
  };

  // Generate calendar days for month view
  const calendarDays = [];
  for (let i = 0; i < startingDay; i++) {
    calendarDays.push(null);
  }
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day);
  }

  return (
    <div className="flex flex-col lg:flex-row gap-4">
      {/* Calendar */}
      <Card className="flex-1">
        <CardHeader className="pb-2">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-lg">{getHeaderTitle()}</CardTitle>
            <div className="flex items-center gap-2">
              {/* View toggle */}
              <div className="flex items-center border rounded-md">
                <Button
                  variant={view === 'month' ? 'default' : 'ghost'}
                  size="sm"
                  className="rounded-r-none h-8 px-3"
                  onClick={() => setView('month')}
                >
                  Mes
                </Button>
                <Button
                  variant={view === 'week' ? 'default' : 'ghost'}
                  size="sm"
                  className="rounded-none border-x h-8 px-3"
                  onClick={() => setView('week')}
                >
                  Semana
                </Button>
                <Button
                  variant={view === 'day' ? 'default' : 'ghost'}
                  size="sm"
                  className="rounded-l-none h-8 px-3"
                  onClick={() => setView('day')}
                >
                  Día
                </Button>
              </div>
              {/* Navigation */}
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" onClick={handlePrev}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={handleToday}>
                  Hoy
                </Button>
                <Button variant="ghost" size="icon" onClick={handleNext}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Month view */}
          {view === 'month' && (
            <>
              <div className="grid grid-cols-7 gap-1 mb-2">
                {DAYS.map((day) => (
                  <div
                    key={day}
                    className="text-center text-sm font-medium text-muted-foreground py-2"
                  >
                    {day}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {calendarDays.map((day, index) => (
                  <button
                    key={index}
                    disabled={day === null}
                    onClick={() => day && handleDateClick(day)}
                    className={`
                      relative aspect-square p-1 text-sm rounded-md transition-colors
                      ${day === null ? 'invisible' : 'hover:bg-muted'}
                      ${isTodayDay(day!) ? 'bg-primary text-primary-foreground hover:bg-primary/90' : ''}
                      ${isSelectedDay(day!) && !isTodayDay(day!) ? 'bg-muted ring-2 ring-primary' : ''}
                    `}
                  >
                    <span className="absolute top-1 left-1/2 -translate-x-1/2">
                      {day}
                    </span>
                    {day && hasAppointments(day) && (
                      <span className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
                        {getAppointmentCount(day) <= 3 ? (
                          Array.from({ length: getAppointmentCount(day) }).map((_, i) => (
                            <span
                              key={i}
                              className="w-1.5 h-1.5 rounded-full bg-primary"
                            />
                          ))
                        ) : (
                          <span className="text-[10px] font-medium text-primary">
                            {getAppointmentCount(day)}
                          </span>
                        )}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </>
          )}

          {/* Week view */}
          {view === 'week' && (
            <CalendarWeekView
              appointments={appointments}
              appointmentsByDate={appointmentsByDate}
              currentDate={currentDate}
              selectedDate={selectedDate}
              onDateSelect={(date) => {
                setSelectedDate(date);
                onDateSelect?.(date);
              }}
              onAppointmentClick={(apt) => onAppointmentClick?.(apt)}
              onNewAppointment={(date) => onNewAppointment?.(date)}
            />
          )}

          {/* Day view */}
          {view === 'day' && (
            <CalendarDayView
              appointments={appointments}
              appointmentsByDate={appointmentsByDate}
              currentDate={currentDate}
              selectedDate={selectedDate}
              onDateSelect={(date) => {
                setSelectedDate(date);
                onDateSelect?.(date);
              }}
              onAppointmentClick={(apt) => onAppointmentClick?.(apt)}
              onNewAppointment={(date) => onNewAppointment?.(date)}
            />
          )}
        </CardContent>
      </Card>

      {/* Sidebar - Selected day appointments */}
      <Card className="lg:w-80">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">
              {selectedDate
                ? selectedDate.toLocaleDateString('es-MX', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                  })
                : 'Selecciona un día'}
            </CardTitle>
            {selectedDate && (
              <Button
                size="sm"
                onClick={() => onNewAppointment?.(selectedDate)}
              >
                <Plus className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {selectedDateAppointments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No hay citas programadas</p>
              {selectedDate && (
                <Button
                  variant="link"
                  size="sm"
                  className="mt-2"
                  onClick={() => onNewAppointment?.(selectedDate)}
                >
                  Agendar cita
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {selectedDateAppointments.map((appointment) => (
                <div
                  key={appointment.id}
                  className="p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() => onAppointmentClick?.(appointment)}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-1 h-full min-h-[50px] rounded-full ${getStatusColor(appointment.status)}`}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-medium text-sm truncate">
                          {appointment.title}
                        </p>
                        <Badge variant="outline" className="text-xs shrink-0">
                          {formatAppointmentType(appointment.appointment_type)}
                        </Badge>
                      </div>
                      <div className="mt-1 space-y-1">
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span>
                            {formatTime(appointment.start_time)} -{' '}
                            {formatTime(appointment.end_time)}
                          </span>
                        </div>
                        {appointment.patient && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <User className="h-3 w-3" />
                            <span className="truncate">
                              {appointment.patient.full_name}
                            </span>
                          </div>
                        )}
                      </div>
                      <Badge
                        variant="secondary"
                        className="mt-2 text-xs"
                      >
                        {formatAppointmentStatus(appointment.status)}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
