import Link from 'next/link';
import {
  Users,
  Calendar,
  Clock,
  TrendingUp,
  Plus,
  ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getDashboardStats, getCurrentTherapist } from '@/actions/auth';
import { getTodayAppointments } from '@/actions/appointments';
import { formatTime, formatAppointmentStatus } from '@/lib/utils';

export default async function DashboardPage() {
  const [stats, appointments, therapist] = await Promise.all([
    getDashboardStats(),
    getTodayAppointments(),
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
            <Calendar className="h-4 w-4 text-muted-foreground" />
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
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activePatients}</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalPatients} totales
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Próxima Cita</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {appointments.length > 0
                ? formatTime(appointments[0].start_time)
                : '--:--'}
            </div>
            <p className="text-xs text-muted-foreground truncate">
              {appointments.length > 0
                ? appointments[0].patient_name
                : 'Sin citas pendientes'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completadas</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {appointments.filter((a) => a.status === 'completed').length}
            </div>
            <p className="text-xs text-muted-foreground">hoy</p>
          </CardContent>
        </Card>
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
          {appointments.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                No tienes citas programadas para hoy
              </p>
              <Button variant="link" asChild>
                <Link href="/calendar">Agendar una cita</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {appointments.map((appointment) => (
                <div
                  key={appointment.id}
                  className="flex items-center gap-4 p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <div className="text-center min-w-[60px]">
                    <p className="text-lg font-semibold">
                      {formatTime(appointment.start_time)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {appointment.duration_minutes} min
                    </p>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">
                      {appointment.patient_name}
                    </p>
                    <p className="text-sm text-muted-foreground truncate">
                      {appointment.title}
                    </p>
                  </div>
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
                    <Link href={`/patients/${appointment.patient_id}`}>
                      Ver
                    </Link>
                  </Button>
                </div>
              ))}
            </div>
          )}
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
