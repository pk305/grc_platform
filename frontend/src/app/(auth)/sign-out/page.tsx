import type { Metadata } from 'next';
import Link from 'next/link';
import AuthShell from '@/components/auth/AuthShell';

export const metadata: Metadata = {
  title: 'Sign Out'
};

export default function SignOutPage() {
  return (
    <AuthShell logo={false} columnClass="col-xxl-4">
      <div className="text-center mb-6">
        <img
          className="mb-7"
          src="/assets/img/spot-illustrations/3.png"
          alt="phoenix"
        />
        <h4>Come back soon!</h4>
        <p className="text-700">
          Thanks for using Phoenix. You are now successfully signed out.
        </p>
      </div>
      <Link href="/auth/login" className="btn btn-primary w-100">
        <span className="fas fa-angle-left me-2" />
        Go to sign in page
      </Link>
    </AuthShell>
  );
}
