export const formatDate = (value) =>
  new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));

export const getRelativeTime = (value) => {
  const now = Date.now();
  const createdAt = new Date(value).getTime();
  const diffInHours = Math.round((createdAt - now) / (1000 * 60 * 60));
  const formatter = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

  if (Math.abs(diffInHours) < 24) {
    return formatter.format(diffInHours, "hour");
  }

  return formatter.format(Math.round(diffInHours / 24), "day");
};

export const getRoleLabel = (role = "citizen") => {
  const labels = {
    citizen: "Citizen",
    volunteer: "Volunteer",
    panchayatOfficer: "Panchayat Officer",
    departmentOfficer: "Department Officer",
    districtAdmin: "District Admin",
    stateAdmin: "State Admin",
    superAdmin: "Super Admin",
  };

  return labels[role] || role;
};

export const getStatusTone = (status = "Pending") => {
  const tones = {
    Pending: "bg-amber-100 text-amber-900",
    "In Progress": "bg-sky-100 text-sky-900",
    Resolved: "bg-emerald-100 text-emerald-900",
    Rejected: "bg-rose-100 text-rose-900",
  };

  return tones[status] || "bg-slate-100 text-slate-900";
};

export const getPriorityTone = (priority = "Medium") => {
  const tones = {
    Low: "bg-slate-100 text-slate-900",
    Medium: "bg-amber-100 text-amber-900",
    High: "bg-orange-100 text-orange-900",
    Critical: "bg-red-100 text-red-900",
  };

  return tones[priority] || "bg-slate-100 text-slate-900";
};

export const getPriorityLabel = (priority = "Medium") => {
  return priority === "Critical" ? "Emergency-grade" : priority;
};

export const getAllowedTransitions = (status) => {
  const transitions = {
    Pending: ["In Progress", "Rejected"],
    "In Progress": ["Resolved", "Rejected"],
    Resolved: [],
    Rejected: [],
  };

  return transitions[status] || [];
};

export const getApiErrorMessage = (error) => {
  const details = error.response?.data?.details;

  if (Array.isArray(details) && details.length) {
    return details.map((detail) => detail.message).join(" ");
  }

  return error.response?.data?.message || error.message || "Request failed.";
};

export const getCertificateStatusTone = (status = "Submitted") => {
  const tones = {
    Submitted: "bg-amber-100 text-amber-900",
    "Under Review": "bg-sky-100 text-sky-900",
    Approved: "bg-emerald-100 text-emerald-900",
    Rejected: "bg-rose-100 text-rose-900",
  };

  return tones[status] || "bg-slate-100 text-slate-900";
};
