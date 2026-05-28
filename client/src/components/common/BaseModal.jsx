function BaseModal({ isOpen, title, onClose, children }) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-ink-950/45 px-4 py-6">
      <div className="glass-panel max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-[32px] border border-white/70 bg-white/94 p-6">
        <div className="flex items-center justify-between gap-4">
          <h3 className="font-display text-2xl text-ink-950">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-ink-900 transition hover:border-alert-500 hover:text-alert-500"
          >
            Close
          </button>
        </div>
        <div className="mt-5">{children}</div>
      </div>
    </div>
  );
}

export default BaseModal;
