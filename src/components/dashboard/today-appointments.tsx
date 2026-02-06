'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Calendar, TrendingUp, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getTodayAppointments } from '@/actions/appointments';
import { getWeekAppointmentsCount } from '@/actions/appointments';
import type { TodayAppointment } from '@/types/database.types';
import { formatTime, formatAppointmentStatus } from '@/lib/utils';

// Componente para mostrar el conteo de citas de hoy con zona horaria correcta
export function TodayAppointmentsCountCard() {
  const [todayCount, setTodayCount] = useState<number>(0);
  const [weekCount, setWeekCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
      const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

      // Inicio y fin de semana
      const startOfWeek = new Date(now);
      startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
      startOfWeek.setHours(0, 0, 0, 0);

      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(endOfWeek.getDate() + 6);
      endOfWeek.setHours(23, 59, 59, 999);

      const [todayData, weekData] = await Promise.all([
        getTodayAppointments(startOfDay.toISOString(), endOfDay.toISOString()),
        getWeekAppointmentsCount(startOfWeek.toISOString(), endOfWeek.toISOString()),
      ]);

      setTodayCount(todayData.length);
      setWeekCount(weekData);
      setIsLoading(false);
    }
    load();
  }, []);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Citas Hoy</CardTitle>
        <Calendar className="h-4 w-4 shrink-0 text-blue-500" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{isLoading ? '-' : todayCount}</div>
        <p className="text-xs text-muted-foreground">
          {isLoading ? 'Cargando...' : `${weekCount} esta semana`}
        </p>
      </CardContent>
    </Card>
  );
}

export function TodayAppointmentsStats() {
  const [appointments, setAppointments] = useState<TodayAppointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      // Obtener inicio y fin del día en la zona horaria local del usuario
      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
      const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

      const data = await getTodayAppointments(startOfDay.toISOString(), endOfDay.toISOString());
      setAppointments(data);
      setIsLoading(false);
    }
    load();
  }, []);

  const completedCount = appointments.filter((a) => a.status === 'completed').length;
  const nextAppointment = appointments.find((a) => a.status !== 'completed');

  if (isLoading) {
    return (
      <>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Próxima Cita</CardTitle>
            <Clock className="h-4 w-4 shrink-0 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">--:--</div>
            <p className="text-xs text-muted-foreground">Cargando...</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completadas</CardTitle>
            <TrendingUp className="h-4 w-4 shrink-0 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">-</div>
            <p className="text-xs text-muted-foreground">hoy</p>
          </CardContent>
        </Card>
      </>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Próxima Cita</CardTitle>
          <Clock className="h-4 w-4 shrink-0 text-orange-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {nextAppointment ? formatTime(nextAppointment.start_time) : '--:--'}
          </div>
          <p className="text-xs text-muted-foreground truncate">
            {nextAppointment ? nextAppointment.patient_name : 'Sin citas pendientes'}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Completadas</CardTitle>
          <TrendingUp className="h-4 w-4 shrink-0 text-purple-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{completedCount}</div>
          <p className="text-xs text-muted-foreground">hoy</p>
        </CardContent>
      </Card>
    </>
  );
}

export function TodayAppointmentsList() {
  const [appointments, setAppointments] = useState<TodayAppointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
      const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

      const data = await getTodayAppointments(startOfDay.toISOString(), endOfDay.toISOString());
      setAppointments(data);
      setIsLoading(false);
    }
    load();
  }, []);

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Cargando citas...</p>
      </div>
    );
  }

  if (appointments.length === 0) {
    return (
      <div className="text-center py-8">
        <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">
          No tienes citas programadas para hoy
        </p>
        <Button variant="link" asChild>
          <Link href="/calendar">Agendar una cita</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {appointments.map((appointment) => (
        <div
          key={appointment.id}
          className="p-4 rounded-lg border hover:bg-muted/50 transition-colors"
        >
          <div className="flex items-start gap-3">
            <div className="text-center shrink-0">
              <p className="text-lg font-semibold">
                {formatTime(appointment.start_time)}
              </p>
              <p className="text-xs text-muted-foreground">
                {appointment.duration_minutes} min
              </p>
            </div>
            <div className="flex-1 min-w-0 overflow-hidden">
              <p className="font-medium break-words">{appointment.patient_name}</p>
              <p className="text-sm text-muted-foreground break-words">
                {appointment.title}
              </p>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <Badge
                  variant={
                    appointment.status === 'completed'
                      ? 'secondary'
                      : appointment.status === 'in_progress'
                        ? 'default'
                        : 'outline'
                  }
                >
                  {formatAppointmentStatus(appointment.status)}
                </Badge>
                <Button variant="ghost" size="sm" asChild>
                  <Link href={`/patients/${appointment.patient_id}`}>Ver</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
