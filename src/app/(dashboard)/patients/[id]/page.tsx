import { notFound } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Edit,
  Phone,
  Mail,
  Calendar,
  MapPin,
  AlertCircle,
  Pill,
  FileText,
  Plus,
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
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { getPatientById } from '@/actions/patients';
import { getPatientClinicalNotes } from '@/actions/clinical-notes';
import { getCurrentTherapist } from '@/actions/auth';
import { PainEvolutionChart } from '@/components/patients/pain-evolution-chart';
import { ExportHistoryPDFButton } from '@/components/pdf/export-pdf-button';
import {
  formatDate,
  formatPhone,
  getInitials,
  stringToColor,
  formatPatientStatus,
  calculateAge,
  formatProgressStatus,
  getPainLevelColor,
} from '@/lib/utils';

export default async function PatientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [patientResult, clinicalNotes, therapist] = await Promise.all([
    getPatientById(id),
    getPatientClinicalNotes(id),
    getCurrentTherapist(),
  ]);

  if (!patientResult.success || !patientResult.data) {
    notFound();
  }

  const patient = patientResult.data;

  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/patients">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <Avatar className={`h-12 w-12 ${stringToColor(patient.full_name)}`}>
            <AvatarFallback className="text-white text-lg">
              {getInitials(patient.full_name)}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-2xl font-bold">{patient.full_name}</h1>
            <div className="flex items-center gap-2">
              <Badge
                variant={
                  patient.status === 'active'
                    ? 'success'
                    : patient.status === 'inactive'
                      ? 'warning'
                      : 'secondary'
                }
              >
                {formatPatientStatus(patient.status)}
              </Badge>
              {patient.date_of_birth && (
                <span className="text-sm text-muted-foreground">
                  {calculateAge(patient.date_of_birth)} años
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          {therapist && (
            <ExportHistoryPDFButton
              patient={patient}
              clinicalNotes={clinicalNotes}
              therapist={therapist}
            />
          )}
          <Button variant="outline" asChild>
            <Link href={`/patients/${id}/edit`}>
              <Edit className="h-4 w-4" />
              Editar
            </Link>
          </Button>
          <Button asChild>
            <Link href={`/patients/${id}/notes/new`}>
              <Plus className="h-4 w-4" />
              Nueva nota
            </Link>
          </Button>
        </div>
      </div>

      {/* Gráfica de evolución del dolor */}
      {clinicalNotes.length > 0 && (
        <PainEvolutionChart clinicalNotes={clinicalNotes} />
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Columna izquierda - Información del paciente */}
        <div className="space-y-6 lg:col-span-1">
          {/* Contacto */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Contacto</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <a
                  href={`tel:${patient.phone}`}
                  className="text-sm hover:underline"
                >
                  {formatPhone(patient.phone)}
                </a>
              </div>
              {patient.email && (
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <a
                    href={`mailto:${patient.email}`}
                    className="text-sm hover:underline truncate"
                  >
                    {patient.email}
                  </a>
                </div>
              )}
              {patient.date_of_birth && (
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    {formatDate(patient.date_of_birth)}
                  </span>
                </div>
              )}
              {patient.address && (
                <div className="flex items-start gap-3">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <span className="text-sm">{patient.address}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Historial médico */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Historial Médico</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {patient.allergies && patient.allergies.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 text-sm font-medium mb-2">
                    <AlertCircle className="h-4 w-4 text-red-500" />
                    Alergias
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {patient.allergies.map((allergy, i) => (
                      <Badge key={i} variant="destructive" className="text-xs">
                        {allergy}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {patient.current_medications &&
                patient.current_medications.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 text-sm font-medium mb-2">
                      <Pill className="h-4 w-4 text-blue-500" />
                      Medicamentos
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {patient.current_medications.map((med, i) => (
                        <Badge key={i} variant="secondary" className="text-xs">
                          {med}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

              {patient.chronic_conditions &&
                patient.chronic_conditions.length > 0 && (
                  <div>
                    <div className="text-sm font-medium mb-2">
                      Condiciones crónicas
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {patient.chronic_conditions.map((condition, i) => (
                        <Badge key={i} variant="outline" className="text-xs">
                          {condition}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

              {!patient.allergies?.length &&
                !patient.current_medications?.length &&
                !patient.chronic_conditions?.length && (
                  <p className="text-sm text-muted-foreground">
                    Sin información médica registrada
                  </p>
                )}
            </CardContent>
          </Card>

          {/* Diagnóstico */}
          {(patient.initial_complaint || patient.diagnosis) && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Diagnóstico</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {patient.initial_complaint && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">
                      Motivo de consulta
                    </p>
                    <p className="text-sm">{patient.initial_complaint}</p>
                  </div>
                )}
                {patient.diagnosis && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">
                      Diagnóstico
                    </p>
                    <p className="text-sm font-medium">{patient.diagnosis}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Columna derecha - Notas clínicas */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Notas de Evolución</CardTitle>
                <CardDescription>
                  Historial de sesiones del paciente
                </CardDescription>
              </div>
              <Button size="sm" asChild>
                <Link href={`/patients/${id}/notes/new`}>
                  <Plus className="h-4 w-4" />
                  Nueva nota
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              {clinicalNotes.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-2">
                    No hay notas clínicas registradas
                  </p>
                  <Button variant="link" asChild>
                    <Link href={`/patients/${id}/notes/new`}>
                      Crear primera nota
                    </Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {clinicalNotes.map((note) => (
                    <div
                      key={note.id}
                      className="p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-3">
                        <div>
                          <p className="font-medium">
                            {formatDate(note.session_date)}
                          </p>
                          {note.progress_status && (
                            <Badge variant="outline" className="mt-1">
                              {formatProgressStatus(note.progress_status)}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {note.pain_level_before !== null && (
                            <div className="text-sm">
                              <span className="text-muted-foreground">
                                Dolor:{' '}
                              </span>
                              <span
                                className={`px-1.5 py-0.5 rounded ${getPainLevelColor(note.pain_level_before)}`}
                              >
                                {note.pain_level_before}
                              </span>
                              {note.pain_level_after !== null && (
                                <>
                                  <span className="mx-1">→</span>
                                  <span
                                    className={`px-1.5 py-0.5 rounded ${getPainLevelColor(note.pain_level_after)}`}
                                  >
                                    {note.pain_level_after}
                                  </span>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {note.subjective && (
                        <div className="mb-2">
                          <p className="text-xs font-medium text-muted-foreground">
                            Subjetivo
                          </p>
                          <p className="text-sm line-clamp-2">
                            {note.subjective}
                          </p>
                        </div>
                      )}

                      {note.treatment_performed && (
                        <div className="mb-2">
                          <p className="text-xs font-medium text-muted-foreground">
                            Tratamiento
                          </p>
                          <p className="text-sm line-clamp-2">
                            {note.treatment_performed}
                          </p>
                        </div>
                      )}

                      {note.techniques_used && note.techniques_used.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {note.techniques_used.map((tech, i) => (
                            <Badge
                              key={i}
                              variant="secondary"
                              className="text-xs"
                            >
                              {tech}
                            </Badge>
                          ))}
                        </div>
                      )}

                      <div className="mt-3 flex justify-end">
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/patients/${id}/notes/${note.id}`}>
                            Ver completa
                          </Link>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
