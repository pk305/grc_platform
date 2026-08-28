'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import feather from 'feather-icons';
import AnchorJS from 'anchor-js';

export default function ThemeInit() {
  const pathname = usePathname();

  useEffect(() => {
    let cancelled = false;

    import('bootstrap/dist/js/bootstrap.bundle.min').then(
      ({ Tooltip, Popover, Toast }) => {
        if (cancelled) return;

        document
          .querySelectorAll('[data-bs-toggle="tooltip"]')
          .forEach(el => new Tooltip(el, { trigger: 'hover' }));

        document
          .querySelectorAll('[data-bs-toggle="popover"]')
          .forEach(el => new Popover(el));

        document.querySelectorAll('.toast').forEach(el => new Toast(el));
      }
    );

    feather.replace({ width: '16px', height: '16px' });

    new AnchorJS({ icon: '#' }).add('[data-anchor]');

    return () => {
      cancelled = true;
    };
  }, [pathname]);

  useEffect(() => {
    let frame: number | null = null;
    const observer = new MutationObserver(() => {
      if (frame !== null) return;
      frame = requestAnimationFrame(() => {
        frame = null;
        if (document.querySelector('[data-feather]')) {
          feather.replace({ width: '16px', height: '16px' });
        }
      });
    });
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      if (frame !== null) cancelAnimationFrame(frame);
    };
  }, []);

  return null;
}
