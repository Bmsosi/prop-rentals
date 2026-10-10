import * as invoiceService from "../services/invoiceService.js";
import { SuccessResponse, HandleError } from "../utils/httpResponse.js";

/**
 * Create a new invoice
 */
export const createInvoiceController = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    const invoice = await invoiceService.createInvoice(req.body, userId, userRole);
    return SuccessResponse(res, 201, "Invoice created successfully", invoice);
  } catch (error) {
    return HandleError(res, error);
  }
};

/**
 * Get invoices by maintenance request ID
 */
export const getInvoicesByMaintenanceRequestController = async (req, res) => {
  try {
    const { maintenanceRequestId } = req.query;
    const userId = req.user.id;
    const userRole = req.user.role;

    if (!maintenanceRequestId) {
      return res.status(400).json({ message: "maintenanceRequestId is required" });
    }

    const invoices = await invoiceService.getInvoicesByMaintenanceRequest(
      maintenanceRequestId,
      userId,
      userRole
    );
    return SuccessResponse(res, 200, "Invoices retrieved successfully", invoices);
  } catch (error) {
    return HandleError(res, error);
  }
};

/**
 * Get invoice by ID
 */
export const getInvoiceByIdController = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    const invoice = await invoiceService.getInvoiceById(id, userId, userRole);
    return SuccessResponse(res, 200, "Invoice retrieved successfully", invoice);
  } catch (error) {
    return HandleError(res, error);
  }
};

/**
 * Update invoice (general - can update sharedWithTenant, status, etc.)
 */
export const updateInvoiceController = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body; // { status?, sharedWithTenant? }
    const userId = req.user.id;
    const userRole = req.user.role;

    const invoice = await invoiceService.updateInvoice(id, updateData, userId, userRole);
    return SuccessResponse(res, 200, "Invoice updated successfully", invoice);
  } catch (error) {
    return HandleError(res, error);
  }
};

/**
 * Update invoice status
 */
export const updateInvoiceStatusController = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const userId = req.user.id;
    const userRole = req.user.role;

    if (!status) {
      return res.status(400).json({ message: "Status is required" });
    }

    const invoice = await invoiceService.updateInvoiceStatus(id, status, userId, userRole);
    return SuccessResponse(res, 200, "Invoice status updated successfully", invoice);
  } catch (error) {
    return HandleError(res, error);
  }
};

/**
 * Delete invoice
 */
export const deleteInvoiceController = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    await invoiceService.deleteInvoice(id, userId, userRole);
    return SuccessResponse(res, 200, "Invoice deleted successfully");
  } catch (error) {
    return HandleError(res, error);
  }
};

/**
 * Get all invoices for user
 */
export const getAllInvoicesController = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    const { status, maintenanceRequestId } = req.query;

    // If maintenanceRequestId is provided, use specific endpoint
    if (maintenanceRequestId) {
      const invoices = await invoiceService.getInvoicesByMaintenanceRequest(
        maintenanceRequestId,
        userId,
        userRole
      );
      return SuccessResponse(res, 200, "Invoices retrieved successfully", invoices);
    }

    const invoices = await invoiceService.getAllInvoicesForUser(userId, userRole, { status });
    return SuccessResponse(res, 200, "Invoices retrieved successfully", invoices);
  } catch (error) {
    return HandleError(res, error);
  }
};

