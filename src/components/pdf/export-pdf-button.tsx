'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FileDown, Loader2 } from 'lucide-react';
import type { ClinicalNote, Patient, Therapist } from '@/types/database.types';

interface ExportNotePDFButtonProps {
  note: ClinicalNote;
  patient: Patient;
  therapist: Therapist;
}

export function ExportNotePDFButton({
  note,
  patient,
  therapist,
}: ExportNotePDFButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleExport = async () => {
    setIsLoading(true);
    try {
      const { generateClinicalNotePDF } = await import('@/lib/pdf-generator');
      generateClinicalNotePDF(note, patient, therapist);
    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button variant="outline" onClick={handleExport} disabled={isLoading}>
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <FileDown className="h-4 w-4" />
      )}
      Exportar PDF
    </Button>
  );
}

interface ExportHistoryPDFButtonProps {
  patient: Patient;
  clinicalNotes: ClinicalNote[];
  therapist: Therapist;
}

export function ExportHistoryPDFButton({
  patient,
  clinicalNotes,
  therapist,
}: ExportHistoryPDFButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleExport = async () => {
    setIsLoading(true);
    try {
      const { generatePatientHistoryPDF } = await import('@/lib/pdf-generator');
      generatePatientHistoryPDF(patient, clinicalNotes, therapist);
    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button variant="outline" onClick={handleExport} disabled={isLoading}>
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <FileDown className="h-4 w-4" />
      )}
      Exportar PDF
    </Button>
  );
}
