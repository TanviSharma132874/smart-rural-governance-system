import { z } from "zod";

import {
  ANNOUNCEMENT_AUDIENCES,
  ANNOUNCEMENT_STATUSES,
  ANNOUNCEMENT_TYPES,
  CERTIFICATE_TYPES,
  CERTIFICATE_TYPE_DEPARTMENTS,
  COMPLAINT_CATEGORIES,
  COMPLAINT_PRIORITIES,
  EMERGENCY_DEPARTMENTS,
  EMERGENCY_SEVERITIES,
  EMERGENCY_STATUSES,
  EMERGENCY_TYPES,
  GOVERNMENT_DEPARTMENTS,
  JURISDICTION_TYPES,
  RESOURCE_TYPES,
  USER_ROLES,
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
  email: z.email("Enter a valid email address."),
  password: z.string().min(6, "Password must be at least 6 characters long."),
  role: z.enum(USER_ROLES),
  department: z.string().optional(),
  jurisdictionType: z.enum(JURISDICTION_TYPES),
  state: z.string().trim().min(2, "State is required."),
  phone: z.string().trim().min(6, "Phone number is required."),
  tehsil: z.string().trim().optional().or(z.literal("")),
  village: z.string().trim().optional().or(z.literal("")),
  district: z.string().trim().min(2, "District is required."),
  municipality: z.string().trim().optional().or(z.literal("")),
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

  if (["departmentOfficer", "panchayatOfficer"].includes(data.role) && !data.department) {
    ctx.addIssue({
      code: "custom",
      path: ["department"],
      message: "Department is required for officer registration.",
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
  priority: z.enum(COMPLAINT_PRIORITIES),
  locationAddress: z.string().trim().max(200, "Location cannot exceed 200 characters.").optional().or(z.literal("")),
  landmark: z.string().trim().max(100, "Landmark cannot exceed 100 characters.").optional().or(z.literal("")),
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
});

export const certificateApplySchema = z
  .object({
    certificateType: z.enum(CERTIFICATE_TYPES),
    department: z.enum(GOVERNMENT_DEPARTMENTS),
    jurisdictionType: z.enum(JURISDICTION_TYPES),
    state: z.string().trim().min(2, "State is required."),
    district: z.string().trim().min(2, "District is required."),
    tehsil: z.string().trim().optional().or(z.literal("")),
    village: z.string().trim().optional().or(z.literal("")),
    municipality: z.string().trim().optional().or(z.literal("")),
    remarks: z.string().trim().max(1000, "Remarks cannot exceed 1000 characters.").optional().or(z.literal("")),
  })
  .superRefine((data, ctx) => {
    const allowedDepartments = CERTIFICATE_TYPE_DEPARTMENTS[data.certificateType] || [];
    if (allowedDepartments.length && !allowedDepartments.includes(data.department)) {
      ctx.addIssue({
        code: "custom",
        path: ["department"],
        message: "Selected department does not match the certificate type.",
      });
    }

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
  });

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
