import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import EmptyState from "../components/common/EmptyState";
import InfoCard from "../components/common/InfoCard";
import LoaderPanel from "../components/common/LoaderPanel";
import complaintService from "../services/complaintService";
import { useAppSelector } from "../redux/hooks";
import { formatDate, getApiErrorMessage, getRoleLabel } from "../utils/formatters";

const adminRoles = ["districtAdmin", "stateAdmin", "superAdmin"];
const officerRoles = ["panchayatOfficer", "departmentOfficer", "districtAdmin", "stateAdmin", "superAdmin"];
const chartColors = ["#22634d", "#f59e0b", "#0ea5e9", "#dc2626", "#7c3aed", "#475569"];

const getMetric = (source, key) => source?.[key] ?? 0;

function MetricGrid({ cards }) {
  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <InfoCard key={`${card.title}-${card.eyebrow}`} {...card} />
      ))}
    </section>
  );
}

function SectionPanel({ eyebrow, title, children, action }) {
  return (
    <article className="glass-panel rounded-[32px] border border-white/70 bg-white/88 p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-leaf-600">{eyebrow}</p>
          <h2 className="mt-2 font-display text-2xl text-ink-950">{title}</h2>
        </div>
        {action}
      </div>
      <div className="mt-5">{children}</div>
    </article>
  );
}

function MiniStatList({ items, emptyMessage = "No analytics available yet." }) {
  if (!items.length) {
    return <EmptyState title="Nothing to show" description={emptyMessage} />;
  }

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item.label} className="flex items-center justify-between gap-4 rounded-[22px] border border-slate-200 bg-white/75 px-4 py-3">
          <span className="text-sm font-semibold text-ink-900">{item.label}</span>
          <span className="rounded-full bg-leaf-50 px-3 py-1 text-sm font-black text-leaf-700">{item.value}</span>
        </div>
      ))}
    </div>
  );
}

