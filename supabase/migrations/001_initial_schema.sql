-- =============================================
-- FisioGest - Schema de Base de Datos
-- =============================================
-- Este script crea todas las tablas necesarias para el MVP
-- con Row Level Security (RLS) habilitado

-- =============================================
-- 1. TABLA: therapists (Perfiles de Terapeutas)
-- =============================================
-- Se vincula con auth.users de Supabase

CREATE TABLE IF NOT EXISTS therapists (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    phone TEXT,
    license_number TEXT, -- Cédula profesional
    clinic_name TEXT,
    clinic_address TEXT,
    specialty TEXT DEFAULT 'Fisioterapia General',
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para therapists
CREATE INDEX IF NOT EXISTS idx_therapists_email ON therapists(email);

-- =============================================
-- 2. TABLA: patients (Pacientes)
-- =============================================

CREATE TABLE IF NOT EXISTS patients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    therapist_id UUID NOT NULL REFERENCES therapists(id) ON DELETE CASCADE,

    -- Datos personales
    full_name TEXT NOT NULL,
    email TEXT,
    phone TEXT NOT NULL,
    date_of_birth DATE,
    gender TEXT CHECK (gender IN ('M', 'F', 'Otro', 'No especificado')),
    address TEXT,
    occupation TEXT,
    emergency_contact_name TEXT,
    emergency_contact_phone TEXT,

    -- Historial médico
    medical_history JSONB DEFAULT '{}',
    allergies TEXT[],
    current_medications TEXT[],
    previous_surgeries TEXT[],
    chronic_conditions TEXT[],

    -- Motivo de consulta inicial
    initial_complaint TEXT,
    diagnosis TEXT,

    -- Estado del paciente
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'discharged')),

    -- Notas generales
    notes TEXT,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para patients
CREATE INDEX IF NOT EXISTS idx_patients_therapist ON patients(therapist_id);
CREATE INDEX IF NOT EXISTS idx_patients_status ON patients(status);
CREATE INDEX IF NOT EXISTS idx_patients_name ON patients(full_name);
CREATE INDEX IF NOT EXISTS idx_patients_phone ON patients(phone);

-- =============================================
-- 3. TABLA: appointments (Citas)
-- =============================================

CREATE TABLE IF NOT EXISTS appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    therapist_id UUID NOT NULL REFERENCES therapists(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,

    -- Detalles de la cita
    title TEXT NOT NULL,
    description TEXT,

    -- Fecha y hora
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    duration_minutes INTEGER GENERATED ALWAYS AS (
        EXTRACT(EPOCH FROM (end_time - start_time)) / 60
    ) STORED,

    -- Estado de la cita
    status TEXT DEFAULT 'scheduled' CHECK (
        status IN ('scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show')
    ),

    -- Tipo de cita
    appointment_type TEXT DEFAULT 'session' CHECK (
        appointment_type IN ('evaluation', 'session', 'follow_up', 'discharge')
    ),

    -- Recordatorio
    reminder_sent BOOLEAN DEFAULT FALSE,

    -- Notas
    notes TEXT,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Constraint: end_time debe ser después de start_time
    CONSTRAINT valid_time_range CHECK (end_time > start_time)
);

-- Índices para appointments
CREATE INDEX IF NOT EXISTS idx_appointments_therapist ON appointments(therapist_id);
CREATE INDEX IF NOT EXISTS idx_appointments_patient ON appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_start ON appointments(start_time);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);

-- =============================================
-- 4. TABLA: clinical_notes (Notas de Evolución)
-- =============================================
-- Formato SOAP: Subjective, Objective, Assessment, Plan

CREATE TABLE IF NOT EXISTS clinical_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    therapist_id UUID NOT NULL REFERENCES therapists(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,

    -- Fecha de la sesión
    session_date DATE NOT NULL DEFAULT CURRENT_DATE,

    -- Escala de dolor (1-10)
    pain_level_before INTEGER CHECK (pain_level_before >= 0 AND pain_level_before <= 10),
    pain_level_after INTEGER CHECK (pain_level_after >= 0 AND pain_level_after <= 10),
    pain_location TEXT,

    -- Formato SOAP
    subjective TEXT, -- Lo que el paciente reporta
    objective TEXT,  -- Observaciones del terapeuta, mediciones
    assessment TEXT, -- Evaluación/análisis del terapeuta
    plan TEXT,       -- Plan de tratamiento

    -- Tratamiento realizado
    treatment_performed TEXT,
    techniques_used TEXT[], -- Array de técnicas aplicadas

    -- Ejercicios prescritos
    exercises_prescribed JSONB DEFAULT '[]',

    -- Duración de la sesión
    session_duration_minutes INTEGER,

    -- Progreso general
    progress_status TEXT CHECK (
        progress_status IN ('improving', 'stable', 'worsening', 'recovered')
    ),

    -- Próxima cita recomendada
    next_session_recommendation TEXT,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para clinical_notes
CREATE INDEX IF NOT EXISTS idx_clinical_notes_therapist ON clinical_notes(therapist_id);
CREATE INDEX IF NOT EXISTS idx_clinical_notes_patient ON clinical_notes(patient_id);
CREATE INDEX IF NOT EXISTS idx_clinical_notes_date ON clinical_notes(session_date DESC);
CREATE INDEX IF NOT EXISTS idx_clinical_notes_appointment ON clinical_notes(appointment_id);

-- =============================================
-- 5. FUNCIONES AUXILIARES
-- =============================================

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para updated_at
CREATE TRIGGER update_therapists_updated_at
    BEFORE UPDATE ON therapists
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_patients_updated_at
    BEFORE UPDATE ON patients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_appointments_updated_at
    BEFORE UPDATE ON appointments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clinical_notes_updated_at
    BEFORE UPDATE ON clinical_notes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Función para crear perfil de terapeuta automáticamente al registrarse
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO therapists (id, email, full_name)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1))
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para crear perfil al registrarse
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- =============================================
-- 6. ROW LEVEL SECURITY (RLS)
-- =============================================

