import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="px-3">
      <div className="row min-vh-100 flex-center px-5">
        <div className="col-12 col-xl-10 col-xxl-8">
          <div className="row justify-content-center g-5">
            <div className="col-12 col-lg-6 text-center order-lg-1">
              <img
                className="img-fluid"
                src="/assets/img/spot-illustrations/404-illustration.png"
                alt=""
                width={540}
              />
            </div>
            <div className="col-12 col-lg-6 text-center text-lg-start">
              <img
                className="img-fluid mb-3 w-lg-75"
                src="/assets/img/spot-illustrations/404.png"
                alt=""
              />
              <h2 className="text-800 fw-bolder mb-3">Page Missing!</h2>
              <p className="text-900">
                But no worries! Our ostrich is looking everywhere
                <br className="d-none d-sm-block" />
                while you wait safely.
              </p>
              <Link href="/" className="btn btn-lg btn-primary">
                Go Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
