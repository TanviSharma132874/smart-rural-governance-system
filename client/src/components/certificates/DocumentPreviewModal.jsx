import { useState, useEffect } from "react";
import BaseModal from "../common/BaseModal";
import apiClient from "../../api/apiClient";

function DocumentPreviewModal({ isOpen, documentUrl, onClose }) {
  const [blobUrl, setBlobUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isPdf =
    typeof documentUrl === "string" &&
    documentUrl.split("?")[0].toLowerCase().endsWith(".pdf");

  useEffect(() => {
    let active = true;
    let currentBlobUrl = "";

    const fetchBlob = async () => {
      if (!isOpen || !documentUrl) return;

      try {
        setLoading(true);
        setError("");
        
        // Ensure path is relative to API base if it starts with /api/v1
        const cleanPath = documentUrl.startsWith("/api/v1") 
          ? documentUrl.replace("/api/v1", "") 
          : documentUrl;

        const response = await apiClient.get(cleanPath, {
          responseType: "blob",
        });

        if (active) {
          const url = URL.createObjectURL(response.data);
          currentBlobUrl = url;
          setBlobUrl(url);
        }
      } catch (err) {
        console.error("Failed to load protected document:", err);
        if (active) {
          setError("Failed to load document. You may not have permission to view it.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    fetchBlob();

    return () => {
      active = false;
      if (currentBlobUrl) {
        URL.revokeObjectURL(currentBlobUrl);
      }
    };
  }, [isOpen, documentUrl]);

  return (
    <BaseModal isOpen={isOpen} title="Document Preview" onClose={onClose}>
      {loading ? (
        <div className="flex h-40 items-center justify-center">
          <p className="text-sm font-medium text-leaf-600">Loading protected document...</p>
        </div>
      ) : error ? (
        <div className="flex h-40 items-center justify-center">
          <p className="text-sm text-rose-600">{error}</p>
        </div>
      ) : blobUrl ? (
        isPdf ? (
          <iframe
            title="Document Preview"
            src={blobUrl}
            className="h-[70vh] w-full rounded-2xl border border-slate-200"
          />
        ) : (
          <img
            src={blobUrl}
            alt="Certificate document"
            className="max-h-[70vh] w-full rounded-2xl object-contain"
          />
        )
      ) : (
        <p className="text-sm text-ink-800">No document selected.</p>
      )}
    </BaseModal>
  );
}

export default DocumentPreviewModal;