import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "react-hot-toast";

import AuditPanel from "../components/certificates/AuditPanel";
import CertificateApplyForm from "../components/certificates/CertificateApplyForm";
import CertificateQueueTable from "../components/certificates/CertificateQueueTable";
import DocumentPreviewModal from "../components/certificates/DocumentPreviewModal";
import PdfPreviewModal from "../components/certificates/PdfPreviewModal";
import VerificationBadge from "../components/certificates/VerificationBadge";
import DataTable from "../components/common/DataTable";
import FormField from "../components/common/FormField";
import LoaderPanel from "../components/common/LoaderPanel";
import PaginationControls from "../components/common/PaginationControls";
import StatusBadge from "../components/common/StatusBadge";
import { useAppSelector } from "../redux/hooks";
import certificateService from "../services/certificateService";
import { connectLiveUpdates, disconnectLiveUpdates, getLiveUpdatesSocket } from "../services/liveUpdatesService";
import { CERTIFICATE_STATUSES, CERTIFICATE_TYPES } from "../utils/constants";
import { getApiErrorMessage } from "../utils/formatters";

function CertificatesPage() {
  const user = useAppSelector((state) => state.auth.user);
  const isCitizen = user?.role === "citizen";
  const isOfficer = !isCitizen;
  const [records, setRecords] = useState([]);
  const [selectedCertificate, setSelectedCertificate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [certificateTypeFilter, setCertificateTypeFilter] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 8,
    totalPages: 0,
    totalApplications: 0,
    totalCertificates: 0,
  });
  const [documentPreview, setDocumentPreview] = useState("");
  const [pdfPreview, setPdfPreview] = useState("");
  const [remarks, setRemarks] = useState("");

  const queueParams = useMemo(
    () => ({
      page,
      limit: 8,
      sort: "latest",
      ...(statusFilter ? { status: statusFilter } : {}),
      ...(certificateTypeFilter ? { certificateType: certificateTypeFilter } : {}),
      ...(searchTerm ? { search: searchTerm } : {}),
    }),
    [certificateTypeFilter, page, searchTerm, statusFilter]
  );
  const assetBaseUrl = (import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1").replace("/api/v1", "").replace("/api", "");

  const loadCertificateDetail = async (id) => {
    try {
      const response = await certificateService.getById(id);
      setSelectedCertificate(response.certificate);
      setRemarks(response.certificate.remarks || "");
    } catch (requestError) {
      const message = getApiErrorMessage(requestError);
      setError(message);
      toast.error(message);
    }
  };

  const loadRecords = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = isCitizen
        ? await certificateService.getMyApplications(queueParams)
        : await certificateService.getDepartmentQueue(queueParams);
      const certificates = response.certificates || [];
      setRecords(certificates);
      setPagination(response.pagination || { page: 1, limit: 8, totalPages: 0 });

      const selectedId = selectedCertificate?.id;
      const nextSelected = selectedId && certificates.some((item) => item.id === selectedId) ? selectedId : certificates[0]?.id;

      if (nextSelected) {
        await loadCertificateDetail(nextSelected);
      } else {
        setSelectedCertificate(null);
      }
    } catch (requestError) {
      const message = getApiErrorMessage(requestError);
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [isCitizen, queueParams, selectedCertificate?.id]);

  const handleStatusFilterChange = (value) => {
    setStatusFilter(value);
    setPage(1);
  };

  const handleCertificateTypeFilterChange = (value) => {
    setCertificateTypeFilter(value);
    setPage(1);
  };

  const handleSearchChange = (value) => {
    setSearchTerm(value);
    setPage(1);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadRecords();
    }, 0);

    return () => clearTimeout(timer);
  }, [loadRecords]);

  useEffect(() => {
    const socket = connectLiveUpdates();

    const handleCertificateCreated = ({ certificate }) => {
      if (isCitizen) {
        toast.success(`Certificate application submitted: ${certificate.applicationNumber}`);
      } else {
        toast.success(`New certificate application received: ${certificate.applicationNumber}`);
      }
      loadRecords();
    };

    const handleCertificateUpdated = ({ certificate }) => {
      toast.success(`Certificate application updated: ${certificate.status}`);
      if (selectedCertificate?.id === certificate.id) {
        setSelectedCertificate(certificate);
      }
      loadRecords();
    };

    socket.on("certificate:submitted", handleCertificateCreated);
    socket.on("certificate:approved", handleCertificateUpdated);
    socket.on("certificate:rejected", handleCertificateUpdated);
    socket.on("certificate:updated", handleCertificateUpdated);

    return () => {
      const activeSocket = getLiveUpdatesSocket();
      activeSocket?.off("certificate:submitted", handleCertificateCreated);
      activeSocket?.off("certificate:approved", handleCertificateUpdated);
      activeSocket?.off("certificate:rejected", handleCertificateUpdated);
      activeSocket?.off("certificate:updated", handleCertificateUpdated);
      disconnectLiveUpdates();
    };
  }, [user, isCitizen, selectedCertificate?.id, loadRecords]);

  const runBusyAction = async (action) => {
    setBusy(true);
    setError("");

    try {
      await action();
      await loadRecords();
    } catch (requestError) {
      const message = getApiErrorMessage(requestError);
      setError(message);
      toast.error(message);
      throw requestError;
    } finally {
      setBusy(false);
    }
  };

  const previewPdf = async (id) => {
    try {
      const blob = await certificateService.download(id);
      const url = window.URL.createObjectURL(blob);
      setPdfPreview(url);
    } catch (requestError) {
      toast.error(getApiErrorMessage(requestError));
    }
  };

  return (
    <div className="space-y-5">
      <section
        className={`rounded-[36px] p-6 ${
          isCitizen
            ? "border border-amber-100 bg-[linear-gradient(135deg,rgba(255,255,255,0.96),rgba(255,245,220,0.94))]"
            : "border border-slate-700 bg-[linear-gradient(135deg,rgba(23,32,51,0.98),rgba(35,48,73,0.96))] text-white"
        }`}
      >
        <p className={`text-xs font-semibold uppercase tracking-[0.28em] ${isCitizen ? "text-amber-700" : "text-sky-200"}`}>
          {isCitizen ? "Citizen Certificate Desk" : "Officer Certificate Operations"}
        </p>
        <h1 className={`mt-3 font-display text-3xl md:text-4xl ${isCitizen ? "text-ink-950" : "text-white"}`}>
          {isCitizen ? "Certificate services for residents" : "Department queue and approval workspace"}
        </h1>
        <p className={`mt-3 max-w-3xl text-sm leading-7 md:text-base ${isCitizen ? "text-ink-800" : "text-white/78"}`}>
          {isCitizen
            ? "Apply for core government certificates, upload supporting proof, track review status, and download approved documents from a single guided service flow."
            : "Review jurisdiction-bound certificate applications, validate supporting documents, capture remarks, approve or reject requests, and manage auditable department workflows."}
        </p>
      </section>

      {error ? <div className="rounded-[28px] bg-alert-100 px-5 py-4 text-sm font-medium text-alert-500">{error}</div> : null}

      {isCitizen ? (
        <div className="grid gap-5 xl:grid-cols-[1fr_0.9fr]">
          <CertificateApplyForm
            currentUser={user}
            isSubmitting={busy}
            onSubmit={(payload) =>
              runBusyAction(async () => {
                await certificateService.apply(payload);
                setPage(1);
              })
            }
          />
          <section className="glass-panel rounded-[32px] border border-white/70 bg-white/92 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-leaf-600">Track Applications</p>
            <h2 className="mt-2 font-display text-2xl text-ink-950">Search and monitor certificate requests</h2>
            <div className="mt-5 grid gap-4">
              <FormField
                label="Search"
                name="search"
                value={searchTerm}
                onChange={(event) => handleSearchChange(event.target.value)}
                placeholder="Search by application number or certificate type"
              />
              <FormField
                label="Status Filter"
                name="statusFilter"
                as="select"
                value={statusFilter}
                onChange={(event) => handleStatusFilterChange(event.target.value)}
                options={[{ value: "", label: "All statuses" }, ...CERTIFICATE_STATUSES.map((item) => ({ value: item, label: item }))]}
              />
              <FormField
                label="Certificate Type"
                name="certificateTypeFilter"
                as="select"
                value={certificateTypeFilter}
                onChange={(event) => handleCertificateTypeFilterChange(event.target.value)}
                options={[{ value: "", label: "All certificate types" }, ...CERTIFICATE_TYPES.map((item) => ({ value: item, label: item }))]}
              />
            </div>
          </section>
        </div>
      ) : (
        <section className="glass-panel rounded-[32px] border border-white/70 bg-white/92 p-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-leaf-600">Department Queue</p>
              <h2 className="mt-2 font-display text-2xl text-ink-950">Operational certificate filters</h2>
            </div>
            <div className="grid w-full gap-4 md:max-w-3xl md:grid-cols-3">
              <FormField
                label="Search"
                name="search"
                value={searchTerm}
                onChange={(event) => handleSearchChange(event.target.value)}
                placeholder="Search by application number"
              />
              <FormField
                label="Status Filter"
                name="statusFilter"
                as="select"
                value={statusFilter}
                onChange={(event) => handleStatusFilterChange(event.target.value)}
                options={[{ value: "", label: "All statuses" }, ...CERTIFICATE_STATUSES.map((item) => ({ value: item, label: item }))]}
              />
              <FormField
                label="Certificate Type"
                name="certificateTypeFilter"
                as="select"
                value={certificateTypeFilter}
                onChange={(event) => handleCertificateTypeFilterChange(event.target.value)}
                options={[{ value: "", label: "All certificate types" }, ...CERTIFICATE_TYPES.map((item) => ({ value: item, label: item }))]}
              />
            </div>
          </div>
        </section>
      )}

      {loading ? (
        <LoaderPanel label="Loading certificate records..." />
      ) : (
        <div className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
          <section className="space-y-4">
            <div className="flex items-center justify-between gap-4 rounded-[24px] bg-white/70 px-4 py-3 text-sm text-ink-800">
              <p>
                {isCitizen
                  ? `${pagination.totalApplications || 0} applications found`
                  : `${pagination.totalCertificates || 0} certificates in queue`}
              </p>
              <PaginationControls page={pagination.page || page} totalPages={pagination.totalPages || 1} onPageChange={setPage} />
            </div>
            {isCitizen ? (
              <DataTable
                columns={[
                  {
                    key: "applicationNumber",
                    label: "Application",
                    render: (row) => (
                      <button type="button" onClick={() => loadCertificateDetail(row.id)} className="text-left">
                        <p className="font-semibold text-ink-950">{row.applicationNumber}</p>
                        <p className="mt-1 text-xs text-ink-800">{row.certificateType}</p>
                      </button>
                    ),
                  },
                  {
                    key: "status",
                    label: "Status",
                    render: (row) => <StatusBadge value={row.status} />,
                  },
                  {
                    key: "issuedAt",
                    label: "Issued",
                    render: (row) => (row.issuedAt ? new Date(row.issuedAt).toLocaleDateString("en-IN") : "Pending"),
                  },
                ]}
                rows={records}
                emptyMessage="No certificate applications found."
              />
            ) : (
              <CertificateQueueTable certificates={records} onSelect={loadCertificateDetail} emptyMessage="No department applications found." />
            )}
          </section>

          <section className="space-y-5">
            {selectedCertificate ? (
              <>
                <section className="glass-panel rounded-[32px] border border-white/70 bg-white/92 p-5">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.28em] text-leaf-600">Certificate Detail</p>
                      <h2 className="mt-2 font-display text-2xl text-ink-950">{selectedCertificate.certificateType}</h2>
                      <p className="mt-2 text-sm leading-6 text-ink-800">{selectedCertificate.applicationNumber}</p>
                    </div>
                    <VerificationBadge
                      verified={selectedCertificate.status === "Approved"}
                      status={selectedCertificate.status}
                    />
                  </div>

                  <div className="mt-5 grid gap-3 md:grid-cols-2">
                    <div className="rounded-[24px] bg-slate-50 p-4 text-sm text-ink-800">
                      <p><span className="font-semibold text-ink-950">Applicant:</span> {selectedCertificate.applicant?.name}</p>
                      <p className="mt-2"><span className="font-semibold text-ink-950">Department:</span> {selectedCertificate.department}</p>
                      <p className="mt-2"><span className="font-semibold text-ink-950">District:</span> {selectedCertificate.district}</p>
                      <p className="mt-2"><span className="font-semibold text-ink-950">Jurisdiction:</span> {selectedCertificate.jurisdictionType}</p>
                    </div>
                    <div className="rounded-[24px] bg-slate-50 p-4 text-sm text-ink-800">
                      <p><span className="font-semibold text-ink-950">Village:</span> {selectedCertificate.village || "-"}</p>
                      <p className="mt-2"><span className="font-semibold text-ink-950">Municipality:</span> {selectedCertificate.municipality || "-"}</p>
                      <p className="mt-2"><span className="font-semibold text-ink-950">Issued At:</span> {selectedCertificate.issuedAt ? new Date(selectedCertificate.issuedAt).toLocaleString("en-IN") : "Pending"}</p>
                    </div>
                  </div>

                  {selectedCertificate.certificateDetails && Object.keys(selectedCertificate.certificateDetails).length ? (
                    <div className="mt-5 rounded-[24px] bg-slate-50 p-4 text-sm text-ink-800">
                      <p className="font-semibold text-ink-950">Certificate Details</p>
                      <div className="mt-3 grid gap-2 md:grid-cols-2">
                        {Object.entries(selectedCertificate.certificateDetails).map(([key, value]) => (
                          <p key={key}>
                            <span className="font-semibold text-ink-950">{key}:</span> {String(value)}
                          </p>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  <div className="mt-5 flex flex-wrap gap-3">
                    {selectedCertificate.uploadedDocuments?.map((documentPath) => (
                      <button
                        key={documentPath}
                        type="button"
                        onClick={() => setDocumentPreview(`${assetBaseUrl}${documentPath}`)}
                        className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-ink-900 transition hover:border-leaf-500 hover:text-leaf-600"
                      >
                        Preview Document
                      </button>
                    ))}
                    {selectedCertificate.status === "Approved" ? (
                      <button
                        type="button"
                        onClick={() => previewPdf(selectedCertificate.id)}
                        className="rounded-full bg-leaf-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-leaf-500"
                      >
                        Preview PDF
                      </button>
                    ) : null}
                  </div>

                  {isOfficer ? (
                    <div className="mt-6 grid gap-4">
                      <FormField
                        label="Officer Remarks"
                        name="officerRemarks"
                        as="textarea"
                        value={remarks}
                        onChange={(event) => setRemarks(event.target.value)}
                        placeholder="Capture review observations or approval notes."
                      />
                      <div className="flex flex-wrap gap-3">
                        {selectedCertificate.status === "Submitted" ? (
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() =>
                              runBusyAction(async () => {
                                await certificateService.review(selectedCertificate.id, { remarks });
                                toast.success("Certificate moved to review.");
                              })
                            }
                            className="rounded-full bg-sky-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-sky-500 disabled:opacity-60"
                          >
                            Move to Review
                          </button>
                        ) : null}
                        {selectedCertificate.status === "Under Review" ? (
                          <>
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() =>
                                runBusyAction(async () => {
                                  await certificateService.updateStatus(selectedCertificate.id, {
                                    status: "Approved",
                                    remarks,
                                  });
                                  toast.success("Certificate approved.");
                                })
                              }
                              className="rounded-full bg-leaf-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-leaf-500 disabled:opacity-60"
                            >
                              Approve Certificate
                            </button>
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() =>
                                runBusyAction(async () => {
                                  await certificateService.updateStatus(selectedCertificate.id, {
                                    status: "Rejected",
                                    remarks,
                                  });
                                  toast.success("Certificate rejected.");
                                })
                              }
                              className="rounded-full bg-alert-500 px-5 py-3 text-sm font-bold text-white transition hover:bg-alert-400 disabled:opacity-60"
                            >
                              Reject Certificate
                            </button>
                          </>
                        ) : null}
                      </div>
                    </div>
                  ) : (
                    <div className="mt-6 flex flex-wrap gap-3">
                      {selectedCertificate.status === "Approved" ? (
                        <button
                          type="button"
                          onClick={() => previewPdf(selectedCertificate.id)}
                          className="rounded-full bg-ink-950 px-5 py-3 text-sm font-bold text-white transition hover:bg-leaf-600"
                        >
                          Preview Approved PDF
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled={busy || selectedCertificate.status !== "Submitted"}
                          onClick={() =>
                            runBusyAction(async () => {
                              await certificateService.archive(selectedCertificate.id);
                              toast.success("Certificate application archived.");
                            })
                          }
                          className="rounded-full border border-slate-200 px-5 py-3 text-sm font-bold text-ink-900 transition hover:border-alert-500 hover:text-alert-500 disabled:opacity-50"
                        >
                          Archive Application
                        </button>
                      )}
                    </div>
                  )}
                </section>

                <AuditPanel history={selectedCertificate.statusHistory} />
              </>
            ) : (
              <LoaderPanel label="Select a certificate record to inspect the workflow." />
            )}
          </section>
        </div>
      )}

      <DocumentPreviewModal isOpen={Boolean(documentPreview)} documentUrl={documentPreview} onClose={() => setDocumentPreview("")} />
      <PdfPreviewModal isOpen={Boolean(pdfPreview)} pdfUrl={pdfPreview} onClose={() => setPdfPreview("")} />
    </div>
  );
}

export default CertificatesPage;
