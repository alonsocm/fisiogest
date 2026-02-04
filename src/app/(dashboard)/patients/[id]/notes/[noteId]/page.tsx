import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Edit, Trash2, Calendar, Clock, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getClinicalNoteById } from '@/actions/clinical-notes';
import { getPatientById } from '@/actions/patients';
import {
  formatDate,
  formatProgressStatus,
  getPainLevelColor,
} from '@/lib/utils';

export default async function ClinicalNoteDetailPage({
  params,
}: {
  params: Promise<{ id: string; noteId: string }>;
}) {
  const { id, noteId } = await params;

  const [noteResult, patientResult] = await Promise.all([
    getClinicalNoteById(noteId),
    getPatientById(id),
  ]);

  if (!noteResult.success || !noteResult.data || !patientResult.success) {
    notFound();
  }

  const note = noteResult.data;
  const patient = patientResult.data;

  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/patients/${id}`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Nota Clínica</h1>
            <p className="text-muted-foreground">
              {patient?.full_name} - {formatDate(note.session_date)}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={`/patients/${id}/notes/${noteId}/edit`}>
              <Edit className="h-4 w-4" />
              Editar
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Columna principal */}
        <div className="space-y-6 lg:col-span-2">
          {/* Notas SOAP */}
          <Card>
            <CardHeader>
              <CardTitle>Notas SOAP</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {note.subjective && (
                <div>
                  <h3 className="text-sm font-semibold text-primary mb-2">
                    S - Subjetivo
                  </h3>
                  <p className="text-sm whitespace-pre-wrap">{note.subjective}</p>
                </div>
              )}

              {note.objective && (
                <div>
                  <h3 className="text-sm font-semibold text-primary mb-2">
                    O - Objetivo
                  </h3>
                  <p className="text-sm whitespace-pre-wrap">{note.objective}</p>
                </div>
              )}

              {note.assessment && (
                <div>
                  <h3 className="text-sm font-semibold text-primary mb-2">
                    A - Análisis
                  </h3>
                  <p className="text-sm whitespace-pre-wrap">{note.assessment}</p>
                </div>
              )}

              {note.plan && (
                <div>
                  <h3 className="text-sm font-semibold text-primary mb-2">
                    P - Plan
                  </h3>
                  <p className="text-sm whitespace-pre-wrap">{note.plan}</p>
                </div>
              )}

              {!note.subjective && !note.objective && !note.assessment && !note.plan && (
                <p className="text-muted-foreground text-sm">
                  No se registraron notas SOAP en esta sesión.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Tratamiento */}
          {(note.treatment_performed || (note.techniques_used && note.techniques_used.length > 0)) && (
            <Card>
              <CardHeader>
                <CardTitle>Tratamiento Realizado</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {note.treatment_performed && (
                  <p className="text-sm whitespace-pre-wrap">
                    {note.treatment_performed}
                  </p>
                )}

                {note.techniques_used && note.techniques_used.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium mb-2">Técnicas aplicadas</h4>
                    <div className="flex flex-wrap gap-2">
                      {note.techniques_used.map((tech, i) => (
                        <Badge key={i} variant="secondary">
                          {tech}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Recomendación próxima sesión */}
          {note.next_session_recommendation && (
            <Card>
              <CardHeader>
                <CardTitle>Recomendación Próxima Sesión</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">
                  {note.next_session_recommendation}
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Columna lateral */}
        <div className="space-y-6">
          {/* Información de la sesión */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Información de Sesión</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{formatDate(note.session_date)}</span>
              </div>

              {note.session_duration_minutes && (
                <div className="flex items-center gap-3">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    {note.session_duration_minutes} minutos
                  </span>
                </div>
              )}

              {note.progress_status && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">
                    Estado de progreso
                  </p>
                  <Badge variant="outline">
                    {formatProgressStatus(note.progress_status)}
                  </Badge>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Evaluación del dolor */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Evaluación del Dolor</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {note.pain_location && (
                <div className="flex items-start gap-3">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground">Localización</p>
                    <p className="text-sm">{note.pain_location}</p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Al inicio</p>
                  {note.pain_level_before !== null ? (
                    <span
                      className={`inline-block px-3 py-1 rounded-md text-lg font-semibold ${getPainLevelColor(note.pain_level_before)}`}
                    >
                      {note.pain_level_before}/10
                    </span>
                  ) : (
                    <span className="text-muted-foreground text-sm">-</span>
                  )}
                </div>

                <div>
                  <p className="text-xs text-muted-foreground mb-1">Al final</p>
                  {note.pain_level_after !== null ? (
                    <span
                      className={`inline-block px-3 py-1 rounded-md text-lg font-semibold ${getPainLevelColor(note.pain_level_after)}`}
                    >
                      {note.pain_level_after}/10
                    </span>
                  ) : (
                    <span className="text-muted-foreground text-sm">-</span>
                  )}
                </div>
              </div>

              {note.pain_level_before !== null && note.pain_level_after !== null && (
                <div className="pt-2 border-t">
                  <p className="text-xs text-muted-foreground mb-1">Cambio</p>
                  <p className="text-sm font-medium">
                    {note.pain_level_before - note.pain_level_after > 0 ? (
                      <span className="text-green-600">
                        -{note.pain_level_before - note.pain_level_after} puntos (mejoría)
                      </span>
                    ) : note.pain_level_before - note.pain_level_after < 0 ? (
                      <span className="text-red-600">
                        +{note.pain_level_after - note.pain_level_before} puntos (aumento)
                      </span>
                    ) : (
                      <span className="text-muted-foreground">Sin cambio</span>
                    )}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
