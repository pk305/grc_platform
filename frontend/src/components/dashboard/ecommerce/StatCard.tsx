'use client';

import { useEffect, useRef } from 'react';
import dayjs from 'dayjs';
import EChartBox from './EChartBox';
import { getColor, getDates } from '@/lib/chart-utils';

export function TotalOrders() {
  const getOption = () => ({
    color: getColor('primary'),
    tooltip: { show: false },
    xAxis: {
      type: 'category',
      data: getDates(
        new Date('5/1/2022'),
        new Date('5/7/2022'),
        1000 * 60 * 60 * 24
      ),
      show: true,
      boundaryGap: false,
      axisLine: { show: true, lineStyle: { color: getColor('200') } },
      axisTick: { show: false },
      axisLabel: {
        formatter: value => dayjs(value).format('DD MMM'),
        interval: 6,
        showMinLabel: true,
        showMaxLabel: true,
        color: getColor('800')
      }
    },
    yAxis: { show: false, type: 'value', boundaryGap: false },
    series: [
      {
        type: 'bar',
        barWidth: '5px',
        data: [120, 200, 150, 80, 70, 110, 120],
        showBackground: true,
        symbol: 'none',
        itemStyle: { borderRadius: 10 },
        backgroundStyle: { borderRadius: 10 }
      }
    ],
    grid: { right: 10, left: 10, bottom: 0, top: 0 }
  });

  return (
    <div className="card border border-200 shadow-none h-100">
      <div className="card-body">
        <div className="d-flex justify-content-between">
          <div>
            <h5 className="mb-1">
              Total orders
              <span className="badge badge-light-warning rounded-pill fs--1 ms-2">
                -6.8%
              </span>
            </h5>
            <h6 className="text-700">Last 7 days</h6>
          </div>
          <h4>16,247</h4>
        </div>
        <div className="d-flex justify-content-center px-4 py-6">
          <EChartBox getOption={getOption} style={{ height: 85, width: 115 }} />
        </div>
        <div className="mt-2">
          <div className="d-flex align-items-center mb-2">
            <div className="bullet-item bg-primary me-2" />
            <h6 className="text-900 fw-semi-bold flex-1 mb-0">Completed</h6>
            <h6 className="text-900 fw-semi-bold mb-0">52%</h6>
          </div>
          <div className="d-flex align-items-center">
            <div className="bullet-item bg-light-primary me-2" />
            <h6 className="text-900 fw-semi-bold flex-1 mb-0">
              Pending payment
            </h6>
            <h6 className="text-900 fw-semi-bold mb-0">48%</h6>
          </div>
        </div>
      </div>
    </div>
  );
}

export function NewCustomers() {
  const getOption = () => ({
    tooltip: {
      trigger: 'item',
      padding: [7, 10],
      backgroundColor: getColor('100'),
      borderColor: getColor('300'),
      textStyle: { color: getColor('dark') },
      borderWidth: 1,
      transitionDuration: 0
    },
    xAxis: [
      {
        type: 'category',
        data: getDates(
          new Date('5/1/2022'),
          new Date('5/7/2022'),
          1000 * 60 * 60 * 24
        ),
        show: true,
        boundaryGap: false,
        axisLine: { show: true, lineStyle: { color: getColor('200') } },
        axisTick: { show: false },
        axisLabel: {
          formatter: value => dayjs(value).format('DD MMM'),
          showMinLabel: true,
          showMaxLabel: false,
          color: getColor('800'),
          align: 'left',
          interval: 5,
          fontFamily: 'Nunito Sans',
          fontWeight: 600,
          fontSize: 12.8
        }
      },
      {
        type: 'category',
        position: 'bottom',
        show: true,
        data: getDates(
          new Date('5/1/2022'),
          new Date('5/7/2022'),
          1000 * 60 * 60 * 24
        ),
        axisLabel: {
          formatter: value => dayjs(value).format('DD MMM'),
          interval: 130,
          showMaxLabel: true,
          showMinLabel: false,
          color: getColor('800'),
          align: 'right',
          fontFamily: 'Nunito Sans',
          fontWeight: 600,
          fontSize: 12.8
        },
        axisLine: { show: false },
        axisTick: { show: false },
        splitLine: { show: false },
        boundaryGap: false
      }
    ],
    yAxis: { show: false, type: 'value', boundaryGap: false },
    series: [
      {
        type: 'line',
        data: [150, 100, 300, 200, 250, 180, 250],
        showSymbol: false,
        symbol: 'circle',
        lineStyle: { width: 2, color: getColor('200') },
        emphasis: { lineStyle: { color: getColor('200') } }
      },
      {
        type: 'line',
        data: [200, 150, 250, 100, 500, 400, 600],
        lineStyle: { width: 2, color: getColor('primary') },
        showSymbol: false,
        symbol: 'circle'
      }
    ],
    grid: { left: 0, right: 0, top: 5, bottom: 20 }
  });

  return (
    <div className="card border border-200 shadow-none h-100">
      <div className="card-body">
        <div className="d-flex justify-content-between">
          <div>
            <h5 className="mb-1">
              New customers
              <span className="badge badge-light-warning rounded-pill fs--1 ms-2">
                +26.5%
              </span>
            </h5>
            <h6 className="text-700">Last 7 days</h6>
          </div>
          <h4>356</h4>
        </div>
        <div className="pb-0 pt-4">
          <EChartBox
            getOption={getOption}
            style={{ height: 180, width: '100%' }}
          />
        </div>
      </div>
    </div>
  );
}

