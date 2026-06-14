const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");
const CertificateTemplate = require("../models/CertificateTemplate");

dotenv.config({
  path: path.resolve(__dirname, "../.env"),
});

const templates = [
  {
    name: "Birth Certificate",
    code: "BIRTH_CERT",
    department: "Civil Registration",
    description: "Official record of a person's birth.",
    fields: [
      { name: "childName", label: "Full Name of Child", fieldType: "text", required: true },
      { name: "fatherName", label: "Father's Full Name", fieldType: "text", required: true },
      { name: "motherName", label: "Mother's Full Name", fieldType: "text", required: true },
      { name: "placeOfBirth", label: "Place of Birth (Hospital/Home)", fieldType: "text", required: true },
    ],
    requiredDocuments: [
      { category: "Identity Proof", label: "Parent's Aadhaar Card", mandatory: true },
      { category: "Hospital Discharge Summary", label: "Hospital Record", mandatory: true },
    ],
  },
  {
    name: "Income Certificate",
    code: "INCOME_CERT",
    department: "Revenue Department",
    description: "Certification of the family's annual income.",
    fields: [
      { name: "annualIncome", label: "Total Annual Family Income (INR)", fieldType: "number", required: true },
      { name: "sourceOfIncome", label: "Primary Source of Income", fieldType: "text", required: true },
      { name: "familyMemberCount", label: "Total Family Members", fieldType: "number", required: true },
    ],
    requiredDocuments: [
      { category: "Income Proof", label: "Salary Slip / Bank Statement", mandatory: true },
      { category: "Identity Proof", label: "Aadhaar Card", mandatory: true },
      { category: "Affidavit", label: "Income Declaration Affidavit", mandatory: true },
    ],
  },
  {
    name: "Caste Certificate",
    code: "CASTE_CERT",
    department: "Social Justice & Empowerment",
    description: "Certification of belonging to a specific caste category (SC/ST/OBC).",
    fields: [
      { name: "casteCategory", label: "Caste Category", fieldType: "select", options: ["SC", "ST", "OBC", "General"], required: true },
      { name: "specificCaste", label: "Specific Caste Name", fieldType: "text", required: true },
      { name: "religion", label: "Religion", fieldType: "select", options: ["Hindu", "Muslim", "Sikh", "Christian", "Buddhist", "Jain", "Other"], required: true },
    ],
    requiredDocuments: [
      { category: "Identity Proof", label: "Aadhaar Card", mandatory: true },
      { category: "Previous Certificate", label: "Father's Caste Certificate (Optional)", mandatory: false },
      { category: "Affidavit", label: "Self Declaration Affidavit", mandatory: true },
    ],
  },
  {
    name: "Residence Certificate",
    code: "RESIDENCE_CERT",
    department: "Revenue Department",
    description: "Proof of permanent residence in the state/district.",
    fields: [
      { name: "yearsOfResidence", label: "Number of years living at current address", fieldType: "number", required: true },
      { name: "isPermanent", label: "Is this a permanent residence?", fieldType: "select", options: ["Yes", "No"], required: true },
    ],
    requiredDocuments: [
      { category: "Address Proof", label: "Electricity Bill / Voter ID", mandatory: true },
      { category: "Identity Proof", label: "Aadhaar Card", mandatory: true },
    ],
  },
];

const seedTemplates = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) throw new Error("MONGODB_URI is undefined.");

    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB for template seeding...");

    for (const templateData of templates) {
      await CertificateTemplate.findOneAndUpdate(
        { code: templateData.code },
        templateData,
        { upsert: true, new: true }
      );
      console.log(`Seeded Template: ${templateData.name} (${templateData.code})`);
    }

    console.log("Template seeding completed.");
    process.exit(0);
  } catch (error) {
    console.error("Template seeding failed:", error.message);
    process.exit(1);
  }
};

seedTemplates();