function BarAnalytics({ data, emptyMessage }) {
  if (!data?.length) {
    return <EmptyState title="No chart data" description={emptyMessage} />;
  }

  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, bottom: 24, left: -20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="label" tick={{ fontSize: 11 }} interval={0} angle={-18} textAnchor="end" height={60} />
          <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
          <Tooltip />
          <Bar dataKey="value" radius={[8, 8, 0, 0]}>
            {data.map((entry, index) => (
              <Cell key={entry.label} fill={chartColors[index % chartColors.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function PieAnalytics({ data, emptyMessage }) {
  if (!data?.length) {
    return <EmptyState title="No chart data" description={emptyMessage} />;
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="label" innerRadius={55} outerRadius={92} paddingAngle={3}>
              {data.map((entry, index) => (
                <Cell key={entry.label} fill={chartColors[index % chartColors.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <MiniStatList items={data} emptyMessage={emptyMessage} />
    </div>
  );
}

function RecentAnnouncements({ announcements }) {
  if (!announcements.length) {
    return <EmptyState title="No announcements" description="Published notices for your area will appear here." />;
  }

  return (
    <div className="space-y-4">
      {announcements.map((announcement) => (
        <div key={announcement.id} className="rounded-[24px] border border-slate-200 bg-white/75 p-4">
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-leaf-700">
            <span>{announcement.announcementType}</span>
            <span className="text-ink-800/50">.</span>
            <span>{announcement.department}</span>
          </div>
          <h3 className="mt-2 font-display text-lg text-ink-950">{announcement.title}</h3>
          <p className="mt-2 line-clamp-2 text-sm leading-6 text-ink-800">{announcement.message}</p>
          <p className="mt-3 text-xs font-semibold text-ink-800/75">{formatDate(announcement.publishedAt || announcement.createdAt)}</p>
        </div>
      ))}
    </div>
  );
}

function CitizenDashboard({ analytics }) {
  const complaints = analytics?.complaintStatistics || {};
  const certificates = analytics?.certificateStatistics || {};
  const emergencies = analytics?.emergencyStatistics || {};

  return (
    <>
      <MetricGrid
        cards={[
          { eyebrow: "Complaints", title: "Total Complaints", value: getMetric(complaints, "total"), accent: "bg-white/82", description: "All complaints submitted from your account.", to: "/complaints" },
          { eyebrow: "Complaints", title: "Pending Complaints", value: getMetric(complaints, "pending"), accent: "bg-amber-50", description: "Complaints waiting for first action.", to: "/complaints?status=Pending" },
          { eyebrow: "Complaints", title: "In Progress", value: getMetric(complaints, "inProgress"), accent: "bg-sky-50", description: "Complaints currently being handled.", to: "/complaints?status=In Progress" },
          { eyebrow: "Complaints", title: "Resolved Complaints", value: getMetric(complaints, "resolved"), accent: "bg-emerald-50", description: "Complaints closed as resolved.", to: "/complaints?status=Resolved" },
          { eyebrow: "Certificates", title: "Total Applications", value: getMetric(certificates, "total"), accent: "bg-white/82", description: "All certificate applications submitted by you.", to: "/certificates" },
          { eyebrow: "Certificates", title: "Pending Applications", value: getMetric(certificates, "pending"), accent: "bg-amber-50", description: "Submitted or under-review applications.", to: "/certificates?status=Submitted" },
          { eyebrow: "Certificates", title: "Approved Applications", value: getMetric(certificates, "approved"), accent: "bg-emerald-50", description: "Applications approved and ready for records.", to: "/certificates?status=Approved" },
          { eyebrow: "Certificates", title: "Rejected Applications", value: getMetric(certificates, "rejected"), accent: "bg-rose-50", description: "Applications that need correction or follow-up.", to: "/certificates?status=Rejected" },
          { eyebrow: "SOS", title: "Total SOS Requests", value: getMetric(emergencies, "total"), accent: "bg-white/82", description: "All emergency requests submitted by you.", to: "/emergencies" },
          { eyebrow: "SOS", title: "Active Requests", value: getMetric(emergencies, "active"), accent: "bg-red-50", description: "SOS requests that are not resolved or closed.", to: "/emergencies?queue=active" },
        ]}
      />
      <SectionPanel eyebrow="Announcements" title="Recent announcements">
        <RecentAnnouncements announcements={analytics?.recentAnnouncements || []} />
      </SectionPanel>
    </>
  );
}

function OfficerDashboard({ analytics }) {
  const complaints = analytics?.complaintQueue || {};
  const certificates = analytics?.certificateQueue || {};
  const emergencies = analytics?.emergencyOverview || {};
  const volunteers = analytics?.volunteerOverview || {};

  return (
    <>
      <MetricGrid
        cards={[
          { eyebrow: "Complaint Queue", title: "Assigned Complaints", value: getMetric(complaints, "assignedComplaints"), accent: "bg-white/82", description: "Complaints assigned directly to you.", to: "/complaints?queue=my" },
          { eyebrow: "Complaint Queue", title: "Department Queue", value: getMetric(complaints, "departmentQueue"), accent: "bg-sky-50", description: "Role-scoped complaints for your department or jurisdiction.", to: "/complaints?queue=all" },
          { eyebrow: "Complaint Queue", title: "Escalated Complaints", value: getMetric(complaints, "escalatedComplaints"), accent: "bg-rose-50", description: "Complaints requiring senior oversight.", to: "/complaints?status=Escalated" },
          { eyebrow: "Certificate Queue", title: "Pending Reviews", value: getMetric(certificates, "pendingReviews"), accent: "bg-amber-50", description: "Submitted or under-review certificate applications.", to: "/certificates?status=Submitted" },
          { eyebrow: "Certificate Queue", title: "Approved Today", value: getMetric(certificates, "approvedToday"), accent: "bg-emerald-50", description: "Applications approved since the start of today.", to: "/certificates?status=Approved" },
          { eyebrow: "Emergency", title: "Active Emergencies", value: getMetric(emergencies, "activeEmergencies"), accent: "bg-red-50", description: "SOS cases still moving through response workflow.", to: "/emergencies?queue=active" },
          { eyebrow: "Resources", title: "Resource Usage", value: getMetric(emergencies, "resourceUsage"), accent: "bg-cyan-50", description: "Allocated inventory units in your operational scope." },
          { eyebrow: "Volunteers", title: "Available Volunteers", value: getMetric(volunteers, "availableVolunteers"), accent: "bg-emerald-50", description: "Approved volunteers currently available." },
          { eyebrow: "Volunteers", title: "Assigned Volunteers", value: getMetric(volunteers, "assignedVolunteers"), accent: "bg-indigo-50", description: "Volunteers already assigned to emergency support." },
        ]}
      />
      <section className="grid gap-5 xl:grid-cols-2">
        <SectionPanel eyebrow="Operations" title="Queue priorities">
          <MiniStatList
            items={[
              { label: "Assigned complaints", value: getMetric(complaints, "assignedComplaints") },
              { label: "Department queue", value: getMetric(complaints, "departmentQueue") },
              { label: "Escalated complaints", value: getMetric(complaints, "escalatedComplaints") },
            ]}
          />
        </SectionPanel>
        <SectionPanel eyebrow="Emergency" title="Resource and volunteer overview">
          <MiniStatList
            items={[
              { label: "Active emergencies", value: getMetric(emergencies, "activeEmergencies") },
              { label: "Allocated resources", value: getMetric(emergencies, "resourceUsage") },
              { label: "Available volunteers", value: getMetric(volunteers, "availableVolunteers") },
              { label: "Assigned volunteers", value: getMetric(volunteers, "assignedVolunteers") },
            ]}
          />
        </SectionPanel>
      </section>
    </>
  );
}

function AdminDashboard({ analytics }) {
  const platform = analytics?.platformStatistics || {};
  const emergencies = analytics?.emergencyAnalytics || {};
  const resources = analytics?.resourceAnalytics || {};
  const volunteers = analytics?.volunteerAnalytics || {};

  return (
    <>
      <MetricGrid
        cards={[
          { eyebrow: "Platform", title: "Total Users", value: getMetric(platform, "totalUsers"), accent: "bg-white/82", description: "Users inside your administrative scope." },
          { eyebrow: "Platform", title: "Citizens", value: getMetric(platform, "citizens"), accent: "bg-emerald-50", description: "Registered citizen accounts." },
          { eyebrow: "Platform", title: "Officers", value: getMetric(platform, "officers"), accent: "bg-sky-50", description: "Officer and administrator accounts." },
          { eyebrow: "Emergency", title: "Active Cases", value: getMetric(emergencies, "activeCases"), accent: "bg-red-50", description: "Open SOS cases across the jurisdiction.", to: "/emergencies?queue=active" },
          { eyebrow: "Emergency", title: "Resolved Cases", value: getMetric(emergencies, "resolvedCases"), accent: "bg-emerald-50", description: "Resolved or closed emergency cases.", to: "/emergencies?status=Resolved" },
          { eyebrow: "Resources", title: "Available Resources", value: getMetric(resources, "availableResources"), accent: "bg-cyan-50", description: "Available resource inventory units." },
          { eyebrow: "Resources", title: "Allocated Resources", value: getMetric(resources, "allocatedResources"), accent: "bg-amber-50", description: "Inventory units allocated to response work." },
          { eyebrow: "Volunteers", title: "Registered Volunteers", value: getMetric(volunteers, "registeredVolunteers"), accent: "bg-white/82", description: "Volunteer profiles in your scope." },
          { eyebrow: "Volunteers", title: "Active Volunteers", value: getMetric(volunteers, "activeVolunteers"), accent: "bg-indigo-50", description: "Available or assigned volunteers." },
        ]}
      />
      <section className="grid gap-5 xl:grid-cols-2">
        <SectionPanel eyebrow="Complaint Analytics" title="By department">
          <BarAnalytics data={analytics?.complaintAnalytics?.byDepartment || []} emptyMessage="Complaint department trends will appear after complaints are filed." />
        </SectionPanel>
        <SectionPanel eyebrow="Complaint Analytics" title="By status and jurisdiction">
          <PieAnalytics data={analytics?.complaintAnalytics?.byStatus || []} emptyMessage="Complaint status trends will appear after complaints are filed." />
          <div className="mt-5">
            <MiniStatList items={analytics?.complaintAnalytics?.byJurisdiction || []} emptyMessage="Jurisdiction insights will appear after complaints are filed." />
          </div>
        </SectionPanel>
        <SectionPanel eyebrow="Certificate Analytics" title="By type">
          <BarAnalytics data={analytics?.certificateAnalytics?.byType || []} emptyMessage="Certificate type trends will appear after applications are submitted." />
        </SectionPanel>
        <SectionPanel eyebrow="Certificate Analytics" title="By status">
          <PieAnalytics data={analytics?.certificateAnalytics?.byStatus || []} emptyMessage="Certificate status trends will appear after applications are submitted." />
        </SectionPanel>
      </section>
    </>
  );
}

function DashboardPage() {
  const user = useAppSelector((state) => state.auth.user);
  const isOfficer = officerRoles.includes(user?.role);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const dashboardType = useMemo(() => {
    if (user?.role === "citizen") {
      return "citizen";
    }

    if (adminRoles.includes(user?.role)) {
      return "admin";
    }

    return "officer";
  }, [user?.role]);

  useEffect(() => {
    const loadDashboard = async () => {
      if (!user?.role) {
        return;
      }

      try {
        setLoading(true);
        setError("");
        const response = await complaintService.getDashboardAnalytics();
        setAnalytics(response);
      } catch (requestError) {
        setError(getApiErrorMessage(requestError));
        setAnalytics(null);
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, [user?.role]);

  const retry = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await complaintService.getDashboardAnalytics();
      setAnalytics(response);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoaderPanel label="Preparing dashboard analytics..." />;
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
                ? "Use this control room to review queues, spot department pressure, and keep emergency response visible."
                : "Track complaints, certificates, SOS requests, and official announcements from one place."}
            </p>
          </div>
          <div className="rounded-[24px] border border-white/15 bg-white/10 px-5 py-4 text-sm">
            <p className="font-bold">{getRoleLabel(user?.role)}</p>
            <p className="mt-1 text-white/70">
              {user?.village || user?.municipality || user?.tehsil || "Jurisdiction"}, {user?.district}
            </p>
          </div>
        </div>
      </section>

      {error ? (
        <EmptyState
          title="Dashboard unavailable"
          description={error}
          action={
            <button type="button" onClick={retry} className="rounded-full bg-ink-950 px-5 py-2 text-sm font-bold text-white transition hover:bg-leaf-600">
              Retry analytics
            </button>
          }
        />
      ) : null}

      {!error && dashboardType === "citizen" ? <CitizenDashboard analytics={analytics} /> : null}
      {!error && dashboardType === "officer" ? <OfficerDashboard analytics={analytics} /> : null}
      {!error && dashboardType === "admin" ? <AdminDashboard analytics={analytics} /> : null}

      <SectionPanel
        eyebrow="Next Actions"
        title="Focused workflow entry points"
        action={
          <Link to="/complaints" className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-ink-900 transition hover:border-leaf-500 hover:text-leaf-600">
            Open complaints
          </Link>
        }
      >
        <div className="grid gap-4 md:grid-cols-3">
          <Link to="/complaints" className="block rounded-[24px] border border-slate-200 p-4 transition hover:border-leaf-500 hover:bg-leaf-50">
            <p className="font-display text-lg text-ink-950">{isOfficer ? "Review complaint queues" : "Create or track complaints"}</p>
            <p className="mt-2 text-sm leading-6 text-ink-800">Move into complaint workflows with the same role scope as this dashboard.</p>
          </Link>
          <Link to="/certificates" className="block rounded-[24px] border border-slate-200 p-4 transition hover:border-sky-500 hover:bg-sky-50">
            <p className="font-display text-lg text-ink-950">{isOfficer ? "Review certificates" : "Track applications"}</p>
            <p className="mt-2 text-sm leading-6 text-ink-800">Open certificate applications and review status history.</p>
          </Link>
          <Link to="/emergencies" className="block rounded-[24px] border border-slate-200 p-4 transition hover:border-alert-500 hover:bg-rose-50">
            <p className="font-display text-lg text-ink-950">{isOfficer ? "Open emergency operations" : "Raise or track SOS requests"}</p>
            <p className="mt-2 text-sm leading-6 text-ink-800">Monitor emergency response, resources, and volunteer support.</p>
          </Link>
        </div>
      </SectionPanel>
    </div>
  );
}

export default DashboardPage;
