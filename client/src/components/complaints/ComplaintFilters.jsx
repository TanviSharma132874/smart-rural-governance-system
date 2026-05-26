import FormField from "../common/FormField";

function ComplaintFilters({ filters, onChange, onReset, pagination, isLoading }) {
  return (
    <section className="glass-panel rounded-[32px] border border-white/70 bg-white/85 p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-leaf-600">Query Controls</p>
          <h2 className="mt-2 font-display text-2xl text-ink-950">Filter complaint traffic</h2>
        </div>
        <button
          type="button"
          onClick={onReset}
          className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-ink-900 transition hover:border-leaf-500 hover:text-leaf-600"
        >
          Reset Filters
        </button>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <FormField label="Search" name="search" value={filters.search} onChange={onChange} placeholder="Search title or description" />
        <FormField
          label="Status"
          name="status"
          as="select"
          value={filters.status}
          onChange={onChange}
          options={[
            { value: "", label: "All statuses" },
            { value: "Pending", label: "Pending" },
            { value: "In Progress", label: "In Progress" },
            { value: "Resolved", label: "Resolved" },
            { value: "Rejected", label: "Rejected" },
          ]}
        />
        <FormField
          label="Priority"
          name="priority"
          as="select"
          value={filters.priority}
          onChange={onChange}
          options={[
            { value: "", label: "All priorities" },
            { value: "Low", label: "Low" },
            { value: "Medium", label: "Medium" },
            { value: "High", label: "High" },
            { value: "Critical", label: "Critical" },
          ]}
        />
        <FormField label="Category" name="category" value={filters.category} onChange={onChange} placeholder="Water / Roads / Health" />
        <FormField
          label="Sort"
          name="sort"
          as="select"
          value={filters.sort}
          onChange={onChange}
          options={[
            { value: "latest", label: "Latest first" },
            { value: "oldest", label: "Oldest first" },
            { value: "priority", label: "Priority first" },
          ]}
        />
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-[24px] bg-slate-50 px-4 py-3 text-sm text-ink-800">
        <p>
          Showing page <span className="font-bold text-ink-950">{pagination.page || 1}</span> of{" "}
          <span className="font-bold text-ink-950">{pagination.totalPages || 0}</span>
        </p>
        <p>
          Total complaints in query: <span className="font-bold text-ink-950">{pagination.totalComplaints || 0}</span>
          {isLoading ? " • Refreshing..." : ""}
        </p>
      </div>
    </section>
  );
}

export default ComplaintFilters;
