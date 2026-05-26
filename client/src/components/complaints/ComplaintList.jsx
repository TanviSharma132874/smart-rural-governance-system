import EmptyState from "../common/EmptyState";
import StatusBadge from "../common/StatusBadge";
import { formatDate, getRelativeTime } from "../../utils/formatters";

function ComplaintList({ complaints, selectedId, onSelect, pagination, page, onPageChange }) {
  if (!complaints.length) {
    return <EmptyState title="No complaints found" description="Try another filter combination or create a new complaint from the citizen action panel." />;
  }

  return (
    <section className="space-y-4">
      <div className="space-y-4">
        {complaints.map((complaint) => {
          const isSelected = selectedId === complaint.id;

          return (
            <button
              key={complaint.id}
              type="button"
              onClick={() => onSelect(complaint.id)}
              className={`glass-panel w-full rounded-[28px] border p-5 text-left transition ${
                isSelected
                  ? "border-leaf-500 bg-white shadow-[0_18px_46px_rgba(34,99,77,0.18)]"
                  : "border-white/70 bg-white/82 hover:-translate-y-0.5 hover:border-leaf-300"
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-ink-800/70">{complaint.category}</p>
                  <h3 className="mt-2 font-display text-xl text-ink-950">{complaint.title}</h3>
                  <p className="mt-2 line-clamp-2 text-sm leading-6 text-ink-800">{complaint.description}</p>
                </div>
                <div className="text-right text-xs text-ink-800">
                  <p>{getRelativeTime(complaint.createdAt)}</p>
                  <p className="mt-2 font-medium">{formatDate(complaint.createdAt)}</p>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <StatusBadge value={complaint.status} />
                <StatusBadge type="priority" value={complaint.priority} />
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-ink-800">
                  {complaint.images?.length || 0} image(s)
                </span>
              </div>

              <div className="mt-4 grid gap-2 text-sm text-ink-800 md:grid-cols-2">
                <p>
                  <span className="font-semibold text-ink-950">Citizen:</span> {complaint.citizenId?.name || "Unknown"}
                </p>
                <p>
                  <span className="font-semibold text-ink-950">Assigned:</span> {complaint.assignedOfficer?.name || "Unassigned"}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-[28px] border border-white/70 bg-white/82 p-4">
        <p className="text-sm text-ink-800">
          Page <span className="font-bold text-ink-950">{pagination.page || 1}</span> of{" "}
          <span className="font-bold text-ink-950">{pagination.totalPages || 0}</span>
        </p>
        <div className="flex gap-3">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
            className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-ink-900 transition hover:border-leaf-500 hover:text-leaf-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Previous
          </button>
          <button
            type="button"
            disabled={page >= (pagination.totalPages || 1)}
            onClick={() => onPageChange(page + 1)}
            className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-ink-900 transition hover:border-leaf-500 hover:text-leaf-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </section>
  );
}

export default ComplaintList;