export function TopCoupons() {
  const getOption = () => ({
    color: [getColor('primary'), getColor('200'), getColor('info')],
    tooltip: {
      trigger: 'item',
      padding: [7, 10],
      backgroundColor: getColor('100'),
      borderColor: getColor('300'),
      textStyle: { color: getColor('dark') },
      borderWidth: 1,
      transitionDuration: 0,
      formatter: params =>
        `<strong>${params.data.name}:</strong> ${params.percent}%`
    },
    legend: { show: false },
    series: [
      {
        name: '72%',
        type: 'pie',
        radius: ['100%', '87%'],
        avoidLabelOverlap: false,
        emphasis: { scale: false },
        itemStyle: { borderWidth: 2, borderColor: getColor('white') },
        label: {
          show: true,
          position: 'center',
          formatter: '{a}',
          fontSize: 23,
          color: getColor('dark')
        },
        data: [
          { value: 7200000, name: 'Percentage discount' },
          { value: 1800000, name: 'Fixed card discount' },
          { value: 1000000, name: 'Fixed product discount' }
        ]
      }
    ]
  });

  return (
    <div className="card border border-200 shadow-none h-100">
      <div className="card-body">
        <div className="d-flex justify-content-between">
          <div>
            <h5 className="mb-2">Top coupons</h5>
            <h6 className="text-700">Last 7 days</h6>
          </div>
        </div>
        <div className="pb-4 pt-3">
          <EChartBox
            getOption={getOption}
            style={{ height: 115, width: '100%' }}
          />
        </div>
        <div>
          <div className="d-flex align-items-center mb-2">
            <div className="bullet-item bg-primary me-2" />
            <h6 className="text-900 fw-semi-bold flex-1 mb-0">
              Percentage discount
            </h6>
            <h6 className="text-900 fw-semi-bold mb-0">72%</h6>
          </div>
          <div className="d-flex align-items-center mb-2">
            <div className="bullet-item bg-primary-200 me-2" />
            <h6 className="text-900 fw-semi-bold flex-1 mb-0">
              Fixed card discount
            </h6>
            <h6 className="text-900 fw-semi-bold mb-0">18%</h6>
          </div>
          <div className="d-flex align-items-center">
            <div className="bullet-item bg-info me-2" />
            <h6 className="text-900 fw-semi-bold flex-1 mb-0">
              Fixed product discount
            </h6>
            <h6 className="text-900 fw-semi-bold mb-0">10%</h6>
          </div>
        </div>
      </div>
    </div>
  );
}

export function PayingCustomer() {
  const canvasRef = useRef(null);

  useEffect(() => {
    let chart;
    let cancelled = false;

    import('chart.js/auto').then(({ default: Chart }) => {
      if (cancelled || !canvasRef.current) return;
      const ctx = canvasRef.current.getContext('2d');
      chart = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: ['Falcon', 'Sparrow'],
          datasets: [
            {
              data: [50, 88],
              backgroundColor: [getColor('primary'), getColor('primary-100')],
              borderColor: [getColor('primary'), getColor('primary-100')],
              borderRadius: [
                { outerStart: 15, outerEnd: 0, innerStart: 15, innerEnd: 0 },
                { outerStart: 0, outerEnd: 15, innerStart: 0, innerEnd: 15 }
              ]
            }
          ]
        },
        options: {
          rotation: -90,
          circumference: 180,
          cutout: '80%',
          plugins: { legend: { display: false } }
        }
      });
    });

    return () => {
      cancelled = true;
      chart?.destroy();
    };
  }, []);

  return (
    <div className="card border border-200 shadow-none h-100">
      <div className="card-body">
        <div className="d-flex justify-content-between">
          <div>
            <h5 className="mb-2">Paying vs non paying</h5>
            <h6 className="text-700">Last 7 days</h6>
          </div>
        </div>
        <div className="d-flex justify-content-center pt-3">
          <div style={{ height: 145, width: 140 }}>
            <canvas ref={canvasRef} id="payingCustomerChart" />
          </div>
        </div>
        <div className="mt-3">
          <div className="d-flex align-items-center mb-2">
            <div className="bullet-item bg-primary me-2" />
            <h6 className="text-900 fw-semi-bold flex-1 mb-0">
              Paying customer
            </h6>
            <h6 className="text-900 fw-semi-bold mb-0">30%</h6>
          </div>
          <div className="d-flex align-items-center">
            <div className="bullet-item bg-light-primary me-2" />
            <h6 className="text-900 fw-semi-bold flex-1 mb-0">
              Non-paying customer
            </h6>
            <h6 className="text-900 fw-semi-bold mb-0">70%</h6>
          </div>
        </div>
      </div>
    </div>
  );
}
