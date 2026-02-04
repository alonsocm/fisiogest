'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { FileText, Search, Calendar, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { getRecentClinicalNotes } from '@/actions/clinical-notes';
import { getActivePatients } from '@/actions/patients';
import type { ClinicalNote, Patient } from '@/types/database.types';
import {
  formatDate,
  formatProgressStatus,
  getPainLevelColor,
} from '@/lib/utils';

export default function ClinicalNotesPage() {
  const [notes, setNotes] = useState<ClinicalNote[]>([]);
  const [patients, setPatients] = useState<Pick<Patient, 'id' | 'full_name' | 'phone'>[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [patientFilter, setPatientFilter] = useState('all');

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      const [notesData, patientsData] = await Promise.all([
        getRecentClinicalNotes(50),
        getActivePatients(),
      ]);
      setNotes(notesData);
      setPatients(patientsData);
      setIsLoading(false);
    }
    loadData();
  }, []);

  const filteredNotes = patientFilter === 'all'
    ? notes
    : notes.filter((note) => note.patient_id === patientFilter);

  const getPatientName = (note: ClinicalNote) => {
    if ((note as ClinicalNote & { patient?: { full_name: string } }).patient) {
      return (note as ClinicalNote & { patient: { full_name: string } }).patient.full_name;
    }
    const patient = patients.find((p) => p.id === note.patient_id);
    return patient?.full_name || 'Paciente';
  };

  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      <div className="page-header">
        <h1 className="page-title">Notas Clínicas</h1>
        <p className="page-description">
          Historial de todas las notas de evolución
        </p>
      </div>

      {/* Filtros */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="flex-1 max-w-sm">
          <Select value={patientFilter} onValueChange={setPatientFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Filtrar por paciente" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los pacientes</SelectItem>
              {patients.map((patient) => (
                <SelectItem key={patient.id} value={patient.id}>
                  {patient.full_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Lista de notas */}
      {isLoading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Cargando notas...</p>
        </div>
      ) : filteredNotes.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-center mb-4">
              {patientFilter === 'all'
                ? 'No hay notas clínicas registradas'
                : 'No hay notas para este paciente'}
            </p>
            <Button asChild>
              <Link href="/patients">Ir a pacientes</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredNotes.map((note) => (
            <Card
              key={note.id}
              className="hover:bg-muted/50 transition-colors"
            >
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                  {/* Info principal */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <Link
                        href={`/patients/${note.patient_id}`}
                        className="font-semibold hover:underline"
                      >
                        {getPatientName(note)}
                      </Link>
                      <span className="text-muted-foreground">•</span>
                      <span className="text-sm text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(note.session_date)}
                      </span>
                      {note.progress_status && (
                        <Badge variant="outline">
                          {formatProgressStatus(note.progress_status)}
                        </Badge>
                      )}
                    </div>

                    {/* Preview del contenido */}
                    {note.subjective && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                        {note.subjective}
                      </p>
                    )}

                    {/* Técnicas */}
                    {note.techniques_used && note.techniques_used.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {note.techniques_used.slice(0, 3).map((tech, i) => (
                          <Badge key={i} variant="secondary" className="text-xs">
                            {tech}
                          </Badge>
                        ))}
                        {note.techniques_used.length > 3 && (
                          <Badge variant="secondary" className="text-xs">
                            +{note.techniques_used.length - 3}
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Dolor y acciones */}
                  <div className="flex items-center gap-4">
                    {note.pain_level_before !== null && (
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground mb-1">Dolor</p>
                        <div className="flex items-center gap-1">
                          <span
                            className={`px-2 py-0.5 rounded text-sm font-medium ${getPainLevelColor(note.pain_level_before)}`}
                          >
                            {note.pain_level_before}
                          </span>
                          {note.pain_level_after !== null && (
                            <>
                              <span className="text-muted-foreground">→</span>
                              <span
                                className={`px-2 py-0.5 rounded text-sm font-medium ${getPainLevelColor(note.pain_level_after)}`}
                              >
                                {note.pain_level_after}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    )}

                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/patients/${note.patient_id}/notes/${note.id}`}>
                        Ver
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
