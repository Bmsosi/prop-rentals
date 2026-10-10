import { z } from "zod";

export const employmentInfoSchema = z.object({
  employerName: z.string().trim().min(1, "Employer name is required"),
  jobTitle: z.string().trim().min(1, "Job title is required"),
  income: z.number().positive("Income must be positive").optional(),
  duration: z.string().trim().optional(),
  address: z.string().trim().optional(),
  proofDocument: z.string().url("Must be a valid URL").optional(),
});

export const createApplicationSchema = z.object({
  listingId: z.string().trim().min(1, "Listing ID is required"),
  tenantId: z.string().trim().optional(),
  fullName: z.string().trim().min(2, "Full name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().trim().optional(),
  dateOfBirth: z.string().datetime("Invalid date format").optional(),
  monthlyIncome: z
    .number()
    .positive("Monthly income must be positive")
    .optional(),
  currentAddress: z.string().trim().optional(),
  moveInDate: z.string().datetime("Invalid move-in date format").optional(),
  occupants: z.array(z.any()).optional(),
  pets: z.array(z.any()).optional(),
  documents: z.array(z.string().url("Document must be a valid URL")).optional(),
  references: z.array(z.any()).optional(),
  message: z.string().trim().optional(),
  expirationDate: z.string().datetime("Invalid expiration date format").optional(),
  employmentInfo: z.array(employmentInfoSchema).optional(),
});

export const updateApplicationStatusSchema = z.object({
  status: z.enum(["NEW", "PENDING", "APPROVED", "REJECTED", "CANCELLED"], {
    errorMap: () => ({
      message: "Status must be APPROVED, REJECTED, or CANCELLED",
    }),
  }),
  decisionNotes: z.string().trim().optional(),
});
