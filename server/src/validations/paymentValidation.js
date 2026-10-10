import { z } from "zod";

/**
 * Schema for creating a payment
 */
export const createPaymentSchema = z.object({
  type: z.enum(['RENT', 'DEPOSIT', 'MAINTENANCE', 'REFUND', 'OTHER'], {
    errorMap: () => ({ message: 'Invalid payment type' }),
  }),
  
  amount: z
    .number()
    .positive("Amount must be greater than 0"),
  
  leaseId: z.string().trim().optional(),
  
  customLeaseId: z.string().trim().optional(),
  
  tenantId: z.string().trim().optional(),
  
  dueDate: z.coerce.date().optional(),
  
  paymentMethod: z.string().trim().optional(),
  
  reference: z.string().trim().optional(),
  
  notes: z.string().trim().optional(),
});

/**
 * Schema for updating a payment
 */
export const updatePaymentSchema = z.object({
  type: z.enum(['RENT', 'DEPOSIT', 'MAINTENANCE', 'REFUND', 'OTHER'], {
    errorMap: () => ({ message: 'Invalid payment type' }),
  }).optional(),
  
  amount: z
    .number()
    .positive("Amount must be greater than 0")
    .optional(),
  
  status: z.enum(['PENDING', 'PAID', 'FAILED', 'CANCELLED'], {
    errorMap: () => ({ message: 'Invalid payment status' }),
  }).optional(),
  
  dueDate: z.coerce.date().optional(),
  
  paidDate: z.coerce.date().optional(),
  
  paymentMethod: z.string().trim().optional(),
  
  reference: z.string().trim().optional(),
  
  notes: z.string().trim().optional(),
});

/**
 * Schema for marking payment as paid
 */
export const markAsPaidSchema = z.object({
  paidDate: z.coerce.date().optional(),
  
  paymentMethod: z.string().trim().optional(),
  
  reference: z.string().trim().optional(),
  
  notes: z.string().trim().optional(),
});

/**
 * Schema for query parameters
 */
export const paymentQuerySchema = z.object({
  search: z.string().trim().optional(),
  
  status: z.enum(['ALL', 'PENDING', 'PAID', 'FAILED', 'CANCELLED'], {
    errorMap: () => ({ message: 'Invalid status filter' }),
  }).optional(),
  
  type: z.enum(['ALL', 'RENT', 'DEPOSIT', 'MAINTENANCE', 'REFUND', 'OTHER'], {
    errorMap: () => ({ message: 'Invalid type filter' }),
  }).optional(),
});
