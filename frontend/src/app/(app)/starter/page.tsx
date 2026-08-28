import Link from 'next/link';

export default function StarterPage() {
  return (
    <div className="d-flex flex-center content-min-h">
      <div className="text-center py-9">
        <img
          className="img-fluid mb-7"
          src="/assets/img/spot-illustrations/2.png"
          alt=""
        />
        <h1 className="text-800 fw-normal mb-5">Create Something Beautiful.</h1>
        <Link href="/" className="btn btn-lg btn-primary">
          Getting Started
        </Link>
      </div>
    </div>
  );
}
