import Link from 'next/link';
import {
  Users,
  Calendar,
  Plus,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { getDashboardStats, getCurrentTherapist } from '@/actions/auth';
import {
  TodayAppointmentsStats,
  TodayAppointmentsList,
} from '@/components/dashboard/today-appointments';

export default async function DashboardPage() {
  const [stats, therapist] = await Promise.all([
    getDashboardStats(),
    getCurrentTherapist(),
  ]);

  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Hola, {therapist?.full_name?.split(' ')[0] || 'Doctor'}
          </h1>
          <p className="text-muted-foreground">
            Aquí tienes el resumen de tu día
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href="/patients/new">
              <Plus className="h-4 w-4" />
              Paciente
            </Link>
          </Button>
          <Button asChild>
            <Link href="/calendar">
              <Calendar className="h-4 w-4" />
              Nueva cita
            </Link>
          </Button>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Citas Hoy</CardTitle>
            <Calendar className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.todayAppointments}</div>
            <p className="text-xs text-muted-foreground">
              {stats.weekAppointments} esta semana
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pacientes Activos
            </CardTitle>
            <Users className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activePatients}</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalPatients} totales
            </p>
          </CardContent>
        </Card>

        <TodayAppointmentsStats />
      </div>

      {/* Citas del día */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Citas de Hoy</CardTitle>
            <CardDescription>
              {new Date().toLocaleDateString('es-MX', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </CardDescription>
          </div>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/calendar">
              Ver agenda
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          <TodayAppointmentsList />
        </CardContent>
      </Card>

      {/* Acciones rápidas */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
          <Link href="/patients/new">
            <CardHeader>
              <div className="flex items-center gap-4">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-base">Nuevo Paciente</CardTitle>
                  <CardDescription>Registrar un nuevo paciente</CardDescription>
                </div>
              </div>
            </CardHeader>
          </Link>
        </Card>

        <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
          <Link href="/calendar">
            <CardHeader>
              <div className="flex items-center gap-4">
                <div className="p-2 rounded-lg bg-green-500/10">
                  <Calendar className="h-6 w-6 text-green-500" />
                </div>
                <div>
                  <CardTitle className="text-base">Agendar Cita</CardTitle>
                  <CardDescription>Programar una nueva cita</CardDescription>
                </div>
              </div>
            </CardHeader>
          </Link>
        </Card>

        <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
          <Link href="/patients">
            <CardHeader>
              <div className="flex items-center gap-4">
                <div className="p-2 rounded-lg bg-orange-500/10">
                  <TrendingUp className="h-6 w-6 text-orange-500" />
                </div>
                <div>
                  <CardTitle className="text-base">Ver Pacientes</CardTitle>
                  <CardDescription>Gestionar expedientes</CardDescription>
                </div>
              </div>
            </CardHeader>
          </Link>
        </Card>
      </div>
    </div>
  );
}
