'use client';
import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';
import { Line, Doughnut } from 'react-chartjs-2';
import { motion } from 'framer-motion';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

interface AnalyticsChartsProps {
  stats: any; // Using any for simplicity here, can be typed properly
}

export default function AnalyticsCharts({ stats }: AnalyticsChartsProps) {
  // Biểu đồ đường (Line Chart): Doanh thu 7 ngày gần nhất (Giả lập data từ stats)
  const lineData = {
    labels: ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'],
    datasets: [
      {
        label: 'Doanh thu (VND)',
        data: stats?.sparklines?.revenue || [1200000, 1900000, 3000000, 5000000, 2000000, 3000000, 7000000],
        borderColor: '#10b981', // emerald-500
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        tension: 0.4,
        fill: true,
      },
    ],
  };

  const lineOptions = {
    responsive: true,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
        }
      },
      x: {
        grid: {
          display: false,
        }
      }
    }
  };

  // Biểu đồ tròn (Doughnut Chart): Tỷ lệ các trạng thái đơn hàng (Dựa trên stats.recentOrders)
  // Nếu stats.recentOrders ít quá thì giả lập 1 chút cho đẹp
  let pending = 0, processing = 0, shipped = 0, delivered = 0, cancelled = 0;
  if (stats?.recentOrders && stats.recentOrders.length > 0) {
      stats.recentOrders.forEach((o: any) => {
          if (o.status === 'pending') pending++;
          else if (o.status === 'processing') processing++;
          else if (o.status === 'shipped') shipped++;
          else if (o.status === 'delivered') delivered++;
          else if (o.status === 'cancelled' || o.status === 'refunded') cancelled++;
      });
  } else {
      pending = 12; processing = 19; shipped = 3; delivered = 5; cancelled = 2;
  }

  const doughnutData = {
    labels: ['Chờ duyệt', 'Đang xử lý', 'Đang giao', 'Đã giao', 'Đã huỷ'],
    datasets: [
      {
        data: [pending, processing, shipped, delivered, cancelled],
        backgroundColor: [
          '#f59e0b', // amber-500
          '#3b82f6', // blue-500
          '#8b5cf6', // violet-500
          '#10b981', // emerald-500
          '#ef4444', // red-500
        ],
        borderWidth: 0,
      },
    ],
  };

  const doughnutOptions = {
    responsive: true,
    cutout: '70%',
    plugins: {
      legend: {
        position: 'right' as const,
        labels: {
            usePointStyle: true,
            padding: 20,
            font: { size: 11, family: 'Inter' }
        }
      }
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-5 mb-4 md:gap-5">
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="adm-card p-5 lg:col-span-2"
        >
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold" style={{ color: 'var(--adm-text)' }}>
                    Biểu đồ Doanh thu (7 ngày)
                </h3>
            </div>
            <div className="h-[250px] w-full flex justify-center items-center">
                <Line data={lineData} options={lineOptions} />
            </div>
        </motion.div>

        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="adm-card p-5 lg:col-span-1"
        >
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold" style={{ color: 'var(--adm-text)' }}>
                    Trạng thái Đơn hàng
                </h3>
            </div>
            <div className="h-[250px] w-full flex justify-center items-center">
                <Doughnut data={doughnutData} options={doughnutOptions} />
            </div>
        </motion.div>
    </div>
  );
}
