import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { ClinicalNote, Patient, Therapist } from '@/types/database.types';

function formatDatePDF(dateStr: string): string {
  const date = new Date(dateStr + 'T12:00:00');
  return date.toLocaleDateString('es-MX', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

function formatProgressStatusPDF(status: string): string {
  const statusMap: Record<string, string> = {
    improving: 'Mejorando',
    stable: 'Estable',
    worsening: 'Empeorando',
    recovered: 'Recuperado',
  };
  return statusMap[status] || status;
}

function sanitizeFilename(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '');
}

function addHeader(doc: jsPDF, therapist: Therapist): number {
  let y = 20;

  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(therapist.clinic_name || 'FisioGest', 14, y);
  y += 7;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text(`${therapist.full_name} - ${therapist.specialty || 'Fisioterapia'}`, 14, y);
  y += 5;

  if (therapist.license_number) {
    doc.text(`Cédula profesional: ${therapist.license_number}`, 14, y);
    y += 5;
  }

  if (therapist.clinic_address) {
    doc.text(therapist.clinic_address, 14, y);
    y += 5;
  }

  doc.setTextColor(0, 0, 0);

  // Divider line
  y += 2;
  doc.setDrawColor(200, 200, 200);
  doc.line(14, y, 196, y);
  y += 8;

  return y;
}

function addSection(
  doc: jsPDF,
  title: string,
  y: number,
  pageHeight: number
): number {
  if (y > pageHeight - 30) {
    doc.addPage();
    y = 20;
  }

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(41, 98, 255);
  doc.text(title, 14, y);
  y += 2;
  doc.setDrawColor(41, 98, 255);
  doc.line(14, y, 196, y);
  y += 6;
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);

  return y;
}

