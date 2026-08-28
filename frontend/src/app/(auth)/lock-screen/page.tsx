import Link from 'next/link';
import AuthShell from '@/components/auth/AuthShell';

export default function LockScreenPage() {
  return (
    <AuthShell logo={false}>
      <div className="text-center mb-5">
        <div className="avatar avatar-3xl mb-4">
          <img
            className="rounded-circle"
            src="/assets/img/team/30.png"
            alt=""
          />
        </div>
        <h2 className="text-800">
          <span className="fw-normal">Hello </span>
          John Smith
        </h2>
        <p className="text-700">Enter your password to access the admin</p>
      </div>
      <input
        id="password"
        className="form-control mb-3"
        type="password"
        placeholder="Enter Password"
      />
      <Link href="/" className="btn btn-primary w-100">
        Sign In
      </Link>
    </AuthShell>
  );
}
