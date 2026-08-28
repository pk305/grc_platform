import Image from 'next/image';

const NATIVE_WIDTH = 1572;
const NATIVE_HEIGHT = 496;

export default function AcentriaLogo({
  width = 240,
  priority = false,
  className
}: {
  width?: number;
  priority?: boolean;
  className?: string;
}) {
  const height = Math.round((width * NATIVE_HEIGHT) / NATIVE_WIDTH);

  return (
    <Image
      src="/assets/logo/horizontal-logo.png"
      alt="Acentria Group"
      width={width}
      height={height}
      priority={priority}
      className={className}
    />
  );
}