function addField(
  doc: jsPDF,
  label: string,
  value: string,
  x: number,
  y: number,
  maxWidth: number,
  pageHeight: number
): number {
  if (y > pageHeight - 20) {
    doc.addPage();
    y = 20;
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text(label, x, y);
  y += 4;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  const lines = doc.splitTextToSize(value, maxWidth);
  doc.text(lines, x, y);
  y += lines.length * 5 + 3;

  return y;
}

export function generateClinicalNotePDF(
  note: ClinicalNote,
  patient: Patient,
  therapist: Therapist
): void {
  const doc = new jsPDF();
  const pageHeight = doc.internal.pageSize.getHeight();
  const maxWidth = 180;

  let y = addHeader(doc, therapist);

  // Title
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Nota Clínica', 14, y);
  y += 10;

  // Patient info section
  y = addSection(doc, 'Datos del Paciente', y, pageHeight);
  y = addField(doc, 'Nombre', patient.full_name, 14, y, maxWidth, pageHeight);

  if (patient.phone) {
    y = addField(doc, 'Teléfono', patient.phone, 14, y, maxWidth, pageHeight);
  }
  if (patient.email) {
    y = addField(doc, 'Email', patient.email, 14, y, maxWidth, pageHeight);
  }
  if (patient.date_of_birth) {
    const age = Math.floor(
      (Date.now() - new Date(patient.date_of_birth).getTime()) / 31557600000
    );
    y = addField(doc, 'Edad', `${age} años`, 14, y, maxWidth, pageHeight);
  }
  if (patient.diagnosis) {
    y = addField(doc, 'Diagnóstico', patient.diagnosis, 14, y, maxWidth, pageHeight);
  }

  // Session info
  y = addSection(doc, 'Información de Sesión', y, pageHeight);
  y = addField(doc, 'Fecha', formatDatePDF(note.session_date), 14, y, maxWidth, pageHeight);

  if (note.session_duration_minutes) {
    y = addField(doc, 'Duración', `${note.session_duration_minutes} minutos`, 14, y, maxWidth, pageHeight);
  }
  if (note.progress_status) {
    y = addField(doc, 'Estado de progreso', formatProgressStatusPDF(note.progress_status), 14, y, maxWidth, pageHeight);
  }

  // Pain assessment
  y = addSection(doc, 'Evaluación del Dolor', y, pageHeight);
  if (note.pain_location) {
    y = addField(doc, 'Localización', note.pain_location, 14, y, maxWidth, pageHeight);
  }
  if (note.pain_level_before !== null) {
    y = addField(doc, 'Dolor al inicio', `${note.pain_level_before}/10`, 14, y, maxWidth, pageHeight);
  }
  if (note.pain_level_after !== null) {
    y = addField(doc, 'Dolor al final', `${note.pain_level_after}/10`, 14, y, maxWidth, pageHeight);
  }
  if (note.pain_level_before !== null && note.pain_level_after !== null) {
    const change = note.pain_level_before - note.pain_level_after;
    const changeText =
      change > 0
        ? `-${change} puntos (mejoría)`
        : change < 0
          ? `+${Math.abs(change)} puntos (aumento)`
          : 'Sin cambio';
    y = addField(doc, 'Cambio', changeText, 14, y, maxWidth, pageHeight);
  }

  // SOAP notes
  if (note.subjective || note.objective || note.assessment || note.plan) {
    y = addSection(doc, 'Notas SOAP', y, pageHeight);
    if (note.subjective) {
      y = addField(doc, 'S - Subjetivo', note.subjective, 14, y, maxWidth, pageHeight);
    }
    if (note.objective) {
      y = addField(doc, 'O - Objetivo', note.objective, 14, y, maxWidth, pageHeight);
    }
    if (note.assessment) {
      y = addField(doc, 'A - Análisis', note.assessment, 14, y, maxWidth, pageHeight);
    }
    if (note.plan) {
      y = addField(doc, 'P - Plan', note.plan, 14, y, maxWidth, pageHeight);
    }
  }

  // Treatment
  if (note.treatment_performed || (note.techniques_used && note.techniques_used.length > 0)) {
    y = addSection(doc, 'Tratamiento', y, pageHeight);
    if (note.treatment_performed) {
      y = addField(doc, 'Tratamiento realizado', note.treatment_performed, 14, y, maxWidth, pageHeight);
    }
    if (note.techniques_used && note.techniques_used.length > 0) {
      y = addField(doc, 'Técnicas aplicadas', note.techniques_used.join(', '), 14, y, maxWidth, pageHeight);
    }
  }

  // Next session recommendation
  if (note.next_session_recommendation) {
    y = addSection(doc, 'Recomendación Próxima Sesión', y, pageHeight);
    y = addField(doc, '', note.next_session_recommendation, 14, y, maxWidth, pageHeight);
  }

  // Footer
  const today = new Date().toLocaleDateString('es-MX', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text(
    `Generado el ${today} - FisioGest`,
    14,
    doc.internal.pageSize.getHeight() - 10
  );

  const fileName = `nota_clinica_${sanitizeFilename(patient.full_name)}_${note.session_date}.pdf`;
  doc.save(fileName);
}

export function generatePatientHistoryPDF(
  patient: Patient,
  clinicalNotes: ClinicalNote[],
  therapist: Therapist
): void {
  const doc = new jsPDF();
  const pageHeight = doc.internal.pageSize.getHeight();
  const maxWidth = 180;

  let y = addHeader(doc, therapist);

  // Title
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Historial del Paciente', 14, y);
  y += 10;

  // Patient info
  y = addSection(doc, 'Datos del Paciente', y, pageHeight);
  y = addField(doc, 'Nombre', patient.full_name, 14, y, maxWidth, pageHeight);
  y = addField(doc, 'Teléfono', patient.phone, 14, y, maxWidth, pageHeight);

  if (patient.email) {
    y = addField(doc, 'Email', patient.email, 14, y, maxWidth, pageHeight);
  }
  if (patient.date_of_birth) {
    const age = Math.floor(
      (Date.now() - new Date(patient.date_of_birth).getTime()) / 31557600000
    );
    y = addField(doc, 'Fecha de nacimiento', `${formatDatePDF(patient.date_of_birth)} (${age} años)`, 14, y, maxWidth, pageHeight);
  }
  if (patient.address) {
    y = addField(doc, 'Dirección', patient.address, 14, y, maxWidth, pageHeight);
  }

  // Medical history
  if (
    patient.allergies?.length ||
    patient.current_medications?.length ||
    patient.chronic_conditions?.length
  ) {
    y = addSection(doc, 'Historial Médico', y, pageHeight);
    if (patient.allergies?.length) {
      y = addField(doc, 'Alergias', patient.allergies.join(', '), 14, y, maxWidth, pageHeight);
    }
    if (patient.current_medications?.length) {
      y = addField(doc, 'Medicamentos', patient.current_medications.join(', '), 14, y, maxWidth, pageHeight);
    }
    if (patient.chronic_conditions?.length) {
      y = addField(doc, 'Condiciones crónicas', patient.chronic_conditions.join(', '), 14, y, maxWidth, pageHeight);
    }
  }

  // Diagnosis
  if (patient.initial_complaint || patient.diagnosis) {
    y = addSection(doc, 'Diagnóstico', y, pageHeight);
    if (patient.initial_complaint) {
      y = addField(doc, 'Motivo de consulta', patient.initial_complaint, 14, y, maxWidth, pageHeight);
    }
    if (patient.diagnosis) {
      y = addField(doc, 'Diagnóstico', patient.diagnosis, 14, y, maxWidth, pageHeight);
    }
  }

  // Evolution summary
  const notesWithPain = clinicalNotes.filter(
    (n) => n.pain_level_before !== null || n.pain_level_after !== null
  );

  if (notesWithPain.length > 0) {
    y = addSection(doc, 'Resumen de Evolución', y, pageHeight);

    const sorted = [...notesWithPain].sort(
      (a, b) =>
        new Date(a.session_date).getTime() - new Date(b.session_date).getTime()
    );

    const first = sorted[0];
    const last = sorted[sorted.length - 1];
    const initialPain = first.pain_level_before ?? first.pain_level_after ?? 0;
    const currentPain = last.pain_level_after ?? last.pain_level_before ?? 0;

    const withBoth = sorted.filter(
      (n) => n.pain_level_before !== null && n.pain_level_after !== null
    );
    const avgReduction =
      withBoth.length > 0
        ? withBoth.reduce(
            (sum, n) => sum + ((n.pain_level_before ?? 0) - (n.pain_level_after ?? 0)),
            0
          ) / withBoth.length
        : 0;

    y = addField(doc, 'Total de sesiones', `${clinicalNotes.length}`, 14, y, maxWidth, pageHeight);
    y = addField(doc, 'Reducción promedio por sesión', `${avgReduction.toFixed(1)} puntos`, 14, y, maxWidth, pageHeight);
    y = addField(doc, 'Evolución del dolor', `${initialPain}/10 → ${currentPain}/10`, 14, y, maxWidth, pageHeight);
  }

  // Clinical notes table
  if (clinicalNotes.length > 0) {
    y = addSection(doc, 'Historial de Sesiones', y, pageHeight);

    const sortedNotes = [...clinicalNotes].sort(
      (a, b) =>
        new Date(b.session_date).getTime() - new Date(a.session_date).getTime()
    );

    const tableData = sortedNotes.map((note) => {
      const painChange =
        note.pain_level_before !== null && note.pain_level_after !== null
          ? `${note.pain_level_before - note.pain_level_after > 0 ? '-' : '+'}${Math.abs(note.pain_level_before - note.pain_level_after)}`
          : '-';

      return [
        formatDatePDF(note.session_date),
        note.pain_level_before !== null ? `${note.pain_level_before}` : '-',
        note.pain_level_after !== null ? `${note.pain_level_after}` : '-',
        painChange,
        note.progress_status
          ? formatProgressStatusPDF(note.progress_status)
          : '-',
        note.treatment_performed
          ? note.treatment_performed.substring(0, 50) +
            (note.treatment_performed.length > 50 ? '...' : '')
          : '-',
      ];
    });

    autoTable(doc, {
      startY: y,
      head: [['Fecha', 'Antes', 'Después', 'Cambio', 'Estado', 'Tratamiento']],
      body: tableData,
      theme: 'striped',
      headStyles: {
        fillColor: [41, 98, 255],
        fontSize: 8,
        fontStyle: 'bold',
      },
      bodyStyles: {
        fontSize: 8,
      },
      columnStyles: {
        0: { cellWidth: 30 },
        1: { cellWidth: 15, halign: 'center' },
        2: { cellWidth: 18, halign: 'center' },
        3: { cellWidth: 16, halign: 'center' },
        4: { cellWidth: 25 },
        5: { cellWidth: 'auto' },
      },
      margin: { left: 14, right: 14 },
    });
  }

  // Footer
  const today = new Date().toLocaleDateString('es-MX', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text(
    `Generado el ${today} - FisioGest`,
    14,
    doc.internal.pageSize.getHeight() - 10
  );

  const fileName = `historial_${sanitizeFilename(patient.full_name)}_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
}
