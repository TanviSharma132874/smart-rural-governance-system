import { useCallback, useDeferredValue, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "react-hot-toast";

import ComplaintComposer from "../components/complaints/ComplaintComposer";
import ComplaintDetailsCard from "../components/complaints/ComplaintDetailsCard";
import ComplaintFilters from "../components/complaints/ComplaintFilters";
import ComplaintList from "../components/complaints/ComplaintList";
import LoaderPanel from "../components/common/LoaderPanel";
import { useAppSelector } from "../redux/hooks";
import complaintService from "../services/complaintService";
import { connectLiveUpdates, getLiveUpdatesSocket } from "../services/liveUpdatesService";
import { getApiErrorMessage } from "../utils/formatters";

const initialFilters = {
  search: "",
  status: "",
  priority: "",
  category: "",
  subcategory: "",
  responsibleDepartment: "",
  escalationStatus: "",
  sort: "latest",
};

function ComplaintPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlId = searchParams.get("id");
  const urlStatus = searchParams.get("status");
  const urlQueue = searchParams.get("queue");

  const user = useAppSelector((state) => state.auth.user);
  const canManage = ["panchayatOfficer", "departmentOfficer", "districtAdmin", "stateAdmin", "superAdmin"].includes(user?.role);
  
  const [activeQueue, setActiveQueue] = useState(() => {
    if (urlQueue) return urlQueue;
    if (urlStatus === "Escalated") return "escalated";
    return "all";
  });
  const [filters, setFilters] = useState(() => ({
    ...initialFilters,
    status: (urlStatus && urlStatus !== "Escalated") ? urlStatus : "",
  }));
  const [page, setPage] = useState(1);
  const [complaints, setComplaints] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 0, totalComplaints: 0, limit: 10 });
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [pageError, setPageError] = useState("");
  const deferredSearch = useDeferredValue(filters.search);

  // COMP-L02: Sync URL -> State (Handles Browser Back/Forward)
  useEffect(() => {
    if (urlQueue && urlQueue !== activeQueue) {
      setActiveQueue(urlQueue);
    } else if (urlStatus === "Escalated" && activeQueue !== "escalated") {
      setActiveQueue("escalated");
    } else if (!urlQueue && !urlStatus && activeQueue !== "all" && !searchParams.has("id")) {
      setActiveQueue("all");
    }

    const targetStatus = (urlStatus && urlStatus !== "Escalated") ? urlStatus : "";
    if (targetStatus !== filters.status) {
      setFilters(prev => ({ ...prev, status: targetStatus }));
    }
  }, [urlStatus, urlQueue, activeQueue, filters.status, searchParams]);

  const query = useMemo(
    () => ({
      page,
      limit: 10,
      sort: filters.sort,
      status: activeQueue === "review" ? "Pending" : activeQueue === "resolution" ? "Reviewed" : activeQueue === "closed" ? "Closed" : filters.status,
      assignedOfficer: activeQueue === "my" ? user?.id : undefined,
      priority: filters.priority,
      category: filters.category,
      subcategory: filters.subcategory,
      responsibleDepartment: filters.responsibleDepartment,
      escalationStatus: activeQueue === "escalated" ? "Escalated" : filters.escalationStatus,
      search: deferredSearch,
    }),
    [deferredSearch, filters.category, filters.escalationStatus, filters.priority, filters.responsibleDepartment, filters.sort, filters.status, filters.subcategory, page, activeQueue, user?.id]
  );

  const loadSelectedComplaint = useCallback(async (complaintId) => {
    // COMP-L01: Equality guard to prevent redundant state updates
    if (selectedComplaint?.id === complaintId) return;

    try {
      const response = await complaintService.getComplaintById(complaintId);
      setSelectedComplaint(response.complaint);
    } catch (error) {
      const message = getApiErrorMessage(error);
      setPageError(message);
      toast.error(message);
    }
  }, [selectedComplaint?.id]);

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
    // COMP-L01: Remove selectedComplaint?.id from dependency array to break infinite loop
    refreshComplaints(query, urlId);
  }, [query, refreshComplaints, urlId]);

  useEffect(() => {
    const socket = connectLiveUpdates();

    const handleComplaintCreated = ({ complaint }) => {
      if (!canManage) {
        toast.success(`Complaint created: ${complaint.title}`);
      } else {
        toast.success(`New complaint received: ${complaint.title}`);
      }
      refreshComplaints(query, urlId);
    };

    const handleComplaintUpdated = ({ complaint }) => {
      toast.success(`Complaint updated: ${complaint.status}`);
      if (selectedComplaint?.id === complaint.id) {
        setSelectedComplaint(complaint);
      }
      refreshComplaints(query, urlId);
    };

    socket.on("complaint:created", handleComplaintCreated);
    socket.on("complaint:updated", handleComplaintUpdated);
    socket.on("complaint:assigned", handleComplaintUpdated);
    socket.on("complaint:resolved", handleComplaintUpdated);
    socket.on("complaint:rejected", handleComplaintUpdated);

    return () => {
      const activeSocket = getLiveUpdatesSocket();
      activeSocket?.off("complaint:created", handleComplaintCreated);
      activeSocket?.off("complaint:updated", handleComplaintUpdated);
      activeSocket?.off("complaint:assigned", handleComplaintUpdated);
      activeSocket?.off("complaint:resolved", handleComplaintUpdated);
      activeSocket?.off("complaint:rejected", handleComplaintUpdated);
    };
  }, [user, query, urlId, refreshComplaints, canManage, selectedComplaint?.id]);

  // COMP-L03: State -> URL sync
  const updateUrlParams = (key, value) => {
    const params = new URLSearchParams(searchParams);
    if (value && value !== "all") {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    
    // Clear status if switching away from Escalated queue manually
    if (key === "queue" && value !== "escalated" && params.get("status") === "Escalated") {
      params.delete("status");
    }

    setSearchParams(params, { replace: true });
  };

  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setPage(1);
    setFilters((current) => ({ ...current, [name]: value }));
    updateUrlParams(name, value);
  };

  const handleQueueChange = (queue) => {
    setActiveQueue(queue);
    setPage(1);
    updateUrlParams("queue", queue);
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

      {canManage && (
        <div className="flex flex-wrap gap-2 overflow-x-auto rounded-[28px] bg-slate-100 p-1 shadow-inner text-nowrap">
          <button
            onClick={() => handleQueueChange("all")}
            className={`rounded-full px-5 py-2 text-[11px] font-bold uppercase tracking-wider transition ${activeQueue === "all" ? "bg-ink-950 text-white shadow-md" : "text-slate-600 hover:bg-slate-200"}`}
          >
            All Cases
          </button>
          <button
            onClick={() => handleQueueChange("my")}
            className={`rounded-full px-5 py-2 text-[11px] font-bold uppercase tracking-wider transition ${activeQueue === "my" ? "bg-amber-500 text-white shadow-md" : "text-slate-600 hover:bg-slate-200"}`}
          >
            My Queue
          </button>
          {["panchayatOfficer", "districtAdmin", "stateAdmin", "superAdmin"].includes(user.role) && (
            <button
              onClick={() => handleQueueChange("review")}
              className={`rounded-full px-5 py-2 text-[11px] font-bold uppercase tracking-wider transition ${activeQueue === "review" ? "bg-leaf-600 text-white shadow-md" : "text-slate-600 hover:bg-slate-200"}`}
            >
              Review Queue
            </button>
          )}
          {["departmentOfficer", "districtAdmin", "stateAdmin", "superAdmin"].includes(user.role) && (
            <button
              onClick={() => handleQueueChange("resolution")}
              className={`rounded-full px-5 py-2 text-[11px] font-bold uppercase tracking-wider transition ${activeQueue === "resolution" ? "bg-leaf-600 text-white shadow-md" : "text-slate-600 hover:bg-slate-200"}`}
            >
              Resolution Queue
            </button>
          )}
          <button
            onClick={() => handleQueueChange("escalated")}
            className={`rounded-full px-5 py-2 text-[11px] font-bold uppercase tracking-wider transition ${activeQueue === "escalated" ? "bg-rose-600 text-white shadow-md" : "text-slate-600 hover:bg-slate-200"}`}
          >
            Escalated
          </button>
          <button
            onClick={() => handleQueueChange("closed")}
            className={`rounded-full px-5 py-2 text-[11px] font-bold uppercase tracking-wider transition ${activeQueue === "closed" ? "bg-slate-500 text-white shadow-md" : "text-slate-600 hover:bg-slate-200"}`}
          >
            Archive (Closed)
          </button>
        </div>
      )}

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
          setActiveQueue("all");
          setSearchParams({}, { replace: true });
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
