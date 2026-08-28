'use client';

import dayjs from 'dayjs';
import advancedFormat from 'dayjs/plugin/advancedFormat';
import EChartBox from './EChartBox';
import { getColor, getPastDates, tooltipFormatter } from '@/lib/chart-utils';

dayjs.extend(advancedFormat);

const dates = getPastDates(10);
const actualRevenue = [
  44485, 20428, 47302, 45180, 31034, 46358, 26581, 36628, 38219, 43256
];
const projectedRevenue = [
  38911, 29452, 31894, 47876, 31302, 27731, 25490, 30355, 27176, 30393
];

const getOption = () => ({
  color: [getColor('primary'), getColor('300')],
  tooltip: {
    trigger: 'axis',
    padding: [7, 10],
    backgroundColor: getColor('100'),
    borderColor: getColor('300'),
    textStyle: { color: getColor('dark') },
    borderWidth: 1,
    transitionDuration: 0,
    axisPointer: { type: 'none' },
    formatter: params => tooltipFormatter(params)
  },
  legend: {
    data: ['Projected revenue', 'Actual revenue'],
    right: 'right',
    width: '100%',
    itemWidth: 16,
    itemHeight: 8,
    itemGap: 20,
    top: 3,
    inactiveColor: getColor('100'),
    textStyle: {
      color: getColor('900'),
      fontWeight: 600,
      fontFamily: 'Nunito Sans'
    }
  },
  xAxis: {
    type: 'category',
    axisLabel: {
      color: getColor('800'),
      formatter: value => dayjs(value).format('MMM DD'),
      interval: 3,
      fontFamily: 'Nunito Sans',
      fontWeight: 600,
      fontSize: 12.8
    },
    data: dates,
    axisLine: { lineStyle: { color: getColor('300') } },
    axisTick: false
  },
  yAxis: {
    axisPointer: { type: 'none' },
    axisTick: 'none',
    splitLine: { interval: 5, lineStyle: { color: getColor('200') } },
    axisLine: { show: false },
    axisLabel: {
      fontFamily: 'Nunito Sans',
      fontWeight: 600,
      fontSize: 12.8,
      color: getColor('800'),
      margin: 20,
      verticalAlign: 'bottom',
      formatter: value => `$${value.toLocaleString()}`
    }
  },
  series: [
    {
      name: 'Projected revenue',
      type: 'bar',
      barWidth: '6px',
      data: projectedRevenue,
      barGap: '30%',
      label: { show: false },
      itemStyle: { borderRadius: [2, 2, 0, 0], color: getColor('primary') }
    },
    {
      name: 'Actual revenue',
      type: 'bar',
      data: actualRevenue,
      barWidth: '6px',
      barGap: '30%',
      label: { show: false },
      z: 10,
      itemStyle: { borderRadius: [2, 2, 0, 0], color: getColor('info-100') }
    }
  ],
  grid: { right: 0, left: 3, bottom: 0, top: '15%', containLabel: true },
  animation: false
});

export default function ProjectVsActualChart() {
  return (
    <EChartBox getOption={getOption} style={{ height: 300, width: '100%' }} />
  );
}
