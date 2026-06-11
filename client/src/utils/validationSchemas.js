import { z } from "zod";

import {
  ANNOUNCEMENT_AUDIENCES,
  ANNOUNCEMENT_STATUSES,
  ANNOUNCEMENT_TYPES,
  CERTIFICATE_TYPES,
  CERTIFICATE_TYPE_DEPARTMENTS,
  COMPLAINT_CATEGORIES,
  COMPLAINT_SUBCATEGORY_MAP,
  COMPLAINT_PRIORITIES,
  GOVERNMENT_DEPARTMENTS,
  EMERGENCY_DEPARTMENTS,
  EMERGENCY_SEVERITIES,
  EMERGENCY_STATUSES,
  EMERGENCY_TYPES,
  JURISDICTION_TYPES,
  RESOURCE_TYPES,
  VOLUNTEER_APPROVAL_STATUSES,
  VOLUNTEER_AVAILABILITY,
  VOLUNTEER_SKILLS,
} from "./constants";

export const loginSchema = z.object({
  email: z.email("Enter a valid email address."),
  password: z.string().min(6, "Password must be at least 6 characters long."),
});

export const registerSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters long."),
  fatherName: z.string().trim().max(100, "Father's name cannot exceed 100 characters.").optional().or(z.literal("")),
  motherName: z.string().trim().max(100, "Mother's name cannot exceed 100 characters.").optional().or(z.literal("")),
  dateOfBirth: z.string().trim().optional().or(z.literal("")),
  gender: z.enum(["", "Male", "Female", "Other"]),
  aadhaarNumber: z.string().trim().min(12, "Aadhaar number must be at least 12 characters.").max(20, "Aadhaar number cannot exceed 20 characters.").optional().or(z.literal("")),
  email: z.email("Enter a valid email address."),
  password: z.string().min(6, "Password must be at least 6 characters long."),
  role: z.literal("citizen"),
  department: z.string().optional(),
  designation: z.string().trim().max(100, "Designation cannot exceed 100 characters.").optional().or(z.literal("")),
  employeeId: z.string().trim().max(50, "Employee ID cannot exceed 50 characters.").optional().or(z.literal("")),
  jurisdictionType: z.enum(JURISDICTION_TYPES),
  state: z.string().trim().min(2, "State is required."),
  phone: z.string().trim().min(6, "Phone number is required."),
  address: z.string().trim().max(250, "Address cannot exceed 250 characters.").optional().or(z.literal("")),
  tehsil: z.string().trim().optional().or(z.literal("")),
  panchayat: z.string().trim().optional().or(z.literal("")),
  village: z.string().trim().optional().or(z.literal("")),
  district: z.string().trim().min(2, "District is required."),
  municipality: z.string().trim().optional().or(z.literal("")),
  ward: z.string().trim().max(50, "Ward cannot exceed 50 characters.").optional().or(z.literal("")),
  pincode: z.string().trim().max(12, "Pincode cannot exceed 12 characters.").optional().or(z.literal("")),
  occupation: z.string().trim().max(100, "Occupation cannot exceed 100 characters.").optional().or(z.literal("")),
}).superRefine((data, ctx) => {
  if (data.jurisdictionType === "Rural" && !data.village) {
    ctx.addIssue({
      code: "custom",
      path: ["village"],
      message: "Village is required for rural jurisdiction.",
    });
  }

  if (data.jurisdictionType === "Urban" && !data.municipality) {
    ctx.addIssue({
      code: "custom",
      path: ["municipality"],
      message: "Municipality is required for urban jurisdiction.",
    });
  }
});

