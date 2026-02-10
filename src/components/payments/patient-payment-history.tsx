'use client';

import { useState, useEffect } from 'react';
import { ArrowUpCircle, ArrowDownCircle, Receipt } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getPatientPayments } from '@/actions/payments';
import type { Payment } from '@/types/database.types';
import { formatDateTime, formatCurrency, formatPaymentMethod } from '@/lib/utils';

interface PatientPaymentHistoryProps {
  patientId: string;
}

export function PatientPaymentHistory({ patientId }: PatientPaymentHistoryProps) {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const data = await getPatientPayments(patientId);
      setPayments(data);
      setIsLoading(false);
    }
    load();
  }, [patientId]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Receipt className="h-4 w-4" />
            Historial de Pagos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Cargando...</p>
        </CardContent>
      </Card>
    );
  }

  if (payments.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Receipt className="h-4 w-4" />
            Historial de Pagos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Sin movimientos registrados
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Receipt className="h-4 w-4" />
          Historial de Pagos
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 max-h-[300px] overflow-y-auto">
          {payments.map((payment) => (
            <div
              key={payment.id}
              className="flex items-start justify-between p-3 rounded-lg border"
            >
              <div className="flex items-start gap-3">
                {payment.type === 'charge' ? (
                  <ArrowUpCircle className="h-5 w-5 text-red-500 mt-0.5 shrink-0" />
                ) : (
                  <ArrowDownCircle className="h-5 w-5 text-green-500 mt-0.5 shrink-0" />
                )}
                <div className="min-w-0">
                  <p className="text-sm font-medium">
                    {payment.type === 'charge' ? 'Cargo' : 'Pago'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDateTime(payment.created_at)}
                  </p>
                  {payment.description && (
                    <p className="text-xs text-muted-foreground mt-1 truncate">
                      {payment.description}
                    </p>
                  )}
                  {payment.payment_method && (
                    <Badge variant="outline" className="text-xs mt-1">
                      {formatPaymentMethod(payment.payment_method)}
                    </Badge>
                  )}
                </div>
              </div>
              <span
                className={`font-semibold whitespace-nowrap ${
                  payment.type === 'charge' ? 'text-red-500' : 'text-green-500'
                }`}
              >
                {payment.type === 'charge' ? '-' : '+'}
                {formatCurrency(payment.amount)}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
