import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ClinicalNoteForm } from '@/components/clinical-notes/clinical-note-form';
import { getClinicalNoteById } from '@/actions/clinical-notes';
import { getPatientById } from '@/actions/patients';

export default async function EditClinicalNotePage({
  params,
}: {
  params: Promise<{ id: string; noteId: string }>;
}) {
  const { id, noteId } = await params;

  const [noteResult, patientResult] = await Promise.all([
    getClinicalNoteById(noteId),
    getPatientById(id),
  ]);

  if (!noteResult.success || !noteResult.data || !patientResult.success || !patientResult.data) {
    notFound();
  }

  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/patients/${id}/notes/${noteId}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Editar Nota Clínica</h1>
          <p className="text-muted-foreground">
            {patientResult.data.full_name}
          </p>
        </div>
      </div>

      <ClinicalNoteForm
        patientId={id}
        patient={patientResult.data}
        existingNote={noteResult.data}
      />
    </div>
  );
}
