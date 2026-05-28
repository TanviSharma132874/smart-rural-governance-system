function FilterBar({ title, eyebrow, actions, children }) {
  return (
    <section className="glass-panel rounded-[32px] border border-white/70 bg-white/85 p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-leaf-600">{eyebrow}</p>
          <h2 className="mt-2 font-display text-2xl text-ink-950">{title}</h2>
        </div>
        {actions}
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}

export default FilterBar;
