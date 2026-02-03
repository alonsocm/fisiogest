import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ClinicalNoteForm } from '@/components/clinical-notes/clinical-note-form';
import { getPatientById } from '@/actions/patients';

export default async function NewClinicalNotePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const patientResult = await getPatientById(id);

  if (!patientResult.success || !patientResult.data) {
    notFound();
  }

  const patient = patientResult.data;

  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/patients/${id}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Nueva Nota Clínica</h1>
          <p className="text-muted-foreground">
            Paciente: {patient.full_name}
          </p>
        </div>
      </div>

      <ClinicalNoteForm patientId={id} patient={patient} />
    </div>
  );
}
