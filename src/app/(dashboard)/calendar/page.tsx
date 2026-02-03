'use client';

import { useState, useEffect } from 'react';
import { CalendarView } from '@/components/calendar/calendar-view';
import { AppointmentDialog } from '@/components/calendar/appointment-dialog';
import { getAppointmentsByDateRange } from '@/actions/appointments';
import type { Appointment } from '@/types/database.types';

export default function CalendarPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 1);
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 2);

    const data = await getAppointmentsByDateRange(
      startDate.toISOString(),
      endDate.toISOString()
    );
    setAppointments(data);
  };

  const handleNewAppointment = (date: Date) => {
    setSelectedDate(date);
    setSelectedAppointment(null);
    setIsDialogOpen(true);
  };

  const handleAppointmentClick = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setIsDialogOpen(true);
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setSelectedAppointment(null);
    setSelectedDate(null);
    fetchAppointments();
  };

  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      <div className="page-header">
        <h1 className="page-title">Agenda</h1>
        <p className="page-description">
          Gestiona tus citas y horarios
        </p>
      </div>

      <CalendarView
        appointments={appointments}
        onAppointmentClick={handleAppointmentClick}
        onNewAppointment={handleNewAppointment}
      />

      <AppointmentDialog
        open={isDialogOpen}
        onOpenChange={handleDialogClose}
        appointment={selectedAppointment}
        defaultDate={selectedDate}
      />
    </div>
  );
}
