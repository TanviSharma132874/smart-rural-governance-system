import { Bar, BarChart, CartesianGrid, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

function ChartBlock({ title, children }) {
  return (
    <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="font-display text-xl text-ink-950">{title}</h3>
      <div className="mt-5 h-72">{children}</div>
    </section>
  );
}

function EmergencyAnalyticsPanel({ analytics }) {
  if (!analytics) {
    return null;
  }

  return (
    <div className="grid gap-5 xl:grid-cols-2">
      <ChartBlock title="Emergency Types">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={analytics.typeStats}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="label" tick={{ fontSize: 12 }} />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="value" fill="#0f766e" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartBlock>

      <ChartBlock title="Workflow Status">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={analytics.statusStats} dataKey="value" nameKey="label" outerRadius={100} fill="#1d4ed8" label />
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </ChartBlock>
    </div>
  );
}

export default EmergencyAnalyticsPanel;
