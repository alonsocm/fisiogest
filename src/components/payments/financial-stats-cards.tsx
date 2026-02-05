'use client';

import { useState, useEffect } from 'react';
import { DollarSign, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getFinancialStats } from '@/actions/payments';
import type { FinancialStats } from '@/types/database.types';
import { formatCurrency } from '@/lib/utils';

export function FinancialStatsCards() {
  const [stats, setStats] = useState<FinancialStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const data = await getFinancialStats();
      setStats(data);
      setIsLoading(false);
    }
    load();
  }, []);

  if (isLoading || !stats) {
    return (
      <>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ingresos del Mes</CardTitle>
            <DollarSign className="h-4 w-4 shrink-0 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">--</div>
            <p className="text-xs text-muted-foreground">Cargando...</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saldo Pendiente</CardTitle>
            <AlertCircle className="h-4 w-4 shrink-0 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">--</div>
            <p className="text-xs text-muted-foreground">Cargando...</p>
          </CardContent>
        </Card>
      </>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Ingresos del Mes</CardTitle>
          <DollarSign className="h-4 w-4 shrink-0 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">
            {formatCurrency(stats.monthlyIncome)}
          </div>
          <p className="text-xs text-muted-foreground">
            Total: {formatCurrency(stats.totalIncome)}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Saldo Pendiente</CardTitle>
          <AlertCircle className="h-4 w-4 shrink-0 text-amber-500" />
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${stats.pendingBalance > 0 ? 'text-amber-600' : 'text-green-600'}`}>
            {formatCurrency(stats.pendingBalance)}
          </div>
          <p className="text-xs text-muted-foreground">
            {stats.patientsWithBalance} paciente
            {stats.patientsWithBalance !== 1 ? 's' : ''} con saldo
          </p>
        </CardContent>
      </Card>
    </>
  );
}
