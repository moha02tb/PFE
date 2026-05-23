import React from 'react';
import { Doughnut } from 'react-chartjs-2';
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
});

const AdminDoughnutChart = ({ labels = [], dataValues = [], backgroundColors = [], height = 220, options = {}, className = '' }) => {
  const data = {
    labels,
    datasets: [
      {
        data: dataValues,
        backgroundColor: backgroundColors,
        borderWidth: 0,
      },
    ],
  };

  const defaultOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '68%',
    layout: {
      padding: { top: 4, right: 4, bottom: 0, left: 4 },
    },
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          usePointStyle: true,
          boxWidth: 8,
          boxHeight: 8,
          padding: 14,
        },
      },
    },
  };

  return (
    <div className={`min-w-0 ${className}`} style={{ height }}>
      <Doughnut data={data} options={mergeOptions(defaultOptions, options)} />
    </div>
  );
};

export default AdminDoughnutChart;
