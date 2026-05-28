function PaginationControls({ page, totalPages, onPageChange }) {
  return (
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
        disabled={page >= (totalPages || 1)}
        onClick={() => onPageChange(page + 1)}
        className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-ink-900 transition hover:border-leaf-500 hover:text-leaf-600 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Next
      </button>
    </div>
  );
}

export default PaginationControls;
