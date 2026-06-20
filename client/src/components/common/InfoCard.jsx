import { Link } from "react-router-dom";

function InfoCard({ eyebrow, title, value, accent, description, to }) {
  const content = (
    <>
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-ink-800/75">{eyebrow}</p>
      <div className="mt-4 flex items-end justify-between gap-4">
        <div>
          <h3 className="font-display text-lg text-ink-950">{title}</h3>
          <p className="mt-3 text-4xl font-black text-ink-950">{value}</p>
        </div>
      </div>
      <p className="mt-4 text-sm leading-6 text-ink-800">{description}</p>
    </>
  );

  const baseClasses = `glass-panel rounded-[28px] border border-white/70 ${accent} p-5 text-left transition-all duration-300`;
  const interactiveClasses = to ? "hover:shadow-lg hover:-translate-y-1 hover:border-leaf-500/50 cursor-pointer block" : "";

  if (to) {
    return (
      <Link to={to} className={`${baseClasses} ${interactiveClasses}`}>
        {content}
      </Link>
    );
  }

  return (
    <article className={baseClasses}>
      {content}
    </article>
  );
}

export default InfoCard;
