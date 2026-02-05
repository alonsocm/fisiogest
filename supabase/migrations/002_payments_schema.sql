-- =============================================
-- FisioGest - Payments Schema
-- Migration: 002_payments_schema.sql
-- =============================================

-- 1. Agregar precio por sesión predeterminado a therapists
ALTER TABLE therapists ADD COLUMN IF NOT EXISTS default_session_price DECIMAL(10,2) DEFAULT 0.00;

-- 2. Agregar precio a appointments
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS price DECIMAL(10,2);

-- 3. Crear tipos enum para pagos
DO $$ BEGIN
    CREATE TYPE payment_type AS ENUM ('charge', 'payment');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE payment_method AS ENUM ('cash', 'card', 'transfer', 'other');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 4. Crear tabla payments
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    therapist_id UUID NOT NULL REFERENCES therapists(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,

    amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
    type payment_type NOT NULL,
    payment_method payment_method,
    description TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Crear índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_payments_therapist ON payments(therapist_id);
CREATE INDEX IF NOT EXISTS idx_payments_patient ON payments(patient_id);
CREATE INDEX IF NOT EXISTS idx_payments_appointment ON payments(appointment_id);
CREATE INDEX IF NOT EXISTS idx_payments_type ON payments(type);
CREATE INDEX IF NOT EXISTS idx_payments_created ON payments(created_at DESC);

-- 6. Trigger para updated_at (reutilizar función existente)
DROP TRIGGER IF EXISTS update_payments_updated_at ON payments;
CREATE TRIGGER update_payments_updated_at
    BEFORE UPDATE ON payments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 7. Habilitar Row Level Security
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- 8. Políticas RLS para payments
DROP POLICY IF EXISTS "Therapists can view own payments" ON payments;
CREATE POLICY "Therapists can view own payments"
    ON payments FOR SELECT
    USING (auth.uid() = therapist_id);

DROP POLICY IF EXISTS "Therapists can create payments" ON payments;
CREATE POLICY "Therapists can create payments"
    ON payments FOR INSERT
    WITH CHECK (auth.uid() = therapist_id);

DROP POLICY IF EXISTS "Therapists can update own payments" ON payments;
CREATE POLICY "Therapists can update own payments"
    ON payments FOR UPDATE
    USING (auth.uid() = therapist_id)
    WITH CHECK (auth.uid() = therapist_id);

DROP POLICY IF EXISTS "Therapists can delete own payments" ON payments;
CREATE POLICY "Therapists can delete own payments"
    ON payments FOR DELETE
    USING (auth.uid() = therapist_id);
