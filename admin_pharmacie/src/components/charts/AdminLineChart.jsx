import React from 'react';
import { Line } from 'react-chartjs-2';
import '../../lib/chartjsConfig';

const mergeOptions = (base = {}, override = {}) => ({
  ...base,
  ...override,
  plugins: {
    ...(base.plugins || {}),
    ...(override.plugins || {}),
    legend: {
      ...(base.plugins?.legend || {}),
      ...(override.plugins?.legend || {}),
    },
    tooltip: {
      ...(base.plugins?.tooltip || {}),
      ...(override.plugins?.tooltip || {}),
    },
  },
  scales: {
    ...(base.scales || {}),
    ...(override.scales || {}),
  },
  interaction: {
    ...(base.interaction || {}),
    ...(override.interaction || {}),
  },
});

const AdminLineChart = ({ labels = [], datasets = [], height = 220, options = {}, className = '' }) => {
  const data = { labels, datasets };

  const defaultOptions = {
    responsive: true,
    maintainAspectRatio: false,
    layout: {
      padding: { top: 6, right: 8, bottom: 0, left: 0 },
    },
    plugins: {
      legend: {
        display: datasets.length > 1,
        position: 'top',
        align: 'end',
        labels: {
          usePointStyle: true,
          boxWidth: 8,
          boxHeight: 8,
          padding: 14,
        },
      },
      tooltip: { mode: 'index', intersect: false },
    },
    interaction: { mode: 'index', intersect: false },
    scales: {
      x: {
        grid: { color: 'rgba(148,163,184,0.10)' },
        ticks: { color: '#64748b', maxRotation: 0, autoSkipPadding: 12 },
      },
      y: {
        grid: { color: 'rgba(148,163,184,0.10)' },
        ticks: { color: '#64748b', padding: 8 },
      },
    },
  };

  return (
    <div className={`min-w-0 ${className}`} style={{ height }}>
      <Line data={data} options={mergeOptions(defaultOptions, options)} />
    </div>
  );
};

export default AdminLineChart;
