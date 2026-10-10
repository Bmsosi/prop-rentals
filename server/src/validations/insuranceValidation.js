import { z } from "zod";

export const createInsuranceSchema = z.object({
  body: z.object({
    leaseId: z.string().optional(),
    customLeaseId: z.string().optional(),
    providerName: z
      .string()
      .min(1, "Provider name is required")
      .max(255, "Provider name is too long"),
    policyNumber: z
      .string()
      .min(1, "Policy number is required")
      .max(100, "Policy number is too long"),
    coverageType: z
      .string()
      .min(1, "Coverage type is required")
      .max(100, "Coverage type is too long"),
    coverageAmount: z
      .number()
      .positive("Coverage amount must be positive")
      .optional(),
    monthlyCost: z
      .number()
      .positive("Monthly cost must be positive")
      .optional(),
    startDate: z.string().refine((date) => !isNaN(Date.parse(date)), {
      message: "Invalid start date format",
    }),
    expiryDate: z.string().refine((date) => !isNaN(Date.parse(date)), {
      message: "Invalid expiry date format",
    }),
    documentUrl: z.string().url("Invalid document URL"),
    documentKey: z.string().min(1, "Document key is required"),
    notes: z.string().max(1000, "Notes are too long").optional(),
  }),
});

export const updateInsuranceSchema = z.object({
  body: z.object({
    providerName: z
      .string()
      .min(1, "Provider name cannot be empty")
      .max(255, "Provider name is too long")
      .optional(),
    policyNumber: z
      .string()
      .min(1, "Policy number cannot be empty")
      .max(100, "Policy number is too long")
      .optional(),
    coverageType: z
      .string()
      .min(1, "Coverage type cannot be empty")
      .max(100, "Coverage type is too long")
      .optional(),
    coverageAmount: z
      .number()
      .positive("Coverage amount must be positive")
      .optional(),
    monthlyCost: z
      .number()
      .positive("Monthly cost must be positive")
      .optional(),
    startDate: z
      .string()
      .refine((date) => !isNaN(Date.parse(date)), {
        message: "Invalid start date format",
      })
      .optional(),
    expiryDate: z
      .string()
      .refine((date) => !isNaN(Date.parse(date)), {
        message: "Invalid expiry date format",
      })
      .optional(),
    documentUrl: z.string().url("Invalid document URL").optional(),
    documentKey: z.string().min(1, "Document key cannot be empty").optional(),
    notes: z.string().max(1000, "Notes are too long").optional(),
  }),
  params: z.object({
    id: z.string().min(1, "Insurance ID is required"),
  }),
});

export const getInsuranceSchema = z.object({
  params: z.object({
    id: z.string().min(1, "Insurance ID is required"),
  }),
});

export const getAllInsurancesSchema = z.object({
  query: z.object({
    status: z
      .enum(["PENDING", "VERIFIED", "REJECTED", "EXPIRING_SOON", "EXPIRED"])
      .optional(),
    leaseId: z.string().optional(),
    customLeaseId: z.string().optional(),
    page: z
      .string()
      .transform((val) => parseInt(val, 10))
      .pipe(z.number().int().positive())
      .optional(),
    limit: z
      .string()
      .transform((val) => parseInt(val, 10))
      .pipe(z.number().int().positive().max(100))
      .optional(),
  }),
});

export const verifyInsuranceSchema = z.object({
  params: z.object({
    id: z.string().min(1, "Insurance ID is required"),
  }),
});

export const rejectInsuranceSchema = z.object({
  params: z.object({
    id: z.string().min(1, "Insurance ID is required"),
  }),
  body: z.object({
    rejectionReason: z
      .string()
      .min(1, "Rejection reason is required")
      .max(500, "Rejection reason is too long"),
  }),
});

export const sendReminderSchema = z.object({
  params: z.object({
    id: z.string().min(1, "Insurance ID is required"),
  }),
  body: z.object({
    message: z
      .string()
      .min(1, "Message is required")
      .max(1000, "Message is too long")
      .optional(),
  }),
});

export const presignUrlSchema = z.object({
  query: z.object({
    fileName: z.string().min(1, "File name is required"),
    fileType: z.string().min(1, "File type is required"),
  }),
});

export const extractInsuranceSchema = z.object({
  body: z.object({
    documentUrl: z.string().url("Valid document URL is required"),
    fileType: z.string().optional(),
  }),
});
