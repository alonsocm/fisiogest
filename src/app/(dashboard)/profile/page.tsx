import { redirect } from 'next/navigation';
import { getCurrentTherapist } from '@/actions/auth';
import { ProfileForm } from '@/components/profile/profile-form';

export default async function ProfilePage() {
  const therapist = await getCurrentTherapist();

  if (!therapist) {
    redirect('/login');
  }

  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      <div>
        <h1 className="text-2xl font-bold">Mi Perfil</h1>
        <p className="text-muted-foreground">
          Administra tu información personal y datos de tu clínica
        </p>
      </div>

      <ProfileForm therapist={therapist} />
    </div>
  );
}
