import FilterBar from "../common/FilterBar";
import FormField from "../common/FormField";
import { COMPLAINT_CATEGORIES, COMPLAINT_STATUSES, COMPLAINT_SUBCATEGORY_MAP, GOVERNMENT_DEPARTMENTS } from "../../utils/constants";

function ComplaintFilters({ filters, onChange, onReset, pagination, isLoading }) {
  const subcategoryOptions = filters.category ? COMPLAINT_SUBCATEGORY_MAP[filters.category] || [] : [];
  return (
    <FilterBar
      eyebrow="Query Controls"
      title="Filter complaint traffic"
      actions={
        <button
          type="button"
          onClick={onReset}
          className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-ink-900 transition hover:border-leaf-500 hover:text-leaf-600"
        >
          Reset Filters
        </button>
      }
    >

      <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-8">
        <FormField label="Search" name="search" value={filters.search} onChange={onChange} placeholder="Search title or description" />
        <FormField
          label="Status"
          name="status"
          as="select"
          value={filters.status}
          onChange={onChange}
          options={[
            { value: "", label: "All statuses" },
            ...COMPLAINT_STATUSES.map(s => ({ value: s, label: s }))
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
        <FormField label="Category" name="category" as="select" value={filters.category} onChange={onChange} options={[{ value: "", label: "All categories" }, ...COMPLAINT_CATEGORIES.map((item) => ({ value: item, label: item }))]} />
        <FormField label="Subcategory" name="subcategory" as="select" value={filters.subcategory} onChange={onChange} options={[{ value: "", label: "All subcategories" }, ...subcategoryOptions.map((item) => ({ value: item, label: item }))]} />
        <FormField label="Department" name="responsibleDepartment" as="select" value={filters.responsibleDepartment} onChange={onChange} options={[{ value: "", label: "All departments" }, ...GOVERNMENT_DEPARTMENTS.map((item) => ({ value: item, label: item }))]} />
        <FormField label="Escalation" name="escalationStatus" as="select" value={filters.escalationStatus} onChange={onChange} options={[{ value: "", label: "All escalation states" }, { value: "Normal", label: "Normal" }, { value: "Escalated", label: "Escalated" }]} />
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
    </FilterBar>
  );
}

export default ComplaintFilters;