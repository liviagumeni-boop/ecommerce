import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

const BG_COLORS = {
  products: "#ebebf9",
  orders: "#3d99f5",
  users: "#eead20",
  revenue: "#de5a5a",
};

const PIE_COLORS = [
  "#5e5cd0",
  "#3d99f5",
  "#eead20",
  "#de5a5a",
  "#22c55e",
];

const SalesChart = ({
  data,
  title = "",
  type = "products",
  chartType = "line",
}) => {
  const key = Object.keys(data?.[0] || {}).find((k) => k !== "name");

  return (
    <div
      className="chart-card"
      style={{
        background: chartType === "pie" ? "transparent" : "#ffffff", // ✔ WHITE BG
        padding: "16px",
        borderRadius: "14px",
        color: "#111",
        boxShadow: "0 6px 18px rgba(0,0,0,0.08)",
      }}
    >
      {title && <h4 style={{ marginBottom: 10 }}>{title}</h4>}

      <div style={{ width: "100%", height: 240 }}>
        <ResponsiveContainer width="100%" height="100%">

          {/* ================= LINE CHART ================= */}
          {chartType === "line" && (
            <LineChart data={data}>

              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#e5e7eb"
              />

              <XAxis dataKey="name" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />

              <Tooltip
                contentStyle={{
                  backgroundColor: "#fff",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                }}
              />

              {/* ✔ SHADOW EFFECT */}
              <defs>
                <filter id="shadow">
                  <feDropShadow dx="0" dy="3" stdDeviation="4" floodColor="#3b82f6" floodOpacity="0.4" />
                </filter>
              </defs>

              <Line
                type="monotone"
                dataKey={key}
                stroke="#3b82f6"
                strokeWidth={3}
                dot={false}
                filter="url(#shadow)"   // ✔ SHADOW ON LINE
              />

            </LineChart>
          )}

          {/* ================= PIE CHART ================= */}
          {chartType === "pie" && (
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                outerRadius={90}
              >
                {data.map((entry, index) => (
                  <Cell
                    key={index}
                    fill={PIE_COLORS[index % PIE_COLORS.length]}
                  />
                ))}
              </Pie>

              <Legend />
              <Tooltip />
            </PieChart>
          )}

        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default SalesChart;