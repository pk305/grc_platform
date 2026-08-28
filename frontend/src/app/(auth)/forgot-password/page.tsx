'use client';

import AuthShell from '@/components/auth/AuthShell';

export default function ForgotPasswordPage() {
  return (
    <AuthShell columnClass="col-xxl-4">
      <div className="text-center mb-6">
        <h4 className="text-800">Forgot your password?</h4>
        <p className="text-700 mb-5">
          Enter your email below and we will send you a reset link
        </p>
        <form
          className="d-flex align-items-center mb-5"
          onSubmit={e => e.preventDefault()}
        >
          <input
            id="email"
            className="form-control flex-1"
            type="email"
            placeholder="Email"
          />
          <button type="submit" className="btn btn-primary ms-2">
            Send
            <span className="fas fa-chevron-right ms-2" />
          </button>
        </form>
        <a className="fs--1 fw-bold" href="#!">
          Still having problems?
        </a>
      </div>
    </AuthShell>
  );
}
