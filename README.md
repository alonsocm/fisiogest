# FisioGest

Sistema de gestión para fisioterapeutas independientes. Permite administrar pacientes, expedientes clínicos y agenda de citas desde cualquier dispositivo.

## Características

- **Autenticación segura** - Login con email/password vía Supabase Auth
- **Dashboard** - Vista rápida de citas del día y estadísticas
- **Gestión de pacientes** - CRUD completo con historial médico
- **Expediente clínico** - Notas de evolución en formato SOAP
- **Escala de dolor** - Seguimiento visual del dolor (1-10)
- **Agenda** - Calendario visual para programar citas
- **Mobile-first** - Diseño responsive optimizado para móvil/tablet

## Stack Tecnológico

- **Frontend:** Next.js 16, React 19, TypeScript
- **Estilos:** Tailwind CSS, Shadcn/UI
- **Backend:** Supabase (PostgreSQL, Auth, RLS)
- **Iconos:** Lucide React

## Requisitos

- Node.js 18+
- Cuenta en [Supabase](https://supabase.com) (gratis)

## Instalación

### 1. Clonar el repositorio

```bash
git clone https://github.com/alonsocm/fisiogest.git
cd fisiogest
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar Supabase

1. Crea un proyecto en [supabase.com](https://supabase.com)
2. Ve a **Settings → API** y copia:
   - Project URL
   - anon/public key

3. Crea el archivo `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
```

### 4. Configurar la base de datos

1. Ve a **SQL Editor** en Supabase Dashboard
2. Copia y ejecuta el contenido de `supabase/migrations/001_initial_schema.sql`

### 5. Configurar autenticación (opcional para desarrollo)

Para evitar confirmar emails en desarrollo:
1. Ve a **Authentication → Providers → Email**
2. Desactiva "Confirm email"

### 6. Iniciar el servidor

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000)

## Estructura del Proyecto

```
src/
├── app/                    # App Router de Next.js
│   ├── (auth)/            # Rutas públicas (login, register)
│   └── (dashboard)/       # Rutas protegidas
├── components/
│   ├── ui/                # Componentes Shadcn/UI
│   ├── layout/            # Sidebar, navegación móvil
│   ├── patients/          # Componentes de pacientes
│   ├── clinical-notes/    # Formulario de notas SOAP
│   └── calendar/          # Vista de calendario
├── actions/               # Server Actions (CRUD)
├── lib/                   # Utilidades y cliente Supabase
└── types/                 # Tipos TypeScript
```

## Modelo de Datos

| Tabla | Descripción |
|-------|-------------|
| `therapists` | Perfiles de terapeutas (vinculado a auth.users) |
| `patients` | Pacientes con datos personales e historial |
| `appointments` | Citas con horarios y estados |
| `clinical_notes` | Notas de evolución formato SOAP |

Todas las tablas tienen **Row Level Security (RLS)** habilitado para que cada terapeuta solo vea sus propios datos.

## Despliegue en Vercel

1. Conecta tu repositorio en [vercel.com](https://vercel.com)
2. Agrega las variables de entorno:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Deploy

## Scripts

```bash
npm run dev      # Servidor de desarrollo
npm run build    # Build de producción
npm run start    # Iniciar build de producción
npm run lint     # Ejecutar ESLint
```

## Licencia

MIT
