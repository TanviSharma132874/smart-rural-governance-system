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
  "Marriage Certificate",
  "Income Certificate",
  "Residence Certificate",
  "Domicile Certificate",
  "Caste Certificate",
  "Senior Citizen Certificate",
  "Disability Certificate",
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
  "Marriage Certificate": ["Civil Registration Department"],
  "Income Certificate": ["Revenue Department"],
  "Residence Certificate": ["Revenue Department"],
  "Domicile Certificate": ["Revenue Department"],
  "Caste Certificate": ["Social Welfare Department"],
  "Senior Citizen Certificate": ["Social Welfare Department"],
  "Disability Certificate": ["Social Welfare Department"],
};

const EMERGENCY_TYPES = [
  "Flood",
  "Fire",
  "Medical Emergency",
  "Road Accident",
  "Building Collapse",
  "Water Crisis",
  "Electricity Hazard",
  "Animal Attack",
  "Landslide",
  "Storm Damage",
];
const EMERGENCY_SEVERITIES = ["Low", "Medium", "High", "Critical"];
const EMERGENCY_STATUSES = ["Submitted", "Acknowledged", "Assigned", "In Progress", "Resolved", "Closed"];
const EMERGENCY_DEPARTMENTS = [
  "Disaster Management Cell",
  "Health Department",
  "Police Department",
  "Fire Department",
  "Municipal Corporation",
  "Panchayat Emergency Team",
  "Electricity Department",
];
const EMERGENCY_TYPE_DEPARTMENTS = {
  Flood: ["Disaster Management Cell", "Panchayat Emergency Team"],
  Fire: ["Fire Department"],
  "Medical Emergency": ["Health Department"],
  "Road Accident": ["Police Department", "Health Department"],
  "Building Collapse": ["Disaster Management Cell", "Municipal Corporation"],
  "Water Crisis": ["Municipal Corporation", "Panchayat Emergency Team"],
  "Electricity Hazard": ["Electricity Department"],
  "Animal Attack": ["Disaster Management Cell", "Panchayat Emergency Team"],
  Landslide: ["Disaster Management Cell"],
  "Storm Damage": ["Disaster Management Cell", "Municipal Corporation"],
};
const RESOURCE_TYPES = [
  "Food Packets",
  "Water Bottles",
  "Medical Kits",
  "Blankets",
  "Emergency Shelters",
  "Ambulances",
  "Rescue Boats",
  "Generators",
];
const RESOURCE_STATUSES = ["Available", "Low Stock", "Depleted", "Maintenance"];
const VOLUNTEER_SKILLS = [
  "Medical",
  "Rescue",
  "Food Distribution",
  "Transportation",
  "First Aid",
  "Communication",
  "Shelter Management",
];
const VOLUNTEER_AVAILABILITY = ["Available", "Assigned", "Unavailable"];
const VOLUNTEER_APPROVAL_STATUSES = ["Pending", "Approved", "Rejected"];
const ANNOUNCEMENT_TYPES = [
  "Flood Warning",
  "Cyclone Alert",
  "Heatwave Alert",
  "Water Supply Notice",
  "Power Outage Notice",
  "Road Closure Notice",
];
const ANNOUNCEMENT_STATUSES = ["Draft", "Published", "Archived"];
const ANNOUNCEMENT_AUDIENCES = ["All", "Citizens", "Officers", "Volunteers"];

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
  EMERGENCY_TYPES,
  EMERGENCY_SEVERITIES,
  EMERGENCY_STATUSES,
  EMERGENCY_DEPARTMENTS,
  EMERGENCY_TYPE_DEPARTMENTS,
  RESOURCE_TYPES,
  RESOURCE_STATUSES,
  VOLUNTEER_SKILLS,
  VOLUNTEER_AVAILABILITY,
  VOLUNTEER_APPROVAL_STATUSES,
  ANNOUNCEMENT_TYPES,
  ANNOUNCEMENT_STATUSES,
  ANNOUNCEMENT_AUDIENCES,
};
