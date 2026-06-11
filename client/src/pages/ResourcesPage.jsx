import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "react-hot-toast";

import DataTable from "../components/common/DataTable";
import EmptyState from "../components/common/EmptyState";
import FormField from "../components/common/FormField";
import LoaderPanel from "../components/common/LoaderPanel";
import PaginationControls from "../components/common/PaginationControls";
import StatusBadge from "../components/common/StatusBadge";
import { useAppSelector } from "../redux/hooks";
import { connectLiveUpdates, disconnectLiveUpdates, getLiveUpdatesSocket } from "../services/liveUpdatesService";
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
      disconnectLiveUpdates();
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
                    label: "Stock",
                    render: (row) => `${row.availableQuantity} / ${row.quantity}`,
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
                    label: "Last Allocation",
                    render: (row) => (row.lastAllocationAt ? new Date(row.lastAllocationAt).toLocaleDateString("en-IN") : "Not allocated"),
                  },
                ]}
                rows={records}
                emptyMessage="No resources found."
              />
            </>
          )}
        </section>
      </section>
    </div>
  );
}

export default ResourcesPage;
