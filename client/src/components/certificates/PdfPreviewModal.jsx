import { useState, useEffect } from "react";
import BaseModal from "../common/BaseModal";
import apiClient from "../../api/apiClient";

function PdfPreviewModal({ isOpen, pdfUrl, onClose }) {
  const [blobUrl, setBlobUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    let currentBlobUrl = "";

    const fetchPdf = async () => {
      if (!isOpen || !pdfUrl) return;

      try {
        setLoading(true);
        setError("");

        // Handle path consistency with API base
        const cleanPath = pdfUrl.includes("/api/v1") 
          ? pdfUrl.split("/api/v1")[1] 
          : pdfUrl;

        const response = await apiClient.get(cleanPath, {
          responseType: "blob",
        });

        if (active) {
          const url = URL.createObjectURL(response.data);
          currentBlobUrl = url;
          setBlobUrl(url);
        }
      } catch (err) {
        console.error("Failed to load protected PDF:", err);
        if (active) {
          setError("Failed to load PDF preview. Ensure you have the required permissions.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    fetchPdf();

    return () => {
      active = false;
      if (currentBlobUrl) {
        URL.revokeObjectURL(currentBlobUrl);
        setBlobUrl("");
      }
    };
  }, [isOpen, pdfUrl]);

  const handleDownload = () => {
    if (!blobUrl) return;
    const link = document.createElement("a");
    link.href = blobUrl;
    link.download = pdfUrl.split("/").pop() || "certificate.pdf";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleOpenInNewTab = () => {
    if (!blobUrl) return;
    window.open(blobUrl, "_blank");
  };

  return (
    <BaseModal isOpen={isOpen} title="Certificate PDF Preview" onClose={onClose}>
      <div className="space-y-4">
        {loading ? (
          <div className="flex h-[50vh] flex-col items-center justify-center space-y-4 rounded-2xl bg-slate-50">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-leaf-200 border-t-leaf-600"></div>
            <p className="text-sm font-medium text-leaf-700">Retrieving secure document...</p>
          </div>
        ) : error ? (
          <div className="flex h-[50vh] flex-col items-center justify-center space-y-4 rounded-2xl bg-rose-50 px-6 text-center">
            <p className="text-sm font-medium text-rose-600">{error}</p>
            <button 
              onClick={onClose}
              className="rounded-full bg-rose-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-rose-700"
            >
              Close Preview
            </button>
          </div>
        ) : blobUrl ? (
          <>
            <div className="flex items-center justify-between px-1">
              <p className="text-xs text-slate-500">Government issued document (Protected)</p>
              <div className="flex gap-2">
                <button
                  onClick={handleOpenInNewTab}
                  className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[10px] font-bold text-ink-950 transition hover:bg-slate-50"
                >
                  Open Fullscreen
                </button>
                <button
                  onClick={handleDownload}
                  className="rounded-full bg-leaf-600 px-3 py-1 text-[10px] font-bold text-white transition hover:bg-leaf-700"
                >
                  Download PDF
                </button>
              </div>
            </div>
            <iframe 
              title="Certificate PDF" 
              src={`${blobUrl}#toolbar=0`} 
              className="h-[70vh] w-full rounded-2xl border border-slate-200 bg-slate-100 shadow-inner" 
            />
          </>
        ) : (
          <div className="flex h-40 items-center justify-center rounded-2xl bg-slate-50 px-6 text-center">
            <p className="text-sm text-ink-800">Select an approved certificate to preview it here.</p>
          </div>
        )}
      </div>
    </BaseModal>
  );
}

export default PdfPreviewModal;
