import StatusBadge from "../common/StatusBadge";

function WorkflowTimeline({ items = [] }) {
  return (
    <div className="space-y-3">
      {items.length ? (
        items.map((item, index) => {
          const formattedDate = item.updatedAt
            ? new Date(item.updatedAt).toLocaleString("en-IN")
            : "Timestamp unavailable";

          return (
            <div
              key={`${item.status}-${item.updatedAt}-${index}`}
              className="rounded-[24px] border border-slate-200 bg-white p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <StatusBadge value={item.status} />
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-800">
                  {item.action}
                </p>
              </div>

              <p className="mt-3 text-sm text-ink-900">
                {item.updatedBy?.name || "System"} •{" "}
                {item.department || "Department Unavailable"}
              </p>

              {item.remarks ? (
                <p className="mt-2 text-sm leading-6 text-ink-800">
                  {item.remarks}
                </p>
              ) : null}

              <p className="mt-2 text-xs text-ink-800">
                {formattedDate}
              </p>
            </div>
          );
        })
      ) : (
        <p className="text-sm text-ink-800">
          No workflow history available.
        </p>
      )}
    </div>
  );
}

export default WorkflowTimeline;