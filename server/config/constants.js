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
const COMPLAINT_SUBCATEGORY_MAP = {
  Roads: ["Potholes", "Broken Culvert", "Road Blockage", "Damaged Bridge"],
  Water: ["No Water Supply", "Pipe Leakage", "Contaminated Water", "Handpump Failure"],
  Electricity: ["Power Cut", "Transformer Fault", "Loose Wires", "Pole Damage"],
  Sanitation: ["Open Drain", "Public Toilet", "Sewage Overflow", "Cleaning Request"],
  "Street Lights": ["Light Not Working", "Broken Pole", "New Installation Request"],
  Health: ["PHC Issue", "Medicine Shortage", "Ambulance Delay", "Public Health Hazard"],
  "Waste Management": ["Garbage Collection Delay", "Dumping Issue", "Waste Overflow"],
  Drainage: ["Blocked Drain", "Flooding", "Water Logging"],
  Traffic: ["Signal Issue", "Congestion", "Parking Problem"],
  Garbage: ["Garbage Not Collected", "Garbage Overflow", "Animal Scattering Waste"],
  "Municipal Issues": ["Encroachment", "Public Space Damage", "Tax/Service Issue"],
  "Public Safety": ["Unsafe Area", "Broken Barrier", "Fire Risk", "Emergency Hazard"],
  Other: ["General Complaint"],
};
const COMPLAINT_CATEGORY_DEPARTMENTS = {
  Roads: "Local Administration Department",
  Water: "Local Administration Department",
  Electricity: "Local Administration Department",
  Sanitation: "Local Administration Department",
  "Street Lights": "Local Administration Department",
  Health: "Social Welfare Department",
  "Waste Management": "Local Administration Department",
  Drainage: "Local Administration Department",
  Traffic: "Local Administration Department",
  Garbage: "Local Administration Department",
  "Municipal Issues": "Local Administration Department",
  "Public Safety": "Local Administration Department",
  Other: "Local Administration Department",
};
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
  COMPLAINT_SUBCATEGORY_MAP,
  COMPLAINT_CATEGORY_DEPARTMENTS,
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
