import { useCallback, useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "react-hot-toast";

import AnnouncementCard from "../components/emergency/AnnouncementCard";
import EmptyState from "../components/common/EmptyState";
import FormField from "../components/common/FormField";
import LoaderPanel from "../components/common/LoaderPanel";
import PaginationControls from "../components/common/PaginationControls";
import { useAppSelector } from "../redux/hooks";
import announcementService from "../services/announcementService";
import { ANNOUNCEMENT_AUDIENCES, ANNOUNCEMENT_STATUSES, ANNOUNCEMENT_TYPES, EMERGENCY_DEPARTMENTS, JURISDICTION_TYPES } from "../utils/constants";
import { getApiErrorMessage } from "../utils/formatters";
import { announcementSchema } from "../utils/validationSchemas";

function AnnouncementsPage() {
  const user = useAppSelector((state) => state.auth.user);
  const canCreate = !["citizen", "volunteer"].includes(user?.role);
  const [records, setRecords] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 0, totalAnnouncements: 0 });
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(announcementSchema),
    defaultValues: {
      title: "",
      announcementType: "Flood Warning",
      message: "",
      department: user?.department || EMERGENCY_DEPARTMENTS[0],
      targetAudience: "All",
      jurisdictionType: user?.jurisdictionType || "Rural",
      state: user?.state || "Rajasthan",
      district: user?.district || "",
      tehsil: user?.tehsil || "",
      village: user?.village || "",
      municipality: user?.municipality || "",
    },
  });
  const jurisdictionType = useWatch({ control, name: "jurisdictionType" });

  const loadAnnouncements = useCallback(async () => {
    setLoading(true);

    try {
      const response = await announcementService.list({ page, limit: 8, ...(statusFilter ? { status: statusFilter } : {}) });
      setRecords(response.data);
      setPagination(response.pagination || { page: 1, totalPages: 0, totalAnnouncements: 0 });
    } catch (requestError) {
      toast.error(getApiErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadAnnouncements();
    }, 0);

    return () => clearTimeout(timer);
  }, [loadAnnouncements]);

  const onSubmit = async (form) => {
    setBusy(true);

    try {
      await announcementService.create(form);
      toast.success("Announcement drafted.");
      reset();
      setPage(1);
      await loadAnnouncements();
    } catch (requestError) {
      toast.error(getApiErrorMessage(requestError));
    } finally {
      setBusy(false);
    }
  };

  if (!loading && !records.length && !canCreate) {
    return <EmptyState title="No public alerts yet" description="Published alerts will appear here for citizens and volunteers." />;
  }

  return (
    <div className="space-y-5">
      <section className={`rounded-[34px] p-6 ${canCreate ? "border border-slate-700 bg-[linear-gradient(135deg,rgba(24,30,51,0.98),rgba(49,62,85,0.96))] text-white" : "border border-sky-100 bg-[linear-gradient(135deg,rgba(255,255,255,0.96),rgba(232,244,255,0.94))]"}`}>
        <p className={`text-xs font-semibold uppercase tracking-[0.28em] ${canCreate ? "text-amber-200" : "text-sky-700"}`}>{canCreate ? "Announcement Management" : "Citizen Alerts"}</p>
        <h1 className={`mt-3 font-display text-3xl md:text-4xl ${canCreate ? "text-white" : "text-ink-950"}`}>{canCreate ? "Publish area-specific advisories" : "Follow official emergency announcements"}</h1>
      </section>

      {canCreate ? (
        <section className="grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
          <form className="glass-panel rounded-[32px] border border-white/70 bg-white/92 p-5" onSubmit={handleSubmit(onSubmit)}>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-leaf-600">Draft Alert</p>
            <h2 className="mt-2 font-display text-2xl text-ink-950">Create an announcement</h2>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <FormField label="Title" name="title" registration={register("title")} error={errors.title?.message} className="md:col-span-2" />
              <FormField label="Type" name="announcementType" as="select" registration={register("announcementType")} error={errors.announcementType?.message} options={ANNOUNCEMENT_TYPES.map((item) => ({ value: item, label: item }))} />
              <FormField label="Department" name="department" as="select" registration={register("department")} error={errors.department?.message} options={EMERGENCY_DEPARTMENTS.map((item) => ({ value: item, label: item }))} />
              <FormField label="Audience" name="targetAudience" as="select" registration={register("targetAudience")} error={errors.targetAudience?.message} options={ANNOUNCEMENT_AUDIENCES.map((item) => ({ value: item, label: item }))} />
              <FormField label="Jurisdiction" name="jurisdictionType" as="select" registration={register("jurisdictionType")} error={errors.jurisdictionType?.message} options={JURISDICTION_TYPES.map((item) => ({ value: item, label: item }))} />
              <FormField label="State" name="state" registration={register("state")} error={errors.state?.message} />
              <FormField label="District" name="district" registration={register("district")} error={errors.district?.message} />
              <FormField label="Tehsil / Block" name="tehsil" registration={register("tehsil")} error={errors.tehsil?.message} />
              {jurisdictionType === "Rural" ? (
                <FormField label="Village" name="village" registration={register("village")} error={errors.village?.message} />
              ) : (
                <FormField label="Municipality" name="municipality" registration={register("municipality")} error={errors.municipality?.message} />
              )}
              <FormField label="Message" name="message" as="textarea" registration={register("message")} error={errors.message?.message} className="md:col-span-2" />
            </div>
            <button type="submit" disabled={busy} className="mt-5 rounded-full bg-ink-950 px-5 py-3 text-sm font-bold text-white transition hover:bg-leaf-600 disabled:opacity-60">
              Save Draft
            </button>
          </form>

          <div className="space-y-4">
            <section className="glass-panel rounded-[32px] border border-white/70 bg-white/92 p-5">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm text-ink-800">{pagination.totalAnnouncements || 0} announcements</p>
                <PaginationControls page={pagination.page || page} totalPages={pagination.totalPages || 1} onPageChange={setPage} />
              </div>
              <div className="mt-4">
                <FormField label="Status Filter" name="statusFilter" as="select" value={statusFilter} onChange={(event) => { setStatusFilter(event.target.value); setPage(1); }} options={[{ value: "", label: "All statuses" }, ...ANNOUNCEMENT_STATUSES.map((item) => ({ value: item, label: item }))]} />
              </div>
            </section>
            {loading ? <LoaderPanel label="Loading announcements..." /> : records.map((announcement) => <AnnouncementCard key={announcement.id} announcement={announcement} canPublish={canCreate} onPublish={async (id) => { try { await announcementService.publish(id, { status: "Published" }); toast.success("Announcement published."); await loadAnnouncements(); } catch (requestError) { toast.error(getApiErrorMessage(requestError)); } }} />)}
          </div>
        </section>
      ) : loading ? (
        <LoaderPanel label="Loading public alerts..." />
      ) : (
        <div className="grid gap-4">
          {records.map((announcement) => <AnnouncementCard key={announcement.id} announcement={announcement} />)}
        </div>
      )}
    </div>
  );
}

export default AnnouncementsPage;
