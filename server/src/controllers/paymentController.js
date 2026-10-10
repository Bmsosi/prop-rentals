import * as paymentService from "../services/paymentService.js";
import { validateRequest } from "../middleware/validateRequest.js";
import { z } from "zod";
import {
  getFromCache,
  setInCache,
  generateCacheKey,
  invalidateEntityCache,
  CACHE_TTL,
} from "../utils/cache.js";

/**
 * Get all payments for landlord or tenant
 * @route GET /api/v1/payments
 */
export const getPayments = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    const { search, status, type, category } = req.query;

    const filters = {
      search,
      status,
      type,
      category,
    };

    let result;
    if (userRole === "ADMIN") {
      // Landlord - get all payments for properties they own
      result = await paymentService.getPaymentsForLandlord(userId, filters);
    } else {
      // Tenant - get only their payments
      result = await paymentService.getPaymentsForTenant(userId, filters);
    }

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Error fetching payments:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch payments",
      error: error.message,
    });
  }
};

/**
 * Get payment summary
 * @route GET /api/v1/payments/summary
 */
export const getPaymentSummary = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    // Generate cache key
    const cacheKey = generateCacheKey("payments:summary", userId, {
      role: userRole,
    });

    // Try to get from cache
    const cachedData = await getFromCache(cacheKey);
    if (cachedData) {
      return res.status(200).json(cachedData);
    }

    let summary;
    if (userRole === "ADMIN") {
      summary = await paymentService.calculatePaymentSummary(userId);
    } else {
      summary = await paymentService.calculateTenantPaymentSummary(userId);
    }

    const response = {
      success: true,
      data: summary,
    };

    // Cache for 2 minutes (payment summaries change moderately)
    await setInCache(cacheKey, response, 120);

    res.status(200).json(response);
  } catch (error) {
    console.error("Error fetching payment summary:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch payment summary",
      error: error.message,
    });
  }
};

/**
 * Get payment by ID
 * @route GET /api/v1/payments/:id
 */
export const getPaymentById = async (req, res) => {
  try {
    const { id } = req.params;
    const landlordId = req.user.id;

    const payment = await paymentService.getPaymentById(id, landlordId);

    res.status(200).json({
      success: true,
      data: payment,
    });
  } catch (error) {
    console.error("Error fetching payment:", error);
    const statusCode = error.message === "Payment not found" ? 404 : 500;
    res.status(statusCode).json({
      success: false,
      message: error.message || "Failed to fetch payment",
    });
  }
};

/**
 * Create new payment
 * @route POST /api/v1/payments
 */
export const createPayment = async (req, res) => {
  try {
    const landlordId = req.user.id;
    const paymentData = req.body;

    const payment = await paymentService.createPayment(landlordId, paymentData);

    // Invalidate payment caches
    await invalidateEntityCache("payments", landlordId);
    await invalidateEntityCache("payments:summary", landlordId);

    res.status(201).json({
      success: true,
      message: "Payment created successfully",
      data: payment,
    });
  } catch (error) {
    console.error("Error creating payment:", error);
    res.status(400).json({
      success: false,
      message: error.message || "Failed to create payment",
    });
  }
};

/**
 * Update payment
 * @route PUT /api/v1/payments/:id
 */
export const updatePayment = async (req, res) => {
  try {
    const { id } = req.params;
    const landlordId = req.user.id;
    const updates = req.body;

    const payment = await paymentService.updatePayment(id, landlordId, updates);

    // Invalidate payment caches
    await invalidateEntityCache("payment", id);
    await invalidateEntityCache("payments", landlordId);
    await invalidateEntityCache("payments:summary", landlordId);

    res.status(200).json({
      success: true,
      message: "Payment updated successfully",
      data: payment,
    });
  } catch (error) {
    console.error("Error updating payment:", error);
    const statusCode = error.message === "Payment not found" ? 404 : 400;
    res.status(statusCode).json({
      success: false,
      message: error.message || "Failed to update payment",
    });
  }
};

/**
 * Mark payment as paid
 * @route POST /api/v1/payments/:id/mark-paid
 */
export const markAsPaid = async (req, res) => {
  try {
    const { id } = req.params;
    const landlordId = req.user.id;
    const paymentDetails = req.body;

    const payment = await paymentService.markPaymentAsPaid(
      id,
      landlordId,
      paymentDetails
    );

    // Invalidate payment caches
    await invalidateEntityCache("payment", id);
    await invalidateEntityCache("payments", landlordId);
    await invalidateEntityCache("payments:summary", landlordId);

    res.status(200).json({
      success: true,
      message: "Payment marked as paid successfully",
      data: payment,
    });
  } catch (error) {
    console.error("Error marking payment as paid:", error);
    const statusCode = error.message === "Payment not found" ? 404 : 400;
    res.status(statusCode).json({
      success: false,
      message: error.message || "Failed to mark payment as paid",
    });
  }
};

