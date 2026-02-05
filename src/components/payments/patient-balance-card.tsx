'use client';

import { useState, useEffect } from 'react';
import { DollarSign, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getPatientBalance } from '@/actions/payments';
import { RegisterPaymentDialog } from './register-payment-dialog';
import { formatCurrency } from '@/lib/utils';

interface PatientBalanceCardProps {
  patientId: string;
  patientName: string;
}

export function PatientBalanceCard({
  patientId,
  patientName,
}: PatientBalanceCardProps) {
  const [balance, setBalance] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);

  const loadBalance = async () => {
    const bal = await getPatientBalance(patientId);
    setBalance(bal);
    setIsLoading(false);
  };

  useEffect(() => {
    loadBalance();
  }, [patientId]);

  const handlePaymentRegistered = () => {
    loadBalance();
  };

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-green-600" />
            Balance
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Cargando...</p>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Saldo pendiente
                </span>
                <span
                  className={`text-2xl font-bold ${
                    balance > 0 ? 'text-red-500' : 'text-green-500'
                  }`}
                >
                  {formatCurrency(balance)}
                </span>
              </div>
              {balance > 0 && (
                <div className="flex items-center gap-2 text-sm text-amber-600">
                  <AlertCircle className="h-4 w-4" />
                  <span>Tiene saldo pendiente</span>
                </div>
              )}
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => setDialogOpen(true)}
              >
                Registrar pago
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <RegisterPaymentDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        patientId={patientId}
        patientName={patientName}
        suggestedAmount={balance > 0 ? balance : undefined}
        onPaymentRegistered={handlePaymentRegistered}
      />
    </>
  );
}
