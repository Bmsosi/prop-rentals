import { z } from "zod";

export const createMaintenanceRequestSchema = z.object({
  listingId: z.string().trim().min(1, "Listing ID is required"),
  title: z
    .string()
    .trim()
    .min(3, "Title must be at least 3 characters")
    .max(200),
  description: z
    .string()
    .trim()
    .min(10, "Description must be at least 10 characters"),
  category: z.enum([
    "PLUMBING",
    "ELECTRICAL",
    "HVAC",
    "APPLIANCE",
    "STRUCTURAL",
    "PEST_CONTROL",
    "CLEANING",
    "LANDSCAPING",
    "SECURITY",
    "OTHER",
  ]),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
  images: z.array(z.string().trim().min(1)).max(10).optional(),
  listingId: z.string().optional(),
});

export const updateMaintenanceRequestSchema = z.object({
  status: z.enum(["OPEN", "IN_PROGRESS", "COMPLETED", "CANCELLED"]).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
  description: z.string().trim().min(10).optional(),
});
