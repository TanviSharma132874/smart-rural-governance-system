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
  const typeStats = analytics?.typeStats ?? [];
  const statusStats = analytics?.statusStats ?? [];

  if (!typeStats.length && !statusStats.length) {
    return null;
  }

  return (
    <div className="grid gap-5 xl:grid-cols-2">
      <ChartBlock title="Emergency Types">
        {typeStats.length ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={typeStats}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="value" fill="#0f766e" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-ink-800">No type analytics available.</div>
        )}
      </ChartBlock>

      <ChartBlock title="Workflow Status">
        {statusStats.length ? (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={statusStats} dataKey="value" nameKey="label" outerRadius={100} fill="#1d4ed8" label />
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-ink-800">No workflow analytics available.</div>
        )}
      </ChartBlock>
    </div>
  );
}

export default EmergencyAnalyticsPanel;
