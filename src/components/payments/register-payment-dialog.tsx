'use client';

import { useState, useTransition, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { createPayment } from '@/actions/payments';
import type { PaymentMethod } from '@/types/database.types';

interface RegisterPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patientId: string;
  patientName: string;
  suggestedAmount?: number;
  onPaymentRegistered?: () => void;
}

export function RegisterPaymentDialog({
  open,
  onOpenChange,
  patientId,
  patientName,
  suggestedAmount,
  onPaymentRegistered,
}: RegisterPaymentDialogProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    amount: '',
    payment_method: 'cash' as PaymentMethod,
    description: '',
  });

  useEffect(() => {
    if (open && suggestedAmount && suggestedAmount > 0) {
      setFormData((prev) => ({
        ...prev,
        amount: suggestedAmount.toFixed(2),
      }));
    }
  }, [open, suggestedAmount]);

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0) {
      setError('Ingresa un monto válido');
      return;
    }

    startTransition(async () => {
      const result = await createPayment({
        patient_id: patientId,
        amount,
        payment_method: formData.payment_method,
        description: formData.description || null,
      });

      if (!result.success) {
        setError(result.error || 'Error al registrar el pago');
        return;
      }

      onPaymentRegistered?.();
      onOpenChange(false);
      setFormData({
        amount: '',
        payment_method: 'cash',
        description: '',
      });
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Registrar Pago</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label>Paciente</Label>
            <Input value={patientName} disabled className="bg-muted" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Monto *</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0"
              value={formData.amount}
              onChange={(e) => handleChange('amount', e.target.value)}
              placeholder="0.00"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="payment_method">Método de pago</Label>
            <Select
              value={formData.payment_method}
              onValueChange={(value) => handleChange('payment_method', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">Efectivo</SelectItem>
                <SelectItem value="card">Tarjeta</SelectItem>
                <SelectItem value="transfer">Transferencia</SelectItem>
                <SelectItem value="other">Otro</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descripción (opcional)</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Notas adicionales..."
              rows={2}
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending} className="flex-1">
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                'Registrar pago'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
