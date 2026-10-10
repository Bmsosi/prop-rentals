import express from 'express';
import * as paymentController from '../controllers/paymentController.js';
export { paymentController as paymentControllerExport };
import {
  createPaymentSchema,
  updatePaymentSchema,
  markAsPaidSchema,
} from '../validations/paymentValidation.js';
import { validateRequest } from '../middleware/validateRequest.js';
import { authenticate } from '../middleware/AuthMiddleware.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/v1/payments
 * @desc    Get all payments for landlord with optional filters
 * @access  Private (Landlord)
 */
router.get('/', paymentController.getPayments);

/**
 * @route   GET /api/v1/payments/summary
 * @desc    Get payment summary for landlord
 * @access  Private (Landlord)
 */
router.get('/summary', paymentController.getPaymentSummary);

/**
 * @route   GET /api/v1/payments/:id
 * @desc    Get payment by ID
 * @access  Private (Landlord)
 */
router.get('/:id', paymentController.getPaymentById);

/**
 * @route   POST /api/v1/payments
 * @desc    Create new payment
 * @access  Private (Landlord)
 */
router.post(
  '/',
  validateRequest(createPaymentSchema),
  paymentController.createPayment
);

/**
 * @route   PUT /api/v1/payments/:id
 * @desc    Update payment
 * @access  Private (Landlord)
 */
router.put(
  '/:id',
  validateRequest(updatePaymentSchema),
  paymentController.updatePayment
);

/**
 * @route   POST /api/v1/payments/:id/mark-paid
 * @desc    Mark payment as paid
 * @access  Private (Landlord)
 */
router.post(
  '/:id/mark-paid',
  validateRequest(markAsPaidSchema),
  paymentController.markAsPaid
);

/**
 * @route   POST /api/v1/payments/:id/send-reminder
 * @desc    Send payment reminder to tenant
 * @access  Private (Landlord)
 */
router.post('/:id/send-reminder', paymentController.sendReminder);

/**
 * @route   POST /api/v1/payments/:id/upload-receipt
 * @desc    Upload payment receipt
 * @access  Private (Tenant)
 */
router.post('/:id/upload-receipt', paymentController.uploadReceipt);

/**
 * @route   POST /api/v1/payments/:id/approve-receipt
 * @desc    Approve payment receipt
 * @access  Private (Landlord)
 */
router.post('/:id/approve-receipt', paymentController.approveReceipt);

/**
 * @route   POST /api/v1/payments/:id/reject-receipt
 * @desc    Reject payment receipt
 * @access  Private (Landlord)
 */
router.post('/:id/reject-receipt', paymentController.rejectReceipt);

/**
 * @route   DELETE /api/v1/payments/:id
 * @desc    Delete payment
 * @access  Private (Landlord)
 */
router.delete('/:id', paymentController.deletePayment);

export default router;
