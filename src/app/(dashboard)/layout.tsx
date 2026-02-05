import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Sidebar } from '@/components/layout/sidebar';
import { MobileNav } from '@/components/layout/mobile-nav';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: therapist } = await supabase
    .from('therapists')
    .select('full_name, email')
    .eq('id', user.id)
    .single();

  return (
    <div className="flex min-h-screen">
      {/* Sidebar para desktop */}
      <Sidebar user={therapist || { full_name: user.email || '', email: user.email || '' }} />

      {/* Contenido principal */}
      <div className="flex-1 flex flex-col lg:pl-64 min-w-0">
        {/* Navegación móvil */}
        <MobileNav user={therapist || { full_name: user.email || '', email: user.email || '' }} />

        {/* Contenido de la página */}
        <main className="flex-1 p-4 lg:p-8 overflow-x-hidden">{children}</main>
      </div>
    </div>
  );
}
