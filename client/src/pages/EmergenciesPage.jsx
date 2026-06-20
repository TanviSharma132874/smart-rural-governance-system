import { Suspense, lazy, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "react-hot-toast";

import DataTable from "../components/common/DataTable";
import FormField from "../components/common/FormField";
import LoaderPanel from "../components/common/LoaderPanel";
import PaginationControls from "../components/common/PaginationControls";
import StatusBadge from "../components/common/StatusBadge";
import WorkflowTimeline from "../components/certificates/WorkflowTimeline";
import { useAppSelector } from "../redux/hooks";
import emergencyService from "../services/emergencyService";
import resourceService from "../services/resourceService";
import volunteerService from "../services/volunteerService";
import { connectLiveUpdates, getLiveUpdatesSocket } from "../services/liveUpdatesService";
import { EMERGENCY_SEVERITIES, EMERGENCY_TYPES, JURISDICTION_TYPES } from "../utils/constants";
import { emergencyCreateSchema } from "../utils/validationSchemas";
import { formatDate, getApiErrorMessage, getEmergencyAllowedTransitions } from "../utils/formatters";

const EmergencyAnalyticsPanel = lazy(() => import("../components/emergency/EmergencyAnalyticsPanel"));
const EmergencyMapPanel = lazy(() => import("../components/emergency/EmergencyMapPanel"));

function EmergenciesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlId = searchParams.get("id");
  const urlStatus = searchParams.get("status");
  const urlSeverity = searchParams.get("severity");
  const urlQueue = searchParams.get("queue");

  const user = useAppSelector((state) => state.auth.user);
  const isCitizen = user?.role === "citizen";
  const isOfficer = !["citizen", "volunteer"].includes(user?.role);
  const isAnalyticsRole = ["districtAdmin", "stateAdmin", "superAdmin"].includes(user?.role);
  const [records, setRecords] = useState([]);
  const [selectedEmergency, setSelectedEmergency] = useState(null);
  const [resources, setResources] = useState([]);
  const [volunteers, setVolunteers] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 0, totalEmergencies: 0 });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const statusFilter = urlStatus || "";
  const severityFilter = urlSeverity || "";
  const queueFilter = urlQueue || "";
  const [typeFilter, setTypeFilter] = useState("");

  const [search, setSearch] = useState("");
  const [officerRemarks, setOfficerRemarks] = useState("");
  const [resourceId, setResourceId] = useState("");
  const [resourceQuantity, setResourceQuantity] = useState("1");
  const [volunteerId, setVolunteerId] = useState("");
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(emergencyCreateSchema),
    defaultValues: {
      emergencyType: "Flood",
      title: "",
      description: "",
      locationAddress: "",
      landmark: "",
      latitude: "",
      longitude: "",
      severity: "High",
      peopleAffected: 1,
      contactNumber: user?.phone || "",
      jurisdictionType: user?.jurisdictionType || "Rural",
      state: user?.state || "Rajasthan",
      district: user?.district || "",
      tehsil: user?.tehsil || "",
      village: user?.village || "",
      municipality: user?.municipality || "",
    },
  });
  const jurisdictionType = useWatch({ control, name: "jurisdictionType" });

  const query = useMemo(
    () => ({
      page,
      limit: 8,
      sort: "priority",
      ...(statusFilter ? { status: statusFilter } : {}),
      ...(severityFilter ? { severity: severityFilter } : {}),
      ...(typeFilter ? { emergencyType: typeFilter } : {}),
      ...(search ? { search } : {}),
      ...(queueFilter ? { queue: queueFilter } : {}),
    }),
    [page, search, severityFilter, statusFilter, typeFilter, queueFilter]
  );

  const loadDetail = async (id) => {
    if (selectedEmergency?.id === id) return;

    try {
      const response = await emergencyService.getById(id);
      setSelectedEmergency(response.emergency);
      setOfficerRemarks(response.emergency.statusHistory?.at(-1)?.remarks || "");
    } catch (requestError) {
      toast.error(getApiErrorMessage(requestError));
    }
  };

  const updateUrlParams = (key, value) => {
    const params = new URLSearchParams(searchParams);
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    setSearchParams(params, { replace: true });
  };

  const onStatusFilterChange = (value) => {
    setPage(1);
    
    // Clear queue filter when status filter is updated
    const params = new URLSearchParams(searchParams);
    if (value) {
      params.set("status", value);
    } else {
      params.delete("status");
    }
    params.delete("queue");
    setSearchParams(params, { replace: true });
  };

  const onSeverityFilterChange = (value) => {
    setPage(1);
    updateUrlParams("severity", value);
  };

  useEffect(() => {
    const socket = connectLiveUpdates();

    const handleEmergencyCreated = ({ emergency }) => {
      if (!isCitizen) {
        toast.success(`New SOS received: ${emergency.title}`);
      }
    };

    const handleEmergencyUpdated = ({ emergency }) => {
      toast.success(`Emergency updated: ${emergency.status}`);
      if (selectedEmergency?.id === emergency.id) {
        setSelectedEmergency(emergency);
      }
    };

    socket.on("emergency:created", handleEmergencyCreated);
    socket.on("emergency:updated", handleEmergencyUpdated);
    socket.on("emergency:acknowledged", handleEmergencyUpdated);
    socket.on("emergency:resources-assigned", handleEmergencyUpdated);
    socket.on("emergency:volunteers-assigned", handleEmergencyUpdated);

    return () => {
      const activeSocket = getLiveUpdatesSocket();
      activeSocket?.off("emergency:created", handleEmergencyCreated);
      activeSocket?.off("emergency:updated", handleEmergencyUpdated);
      activeSocket?.off("emergency:acknowledged", handleEmergencyUpdated);
      activeSocket?.off("emergency:resources-assigned", handleEmergencyUpdated);
      activeSocket?.off("emergency:volunteers-assigned", handleEmergencyUpdated);
    };
  }, [isCitizen, selectedEmergency?.id, user?.department, user?.district, user?.id, user?.jurisdictionType, user?.municipality, user?.role, user?.state, user?.village]);

  useEffect(() => {
    const loadPage = async () => {
      setLoading(true);
      setError("");

      try {
        const response = isCitizen ? await emergencyService.getMyEmergencies(query) : await emergencyService.getDashboard(query);
        setRecords(response.data);
        setPagination(response.pagination || { page: 1, totalPages: 0, totalEmergencies: 0 });

        const nextId =
          urlId ||
          (selectedEmergency?.id && response.data.some((item) => item.id === selectedEmergency.id)
            ? selectedEmergency.id
            : response.data[0]?.id);

        if (nextId) {
          await loadDetail(nextId);
        } else {
          setSelectedEmergency(null);
        }

        if (isOfficer) {
          const [resourceResponse, volunteerResponse] = await Promise.all([
            resourceService.list({ page: 1, limit: 50 }),
            volunteerService.list({ page: 1, limit: 50, approvalStatus: "Approved" }),
          ]);
          setResources(resourceResponse.data);
          setVolunteers(volunteerResponse.data);
        }

        if (isAnalyticsRole) {
          setAnalytics(await emergencyService.getAnalytics());
        }
      } catch (requestError) {
        setError(getApiErrorMessage(requestError));
      } finally {
        setLoading(false);
      }
    };

    loadPage();
  }, [isAnalyticsRole, isCitizen, isOfficer, query, selectedEmergency?.id, urlId]);

  const runBusyAction = async (action) => {
    setBusy(true);

    try {
      await action();
      const response = isCitizen ? await emergencyService.getMyEmergencies(query) : await emergencyService.getDashboard(query);
      setRecords(response.data);
      setPagination(response.pagination || { page: 1, totalPages: 0, totalEmergencies: 0 });
      if (selectedEmergency?.id) {
        await loadDetail(selectedEmergency.id);
      }
    } catch (requestError) {
      toast.error(getApiErrorMessage(requestError));
    } finally {
      setBusy(false);
    }
  };

  const onSubmitEmergency = async (form) => {
    const payload = new FormData();

    Object.entries(form).forEach(([key, value]) => payload.append(key, value));
    const files = document.getElementById("emergency-images")?.files || [];
    Array.from(files).forEach((file) => payload.append("images", file));

    await runBusyAction(async () => {
      await emergencyService.createEmergency(payload);
      toast.success("SOS request submitted.");
      reset();
      setPage(1);
    });
  };

  const mapPoints = records
    .map((record) => ({
      id: record.id,
      title: record.title,
      subtitle: `${record.emergencyType} · ${record.status}`,
      latitude: record.location?.latitude,
      longitude: record.location?.longitude,
      color: record.priority === "Critical" ? "#dc2626" : "#0f766e",
    }))
    .filter((item) => item.latitude !== null && item.longitude !== null);

  const nextTransitions = getEmergencyAllowedTransitions(selectedEmergency?.status);

  return (
    <div className="space-y-5">
      <section className={`rounded-[36px] p-6 ${isCitizen ? "border border-rose-100 bg-[linear-gradient(135deg,rgba(255,255,255,0.96),rgba(255,237,237,0.94))]" : "border border-slate-700 bg-[linear-gradient(135deg,rgba(24,30,51,0.98),rgba(66,28,28,0.95))] text-white"}`}>
        <p className={`text-xs font-semibold uppercase tracking-[0.28em] ${isCitizen ? "text-rose-700" : "text-amber-200"}`}>{isCitizen ? "Citizen SOS Desk" : "Emergency Response Operations"}</p>
        <h1 className={`mt-3 font-display text-3xl md:text-4xl ${isCitizen ? "text-ink-950" : "text-white"}`}>{isCitizen ? "Raise SOS and track response" : "Coordinate incidents, resources, and field teams"}</h1>
        <p className={`mt-3 max-w-3xl text-sm leading-7 md:text-base ${isCitizen ? "text-ink-800" : "text-white/78"}`}>
          {isCitizen
            ? "Submit emergency alerts with evidence and location so the right local department can respond fast."
            : "Use a jurisdiction-bound emergency control room to acknowledge incidents, route resources, assign volunteers, and close cases transparently."}
        </p>
      </section>

      {error ? <div className="rounded-[24px] bg-alert-100 px-4 py-3 text-sm font-semibold text-alert-500">{error}</div> : null}

      {isCitizen ? (
        <section className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
          <article className="glass-panel rounded-[32px] border border-white/70 bg-white/92 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-rose-600">Raise SOS</p>
            <h2 className="mt-2 font-display text-2xl text-ink-950">Submit an emergency request</h2>
            <form className="mt-5 grid gap-4 md:grid-cols-2" onSubmit={handleSubmit(onSubmitEmergency)}>
              <FormField label="Emergency Type" name="emergencyType" as="select" registration={register("emergencyType")} error={errors.emergencyType?.message} options={EMERGENCY_TYPES.map((item) => ({ value: item, label: item }))} />
              <FormField label="Severity" name="severity" as="select" registration={register("severity")} error={errors.severity?.message} options={EMERGENCY_SEVERITIES.map((item) => ({ value: item, label: item }))} />
              <FormField label="Title" name="title" registration={register("title")} error={errors.title?.message} placeholder="Short SOS headline" className="md:col-span-2" />
              <FormField label="Description" name="description" as="textarea" registration={register("description")} error={errors.description?.message} placeholder="Explain what happened and what help is needed" className="md:col-span-2" />
              <FormField label="Location" name="locationAddress" registration={register("locationAddress")} error={errors.locationAddress?.message} placeholder="Village road, ward, landmark" className="md:col-span-2" />
              <FormField label="Landmark" name="landmark" registration={register("landmark")} error={errors.landmark?.message} placeholder="Nearby school, temple, bridge" />
              <FormField label="People Affected" name="peopleAffected" type="number" registration={register("peopleAffected", { valueAsNumber: true })} error={errors.peopleAffected?.message} />
              <FormField label="Latitude" name="latitude" registration={register("latitude")} error={errors.latitude?.message} placeholder="Optional" />
              <FormField label="Longitude" name="longitude" registration={register("longitude")} error={errors.longitude?.message} placeholder="Optional" />
              <FormField label="Contact Number" name="contactNumber" registration={register("contactNumber")} error={errors.contactNumber?.message} />
              <FormField label="Jurisdiction" name="jurisdictionType" as="select" registration={register("jurisdictionType")} error={errors.jurisdictionType?.message} options={JURISDICTION_TYPES.map((item) => ({ value: item, label: item }))} />
              <FormField label="State" name="state" registration={register("state")} error={errors.state?.message} />
              <FormField label="District" name="district" registration={register("district")} error={errors.district?.message} />
              <FormField label="Tehsil / Block" name="tehsil" registration={register("tehsil")} error={errors.tehsil?.message} />
              {jurisdictionType === "Rural" ? (
                <FormField label="Village" name="village" registration={register("village")} error={errors.village?.message} />
              ) : (
                <FormField label="Municipality" name="municipality" registration={register("municipality")} error={errors.municipality?.message} />
              )}
              <label className="block md:col-span-2">
                <span className="mb-2 block text-sm font-semibold text-ink-900">Evidence Images</span>
                <input id="emergency-images" type="file" accept="image/*" multiple className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-ink-950" />
              </label>
              <button type="submit" disabled={busy} className="md:col-span-2 rounded-full bg-rose-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-rose-500 disabled:opacity-60">
                Submit SOS
              </button>
            </form>
          </article>

          <Suspense fallback={<LoaderPanel label="Loading map layer..." />}>
            <EmergencyMapPanel points={mapPoints} title="My emergency locations" subtitle="Every SOS with coordinates appears on the operational map." />
          </Suspense>
        </section>
      ) : (
        <>
          <section className="glass-panel rounded-[32px] border border-white/70 bg-white/92 p-5">
            <div className="grid gap-4 md:grid-cols-4">
              <FormField label="Search" name="search" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Search title or location" />
              <FormField label="Status" name="statusFilter" as="select" value={statusFilter} onChange={(event) => onStatusFilterChange(event.target.value)} options={[{ value: "", label: "All statuses" }, ...["Submitted", "Acknowledged", "Assigned", "In Progress", "Resolved", "Closed"].map((item) => ({ value: item, label: item }))]} />
              <FormField label="Severity" name="severityFilter" as="select" value={severityFilter} onChange={(event) => onSeverityFilterChange(event.target.value)} options={[{ value: "", label: "All severities" }, ...EMERGENCY_SEVERITIES.map((item) => ({ value: item, label: item }))]} />
              <FormField label="Type" name="typeFilter" as="select" value={typeFilter} onChange={(event) => { setTypeFilter(event.target.value); setPage(1); }} options={[{ value: "", label: "All types" }, ...EMERGENCY_TYPES.map((item) => ({ value: item, label: item }))]} />
            </div>
          </section>

          {isAnalyticsRole ? (
            <Suspense fallback={<LoaderPanel label="Loading analytics..." />}>
              <EmergencyAnalyticsPanel analytics={analytics} />
            </Suspense>
          ) : null}
        </>
      )}

      {loading ? (
        <LoaderPanel label="Loading emergency operations..." />
      ) : (
        <div className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
          <section className="space-y-4">
            <div className="flex items-center justify-between gap-4 rounded-[24px] bg-white/70 px-4 py-3 text-sm text-ink-800">
              <p>{pagination.totalEmergencies || 0} emergency records in scope</p>
              <PaginationControls page={pagination.page || page} totalPages={pagination.totalPages || 1} onPageChange={setPage} />
            </div>
            <DataTable
              columns={[
                {
                  key: "title",
                  label: "Incident",
                  render: (row) => (
                    <button type="button" onClick={() => loadDetail(row.id)} className="text-left">
                      <p className="font-semibold text-ink-950">{row.title}</p>
                      <p className="mt-1 text-xs text-ink-800">{row.incidentNumber || row.emergencyType}</p>
                    </button>
                  ),
                },
                {
                  key: "workflow",
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
              rows={records}
              emptyMessage="No emergency records found."
            />
            <Suspense fallback={<LoaderPanel label="Loading map layer..." />}>
              <EmergencyMapPanel points={mapPoints} />
            </Suspense>
          </section>

          <section className="space-y-5">
            {selectedEmergency ? (
              <>
                <section className="glass-panel rounded-[32px] border border-white/70 bg-white/92 p-5">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.28em] text-leaf-600">{selectedEmergency.emergencyType}</p>
                      <h2 className="mt-2 font-display text-2xl text-ink-950">{selectedEmergency.title}</h2>
                      <p className="mt-2 text-sm text-ink-800">{selectedEmergency.incidentNumber}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <StatusBadge value={selectedEmergency.status} />
                      <StatusBadge type="priority" value={selectedEmergency.priority} />
                    </div>
                  </div>

                  <div className="mt-5 grid gap-3 md:grid-cols-2">
                    <div className="rounded-[24px] bg-slate-50 p-4 text-sm text-ink-800">
                      <p><span className="font-semibold text-ink-950">Department:</span> {selectedEmergency.assignedDepartment}</p>
                      <p className="mt-2"><span className="font-semibold text-ink-950">Citizen:</span> {selectedEmergency.citizen?.name}</p>
                      <p className="mt-2"><span className="font-semibold text-ink-950">Location:</span> {selectedEmergency.location?.address}</p>
                    </div>
                    <div className="rounded-[24px] bg-slate-50 p-4 text-sm text-ink-800">
                      <p><span className="font-semibold text-ink-950">Affected:</span> {selectedEmergency.peopleAffected}</p>
                      <p className="mt-2"><span className="font-semibold text-ink-950">Contact:</span> {selectedEmergency.contactNumber}</p>
                      <p className="mt-2"><span className="font-semibold text-ink-950">Jurisdiction:</span> {selectedEmergency.district} / {selectedEmergency.jurisdictionType}</p>
                    </div>
                  </div>

                  <p className="mt-5 text-sm leading-7 text-ink-900">{selectedEmergency.description}</p>

                  {isOfficer ? (
                    <div className="mt-6 space-y-4">
                      <FormField label="Control Room Remarks" name="officerRemarks" as="textarea" value={officerRemarks} onChange={(event) => setOfficerRemarks(event.target.value)} placeholder="Capture acknowledgement, deployment, and closure notes." />
                      <div className="flex flex-wrap gap-3">
                        {selectedEmergency.status === "Submitted" ? (
                          <button type="button" disabled={busy} onClick={() => runBusyAction(async () => { await emergencyService.acknowledge(selectedEmergency.id, { remarks: officerRemarks }); toast.success("Emergency acknowledged."); })} className="rounded-full bg-sky-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-sky-500 disabled:opacity-60">
                            Acknowledge
                          </button>
                        ) : null}
                        {nextTransitions.map((status) => (
                          <button key={status} type="button" disabled={busy} onClick={() => runBusyAction(async () => { await emergencyService.updateStatus(selectedEmergency.id, { status, remarks: officerRemarks }); toast.success(`Emergency moved to ${status}.`); })} className="rounded-full bg-ink-950 px-4 py-2 text-sm font-bold text-white transition hover:bg-leaf-600 disabled:opacity-60">
                            Move to {status}
                          </button>
                        ))}
                      </div>

                      <div className="grid gap-4 rounded-[24px] border border-slate-200 p-4 md:grid-cols-[1fr_130px_auto]">
                        <FormField label="Allocate Resource" name="resourceId" as="select" value={resourceId} onChange={(event) => setResourceId(event.target.value)} options={[{ value: "", label: "Select resource" }, ...resources.map((item) => ({ value: item.id, label: `${item.resourceType} (${item.availableQuantity})` }))]} />
                        <FormField label="Quantity" name="resourceQuantity" type="number" value={resourceQuantity} onChange={(event) => setResourceQuantity(event.target.value)} />
                        <button type="button" disabled={busy || !resourceId} onClick={() => runBusyAction(async () => { await emergencyService.assignResources(selectedEmergency.id, { resources: [{ resourceId, quantity: Number(resourceQuantity) }], remarks: officerRemarks }); toast.success("Resources assigned."); setResourceId(""); setResourceQuantity("1"); })} className="self-end rounded-full bg-amber-500 px-4 py-3 text-sm font-bold text-white transition hover:bg-amber-400 disabled:opacity-60">
                          Assign
                        </button>
                      </div>

                      <div className="grid gap-4 rounded-[24px] border border-slate-200 p-4 md:grid-cols-[1fr_auto]">
                        <FormField label="Assign Volunteer" name="volunteerId" as="select" value={volunteerId} onChange={(event) => setVolunteerId(event.target.value)} options={[{ value: "", label: "Select volunteer" }, ...volunteers.map((item) => ({ value: item.id, label: `${item.name} · ${item.skills.join(", ")}` }))]} />
                        <button type="button" disabled={busy || !volunteerId} onClick={() => runBusyAction(async () => { await emergencyService.assignVolunteers(selectedEmergency.id, { volunteerIds: [volunteerId], note: officerRemarks }); toast.success("Volunteer assigned."); setVolunteerId(""); })} className="self-end rounded-full bg-leaf-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-leaf-500 disabled:opacity-60">
                          Assign Volunteer
                        </button>
                      </div>
                    </div>
                  ) : null}
                </section>

                <WorkflowTimeline items={selectedEmergency.statusHistory} />
              </>
            ) : (
              <LoaderPanel label="Select an emergency record to inspect details." />
            )}
          </section>
        </div>
      )}
    </div>
  );
}

export default EmergenciesPage;