export const complaintSchema = z.object({
  title: z.string().trim().min(3, "Title must be at least 3 characters long.").max(150, "Title cannot exceed 150 characters."),
  description: z
    .string()
    .trim()
    .min(10, "Description must be at least 10 characters long.")
    .max(2000, "Description cannot exceed 2000 characters."),
  category: z
    .string()
    .trim()
    .min(1, "Category is required.")
    .refine((value) => COMPLAINT_CATEGORIES.includes(value), "Choose a supported complaint category."),
  subcategory: z.string().trim().min(1, "Subcategory is required."),
  priority: z.enum(COMPLAINT_PRIORITIES),
  locationAddress: z.string().trim().max(200, "Location cannot exceed 200 characters.").optional().or(z.literal("")),
  landmark: z.string().trim().max(100, "Landmark cannot exceed 100 characters.").optional().or(z.literal("")),
  wardNumber: z.string().trim().max(50, "Ward number cannot exceed 50 characters.").optional().or(z.literal("")),
  citizenRemarks: z.string().trim().max(1000, "Citizen remarks cannot exceed 1000 characters.").optional().or(z.literal("")),
  latitude: z
    .string()
    .trim()
    .optional()
    .or(z.literal(""))
    .refine((value) => !value || !Number.isNaN(Number(value)), "Latitude must be a valid number."),
  longitude: z
    .string()
    .trim()
    .optional()
    .or(z.literal(""))
    .refine((value) => !value || !Number.isNaN(Number(value)), "Longitude must be a valid number."),
  jurisdictionType: z.enum(JURISDICTION_TYPES).optional(),
}).superRefine((data, ctx) => {
  const allowedSubcategories = COMPLAINT_SUBCATEGORY_MAP[data.category] || [];
  if (allowedSubcategories.length && !allowedSubcategories.includes(data.subcategory)) {
    ctx.addIssue({
      code: "custom",
      path: ["subcategory"],
      message: "Choose a supported subcategory for the selected complaint category.",
    });
  }
});

export const complaintWorkflowSchema = z.object({
  status: z.enum(["Pending", "In Progress", "Resolved", "Rejected"]),
  priority: z.enum(COMPLAINT_PRIORITIES).optional(),
  officerRemarks: z.string().trim().max(1000, "Officer remarks cannot exceed 1000 characters.").optional().or(z.literal("")),
  resolutionNotes: z.string().trim().max(2000, "Resolution notes cannot exceed 2000 characters.").optional().or(z.literal("")),
  responsibleDepartment: z.enum(GOVERNMENT_DEPARTMENTS).optional(),
});

export const certificateApplySchema = z
  .object({
    certificateType: z.enum(CERTIFICATE_TYPES),
    department: z.string().optional(),
    jurisdictionType: z.enum(JURISDICTION_TYPES),
    state: z.string().trim().min(2, "State is required."),
    district: z.string().trim().min(2, "District is required."),
    tehsil: z.string().trim().optional().or(z.literal("")),
    village: z.string().trim().optional().or(z.literal("")),
    municipality: z.string().trim().optional().or(z.literal("")),
    certificateDetails: z.record(z.string(), z.string().or(z.number())).optional(),
    remarks: z.string().trim().max(1000, "Remarks cannot exceed 1000 characters.").optional().or(z.literal("")),
  })
  .superRefine((data, ctx) => {
    if (data.jurisdictionType === "Rural" && !data.village) {
      ctx.addIssue({
        code: "custom",
        path: ["village"],
        message: "Village is required for rural certificates.",
      });
    }

    if (data.jurisdictionType === "Urban" && !data.municipality) {
      ctx.addIssue({
        code: "custom",
        path: ["municipality"],
        message: "Municipality is required for urban certificates.",
      });
    }
  })
  .passthrough();

export const certificateWorkflowSchema = z.object({
  remarks: z.string().trim().max(1000, "Remarks cannot exceed 1000 characters.").optional().or(z.literal("")),
});

export const emergencyCreateSchema = z.object({
  emergencyType: z.enum(EMERGENCY_TYPES),
  title: z.string().trim().min(3, "Title must be at least 3 characters long.").max(150, "Title cannot exceed 150 characters."),
  description: z.string().trim().min(10, "Description must be at least 10 characters long.").max(2000, "Description cannot exceed 2000 characters."),
  locationAddress: z.string().trim().min(3, "Location is required.").max(200, "Location cannot exceed 200 characters."),
  landmark: z.string().trim().max(100, "Landmark cannot exceed 100 characters.").optional().or(z.literal("")),
  latitude: z.string().trim().optional().or(z.literal("")).refine((value) => !value || !Number.isNaN(Number(value)), "Latitude must be a valid number."),
  longitude: z.string().trim().optional().or(z.literal("")).refine((value) => !value || !Number.isNaN(Number(value)), "Longitude must be a valid number."),
  severity: z.enum(EMERGENCY_SEVERITIES),
  peopleAffected: z.coerce.number().min(1, "At least one person must be affected."),
  contactNumber: z.string().trim().min(6, "Contact number is required."),
  jurisdictionType: z.enum(JURISDICTION_TYPES),
  state: z.string().trim().min(2, "State is required."),
  district: z.string().trim().min(2, "District is required."),
  tehsil: z.string().trim().optional().or(z.literal("")),
  village: z.string().trim().optional().or(z.literal("")),
  municipality: z.string().trim().optional().or(z.literal("")),
}).superRefine((data, ctx) => {
  if (data.jurisdictionType === "Rural" && !data.village) {
    ctx.addIssue({ code: "custom", path: ["village"], message: "Village is required for rural emergencies." });
  }

  if (data.jurisdictionType === "Urban" && !data.municipality) {
    ctx.addIssue({ code: "custom", path: ["municipality"], message: "Municipality is required for urban emergencies." });
  }
});

