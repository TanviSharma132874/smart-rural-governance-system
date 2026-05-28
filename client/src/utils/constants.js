export const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1";

export const USER_ROLES = [
  "citizen",
  "volunteer",
  "panchayatOfficer",
  "departmentOfficer",
  "districtAdmin",
  "stateAdmin",
  "superAdmin",
];
export const JURISDICTION_TYPES = ["Rural", "Urban"];
export const GOVERNMENT_DEPARTMENTS = [
  "Civil Registration Department",
  "Revenue Department",
  "Local Administration Department",
  "Social Welfare Department",
];
export const COMPLAINT_STATUSES = ["Pending", "In Progress", "Resolved", "Rejected"];
export const COMPLAINT_PRIORITIES = ["Low", "Medium", "High", "Critical"];
export const COMPLAINT_CATEGORIES = [
  "Roads",
  "Water",
  "Electricity",
  "Sanitation",
  "Street Lights",
  "Health",
  "Waste Management",
  "Drainage",
  "Traffic",
  "Garbage",
  "Municipal Issues",
  "Public Safety",
  "Other",
];
export const CERTIFICATE_TYPES = [
  "Birth Certificate",
  "Death Certificate",
  "Income Certificate",
  "Residence Certificate",
  "Caste Certificate",
];
export const CERTIFICATE_STATUSES = ["Submitted", "Under Review", "Approved", "Rejected"];
