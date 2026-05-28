import { getCertificateStatusTone } from "../../utils/formatters";

function VerificationBadge({ verified, status }) {
  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${
        verified ? "bg-emerald-100 text-emerald-900" : getCertificateStatusTone(status)
      }`}
    >
      {verified ? "Verified Certificate" : status}
    </span>
  );
}

export default VerificationBadge;
