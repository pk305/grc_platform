'use client';

import Image from 'next/image';
import { useTheme } from '@/features/theme/ThemeContext';

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
  const { resolved } = useTheme();
  const height = Math.round((width * NATIVE_HEIGHT) / NATIVE_WIDTH);

  return (
    <Image
      src={
        resolved === 'dark'
          ? '/assets/logo/horizontal-logo-dark.png'
          : '/assets/logo/horizontal-logo.png'
      }
      alt="Acentria Group"
      width={width}
      height={height}
      priority={priority}
      className={className}
    />
  );
}
