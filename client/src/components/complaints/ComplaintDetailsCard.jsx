import { useMemo, useState } from "react";

import { getAllowedTransitions, getPriorityLabel, getRelativeTime } from "../../utils/formatters";
import BaseModal from "../common/BaseModal";
import FormField from "../common/FormField";
import StatusBadge from "../common/StatusBadge";

function ComplaintDetailsCard({
  complaint,
  currentUser,
  canManage,
  isBusy,
  onStatusUpdate,
  onAssignToSelf,
  onAssignToOfficer,
}) {
  const [nextStatus, setNextStatus] = useState("");
  const [nextPriority, setNextPriority] = useState("");
  const [officerRemarks, setOfficerRemarks] = useState("");
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [resolutionFiles, setResolutionFiles] = useState([]);
  const [assignedOfficer, setAssignedOfficer] = useState("");
  const [showHistory, setShowHistory] = useState(false);
  const transitions = useMemo(() => getAllowedTransitions(complaint?.status), [complaint?.status]);

  if (!complaint) {
    return (
      <div className="glass-panel rounded-[32px] border border-white/70 bg-white/80 p-6 text-center text-sm text-ink-800">
        Select a complaint to review the full record, images, and workflow actions.
      </div>
    );
  }

  const handleStatusSubmit = (event) => {
    event.preventDefault();
    if (!nextStatus) {
      return;
    }

    const payload = new FormData();
    payload.append("status", nextStatus);
    payload.append("priority", nextPriority || complaint.priority);
    if (officerRemarks) {
      payload.append("officerRemarks", officerRemarks);
    }
    if (resolutionNotes) {
      payload.append("resolutionNotes", resolutionNotes);
    }
    resolutionFiles.forEach((file) => payload.append("resolutionImages", file));

    onStatusUpdate(complaint.id, payload);
  };

  const handleAssignSubmit = (event) => {
    event.preventDefault();
    if (!assignedOfficer) {
      return;
    }

    onAssignToOfficer(complaint.id, assignedOfficer);
    setAssignedOfficer("");
  };

  const assetBaseUrl = (import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1").replace("/api/v1", "").replace("/api", "");

  return (
    <section className="glass-panel rounded-[32px] border border-white/70 bg-white/90 p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-leaf-600">Complaint Detail</p>
          <h2 className="mt-2 font-display text-2xl text-ink-950">{complaint.title}</h2>
          <p className="mt-2 text-sm leading-6 text-ink-800">{complaint.description}</p>
          {complaint.citizenRemarks ? <p className="mt-2 text-sm leading-6 text-amber-900">Citizen remarks: {complaint.citizenRemarks}</p> : null}
        </div>
        <div className="text-right text-sm text-ink-800">
          <p>{getRelativeTime(complaint.createdAt)}</p>
          <p className="mt-1 font-medium">Category: {complaint.category}</p>
          <p className="mt-1 font-medium">Subcategory: {complaint.subcategory || "-"}</p>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <StatusBadge value={complaint.status} />
        <StatusBadge type="priority" value={complaint.priority} />
        {complaint.isEscalated ? <span className="rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold text-rose-900">Escalated for oversight</span> : null}
        <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-900">
          {getPriorityLabel(complaint.priority)} priority workflow
        </span>
        <button
          type="button"
          onClick={() => setShowHistory(true)}
          className="rounded-full border border-slate-200 px-3 py-1 text-xs font-bold text-ink-900 transition hover:border-leaf-500 hover:text-leaf-600"
        >
          View audit trail
        </button>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className="rounded-[26px] bg-slate-50 p-4">
          <h3 className="font-display text-lg text-ink-950">Ownership</h3>
          <div className="mt-3 space-y-3 text-sm text-ink-800">
            <p>
              <span className="font-semibold text-ink-950">Citizen:</span>{" "}
              {complaint.citizenId?.name || "Unknown"} ({complaint.citizenId?.village || "No village"})
            </p>
            <p>
              <span className="font-semibold text-ink-950">Assigned Officer:</span>{" "}
              {complaint.assignedOfficer?.name || "Unassigned"}
            </p>
            <p>
              <span className="font-semibold text-ink-950">Responsible Department:</span>{" "}
              {complaint.responsibleDepartment || "-"}
            </p>
            <p>
              <span className="font-semibold text-ink-950">Ward Number:</span>{" "}
              {complaint.wardNumber || "-"}
            </p>
            <p>
              <span className="font-semibold text-ink-950">Location:</span>{" "}
              {complaint.location?.address || "Not provided"}
            </p>
          </div>
        </div>

        <div className="rounded-[26px] bg-slate-50 p-4">
          <h3 className="font-display text-lg text-ink-950">Evidence</h3>
          {complaint.images?.length ? (
            <div className="mt-3 grid grid-cols-2 gap-3">
              {complaint.images.map((image) => (
                <a
                  key={image}
                  href={`${assetBaseUrl}${image}`}
                  target="_blank"
                  rel="noreferrer"
                  className="overflow-hidden rounded-2xl border border-slate-200"
                >
                  <img src={`${assetBaseUrl}${image}`} alt={complaint.title} className="h-28 w-full object-cover" />
                </a>
              ))}
            </div>
          ) : (
            <p className="mt-3 text-sm text-ink-800">No image proof uploaded for this complaint.</p>
          )}
        </div>
      </div>

      {(complaint.officerRemarks || complaint.resolutionNotes || complaint.resolutionImages?.length) ? (
        <div className="mt-6 rounded-[26px] bg-slate-50 p-4">
          <h3 className="font-display text-lg text-ink-950">Officer Resolution Summary</h3>
          <div className="mt-3 space-y-3 text-sm text-ink-800">
            {complaint.officerRemarks ? <p><span className="font-semibold text-ink-950">Officer Remarks:</span> {complaint.officerRemarks}</p> : null}
            {complaint.resolutionNotes ? <p><span className="font-semibold text-ink-950">Resolution Notes:</span> {complaint.resolutionNotes}</p> : null}
            {complaint.resolutionImages?.length ? (
              <div className="grid grid-cols-2 gap-3">
                {complaint.resolutionImages.map((image) => (
                  <a key={image} href={`${assetBaseUrl}${image}`} target="_blank" rel="noreferrer" className="overflow-hidden rounded-2xl border border-slate-200">
                    <img src={`${assetBaseUrl}${image}`} alt="Resolution evidence" className="h-28 w-full object-cover" />
                  </a>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      {canManage ? (
        <div className="mt-6 grid gap-4 xl:grid-cols-2">
          <form className="rounded-[26px] border border-slate-200 p-4" onSubmit={handleStatusSubmit}>
            <h3 className="font-display text-lg text-ink-950">Update workflow</h3>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <FormField
                label="Next Status"
                name="nextStatus"
                as="select"
                value={nextStatus}
                onChange={(event) => setNextStatus(event.target.value)}
                options={[
                  { value: "", label: "Choose transition" },
                  ...transitions.map((status) => ({ value: status, label: status })),
                ]}
              />
              <FormField
                label="Priority"
                name="nextPriority"
                as="select"
                value={nextPriority || complaint.priority}
                onChange={(event) => setNextPriority(event.target.value)}
                options={["Low", "Medium", "High", "Critical"].map((priority) => ({
                  value: priority,
                  label: priority,
                }))}
              />
            </div>
            <div className="mt-4 grid gap-4">
              <FormField
                label="Officer Remarks"
                name="officerRemarks"
                as="textarea"
                value={officerRemarks}
                onChange={(event) => setOfficerRemarks(event.target.value)}
                placeholder="Add officer remarks or progress updates."
              />
              {nextStatus === "Resolved" ? (
                <>
                  <FormField
                    label="Resolution Notes"
                    name="resolutionNotes"
                    as="textarea"
                    value={resolutionNotes}
                    onChange={(event) => setResolutionNotes(event.target.value)}
                    placeholder="Document how the complaint was resolved."
                  />
                  <label className="block">
                    <span className="mb-2 block text-sm font-semibold text-ink-900">Resolution Images</span>
                    <input type="file" multiple accept="image/*" onChange={(event) => setResolutionFiles(Array.from(event.target.files || []))} className="block w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs text-ink-900" />
                  </label>
                </>
              ) : null}
            </div>
            <button
              type="submit"
              disabled={isBusy || !transitions.length}
              className="mt-4 inline-flex rounded-full bg-ink-950 px-5 py-3 text-sm font-bold text-white transition hover:bg-leaf-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isBusy ? "Saving..." : transitions.length ? "Save workflow update" : "Workflow closed"}
            </button>
          </form>

          <div className="rounded-[26px] border border-slate-200 p-4">
            <h3 className="font-display text-lg text-ink-950">Assignment controls</h3>
            <p className="mt-2 text-sm leading-6 text-ink-800">
              Use self-assignment for officer workflow, or provide another officer ID if an admin needs to re-route the case.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <button
                type="button"
                disabled={isBusy || currentUser?.id === complaint.assignedOfficer?.id}
                onClick={() => onAssignToSelf(complaint.id)}
                className="rounded-full bg-leaf-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-leaf-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Assign to me
              </button>
              <span className="rounded-full bg-slate-100 px-4 py-3 text-sm font-semibold text-ink-800">
                My role: {currentUser?.role || "Unknown"}
              </span>
            </div>

            <form className="mt-4 flex flex-col gap-3 sm:flex-row" onSubmit={handleAssignSubmit}>
              <input
                type="text"
                value={assignedOfficer}
                onChange={(event) => setAssignedOfficer(event.target.value)}
                placeholder="Assign by officer ID"
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-ink-950 outline-none transition focus:border-leaf-500 focus:ring-4 focus:ring-leaf-500/10"
              />
              <button
                type="submit"
                disabled={isBusy || !assignedOfficer}
                className="rounded-full bg-amber-400 px-5 py-3 text-sm font-bold text-ink-950 transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Assign by ID
              </button>
            </form>
          </div>
        </div>
      ) : null}

      <BaseModal isOpen={showHistory} title="Complaint Audit Trail" onClose={() => setShowHistory(false)}>
        <div className="space-y-3">
          {(complaint.statusHistory || []).length ? (
            complaint.statusHistory.map((entry, index) => (
              <div key={`${entry.status}-${entry.updatedAt}-${index}`} className="rounded-[24px] border border-slate-200 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <StatusBadge value={entry.status} />
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-800">
                    {getRelativeTime(entry.updatedAt)}
                  </p>
                </div>
                {entry.action ? <p className="mt-3 text-sm font-semibold text-ink-950">{entry.action}</p> : null}
                <p className="mt-3 text-sm text-ink-900">
                  Updated by: <span className="font-bold">{entry.updatedBy?.name || "System"}</span>
                </p>
                {entry.responsibleDepartment ? <p className="mt-2 text-sm text-ink-800">Department: {entry.responsibleDepartment}</p> : null}
                {entry.remarks ? <p className="mt-2 text-sm text-ink-800">Remarks: {entry.remarks}</p> : null}
                {entry.resolutionNotes ? <p className="mt-2 text-sm text-ink-800">Resolution Notes: {entry.resolutionNotes}</p> : null}
                {entry.resolutionImages?.length ? (
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    {entry.resolutionImages.map((image) => (
                      <a key={image} href={`${assetBaseUrl}${image}`} target="_blank" rel="noreferrer" className="overflow-hidden rounded-2xl border border-slate-200">
                        <img src={`${assetBaseUrl}${image}`} alt="Complaint timeline evidence" className="h-24 w-full object-cover" />
                      </a>
                    ))}
                  </div>
                ) : null}
              </div>
            ))
          ) : (
            <p className="text-sm text-ink-800">No workflow history recorded yet.</p>
          )}
        </div>
      </BaseModal>
    </section>
  );
}

export default ComplaintDetailsCard;
