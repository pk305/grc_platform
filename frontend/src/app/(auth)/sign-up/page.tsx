import Link from 'next/link';
import AuthShell from '@/components/auth/AuthShell';
import SocialButtons from '@/components/auth/SocialButtons';

export default function SignUpPage() {
  return (
    <AuthShell>
      <div className="text-center mb-7">
        <h3>Sign Up</h3>
        <p className="text-700">Create your account today</p>
      </div>
      <SocialButtons title="Sign up" />
      <div className="position-relative mt-4">
        <hr className="bg-200" />
        <div className="divider-content-center">or use email</div>
      </div>
      <form>
        <div className="mb-3 text-start">
          <label className="form-label" htmlFor="name">
            Name
          </label>
          <input
            id="name"
            className="form-control"
            type="text"
            placeholder="Name"
          />
        </div>
        <div className="mb-3 text-start">
          <label className="form-label" htmlFor="email">
            Email address
          </label>
          <input
            id="email"
            className="form-control"
            type="email"
            placeholder="name@example.com"
          />
        </div>
        <div className="row g-3 mb-3">
          <div className="col-md-6">
            <label className="form-label" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              className="form-control form-icon-input"
              type="password"
              placeholder="Password"
            />
          </div>
          <div className="col-md-6">
            <label className="form-label" htmlFor="confirm_password">
              Confirm Password
            </label>
            <input
              id="confirm_password"
              className="form-control form-icon-input"
              type="password"
              placeholder="Confirm Password"
            />
          </div>
        </div>
        <div className="form-check mb-3">
          <input
            id="termsService"
            className="form-check-input"
            type="checkbox"
          />
          <label className="form-label" htmlFor="termsService">
            I accept the <a href="#!">terms</a> and{' '}
            <a href="#!">privacy policy</a>
          </label>
        </div>
        <button type="submit" className="btn btn-primary w-100 mb-3">
          Sign up
        </button>
        <div className="text-center">
          <Link href="/auth/login" className="fs--1 fw-bold">
            Sign in to an existing account
          </Link>
        </div>
      </form>
    </AuthShell>
  );
}
