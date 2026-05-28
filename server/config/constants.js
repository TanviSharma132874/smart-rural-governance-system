const USER_ROLES = [
  "citizen",
  "volunteer",
  "panchayatOfficer",
  "departmentOfficer",
  "districtAdmin",
  "stateAdmin",
  "superAdmin",
];
const OFFICER_ROLES = ["panchayatOfficer", "departmentOfficer", "districtAdmin", "stateAdmin", "superAdmin"];
const JURISDICTION_TYPES = ["Rural", "Urban"];
const GOVERNANCE_TYPES = ["Gram Panchayat", "Municipality", "Municipal Corporation"];

const COMPLAINT_STATUSES = ["Pending", "In Progress", "Resolved", "Rejected"];
const COMPLAINT_PRIORITIES = ["Low", "Medium", "High", "Critical"];
const COMPLAINT_CATEGORIES = [
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
const COMPLAINT_SORT_OPTIONS = ["latest", "oldest", "priority"];

const CERTIFICATE_TYPES = [
  "Birth Certificate",
  "Death Certificate",
  "Income Certificate",
  "Residence Certificate",
  "Caste Certificate",
];
const CERTIFICATE_STATUSES = ["Submitted", "Under Review", "Approved", "Rejected"];
const GOVERNMENT_DEPARTMENTS = [
  "Civil Registration Department",
  "Revenue Department",
  "Local Administration Department",
  "Social Welfare Department",
];
const CERTIFICATE_TYPE_DEPARTMENTS = {
  "Birth Certificate": ["Civil Registration Department"],
  "Death Certificate": ["Civil Registration Department"],
  "Income Certificate": ["Revenue Department"],
  "Residence Certificate": ["Revenue Department", "Local Administration Department"],
  "Caste Certificate": ["Revenue Department", "Social Welfare Department"],
};

const API_V1_PREFIX = "/api/v1";

module.exports = {
  API_V1_PREFIX,
  USER_ROLES,
  OFFICER_ROLES,
  JURISDICTION_TYPES,
  GOVERNANCE_TYPES,
  COMPLAINT_STATUSES,
  COMPLAINT_PRIORITIES,
  COMPLAINT_CATEGORIES,
  COMPLAINT_SORT_OPTIONS,
  CERTIFICATE_TYPES,
  CERTIFICATE_STATUSES,
  GOVERNMENT_DEPARTMENTS,
  CERTIFICATE_TYPE_DEPARTMENTS,
};
