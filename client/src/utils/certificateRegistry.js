export const CERTIFICATE_CONFIG = {
  "Birth Certificate": {
    department: "Civil Registration Department",
    requiredFields: [
      { name: "childName", label: "Child Name", type: "text", required: true },
      { name: "dob", label: "Date of Birth", type: "date", required: true },
      { name: "birthPlace", label: "Birth Place", type: "text", required: true },
      { name: "fatherName", label: "Father Name", type: "text", required: true },
      { name: "motherName", label: "Mother Name", type: "text", required: true },
    ],
    requiredDocuments: ["Identity Proof of Parents", "Hospital Birth Record"],
    validationRules: {},
  },
  "Death Certificate": {
    department: "Civil Registration Department",
    requiredFields: [
      { name: "deceasedName", label: "Deceased Name", type: "text", required: true },
      { name: "dateOfDeath", label: "Date of Death", type: "date", required: true },
      { name: "causeOfDeath", label: "Cause of Death", type: "text", required: true },
    ],
    requiredDocuments: ["Identity Proof of Deceased", "Medical Death Summary"],
    validationRules: {},
  },
  "Marriage Certificate": {
    department: "Civil Registration Department",
    requiredFields: [
      { name: "husbandName", label: "Husband Name", type: "text", required: true },
      { name: "wifeName", label: "Wife Name", type: "text", required: true },
      { name: "marriageDate", label: "Marriage Date", type: "date", required: true },
    ],
    requiredDocuments: ["Wedding Invitation Card", "Identity Proof of Couple", "Joint Photograph"],
    validationRules: {},
  },
  "Income Certificate": {
    department: "Revenue Department",
    requiredFields: [
      { name: "annualIncome", label: "Annual Income", type: "number", required: true },
      { name: "occupation", label: "Occupation", type: "text", required: true },
      { name: "panNumber", label: "PAN Number", type: "text", required: false },
    ],
    requiredDocuments: ["Salary Slip / Form 16", "Ration Card", "Affidavit"],
    validationRules: {},
  },
  "Caste Certificate": {
    department: "Social Welfare Department",
    requiredFields: [
      { name: "casteCategory", label: "Caste Category", type: "text", required: true },
      { name: "subCaste", label: "Sub-Caste", type: "text", required: true },
    ],
    requiredDocuments: ["Identity Proof", "Caste Proof of Ancestors"],
    validationRules: {},
  },
  "Domicile Certificate": {
    department: "Revenue Department",
    requiredFields: [
      { name: "durationOfStay", label: "Duration of Stay (Years)", type: "number", required: true },
    ],
    requiredDocuments: ["Voter ID", "Ration Card", "School Certificate"],
    validationRules: {},
  },
  "Residence Certificate": {
    department: "Revenue Department",
    requiredFields: [
      { name: "durationOfStay", label: "Duration of Stay (Years)", type: "number", required: true },
    ],
    requiredDocuments: ["Address Proof", "Electricity Bill"],
    validationRules: {},
  },
  "Disability Certificate": {
    department: "Social Welfare Department",
    requiredFields: [
      { name: "disabilityType", label: "Disability Type", type: "text", required: true },
      { name: "disabilityPercentage", label: "Percentage (%)", type: "number", required: true },
    ],
    requiredDocuments: ["Medical Report", "Identity Proof"],
    validationRules: {},
  },
  "Senior Citizen Certificate": {
    department: "Social Welfare Department",
    requiredFields: [
      { name: "ageVerification", label: "Age Verification Method", type: "text", required: true },
    ],
    requiredDocuments: ["Birth Proof", "Identity Proof"],
    validationRules: {},
  },
  "Land Ownership Certificate": {
    department: "Revenue Department",
    requiredFields: [
      { name: "khasraNumber", label: "Plot / Khasra Number", type: "text", required: true },
      { name: "area", label: "Area (Sq Ft / Bigha)", type: "text", required: true },
    ],
    requiredDocuments: ["Registry Paper", "Map Trace"],
    validationRules: {},
  },
};
