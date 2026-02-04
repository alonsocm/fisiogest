'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingDown, TrendingUp, Minus, Activity } from 'lucide-react';
import type { ClinicalNote } from '@/types/database.types';

interface PainEvolutionChartProps {
  clinicalNotes: ClinicalNote[];
}

interface ChartDataPoint {
  date: string;
  rawDate: string;
  painBefore: number | null;
  painAfter: number | null;
}

function formatShortDate(dateStr: string): string {
  const date = new Date(dateStr + 'T12:00:00');
  return date.toLocaleDateString('es-MX', { day: '2-digit', month: 'short' });
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; dataKey: string; color: string }>; label?: string }) {
  if (!active || !payload?.length) return null;

  const painBefore = payload.find((p) => p.dataKey === 'painBefore')?.value;
  const painAfter = payload.find((p) => p.dataKey === 'painAfter')?.value;

  return (
    <div className="bg-background border rounded-lg shadow-lg p-3 text-sm">
      <p className="font-medium mb-1">{label}</p>
      {painBefore !== undefined && painBefore !== null && (
        <p className="text-red-500">Dolor inicial: {painBefore}/10</p>
      )}
      {painAfter !== undefined && painAfter !== null && (
        <p className="text-green-500">Dolor final: {painAfter}/10</p>
      )}
      {painBefore !== undefined && painBefore !== null && painAfter !== undefined && painAfter !== null && (
        <p className="text-muted-foreground mt-1">
          Reducción: {painBefore - painAfter} puntos
        </p>
      )}
    </div>
  );
}

export function PainEvolutionChart({ clinicalNotes }: PainEvolutionChartProps) {
  const chartData: ChartDataPoint[] = clinicalNotes
    .filter(
      (note) =>
        note.pain_level_before !== null || note.pain_level_after !== null
    )
    .sort(
      (a, b) =>
        new Date(a.session_date).getTime() - new Date(b.session_date).getTime()
    )
    .map((note) => ({
      date: formatShortDate(note.session_date),
      rawDate: note.session_date,
      painBefore: note.pain_level_before,
      painAfter: note.pain_level_after,
    }));

  if (chartData.length < 2) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Evolución del Dolor
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            Se necesitan al menos 2 sesiones con datos de dolor para mostrar la gráfica de evolución.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Calculate stats
  const sessionsWithBothValues = chartData.filter(
    (d) => d.painBefore !== null && d.painAfter !== null
  );
  const avgReduction =
    sessionsWithBothValues.length > 0
      ? sessionsWithBothValues.reduce(
          (sum, d) => sum + ((d.painBefore ?? 0) - (d.painAfter ?? 0)),
          0
        ) / sessionsWithBothValues.length
      : 0;

  const firstSession = chartData[0];
  const lastSession = chartData[chartData.length - 1];
  const initialPain = firstSession.painBefore ?? firstSession.painAfter ?? 0;
  const currentPain = lastSession.painAfter ?? lastSession.painBefore ?? 0;
  const overallChange = initialPain - currentPain;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Evolución del Dolor
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Chart */}
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12 }}
                tickMargin={8}
              />
              <YAxis
                domain={[0, 10]}
                ticks={[0, 2, 4, 6, 8, 10]}
                tick={{ fontSize: 12 }}
                tickMargin={8}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Line
                type="monotone"
                dataKey="painBefore"
                name="Dolor inicial"
                stroke="#ef4444"
                strokeWidth={2}
                dot={{ r: 4 }}
                connectNulls
              />
              <Line
                type="monotone"
                dataKey="painAfter"
                name="Dolor final"
                stroke="#22c55e"
                strokeWidth={2}
                dot={{ r: 4 }}
                connectNulls
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="text-center p-3 rounded-lg bg-muted/50">
            <p className="text-xs text-muted-foreground">Total sesiones</p>
            <p className="text-lg font-semibold">{chartData.length}</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-muted/50">
            <p className="text-xs text-muted-foreground">Reducción promedio</p>
            <p className="text-lg font-semibold">{avgReduction.toFixed(1)} pts</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-muted/50">
            <p className="text-xs text-muted-foreground">Dolor inicial</p>
            <p className="text-lg font-semibold">{initialPain}/10</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-muted/50">
            <p className="text-xs text-muted-foreground">Dolor actual</p>
            <div className="flex items-center justify-center gap-1">
              <p className="text-lg font-semibold">{currentPain}/10</p>
              {overallChange > 0 ? (
                <TrendingDown className="h-4 w-4 text-green-500" />
              ) : overallChange < 0 ? (
                <TrendingUp className="h-4 w-4 text-red-500" />
              ) : (
                <Minus className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
