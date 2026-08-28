import { redirect } from 'next/navigation';
import { getServerAuthUser } from '@/features/auth/getServerAuthUser';
import LoginForm from './LoginForm';

export default async function LoginPage() {
  const user = await getServerAuthUser();
  if (user) {
    redirect('/');
  }

  return <LoginForm />;
}
