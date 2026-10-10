import express from "express";
import {
  createInvoiceController,
  getInvoicesByMaintenanceRequestController,
  getInvoiceByIdController,
  updateInvoiceController,
  updateInvoiceStatusController,
  deleteInvoiceController,
  getAllInvoicesController,
} from "../controllers/invoiceController.js";
import { authenticate } from "../middleware/AuthMiddleware.js";
import { authorize } from "../middleware/authorizeMiddlewear.js";

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Create invoice (landlord or authorized tenant)
router.post("/", authorize(["LANDLORD", "ADMIN", "TENANT"]), createInvoiceController);

// Get all invoices (with query filters)
router.get("/", getAllInvoicesController);

// Get invoice by ID
router.get("/:id", getInvoiceByIdController);

// Update invoice (general - can update sharedWithTenant, etc.)
router.put("/:id", authorize(["LANDLORD", "ADMIN"]), updateInvoiceController);

// Update invoice status
router.put("/:id/status", authorize(["LANDLORD", "ADMIN"]), updateInvoiceStatusController);

// Delete invoice
router.delete("/:id", authorize(["LANDLORD", "ADMIN"]), deleteInvoiceController);

export default router;

