import { getPriorityTone, getStatusTone } from "../../utils/formatters";

function StatusBadge({ type = "status", value }) {
  const displayValue = value || "Status Unavailable";
  const tone =
    type === "priority"
      ? getPriorityTone(displayValue)
      : getStatusTone(displayValue);

  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${tone}`}>
      {displayValue}
    </span>
  );
}

export default StatusBadge;