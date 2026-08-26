"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

const attendance = [
  { month: "Jan", attendance: 91 },
  { month: "Feb", attendance: 93 },
  { month: "Mar", attendance: 90 },
  { month: "Apr", attendance: 94 },
  { month: "May", attendance: 92 }
];

const fees = [
  { month: "Jan", collected: 72, outstanding: 18 },
  { month: "Feb", collected: 81, outstanding: 12 },
  { month: "Mar", collected: 76, outstanding: 16 },
  { month: "Apr", collected: 88, outstanding: 10 },
  { month: "May", collected: 84, outstanding: 11 }
];

export function DashboardCharts() {
  return (
    <div className="grid" style={{ gridTemplateColumns: "1fr 1fr" }}>
      <div style={{ minHeight: 260 }}>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={attendance}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="attendance" stroke="#116149" strokeWidth={3} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div style={{ minHeight: 260 }}>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={fees}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="collected" fill="#116149" />
            <Bar dataKey="outstanding" fill="#d28c2d" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
