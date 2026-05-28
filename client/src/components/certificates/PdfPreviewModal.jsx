import BaseModal from "../common/BaseModal";

function PdfPreviewModal({ isOpen, pdfUrl, onClose }) {
  return (
    <BaseModal isOpen={isOpen} title="Certificate PDF Preview" onClose={onClose}>
      {pdfUrl ? (
        <iframe title="Certificate PDF" src={pdfUrl} className="h-[70vh] w-full rounded-2xl border border-slate-200" />
      ) : (
        <p className="text-sm text-ink-800">Generate or download an approved certificate to preview it here.</p>
      )}
    </BaseModal>
  );
}

export default PdfPreviewModal;
