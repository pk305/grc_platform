import Link from 'next/link';

export default function Logo({
  logo = 'logo',
  text = true,
  width = 32,
  textClass,
  className,
  href = '/'
}: {
  logo?: string;
  text?: boolean;
  width?: number;
  textClass?: string;
  className?: string;
  href?: string | null;
}) {
  const content = (
    <div className={`d-flex align-items-center ${className || ''}`.trim()}>
      <img src={`/assets/img/icons/${logo}.png`} alt="phoenix" width={width} />
      {text && (
        <p className={`logo-text ms-2 ${textClass || ''}`.trim()}>phoenix</p>
      )}
    </div>
  );

  return href ? (
    <Link href={href} className="text-decoration-none">
      {content}
    </Link>
  ) : (
    content
  );
}