/**
 * Delete payment
 * @route DELETE /api/v1/payments/:id
 */
export const deletePayment = async (req, res) => {
  try {
    const { id } = req.params;
    const landlordId = req.user.id;

    await paymentService.deletePayment(id, landlordId);

    // Invalidate payment caches
    await invalidateEntityCache("payment", id);
    await invalidateEntityCache("payments", landlordId);
    await invalidateEntityCache("payments:summary", landlordId);

    res.status(200).json({
      success: true,
      message: "Payment deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting payment:", error);
    const statusCode = error.message === "Payment not found" ? 404 : 500;
    res.status(statusCode).json({
      success: false,
      message: error.message || "Failed to delete payment",
    });
  }
};

/**
 * Send payment reminder
 * @route POST /api/v1/payments/:id/send-reminder
 */
export const sendReminder = async (req, res) => {
  try {
    const { id } = req.params;
    const landlordId = req.user.id;

    await paymentService.sendPaymentReminder(id, landlordId);

    res.status(200).json({
      success: true,
      message: "Payment reminder sent successfully",
    });
  } catch (error) {
    console.error("Error sending payment reminder:", error);
    const statusCode = error.message === "Payment not found" ? 404 : 400;
    res.status(statusCode).json({
      success: false,
      message: error.message || "Failed to send payment reminder",
    });
  }
};

/**
 * Upload payment receipt
 * @route POST /api/v1/payments/:id/upload-receipt
 */
export const uploadReceipt = async (req, res) => {
  try {
    const { id } = req.params;
    const { proofUrl } = req.body;
    const tenantId = req.user.id;

    if (!proofUrl) {
      return res.status(400).json({
        success: false,
        message: "proofUrl is required",
      });
    }

    const updatedPayment = await paymentService.uploadPaymentProof(
      id,
      proofUrl,
      tenantId
    );

    // Invalidate payment caches
    await invalidateEntityCache("payment", id);
    await invalidateEntityCache("payments", tenantId);
    await invalidateEntityCache("payments:summary", tenantId);

    res.status(200).json({
      success: true,
      message: "Payment receipt uploaded successfully",
      data: updatedPayment,
    });
  } catch (error) {
    console.error("Error uploading payment receipt:", error);
    res.status(error.message.includes("Unauthorized") ? 403 : 500).json({
      success: false,
      message: error.message || "Failed to upload payment receipt",
    });
  }
};

/**
 * Approve payment receipt
 * @route POST /api/v1/payments/:id/approve-receipt
 */
export const approveReceipt = async (req, res) => {
  try {
    const { id } = req.params;
    const landlordId = req.user.id;

    const updatedPayment = await paymentService.approvePaymentReceipt(
      id,
      landlordId
    );

    // Invalidate payment caches
    await invalidateEntityCache("payment", id);
    await invalidateEntityCache("payments", landlordId);
    await invalidateEntityCache("payments:summary", landlordId);

    res.status(200).json({
      success: true,
      message: "Payment receipt approved successfully",
      data: updatedPayment,
    });
  } catch (error) {
    console.error("Error approving payment receipt:", error);
    const statusCode = error.message === "Payment not found" ? 404 : 400;
    res.status(statusCode).json({
      success: false,
      message: error.message || "Failed to approve payment receipt",
    });
  }
};

/**
 * Reject payment receipt
 * @route POST /api/v1/payments/:id/reject-receipt
 */
export const rejectReceipt = async (req, res) => {
  try {
    const { id } = req.params;
    const landlordId = req.user.id;
    const { reason } = req.body;

    const updatedPayment = await paymentService.rejectPaymentReceipt(
      id,
      landlordId,
      reason
    );

    // Invalidate payment caches
    await invalidateEntityCache("payment", id);
    await invalidateEntityCache("payments", landlordId);
    await invalidateEntityCache("payments:summary", landlordId);

    res.status(200).json({
      success: true,
      message: "Payment receipt rejected successfully",
      data: updatedPayment,
    });
  } catch (error) {
    console.error("Error rejecting payment receipt:", error);
    const statusCode = error.message === "Payment not found" ? 404 : 400;
    res.status(statusCode).json({
      success: false,
      message: error.message || "Failed to reject payment receipt",
    });
  }
};
