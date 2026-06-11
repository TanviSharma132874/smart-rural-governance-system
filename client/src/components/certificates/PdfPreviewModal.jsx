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
        const cleanPath = pdfUrl.startsWith("/api/v1") 
          ? pdfUrl.replace("/api/v1", "") 
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
      }
    };
  }, [isOpen, pdfUrl]);

  return (
    <BaseModal isOpen={isOpen} title="Certificate PDF Preview" onClose={onClose}>
      {loading ? (
        <div className="flex h-40 items-center justify-center text-leaf-600">
          <p className="text-sm font-medium">Loading certificate preview...</p>
        </div>
      ) : error ? (
        <div className="flex h-40 items-center justify-center text-rose-600">
          <p className="text-sm">{error}</p>
        </div>
      ) : blobUrl ? (
        <iframe title="Certificate PDF" src={blobUrl} className="h-[70vh] w-full rounded-2xl border border-slate-200" />
      ) : (
        <p className="text-sm text-ink-800">Generate or download an approved certificate to preview it here.</p>
      )}
    </BaseModal>
  );
}

export default PdfPreviewModal;
