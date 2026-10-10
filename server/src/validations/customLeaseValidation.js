import { z } from "zod";

export const createCustomLeaseSchema = z.object({
    leaseName: z.string().min(1),
    propertyCategory: z.string(),
    propertyType: z.string(),
    description: z.string().optional(),
    fileUrl: z.string().url(),
    tenantId: z.string().optional(),
    listingId: z.string().optional(),
    // Accounting fields (optional)
    rentAmount: z.number().positive().optional().nullable(),
    paymentFrequency: z.enum(['DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY']).optional().nullable(),
    startDate: z.coerce.date().optional().nullable(),
    endDate: z.coerce.date().optional().nullable(),
    paymentDay: z.number().int().min(1).max(31).optional().nullable(),
    securityDeposit: z.number().nonnegative().optional().nullable(),
    depositAmount: z.number().nonnegative().optional().nullable(),
    paymentMethod: z.string().optional().nullable(),
    accountingNotes: z.string().optional().nullable(),
});

export const updateCustomLeaseSchema = z.object({
    leaseName: z.string().min(1).optional(),
    propertyCategory: z.string().optional(),
    propertyType: z.string().optional(),
    description: z.string().optional(),
    fileUrl: z.string().url().optional(),
    tenantId: z.string().nullable().optional(),
    listingId: z.string().optional(),
    leaseStatus: z.string().optional(),
    // Accounting fields (optional)
    rentAmount: z.number().positive().optional().nullable(),
    paymentFrequency: z.enum(['DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY']).optional().nullable(),
    startDate: z.coerce.date().optional().nullable(),
    endDate: z.coerce.date().optional().nullable(),
    paymentDay: z.number().int().min(1).max(31).optional().nullable(),
    securityDeposit: z.number().nonnegative().optional().nullable(),
    depositAmount: z.number().nonnegative().optional().nullable(),
    paymentMethod: z.string().optional().nullable(),
    accountingNotes: z.string().optional().nullable(),
});