-- Habilitar RLS en todas las tablas
ALTER TABLE therapists ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinical_notes ENABLE ROW LEVEL SECURITY;

-- =============================================
-- Políticas para THERAPISTS
-- =============================================

-- Los terapeutas solo pueden ver/editar su propio perfil
CREATE POLICY "Therapists can view own profile"
    ON therapists FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Therapists can update own profile"
    ON therapists FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- =============================================
-- Políticas para PATIENTS
-- =============================================

-- Los terapeutas solo pueden ver sus propios pacientes
CREATE POLICY "Therapists can view own patients"
    ON patients FOR SELECT
    USING (auth.uid() = therapist_id);

-- Los terapeutas pueden crear pacientes (se les asigna automáticamente)
CREATE POLICY "Therapists can create patients"
    ON patients FOR INSERT
    WITH CHECK (auth.uid() = therapist_id);

-- Los terapeutas pueden actualizar sus propios pacientes
CREATE POLICY "Therapists can update own patients"
    ON patients FOR UPDATE
    USING (auth.uid() = therapist_id)
    WITH CHECK (auth.uid() = therapist_id);

-- Los terapeutas pueden eliminar sus propios pacientes
CREATE POLICY "Therapists can delete own patients"
    ON patients FOR DELETE
    USING (auth.uid() = therapist_id);

-- =============================================
-- Políticas para APPOINTMENTS
-- =============================================

CREATE POLICY "Therapists can view own appointments"
    ON appointments FOR SELECT
    USING (auth.uid() = therapist_id);

CREATE POLICY "Therapists can create appointments"
    ON appointments FOR INSERT
    WITH CHECK (auth.uid() = therapist_id);

CREATE POLICY "Therapists can update own appointments"
    ON appointments FOR UPDATE
    USING (auth.uid() = therapist_id)
    WITH CHECK (auth.uid() = therapist_id);

CREATE POLICY "Therapists can delete own appointments"
    ON appointments FOR DELETE
    USING (auth.uid() = therapist_id);

-- =============================================
-- Políticas para CLINICAL_NOTES
-- =============================================

CREATE POLICY "Therapists can view own clinical notes"
    ON clinical_notes FOR SELECT
    USING (auth.uid() = therapist_id);

CREATE POLICY "Therapists can create clinical notes"
    ON clinical_notes FOR INSERT
    WITH CHECK (auth.uid() = therapist_id);

CREATE POLICY "Therapists can update own clinical notes"
    ON clinical_notes FOR UPDATE
    USING (auth.uid() = therapist_id)
    WITH CHECK (auth.uid() = therapist_id);

CREATE POLICY "Therapists can delete own clinical notes"
    ON clinical_notes FOR DELETE
    USING (auth.uid() = therapist_id);

-- =============================================
-- 7. VISTAS ÚTILES
-- =============================================

-- Vista para citas del día con info del paciente
CREATE OR REPLACE VIEW today_appointments AS
SELECT
    a.id,
    a.therapist_id,
    a.patient_id,
    p.full_name AS patient_name,
    p.phone AS patient_phone,
    a.title,
    a.start_time,
    a.end_time,
    a.duration_minutes,
    a.status,
    a.appointment_type,
    a.notes
FROM appointments a
JOIN patients p ON a.patient_id = p.id
WHERE DATE(a.start_time) = CURRENT_DATE
ORDER BY a.start_time;

-- Vista para estadísticas del dashboard
CREATE OR REPLACE VIEW therapist_stats AS
SELECT
    t.id AS therapist_id,
    COUNT(DISTINCT p.id) FILTER (WHERE p.status = 'active') AS active_patients,
    COUNT(DISTINCT p.id) AS total_patients,
    COUNT(DISTINCT a.id) FILTER (
        WHERE DATE(a.start_time) = CURRENT_DATE
        AND a.status NOT IN ('cancelled', 'no_show')
    ) AS today_appointments,
    COUNT(DISTINCT a.id) FILTER (
        WHERE a.start_time >= DATE_TRUNC('week', CURRENT_DATE)
        AND a.start_time < DATE_TRUNC('week', CURRENT_DATE) + INTERVAL '7 days'
        AND a.status NOT IN ('cancelled', 'no_show')
    ) AS week_appointments
FROM therapists t
LEFT JOIN patients p ON t.id = p.therapist_id
LEFT JOIN appointments a ON t.id = a.therapist_id
GROUP BY t.id;

-- =============================================
-- 8. DATOS DE EJEMPLO (OPCIONAL - Comentar en producción)
-- =============================================

-- Descomentar las siguientes líneas para insertar datos de prueba
-- después de crear un usuario de prueba en Supabase Auth

/*
-- Insertar paciente de ejemplo (reemplazar UUID con el ID del terapeuta)
INSERT INTO patients (therapist_id, full_name, phone, date_of_birth, gender, initial_complaint, diagnosis)
VALUES
    ('TU-THERAPIST-UUID-AQUI', 'María García López', '+52 555 123 4567', '1985-03-15', 'F', 'Dolor lumbar crónico', 'Lumbalgia mecánica'),
    ('TU-THERAPIST-UUID-AQUI', 'Carlos Rodríguez Pérez', '+52 555 987 6543', '1990-07-22', 'M', 'Lesión de rodilla por deporte', 'Tendinitis rotuliana');
*/
