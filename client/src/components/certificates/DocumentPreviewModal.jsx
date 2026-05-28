import BaseModal from "../common/BaseModal";

function DocumentPreviewModal({ isOpen, documentUrl, onClose }) {
  return (
    <BaseModal isOpen={isOpen} title="Document Preview" onClose={onClose}>
      {documentUrl ? (
        documentUrl.endsWith(".pdf") ? (
          <iframe title="Document Preview" src={documentUrl} className="h-[70vh] w-full rounded-2xl border border-slate-200" />
        ) : (
          <img src={documentUrl} alt="Certificate document" className="max-h-[70vh] w-full rounded-2xl object-contain" />
        )
      ) : (
        <p className="text-sm text-ink-800">No document selected.</p>
      )}
    </BaseModal>
  );
}

export default DocumentPreviewModal;
