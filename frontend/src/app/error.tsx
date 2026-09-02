'use client';

import Link from 'next/link';
import Image from 'next/image';

export default function Error({ reset }) {
  return (
    <div className="px-3">
      <div className="row min-vh-100 flex-center px-5">
        <div className="col-12 col-xl-10 col-xxl-8">
          <div className="row justify-content-center g-5">
            <div className="col-12 col-lg-6 text-center order-lg-1">
              <Image
                className="img-fluid"
                src="/assets/img/spot-illustrations/500-illustration.png"
                alt=""
                width={540}
                height={392}
                style={{ width: '100%', height: 'auto' }}
              />
            </div>
            <div className="col-12 col-lg-6 text-center text-lg-start">
              <Image
                className="img-fluid mb-3 w-lg-75"
                src="/assets/img/spot-illustrations/500.png"
                alt=""
                width={424}
                height={242}
                style={{ width: '100%', height: 'auto' }}
              />
              <h2 className="text-800 fw-bolder mb-3">Unknown error!</h2>
              <p className="text-900">
                But relax! Our cat is here to play you some music.
              </p>
              <button
                type="button"
                className="btn btn-lg btn-primary me-2"
                onClick={() => reset()}
              >
                Try Again
              </button>
              <Link href="/" className="btn btn-lg btn-outline-primary">
                Go Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
