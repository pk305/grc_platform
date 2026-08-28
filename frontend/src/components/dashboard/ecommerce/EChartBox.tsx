'use client';

import { useEffect, useRef, type CSSProperties } from 'react';
import { resize } from '@/lib/chart-utils';

export default function EChartBox({
  getOption,
  className,
  style
}: {
  getOption: () => Record<string, unknown>;
  className?: string;
  style?: CSSProperties;
}) {
  const ref = useRef(null);

  useEffect(() => {
    if (!ref.current) return undefined;

    let chart: import('echarts').ECharts | undefined;
    let handleResize: (() => void) | undefined;
    let cancelled = false;

    import('echarts').then(echarts => {
      if (cancelled || !ref.current) return;

      chart = echarts.init(ref.current);
      chart.setOption(getOption());

      handleResize = () => chart?.resize();
      resize(handleResize);
    });

    return () => {
      cancelled = true;
      if (handleResize) window.removeEventListener('resize', handleResize);
      chart?.dispose();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <div ref={ref} className={className} style={style} />;
}
