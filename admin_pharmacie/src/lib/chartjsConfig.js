import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';

// Register only components we need
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
  Filler
);

// Stable default styling (avoid relying on CSS variables inside canvas)
ChartJS.defaults.font.family = 'Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial';
ChartJS.defaults.font.size = 12;
ChartJS.defaults.color = '#64748b'; // muted foreground
ChartJS.defaults.plugins.legend.labels.boxWidth = 16;

export default ChartJS;
