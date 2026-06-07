import StatusBadge from "../common/StatusBadge";

function AnnouncementCard({ announcement, onPublish, canPublish = false }) {
  const metadata = [announcement.department, announcement.district, announcement.targetAudience].filter(Boolean);

  return (
    <article className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          {announcement.announcementType ? <p className="text-xs font-semibold uppercase tracking-[0.24em] text-leaf-600">{announcement.announcementType}</p> : null}
          <h3 className="mt-2 font-display text-xl text-ink-950">{announcement.title}</h3>
        </div>
        <StatusBadge value={announcement.status} />
      </div>
      <p className="mt-3 text-sm leading-6 text-ink-800">{announcement.message}</p>
      {metadata.length ? <div className="mt-4 flex flex-wrap gap-3 text-xs text-ink-800">{metadata.map((item) => <span key={item}>{item}</span>)}</div> : null}
      {canPublish && announcement.status !== "Published" ? (
        <button
          type="button"
          onClick={() => onPublish?.(announcement.id)}
          className="mt-4 rounded-full bg-ink-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-leaf-600"
        >
          Publish Alert
        </button>
      ) : null}
    </article>
  );
}

export default AnnouncementCard;
