import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "react-hot-toast";

import BaseModal from "../components/common/BaseModal";
import DataTable from "../components/common/DataTable";
import EmptyState from "../components/common/EmptyState";
import FormField from "../components/common/FormField";
import LoaderPanel from "../components/common/LoaderPanel";
import PaginationControls from "../components/common/PaginationControls";
import StatusBadge from "../components/common/StatusBadge";
import { useAppSelector } from "../redux/hooks";
import { connectLiveUpdates, getLiveUpdatesSocket } from "../services/liveUpdatesService";
import resourceService from "../services/resourceService";
import { EMERGENCY_DEPARTMENTS, JURISDICTION_TYPES, RESOURCE_STATUSES, RESOURCE_TYPES } from "../utils/constants";
import { getApiErrorMessage } from "../utils/formatters";
import { resourceSchema } from "../utils/validationSchemas";

function ResourcesPage() {
  const user = useAppSelector((state) => state.auth.user);
  const canManage = !["citizen", "volunteer"].includes(user?.role);
  const [records, setRecords] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 0, totalResources: 0 });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [resourceTypeFilter, setResourceTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedAuditHistory, setSelectedAuditHistory] = useState(null);
  const [selectedAllocationHistory, setSelectedAllocationHistory] = useState(null);
  const [selectedMaintenanceHistory, setSelectedMaintenanceHistory] = useState(null);
  const [isMaintenanceModalOpen, setIsMaintenanceModalOpen] = useState(false);
  const [maintenanceForm, setMaintenanceForm] = useState({ action: "", remarks: "", nextServiceDate: "" });

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(resourceSchema),
    defaultValues: {
      resourceType: "Food Packets",
      resourceCategory: "",
      quantity: 0,
      availableQuantity: 0,
      locationAddress: "",
      latitude: "",
      longitude: "",
      jurisdictionType: user?.jurisdictionType || "Rural",
      state: user?.state || "Rajasthan",
      district: user?.district || "",
      tehsil: user?.tehsil || "",
      village: user?.village || "",
      municipality: user?.municipality || "",
      department: user?.department || EMERGENCY_DEPARTMENTS[0],
      remarks: "",
    },
  });
  const jurisdictionType = useWatch({ control, name: "jurisdictionType" });

  useEffect(() => {
    if (!canManage) {
      return;
    }

    const loadResources = async () => {
      setLoading(true);

      try {
        const response = await resourceService.list({
          page,
          limit: 10,
          ...(resourceTypeFilter ? { resourceType: resourceTypeFilter } : {}),
          ...(statusFilter ? { status: statusFilter } : {}),
        });
        setRecords(response.data);
        setPagination(response.pagination || { page: 1, totalPages: 0, totalResources: 0 });
      } catch (requestError) {
        setError(getApiErrorMessage(requestError));
      } finally {
        setLoading(false);
      }
    };

    loadResources();
  }, [canManage, page, resourceTypeFilter, statusFilter]);

  useEffect(() => {
    if (!canManage) {
      return undefined;
    }

    const socket = connectLiveUpdates();

    const handleResourceUpdated = async () => {
      const response = await resourceService.list({
        page,
        limit: 10,
        ...(resourceTypeFilter ? { resourceType: resourceTypeFilter } : {}),
        ...(statusFilter ? { status: statusFilter } : {}),
      });
      setRecords(response.data);
      setPagination(response.pagination || { page: 1, totalPages: 0, totalResources: 0 });
    };

    socket.on("resource:updated", handleResourceUpdated);

    return () => {
      const activeSocket = getLiveUpdatesSocket();
      activeSocket?.off("resource:updated", handleResourceUpdated);
    };
  }, [canManage, page, resourceTypeFilter, statusFilter, user]);

  const onSubmit = async (form) => {
    setBusy(true);

    try {
      await resourceService.create(form);
      toast.success("Resource inventory added.");
      reset();
      const response = await resourceService.list({ page: 1, limit: 10 });
      setRecords(response.data);
      setPagination(response.pagination || { page: 1, totalPages: 0, totalResources: 0 });
      setPage(1);
    } catch (requestError) {
      toast.error(getApiErrorMessage(requestError));
    } finally {
      setBusy(false);
    }
  };

  if (!canManage) {
    return <EmptyState title="Restricted inventory workspace" description="Resource management is available to officers and administrative roles." />;
  }

  return (
    <div className="space-y-5">
      <section className="rounded-[34px] border border-slate-700 bg-[linear-gradient(135deg,rgba(24,30,51,0.98),rgba(25,70,64,0.96))] p-6 text-white">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-amber-200">Resource Dashboard</p>
        <h1 className="mt-3 font-display text-3xl md:text-4xl">Track emergency supplies and field capacity</h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-white/78 md:text-base">
          Monitor stock, route assets to emergencies, and keep district-level response inventory auditable.
        </p>
      </section>

      {error ? <div className="rounded-[24px] bg-alert-100 px-4 py-3 text-sm font-semibold text-alert-500">{error}</div> : null}

      <section className="grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
        <form className="glass-panel rounded-[32px] border border-white/70 bg-white/92 p-5" onSubmit={handleSubmit(onSubmit)}>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-leaf-600">Create Inventory</p>
          <h2 className="mt-2 font-display text-2xl text-ink-950">Add a response resource</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <FormField label="Resource Type" name="resourceType" as="select" registration={register("resourceType")} error={errors.resourceType?.message} options={RESOURCE_TYPES.map((item) => ({ value: item, label: item }))} />
            <FormField label="Category" name="resourceCategory" registration={register("resourceCategory")} error={errors.resourceCategory?.message} />
            <FormField label="Department" name="department" as="select" registration={register("department")} error={errors.department?.message} options={EMERGENCY_DEPARTMENTS.map((item) => ({ value: item, label: item }))} />
            <FormField label="Quantity" name="quantity" type="number" registration={register("quantity", { valueAsNumber: true })} error={errors.quantity?.message} />
            <FormField label="Available Quantity" name="availableQuantity" type="number" registration={register("availableQuantity", { valueAsNumber: true })} error={errors.availableQuantity?.message} />
            <FormField label="Location" name="locationAddress" registration={register("locationAddress")} error={errors.locationAddress?.message} className="md:col-span-2" />
            <FormField label="Latitude" name="latitude" registration={register("latitude")} error={errors.latitude?.message} />
            <FormField label="Longitude" name="longitude" registration={register("longitude")} error={errors.longitude?.message} />
            <FormField label="Jurisdiction" name="jurisdictionType" as="select" registration={register("jurisdictionType")} error={errors.jurisdictionType?.message} options={JURISDICTION_TYPES.map((item) => ({ value: item, label: item }))} />
            <FormField label="State" name="state" registration={register("state")} error={errors.state?.message} />
            <FormField label="District" name="district" registration={register("district")} error={errors.district?.message} />
            <FormField label="Tehsil / Block" name="tehsil" registration={register("tehsil")} error={errors.tehsil?.message} />
            {jurisdictionType === "Rural" ? (
              <FormField label="Village" name="village" registration={register("village")} error={errors.village?.message} />
            ) : (
              <FormField label="Municipality" name="municipality" registration={register("municipality")} error={errors.municipality?.message} />
            )}
            <FormField label="Remarks" name="remarks" as="textarea" registration={register("remarks")} error={errors.remarks?.message} className="md:col-span-2" />
          </div>
          <button type="submit" disabled={busy} className="mt-5 rounded-full bg-ink-950 px-5 py-3 text-sm font-bold text-white transition hover:bg-leaf-600 disabled:opacity-60">
            Add Resource
          </button>
        </form>

        <section className="space-y-4">
          <div className="glass-panel rounded-[32px] border border-white/70 bg-white/92 p-5">
            <div className="grid gap-4 md:grid-cols-2">
              <FormField label="Resource Type" name="resourceTypeFilter" as="select" value={resourceTypeFilter} onChange={(event) => { setResourceTypeFilter(event.target.value); setPage(1); }} options={[{ value: "", label: "All resource types" }, ...RESOURCE_TYPES.map((item) => ({ value: item, label: item }))]} />
              <FormField label="Status" name="statusFilter" as="select" value={statusFilter} onChange={(event) => { setStatusFilter(event.target.value); setPage(1); }} options={[{ value: "", label: "All statuses" }, ...RESOURCE_STATUSES.map((item) => ({ value: item, label: item }))]} />
            </div>
          </div>

          {loading ? (
            <LoaderPanel label="Loading resource inventory..." />
          ) : (
            <>
              <div className="flex items-center justify-between gap-3 rounded-[24px] bg-white/70 px-4 py-3 text-sm text-ink-800">
                <p>{pagination.totalResources || 0} resources in inventory</p>
                <PaginationControls page={pagination.page || page} totalPages={pagination.totalPages || 1} onPageChange={setPage} />
              </div>
              <DataTable
                columns={[
                  { key: "resourceType", label: "Type" },
                  { key: "resourceCategory", label: "Category", render: (row) => row.resourceCategory || "-" },
                  {
                    key: "stock",
                    label: "Inventory Status",
                    render: (row) => (
                      <div className="flex flex-col gap-1">
                        <p className="font-bold text-ink-950">{row.availableQuantity} / {row.quantity}</p>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => setSelectedAuditHistory({ name: row.resourceType, history: row.auditHistory || [] })}
                            className="text-[10px] font-bold uppercase tracking-tighter text-leaf-600 hover:underline"
                          >
                            Stock Logs
                          </button>
                          <button 
                            onClick={() => setSelectedMaintenanceHistory({ id: row.id, name: row.resourceType, history: row.maintenanceHistory || [] })}
                            className="text-[10px] font-bold uppercase tracking-tighter text-amber-600 hover:underline"
                          >
                            Maintenance
                          </button>
                        </div>
                      </div>
                    ),
                  },
                  {
                    key: "status",
                    label: "Status",
                    render: (row) => <StatusBadge value={row.status} />,
                  },
                  {
                    key: "department",
                    label: "Department",
                    render: (row) => row.department,
                  },
                  {
                    key: "lastAllocationAt",
                    label: "Allocations",
                    render: (row) => (
                      <div className="flex flex-col gap-1">
                        <p className="text-[10px] font-semibold text-ink-900">{row.lastAllocationAt ? new Date(row.lastAllocationAt).toLocaleDateString("en-IN") : "No history"}</p>
                        <button 
                          onClick={() => setSelectedAllocationHistory({ name: row.resourceType, history: row.allocationHistory || [] })}
                          className="text-[10px] font-bold uppercase tracking-tighter text-sky-600 hover:underline text-left"
                        >
                          View All
                        </button>
                      </div>
                    ),
                  },
                ]}
                rows={records}
                emptyMessage="No resources found."
              />

              <div className="mt-8 space-y-4">
                <header className="flex items-center gap-3">
                  <div className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                  <h3 className="font-display text-xl text-ink-950">Active Asset Allocations</h3>
                </header>
                <div className="rounded-[32px] border border-slate-100 bg-white/60 p-1">
                  <DataTable
                    columns={[
                      { key: "resourceType", label: "Asset" },
                      { key: "emergency", label: "Emergency ID", render: (row) => row.emergency?.incidentNumber || row.emergency || "Direct Allocation" },
                      { key: "quantity", label: "Qty" },
                      { key: "allocatedAt", label: "Allocated", render: (row) => new Date(row.allocatedAt).toLocaleDateString("en-IN") },
                      {
                        key: "action",
                        label: "Action",
                        render: (row) => (
                          <button
                            onClick={async () => {
                              try {
                                await resourceService.returnResource(row.resourceId, row.id, "Returned from field");
                                toast.success("Asset returned to inventory.");
                                // Refresh logic is handled by live updates socket
                              } catch (err) {
                                toast.error(getApiErrorMessage(err));
                              }
                            }}
                            className="rounded-full bg-leaf-50 px-3 py-1 text-xs font-bold text-leaf-700 transition hover:bg-leaf-100"
                          >
                            Return
                          </button>
                        ),
                      },
                    ]}
                    rows={records.flatMap(r => (r.allocationHistory || [])
                      .filter(a => !a.isReturned)
                      .map(a => ({ ...a, resourceType: r.resourceType, resourceId: r.id }))
                    )}
                    emptyMessage="No active allocations found."
                  />
                </div>
              </div>
            </>
          )}
        </section>
      </section>

      <BaseModal 
        isOpen={Boolean(selectedAuditHistory)} 
        title={`Inventory Stock Audit: ${selectedAuditHistory?.name}`} 
        onClose={() => setSelectedAuditHistory(null)}
      >
        <div className="space-y-3">
          {selectedAuditHistory?.history?.length ? (
            selectedAuditHistory.history.map((entry, idx) => (
              <div key={idx} className="rounded-2xl border border-slate-100 bg-slate-50 p-3 text-xs">
                <div className="flex justify-between font-bold text-ink-950">
                  <span>{entry.action}</span>
                  <span className={entry.quantityChange >= 0 ? 'text-leaf-600' : 'text-rose-600'}>
                    {entry.quantityChange >= 0 ? '+' : ''}{entry.quantityChange}
                  </span>
                </div>
                <p className="mt-1 text-slate-600">{entry.remarks}</p>
                <div className="mt-2 flex justify-between text-[10px] text-slate-400">
                  <span>By: {entry.updatedBy?.name || 'System'}</span>
                  <span>{new Date(entry.updatedAt).toLocaleString("en-IN")}</span>
                </div>
              </div>
            ))
          ) : (
            <p className="py-4 text-center text-sm text-slate-500">No stock logs recorded for this resource.</p>
          )}
        </div>
      </BaseModal>

      <BaseModal 
        isOpen={Boolean(selectedAllocationHistory)} 
        title={`Allocation History: ${selectedAllocationHistory?.name}`} 
        onClose={() => setSelectedAllocationHistory(null)}
      >
        <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
          {selectedAllocationHistory?.history?.length ? (
            [...selectedAllocationHistory.history].reverse().map((entry, idx) => (
              <div key={idx} className={`rounded-2xl border p-4 text-xs ${entry.isReturned ? 'bg-slate-50 border-slate-200 opacity-80' : 'bg-leaf-50 border-leaf-200'}`}>
                <div className="flex justify-between font-bold text-ink-950">
                  <span className="text-sm">Quantity: {entry.quantity}</span>
                  <StatusBadge value={entry.isReturned ? 'Returned' : 'In Field'} />
                </div>
                <p className="mt-2 text-ink-800"><span className="font-bold text-slate-400 uppercase text-[9px] mr-1">Allocated By:</span> {entry.allocatedBy?.name || 'N/A'}</p>
                <p className="text-ink-800"><span className="font-bold text-slate-400 uppercase text-[9px] mr-1">Allocated At:</span> {new Date(entry.allocatedAt).toLocaleString("en-IN")}</p>
                <p className="mt-1 text-slate-600 italic">"{entry.remarks || 'No remarks recorded'}"</p>
                
                {entry.isReturned && (
                  <div className="mt-3 border-t border-slate-200 pt-3">
                    <p className="text-ink-800"><span className="font-bold text-leaf-700 uppercase text-[9px] mr-1">Returned By:</span> {entry.returnedBy?.name || 'N/A'}</p>
                    <p className="text-ink-800"><span className="font-bold text-leaf-700 uppercase text-[9px] mr-1">Returned At:</span> {new Date(entry.returnedAt).toLocaleString("en-IN")}</p>
                    <p className="mt-1 text-leaf-900 italic">"{entry.returnRemarks || 'No return remarks'}"</p>
                  </div>
                )}
              </div>
            ))
          ) : (
            <p className="py-4 text-center text-sm text-slate-500">No allocation history found.</p>
          )}
        </div>
      </BaseModal>

      <BaseModal 
        isOpen={Boolean(selectedMaintenanceHistory)} 
        title={`Maintenance & Service Records: ${selectedMaintenanceHistory?.name}`} 
        onClose={() => setSelectedMaintenanceHistory(null)}
      >
        <div className="space-y-4">
          <button 
            onClick={() => setIsMaintenanceModalOpen(true)}
            className="w-full rounded-full bg-amber-600 py-3 text-xs font-bold text-white transition hover:bg-amber-700 shadow-md"
          >
            + Log Official Maintenance Action
          </button>
          
          <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-2">
            {selectedMaintenanceHistory?.history?.length ? (
              [...selectedMaintenanceHistory.history].reverse().map((entry, idx) => (
                <div key={idx} className="rounded-2xl border border-slate-100 bg-white p-4 text-xs shadow-sm">
                  <div className="flex justify-between font-bold text-ink-950">
                    <span className="text-sm font-display">{entry.action}</span>
                    <span className="text-amber-600">{new Date(entry.maintenanceDate).toLocaleDateString("en-IN")}</span>
                  </div>
                  <div className="mt-2 space-y-1">
                    <p className="text-ink-800"><span className="font-bold text-slate-400 uppercase text-[9px] mr-1">Technician / Officer:</span> {entry.performedBy}</p>
                    {entry.nextServiceDate && (
                      <p className="text-rose-600 font-bold"><span className="font-bold text-slate-400 uppercase text-[9px] mr-1 text-rose-300">Next Required Service:</span> {new Date(entry.nextServiceDate).toLocaleDateString("en-IN")}</p>
                    )}
                  </div>
                  {entry.remarks && <div className="mt-3 rounded-xl bg-slate-50 p-2 italic text-slate-600">"{entry.remarks}"</div>}
                </div>
              ))
            ) : (
              <p className="py-6 text-center text-sm text-slate-500 italic">No formal maintenance records found for this asset.</p>
            )}
          </div>
        </div>
      </BaseModal>

      <BaseModal 
        isOpen={isMaintenanceModalOpen} 
        title="Add Maintenance Entry" 
        onClose={() => setIsMaintenanceModalOpen(false)}
      >
        <form className="space-y-4" onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          try {
            await resourceService.addMaintenance(selectedMaintenanceHistory.id, maintenanceForm);
            toast.success("Maintenance record synchronized.");
            setIsMaintenanceModalOpen(false);
            setSelectedMaintenanceHistory(null);
            setMaintenanceForm({ action: "", remarks: "", nextServiceDate: "" });
          } catch (err) {
            toast.error(getApiErrorMessage(err));
          } finally {
            setBusy(false);
          }
        }}>
          <FormField label="Maintenance Action" name="action" value={maintenanceForm.action} onChange={(e) => setMaintenanceForm({...maintenanceForm, action: e.target.value})} placeholder="e.g. Engine Service, Battery Replacement" required />
          <FormField label="Performed By" name="performedBy" value={maintenanceForm.performedBy} onChange={(e) => setMaintenanceForm({...maintenanceForm, performedBy: e.target.value})} placeholder={user.name} />
          <FormField label="Next Service Due Date" type="date" name="nextServiceDate" value={maintenanceForm.nextServiceDate} onChange={(e) => setMaintenanceForm({...maintenanceForm, nextServiceDate: e.target.value})} />
          <FormField label="Service Remarks" name="remarks" as="textarea" value={maintenanceForm.remarks} onChange={(e) => setMaintenanceForm({...maintenanceForm, remarks: e.target.value})} />
          <button type="submit" disabled={busy} className="w-full rounded-full bg-ink-950 py-3 text-sm font-bold text-white transition hover:bg-leaf-600 disabled:opacity-50">
            {busy ? "Processing..." : "Commit Record to Registry"}
          </button>
        </form>
      </BaseModal>
    </div>
  );
}

export default ResourcesPage;