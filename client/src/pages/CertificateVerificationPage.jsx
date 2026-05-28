import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import VerificationBadge from "../components/certificates/VerificationBadge";
import LoaderPanel from "../components/common/LoaderPanel";
import certificateService from "../services/certificateService";
import { formatDate, getApiErrorMessage } from "../utils/formatters";

function CertificateVerificationPage() {
  const { id } = useParams();
  const [payload, setPayload] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadVerification = async () => {
      try {
        const response = await certificateService.verify(id);
        setPayload(response);
      } catch (requestError) {
        setError(getApiErrorMessage(requestError));
      }
    };

    loadVerification();
  }, [id]);

  if (!payload && !error) {
    return (
      <main className="app-shell-grid flex min-h-screen items-center justify-center px-4">
        <LoaderPanel label="Verifying certificate..." />
      </main>
    );
  }

  if (error) {
    return (
      <main className="app-shell-grid flex min-h-screen items-center justify-center px-4">
        <div className="glass-panel max-w-xl rounded-[32px] border border-white/70 bg-white/92 p-8 text-center">
          <h1 className="font-display text-3xl text-ink-950">Verification Failed</h1>
          <p className="mt-4 text-sm leading-7 text-ink-800">{error}</p>
        </div>
      </main>
    );
  }

  const certificate = payload.certificate;

  return (
    <main className="app-shell-grid min-h-screen px-4 py-8">
      <div className="mx-auto max-w-3xl rounded-[36px] border border-white/70 bg-white/94 p-8 shadow-[0_24px_80px_rgba(23,32,51,0.12)]">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-leaf-600">Public Verification Portal</p>
        <h1 className="mt-3 font-display text-4xl text-ink-950">{certificate.certificateType}</h1>
        <div className="mt-4">
          <VerificationBadge verified={payload.verified} status={certificate.status} />
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="rounded-[24px] bg-slate-50 p-4 text-sm text-ink-800">
            <p><span className="font-semibold text-ink-950">Application Number:</span> {certificate.applicationNumber}</p>
            <p className="mt-2"><span className="font-semibold text-ink-950">Applicant:</span> {certificate.applicant?.name}</p>
            <p className="mt-2"><span className="font-semibold text-ink-950">Department:</span> {certificate.department}</p>
          </div>
          <div className="rounded-[24px] bg-slate-50 p-4 text-sm text-ink-800">
            <p><span className="font-semibold text-ink-950">District:</span> {certificate.district}</p>
            <p className="mt-2"><span className="font-semibold text-ink-950">Jurisdiction:</span> {certificate.jurisdictionType}</p>
            <p className="mt-2"><span className="font-semibold text-ink-950">Issued At:</span> {certificate.issuedAt ? formatDate(certificate.issuedAt) : "Pending"}</p>
          </div>
        </div>
      </div>
    </main>
  );
}

export default CertificateVerificationPage;
