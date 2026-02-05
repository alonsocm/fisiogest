'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { CheckCircle, Phone, ArrowRight } from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { getPatientsWithBalance } from '@/actions/payments';
import type { PatientBalance } from '@/types/database.types';
import { getInitials, stringToColor, formatPhone, formatCurrency } from '@/lib/utils';

export function PatientsWithBalanceList() {
  const [patients, setPatients] = useState<PatientBalance[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const data = await getPatientsWithBalance();
      setPatients(data);
      setIsLoading(false);
    }
    load();
  }, []);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Pacientes con Saldo Pendiente</CardTitle>
          <CardDescription>Cargando...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (patients.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Pacientes con Saldo Pendiente</CardTitle>
          <CardDescription>No hay pacientes con saldo pendiente</CardDescription>
        </CardHeader>
        <CardContent className="text-center py-8">
          <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
          <p className="text-muted-foreground">
            Todos los pacientes están al corriente
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pacientes con Saldo Pendiente</CardTitle>
        <CardDescription>
          {patients.length} paciente{patients.length !== 1 ? 's' : ''} con saldo
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {patients.map((patient) => (
            <div
              key={patient.patient_id}
              className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <Avatar className={`h-10 w-10 ${stringToColor(patient.full_name)}`}>
                  <AvatarFallback className="text-white">
                    {getInitials(patient.full_name)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="font-medium truncate">{patient.full_name}</p>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Phone className="h-3 w-3 shrink-0" />
                    <span className="truncate">{formatPhone(patient.phone)}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4 shrink-0">
                <span className="text-lg font-semibold text-red-500">
                  {formatCurrency(patient.balance)}
                </span>
                <Button variant="ghost" size="sm" asChild>
                  <Link href={`/patients/${patient.patient_id}`}>
                    Ver
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
