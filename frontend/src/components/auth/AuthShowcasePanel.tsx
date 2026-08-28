import Image from 'next/image';

export default function AuthShowcasePanel({
  caption = 'Governance. Risk. Compliance.'
}: {
  caption?: string;
}) {
  return (
    <div
      className="d-none d-lg-block position-relative animate__animated animate__fadeIn animate__faster"
      style={{ flex: '1 1 55%' }}
      aria-hidden="true"
    >
      <Image
        src="/assets/img/risk.jpeg"
        alt=""
        fill
        priority
        sizes="55vw"
        style={{ objectFit: 'cover', filter: 'grayscale(1) contrast(1.1)' }}
      />
      <p
        className="position-absolute bottom-0 start-0 m-4 mb-5 text-white fw-bold d-flex align-items-center"
        style={{ fontSize: '2rem' }}
      >
        <span
          className="me-3"
          data-feather="shield"
          style={{ height: '2rem', width: '2rem' }}
        />
        {caption}
      </p>
    </div>
  );
}
