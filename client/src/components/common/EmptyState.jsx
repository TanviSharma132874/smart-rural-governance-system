function EmptyState({ title, description, action }) {
  return (
    <div className="glass-panel rounded-[28px] border border-white/60 bg-white/80 p-8 text-center">
      <div className="mx-auto mb-4 h-14 w-14 rounded-2xl bg-amber-100 text-2xl leading-[56px]">+</div>
      <h3 className="font-display text-xl text-ink-950">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-ink-800">{description}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

export default EmptyState;
