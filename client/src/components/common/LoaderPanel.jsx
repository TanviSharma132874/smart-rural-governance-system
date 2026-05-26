function LoaderPanel({ label = "Loading..." }) {
  return (
    <div className="glass-panel rounded-[28px] border border-white/60 bg-white/85 p-10 text-center">
      <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-amber-200 border-t-leaf-600" />
      <p className="mt-4 text-sm font-semibold text-ink-900">{label}</p>
    </div>
  );
}

export default LoaderPanel;