export const resourceSchema = z.object({
  resourceType: z.enum(RESOURCE_TYPES),
  resourceCategory: z.string().trim().max(100, "Resource category cannot exceed 100 characters.").optional().or(z.literal("")),
  quantity: z.coerce.number().min(0, "Quantity must be zero or more."),
  availableQuantity: z.coerce.number().min(0, "Available quantity must be zero or more."),
  locationAddress: z.string().trim().min(3, "Location is required."),
  latitude: z.string().trim().optional().or(z.literal("")).refine((value) => !value || !Number.isNaN(Number(value)), "Latitude must be a valid number."),
  longitude: z.string().trim().optional().or(z.literal("")).refine((value) => !value || !Number.isNaN(Number(value)), "Longitude must be a valid number."),
  jurisdictionType: z.enum(JURISDICTION_TYPES),
  state: z.string().trim().min(2, "State is required."),
  district: z.string().trim().min(2, "District is required."),
  tehsil: z.string().trim().optional().or(z.literal("")),
  village: z.string().trim().optional().or(z.literal("")),
  municipality: z.string().trim().optional().or(z.literal("")),
  department: z.enum(EMERGENCY_DEPARTMENTS),
  remarks: z.string().trim().max(500, "Remarks cannot exceed 500 characters.").optional().or(z.literal("")),
});

export const volunteerSchema = z.object({
  name: z.string().trim().min(2, "Volunteer name is required."),
  phone: z.string().trim().min(6, "Phone number is required."),
  district: z.string().trim().min(2, "District is required."),
  jurisdictionType: z.enum(JURISDICTION_TYPES),
  tehsil: z.string().trim().optional().or(z.literal("")),
  village: z.string().trim().optional().or(z.literal("")),
  municipality: z.string().trim().optional().or(z.literal("")),
  skills: z.union([z.enum(VOLUNTEER_SKILLS), z.array(z.enum(VOLUNTEER_SKILLS)).min(1, "Select at least one volunteer skill.")]),
  bloodGroup: z.string().trim().max(10, "Blood group cannot exceed 10 characters.").optional().or(z.literal("")),
  experience: z.string().trim().max(200, "Experience cannot exceed 200 characters.").optional().or(z.literal("")),
  emergencyContact: z.string().trim().max(100, "Emergency contact cannot exceed 100 characters.").optional().or(z.literal("")),
  certifications: z.string().trim().max(200, "Certifications cannot exceed 200 characters.").optional().or(z.literal("")),
  availabilityStatus: z.enum(VOLUNTEER_AVAILABILITY),
});

export const volunteerApprovalSchema = z.object({
  approvalStatus: z.enum(VOLUNTEER_APPROVAL_STATUSES),
});

export const volunteerAvailabilitySchema = z.object({
  availabilityStatus: z.enum(VOLUNTEER_AVAILABILITY),
});

export const announcementSchema = z.object({
  title: z.string().trim().min(3, "Title must be at least 3 characters long.").max(150, "Title cannot exceed 150 characters."),
  announcementType: z.enum(ANNOUNCEMENT_TYPES),
  message: z.string().trim().min(10, "Message must be at least 10 characters long.").max(2000, "Message cannot exceed 2000 characters."),
  department: z.enum(EMERGENCY_DEPARTMENTS),
  targetAudience: z.enum(ANNOUNCEMENT_AUDIENCES),
  jurisdictionType: z.enum(JURISDICTION_TYPES),
  state: z.string().trim().min(2, "State is required."),
  district: z.string().trim().min(2, "District is required."),
  tehsil: z.string().trim().optional().or(z.literal("")),
  village: z.string().trim().optional().or(z.literal("")),
  municipality: z.string().trim().optional().or(z.literal("")),
});

export const announcementPublishSchema = z.object({
  status: z.enum(ANNOUNCEMENT_STATUSES),
});

export const emergencyStatusSchema = z.object({
  status: z.enum(EMERGENCY_STATUSES),
  remarks: z.string().trim().max(1000, "Remarks cannot exceed 1000 characters.").optional().or(z.literal("")),
});
