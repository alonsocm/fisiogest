import { DollarSign } from 'lucide-react';
import { FinancialStatsCards } from '@/components/payments/financial-stats-cards';
import { PatientsWithBalanceList } from '@/components/payments/patients-with-balance-list';

export default function FinancialsPage() {
  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <DollarSign className="h-6 w-6" />
          Finanzas
        </h1>
        <p className="text-muted-foreground">
          Resumen financiero y pacientes con saldo pendiente
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <FinancialStatsCards />
      </div>

      {/* Patients with balance */}
      <PatientsWithBalanceList />
    </div>
  );
}
