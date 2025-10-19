import React from "react";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import ChartDataLabels from "chartjs-plugin-datalabels";

// Register all plugins only once
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ChartDataLabels);

export default function AnalyticsChart({ chartData, labels, activeTab }: any) {
  // If activeTab is 'weekly', use day names for x-axis labels
  let displayLabels = labels;
  if (activeTab === 'weekly' && labels.length === 7) {
    // Convert date strings to day names (Mon, Tue, ...)
    displayLabels = labels.map((dateStr: string) => {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', { weekday: 'short' });
    });
  }
  const data = {
    labels: displayLabels,
    datasets: [
      {
        label: "Amount Received",
        data: chartData.income,
        backgroundColor: "#22c55e", // Green for received amounts
        borderRadius: 10,
        borderSkipped: false,
        barPercentage: 0.5,
        categoryPercentage: 0.7,
        datalabels: {
          display: false,
        },
      },
      {
        label: "Amount Lent",
        data: chartData.outcome,
        backgroundColor: "#ef4444", // Red for lent amounts
        borderRadius: 10,
        borderSkipped: false,
        barPercentage: 0.5,
        categoryPercentage: 0.7,
        datalabels: {
          display: false,
        },
      },
    ],
  };
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top" as const,
        align: "end" as const, // Move legend to top right
        labels: {
          color: "#334155",
          font: { size: 12, weight: "bold" as const }, // Smaller font size
          usePointStyle: true,
          padding: 31, // Add spacing below the labels
        },
      },
      title: { display: false },
      tooltip: {
        backgroundColor: "#fff",
        titleColor: "#0f172a",
        bodyColor: "#334155",
        borderColor: "#e5e7eb",
        borderWidth: 1,
        padding: 16,
        caretSize: 8,
        cornerRadius: 8,
        callbacks: {
          label: (ctx: any) => `रु ${ctx.parsed.y}`,
        },
      },
      datalabels: {
        display: false,
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: {
          color: "#64748b",
          font: { size: 16 },
          autoSkip: true,
          maxTicksLimit: 6,
          callback: function(value: any, index: number, values: any) {
            return labels[index];
          },
        },
      },
      y: {
        beginAtZero: true,
        grid: { color: "#e5e7eb" },
        ticks: { color: "#64748b", font: { size: 16 } },
      },
    },
    borderRadius: 10,
    animation: {
      duration: 900,
      easing: "easeOutQuart",
    } as const,
  };
  return (
    <div className="w-full" style={{ height: "420px", minHeight: 340 }}>
      <Bar data={data} options={options} className="w-full h-full" />
    </div>
  );
}
