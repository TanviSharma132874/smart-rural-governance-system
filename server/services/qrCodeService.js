const QRCode = require("qrcode");

const generateCertificateVerificationAssets = async ({ certificateId }) => {
  const clientUrl = process.env.CLIENT_URL || "http://localhost:3000";
  const verificationUrl = `${clientUrl}/verify/certificate/${certificateId}`;
  const qrCode = await QRCode.toDataURL(verificationUrl, {
    width: 220,
    margin: 1,
    errorCorrectionLevel: "M",
  });

  return {
    qrCode,
    verificationUrl,
  };
};

module.exports = {
  generateCertificateVerificationAssets,
};
