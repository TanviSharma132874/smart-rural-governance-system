import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import DataTable from "../components/common/DataTable";
import InfoCard from "../components/common/InfoCard";
import LoaderPanel from "../components/common/LoaderPanel";
import StatusBadge from "../components/common/StatusBadge";
import complaintService from "../services/complaintService";
import { useAppSelector } from "../redux/hooks";
import { formatDate, getApiErrorMessage, getRoleLabel } from "../utils/formatters";

function DashboardPage() {
  const user = useAppSelector((state) => state.auth.user);
  const isOfficer = ["panchayatOfficer", "districtAdmin", "superAdmin"].includes(user?.role);
  const [stats, setStats] = useState(null);
  const [recentComplaints, setRecentComplaints] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const [all, pending, progress, resolved] = await Promise.all([
          complaintService.getComplaints({ page: 1, limit: 5, sort: "latest" }),
          complaintService.getComplaints({ page: 1, limit: 1, status: "Pending" }),
          complaintService.getComplaints({ page: 1, limit: 1, status: "In Progress" }),
          complaintService.getComplaints({ page: 1, limit: 1, status: "Resolved" }),
        ]);

        setRecentComplaints(all.data);
        setStats({
          total: all.pagination?.totalComplaints || 0,
          pending: pending.pagination?.totalComplaints || 0,
          inProgress: progress.pagination?.totalComplaints || 0,
          resolved: resolved.pagination?.totalComplaints || 0,
        });
      } catch (requestError) {
        setError(getApiErrorMessage(requestError));
      }
    };

    loadDashboard();
  }, []);

  if (!stats) {
    return <LoaderPanel label="Preparing dashboard..." />;
  }

  return (
    <div className="space-y-5">
      <section className="glass-panel rounded-[34px] border border-white/70 bg-[linear-gradient(135deg,rgba(31,47,79,0.95),rgba(34,99,77,0.92))] p-6 text-white">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-amber-200">Role Based Dashboard</p>
        <div className="mt-3 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="font-display text-3xl md:text-4xl">Welcome back, {user?.name}</h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-white/82 md:text-base">
              {isOfficer
                ? "Use this control room to route complaints quickly, assign responsibility, and maintain transparent resolution timelines."
                : "Track your village issues, monitor progress, and keep every complaint backed by evidence and status visibility."}
            </p>
          </div>
          <div className="rounded-[24px] border border-white/15 bg-white/10 px-5 py-4 text-sm">
            <p className="font-bold">{getRoleLabel(user?.role)}</p>
            <p className="mt-1 text-white/70">
              {user?.village}, {user?.district}
            </p>
          </div>
        </div>
      </section>

      {error ? <div className="rounded-[28px] bg-alert-100 px-5 py-4 text-sm font-medium text-alert-500">{error}</div> : null}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <InfoCard eyebrow="Total" title="All complaints" value={stats.total} accent="bg-white/82" description="Current query scope comes directly from your authenticated role." />
        <InfoCard eyebrow="Queue" title="Pending" value={stats.pending} accent="bg-amber-50" description="Complaints waiting for assignment or a first workflow action." />
        <InfoCard eyebrow="Active" title="In Progress" value={stats.inProgress} accent="bg-sky-50" description="Issues actively being handled by officers or admins." />
        <InfoCard eyebrow="Complete" title="Resolved" value={stats.resolved} accent="bg-emerald-50" description="Cases that have reached the resolved state in the backend." />
      </section>

      <section className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
        <article className="glass-panel rounded-[32px] border border-white/70 bg-white/88 p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-leaf-600">Next Actions</p>
          <h2 className="mt-2 font-display text-2xl text-ink-950">Focused workflow entry points</h2>
          <div className="mt-5 space-y-4">
            <Link to="/complaints" className="block rounded-[24px] border border-slate-200 p-4 transition hover:border-leaf-500 hover:bg-leaf-50">
              <p className="font-display text-lg text-ink-950">{isOfficer ? "Review all complaints" : "Create or track complaints"}</p>
              <p className="mt-2 text-sm leading-6 text-ink-800">
                {isOfficer
                  ? "Move into the complaint management center for assignment, filtering, and status updates."
                  : "Raise a new issue, attach evidence, and watch progress without leaving the dashboard shell."}
              </p>
            </Link>
            <Link to="/emergencies" className="block rounded-[24px] border border-slate-200 p-4 transition hover:border-alert-500 hover:bg-rose-50">
              <p className="font-display text-lg text-ink-950">{isOfficer ? "Open emergency operations" : "Raise or track SOS requests"}</p>
              <p className="mt-2 text-sm leading-6 text-ink-800">
                {isOfficer
                  ? "Coordinate incidents, route resources, and assign volunteers through the live emergency workspace."
                  : "Submit emergency alerts with location details and monitor the official response chain."}
              </p>
            </Link>
            <div className="rounded-[24px] border border-slate-200 p-4">
              <p className="font-display text-lg text-ink-950">Current foundation status</p>
              <ul className="mt-3 space-y-2 text-sm leading-6 text-ink-800">
                <li>Authentication UI is connected to your backend JWT flow.</li>
                <li>Protected routes are role-aware and persistence-ready.</li>
                <li>Complaint, certificate, and emergency workflows consume the stabilized APIs directly.</li>
              </ul>
            </div>
          </div>
        </article>

        <article className="glass-panel rounded-[32px] border border-white/70 bg-white/88 p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-leaf-600">Recent Activity</p>
              <h2 className="mt-2 font-display text-2xl text-ink-950">Latest complaints</h2>
            </div>
            <Link to="/complaints" className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-ink-900 transition hover:border-leaf-500 hover:text-leaf-600">
              Open queue
            </Link>
          </div>

          <div className="mt-5">
            <DataTable
              columns={[
                {
                  key: "title",
                  label: "Complaint",
                  render: (row) => (
                    <div>
                      <p className="font-semibold text-ink-950">{row.title}</p>
                      <p className="mt-1 text-xs text-ink-800">{row.category}</p>
                    </div>
                  ),
                },
                {
                  key: "status",
                  label: "Workflow",
                  render: (row) => (
                    <div className="flex flex-wrap gap-2">
                      <StatusBadge value={row.status} />
                      <StatusBadge type="priority" value={row.priority} />
                    </div>
                  ),
                },
                {
                  key: "createdAt",
                  label: "Created",
                  render: (row) => formatDate(row.createdAt),
                },
              ]}
              rows={recentComplaints}
            />
          </div>
        </article>
      </section>
    </div>
  );
}

export default DashboardPage;
