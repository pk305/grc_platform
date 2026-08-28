import type { Chart } from 'chart.js';
import type * as Leaflet from 'leaflet';

declare global {
  interface Window {
    Chart: typeof Chart;
    L: typeof Leaflet;
  }
}

export {};
