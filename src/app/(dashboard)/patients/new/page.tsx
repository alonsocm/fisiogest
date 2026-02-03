import { PatientForm } from '@/components/patients/patient-form';

export default function NewPatientPage() {
  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      <div className="page-header">
        <h1 className="page-title">Nuevo Paciente</h1>
        <p className="page-description">
          Registra los datos de un nuevo paciente
        </p>
      </div>

      <PatientForm />
    </div>
  );
}
