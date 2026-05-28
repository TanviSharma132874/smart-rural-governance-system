const PDFDocument = require("pdfkit");

const dataUrlToBuffer = (dataUrl) => {
  const base64 = dataUrl.split(",")[1];
  return Buffer.from(base64, "base64");
};

const buildCertificatePdfBuffer = (certificate) =>
  new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "A4",
      margin: 50,
    });
    const chunks = [];

    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    doc.rect(32, 32, 531, 778).lineWidth(2).stroke("#24324d");
    doc.fontSize(12).fillColor("#22634d").text("Smart Rural Governance & Emergency Management System", 50, 50, {
      align: "center",
    });
    doc.moveDown(0.8);
    doc.fontSize(22).fillColor("#172033").text(certificate.certificateType, {
      align: "center",
    });
    doc.moveDown(0.2);
    doc.fontSize(11).fillColor("#24324d").text(`Application Number: ${certificate.applicationNumber}`, {
      align: "center",
    });
    doc.moveDown(1.5);

    [
      ["Applicant", certificate.applicant?.name || "Citizen"],
      ["Department", certificate.department],
      ["Status", certificate.status],
      ["Jurisdiction Type", certificate.jurisdictionType],
      ["State", certificate.state],
      ["District", certificate.district],
      ["Tehsil / Block", certificate.tehsil || "-"],
      ["Village", certificate.village || "-"],
      ["Municipality", certificate.municipality || "-"],
      ["Issued At", certificate.issuedAt ? new Date(certificate.issuedAt).toLocaleString("en-IN") : "-"],
      ["Verification URL", certificate.verificationUrl],
    ].forEach(([label, value]) => {
      doc.font("Helvetica-Bold").fontSize(11).fillColor("#172033").text(`${label}: `, {
        continued: true,
      });
      doc.font("Helvetica").fillColor("#24324d").text(String(value || "-"));
      doc.moveDown(0.4);
    });

    doc.moveDown(1.4);
    doc.font("Helvetica-Bold").fontSize(13).fillColor("#172033").text("Official Approval Section");
    doc.moveDown(0.5);
    doc.font("Helvetica").fontSize(11).fillColor("#24324d").text(`Approved By: ${certificate.approvedBy?.name || certificate.digitalSignature || "-"}`);
    doc.text(`Department Seal: ${certificate.departmentSeal || certificate.department}`);
    doc.text(`Digital Signature Reference: ${certificate.digitalSignature || "-"}`);

    if (certificate.qrCode) {
      doc.image(dataUrlToBuffer(certificate.qrCode), 390, 560, {
        fit: [120, 120],
      });
      doc.fontSize(9).fillColor("#24324d").text("Scan to verify certificate", 385, 688, {
        width: 130,
        align: "center",
      });
    }

    doc.fontSize(9).fillColor("#24324d").text(
      "This digitally generated certificate is issued by the Smart Rural Governance & Emergency Management System and remains valid subject to QR verification.",
      50,
      725,
      {
        width: 470,
        align: "center",
      }
    );

    doc.end();
  });

module.exports = {
  buildCertificatePdfBuffer,
};
