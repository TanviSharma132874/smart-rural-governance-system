import { useCallback, useDeferredValue, useEffect, useMemo, useState } from "react";
import { toast } from "react-hot-toast";

import ComplaintComposer from "../components/complaints/ComplaintComposer";
import ComplaintDetailsCard from "../components/complaints/ComplaintDetailsCard";
import ComplaintFilters from "../components/complaints/ComplaintFilters";
import ComplaintList from "../components/complaints/ComplaintList";
import LoaderPanel from "../components/common/LoaderPanel";
import { useAppSelector } from "../redux/hooks";
import complaintService from "../services/complaintService";
import { getApiErrorMessage } from "../utils/formatters";

const initialFilters = {
  search: "",
  status: "",
  priority: "",
  category: "",
  sort: "latest",
};

function ComplaintPage() {
  const user = useAppSelector((state) => state.auth.user);
  const canManage = ["panchayatOfficer", "districtAdmin", "superAdmin"].includes(user?.role);
  const [filters, setFilters] = useState(initialFilters);
  const [page, setPage] = useState(1);
  const [complaints, setComplaints] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 0, totalComplaints: 0, limit: 10 });
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [pageError, setPageError] = useState("");
  const deferredSearch = useDeferredValue(filters.search);

  const query = useMemo(
    () => ({
      page,
      limit: 10,
      sort: filters.sort,
      status: filters.status,
      priority: filters.priority,
      category: filters.category,
      search: deferredSearch,
    }),
    [deferredSearch, filters.category, filters.priority, filters.sort, filters.status, page]
  );

  const loadSelectedComplaint = useCallback(async (complaintId) => {
    try {
      const response = await complaintService.getComplaintById(complaintId);
      setSelectedComplaint(response.complaint);
    } catch (error) {
      const message = getApiErrorMessage(error);
      setPageError(message);
      toast.error(message);
    }
  }, []);

  const refreshComplaints = useCallback(async (queryValue, preferredComplaintId) => {
    setLoading(true);
    setPageError("");

    try {
      const response = await complaintService.getComplaints(queryValue);
      setComplaints(response.data);
      setPagination(response.pagination || {});

      const fallbackComplaintId = preferredComplaintId || response.data?.[0]?.id;
      if (fallbackComplaintId) {
        await loadSelectedComplaint(fallbackComplaintId);
      } else {
        setSelectedComplaint(null);
      }
    } catch (error) {
      const message = getApiErrorMessage(error);
      setPageError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [loadSelectedComplaint]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refreshComplaints(query, selectedComplaint?.id);
  }, [query, refreshComplaints, selectedComplaint?.id]);

  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setPage(1);
    setFilters((current) => ({ ...current, [name]: value }));
  };

  const runBusyAction = async (action) => {
    setBusy(true);
    setPageError("");

    try {
      await action();
      await refreshComplaints(query, selectedComplaint?.id);
    } catch (error) {
      const message = getApiErrorMessage(error);
      setPageError(message);
      toast.error(message);
      throw error;
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="glass-panel rounded-[34px] border border-white/70 bg-[linear-gradient(135deg,rgba(255,255,255,0.92),rgba(255,248,231,0.82))] p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-leaf-600">
          {canManage ? "Officer Workspace" : "Citizen Workspace"}
        </p>
        <h1 className="mt-3 font-display text-3xl text-ink-950 md:text-4xl">Complaint management center</h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-ink-800 md:text-base">
          {canManage
            ? "Review incoming complaints, assign officers, and move each issue through a disciplined service workflow."
            : "Submit local issues, attach visual evidence, and track every complaint through its service lifecycle."}
        </p>
      </div>

      {pageError ? (
        <div className="rounded-[28px] border border-alert-100 bg-alert-100 px-5 py-4 text-sm font-medium text-alert-500">
          {pageError}
        </div>
      ) : null}

      {!canManage ? (
        <ComplaintComposer
          onSubmit={(payload) =>
            runBusyAction(async () => {
              await complaintService.createComplaint(payload);
            })
          }
          isSubmitting={busy}
        />
      ) : null}

      <ComplaintFilters
        filters={filters}
        onChange={handleFilterChange}
        onReset={() => {
          setFilters(initialFilters);
          setPage(1);
        }}
        pagination={pagination}
        isLoading={loading}
      />

      {loading ? (
        <LoaderPanel label="Loading complaints..." />
      ) : (
        <div className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
          <ComplaintList
            complaints={complaints}
            selectedId={selectedComplaint?.id}
            onSelect={loadSelectedComplaint}
            pagination={pagination}
            page={page}
            onPageChange={setPage}
          />
          <ComplaintDetailsCard
            complaint={selectedComplaint}
            currentUser={user}
            canManage={canManage}
            isBusy={busy}
            onStatusUpdate={(complaintId, payload) =>
              runBusyAction(async () => {
                await complaintService.updateComplaintStatus(complaintId, payload);
                toast.success("Complaint workflow updated.");
              })
            }
            onAssignToSelf={(complaintId) =>
              runBusyAction(async () => {
                await complaintService.assignComplaint(complaintId, { assignedOfficer: user.id });
                toast.success("Complaint assigned to your queue.");
              })
            }
            onAssignToOfficer={(complaintId, assignedOfficer) =>
              runBusyAction(async () => {
                await complaintService.assignComplaint(complaintId, { assignedOfficer });
                toast.success("Complaint assigned successfully.");
              })
            }
          />
        </div>
      )}
    </div>
  );
}

export default ComplaintPage;
