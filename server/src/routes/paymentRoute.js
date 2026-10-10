// server/src/routes/paymentRoutes.js
import express from "express";
import { authenticate } from "../middleware/AuthMiddleware.js";
import {
  getTenantPayments,
  uploadPaymentProof,
  upload,
} from "../controllers/paymentController.js";

const router = express.Router();

// Fetch all payments for the logged-in tenant
router.get("/tenant", authenticate, getTenantPayments);

// Upload proof of payment
router.post(
  "/upload-proof/:paymentId",
  authenticate,
  upload.single("paymentProof"), // handles file upload
  uploadPaymentProof
);

export default router;
