import { getPriorityTone, getStatusTone } from "../../utils/formatters";

function StatusBadge({ type = "status", value }) {
  const tone = type === "priority" ? getPriorityTone(value) : getStatusTone(value);

  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${tone}`}>
      {value}
    </span>
  );
}

export default StatusBadge;
