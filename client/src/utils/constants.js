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
export const COMPLAINT_SUBCATEGORY_MAP = {
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
export const CERTIFICATE_TYPES = [
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
export const CERTIFICATE_TYPE_DEPARTMENTS = {
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
export const CERTIFICATE_STATUSES = ["Submitted", "Under Review", "Approved", "Rejected"];
export const EMERGENCY_TYPES = [
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
export const EMERGENCY_SEVERITIES = ["Low", "Medium", "High", "Critical"];
export const EMERGENCY_STATUSES = ["Submitted", "Acknowledged", "Assigned", "In Progress", "Resolved", "Closed"];
export const EMERGENCY_DEPARTMENTS = [
  "Disaster Management Cell",
  "Health Department",
  "Police Department",
  "Fire Department",
  "Municipal Corporation",
  "Panchayat Emergency Team",
  "Electricity Department",
];
export const RESOURCE_TYPES = [
  "Food Packets",
  "Water Bottles",
  "Medical Kits",
  "Blankets",
  "Emergency Shelters",
  "Ambulances",
  "Rescue Boats",
  "Generators",
];
export const RESOURCE_STATUSES = ["Available", "Low Stock", "Depleted", "Maintenance"];
export const VOLUNTEER_SKILLS = [
  "Medical",
  "Rescue",
  "Food Distribution",
  "Transportation",
  "First Aid",
  "Communication",
  "Shelter Management",
];
export const VOLUNTEER_AVAILABILITY = ["Available", "Assigned", "Unavailable"];
export const VOLUNTEER_APPROVAL_STATUSES = ["Pending", "Approved", "Rejected"];
export const ANNOUNCEMENT_TYPES = [
  "Flood Warning",
  "Cyclone Alert",
  "Heatwave Alert",
  "Water Supply Notice",
  "Power Outage Notice",
  "Road Closure Notice",
];
export const ANNOUNCEMENT_STATUSES = ["Draft", "Published", "Archived"];
export const ANNOUNCEMENT_AUDIENCES = ["All", "Citizens", "Officers", "Volunteers"];
