import WorkflowTimeline from "./WorkflowTimeline";

function AuditPanel({ history = [] }) {
  return (
    <section className="glass-panel rounded-[32px] border border-white/70 bg-white/90 p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.28em] text-leaf-600">Audit Timeline</p>
      <h3 className="mt-2 font-display text-2xl text-ink-950">Governance actions</h3>
      <div className="mt-5">
        <WorkflowTimeline items={history} />
      </div>
    </section>
  );
}

export default AuditPanel;
