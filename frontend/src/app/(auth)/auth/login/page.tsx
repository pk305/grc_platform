import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getServerAuthUser } from '@/features/auth/getServerAuthUser';
import LoginForm from './LoginForm';

export const metadata: Metadata = {
  title: 'Sign in · Phoenix'
};

export default async function LoginPage() {
  const user = await getServerAuthUser();
  if (user) {
    redirect('/');
  }

  return <LoginForm />;
}
