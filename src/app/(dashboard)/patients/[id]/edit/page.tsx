import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PatientForm } from '@/components/patients/patient-form';
import { getPatientById } from '@/actions/patients';

export default async function EditPatientPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const patientResult = await getPatientById(id);

  if (!patientResult.success || !patientResult.data) {
    notFound();
  }

  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/patients/${id}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Editar Paciente</h1>
          <p className="text-muted-foreground">
            {patientResult.data.full_name}
          </p>
        </div>
      </div>

      <PatientForm existingPatient={patientResult.data} />
    </div>
  );
}
