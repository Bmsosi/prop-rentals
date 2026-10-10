import { Router } from "express";
import {
  createApplicationController,
  getAllApplicationsController,
  getApplicationByPublicIdController,
  updateApplicationStatusController,
  deleteApplicationController,
  bulkDeleteApplicationsController,
  submitPublicApplicationController,
} from "../controllers/requestApplicationController.js";
import { authenticate } from "../middleware/AuthMiddleware.js";
import { authorize } from "../middleware/authorizeMiddlewear.js";

const router = Router();

/**
 * @swagger
 * /api/v1/applications:
 *   post:
 *     summary: Create a new application (landlord only)
 *     tags: [Applications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - listingId
 *               - fullName
 *               - email
 *             properties:
 *               listingId:
 *                 type: string
 *               tenantId:
 *                 type: string
 *               fullName:
 *                 type: string
 *               email:
 *                 type: string
 *               phone:
 *                 type: string
 *               dateOfBirth:
 *                 type: string
 *                 format: date-time
 *               monthlyIncome:
 *                 type: number
 *               currentAddress:
 *                 type: string
 *               moveInDate:
 *                 type: string
 *                 format: date-time
 *               occupants:
 *                 type: array
 *                 items:
 *                   type: object
 *               pets:
 *                 type: array
 *                 items:
 *                   type: object
 *               documents:
 *                 type: array
 *                 items:
 *                   type: string
 *               references:
 *                 type: array
 *                 items:
 *                   type: object
 *               message:
 *                 type: string
 *               employmentInfo:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     employerName:
 *                       type: string
 *                     jobTitle:
 *                       type: string
 *                     income:
 *                       type: number
 *                     duration:
 *                       type: string
 *                     address:
 *                       type: string
 *                     proofDocument:
 *                       type: string
 *     responses:
 *       201:
 *         description: Application created successfully
 *       400:
 *         description: Validation error
 *       403:
 *         description: Not authorized
 *       404:
 *         description: Listing not found
 *   get:
 *     summary: Get all applications for landlord
 *     tags: [Applications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, APPROVED, REJECTED, CANCELLED]
 *       - in: query
 *         name: listingId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Applications retrieved successfully
 *       401:
 *         description: Not authenticated
 *
 * /api/v1/applications/{publicId}:
 *   get:
 *     summary: Get application by public ID (no auth required)
 *     tags: [Applications]
 *     parameters:
 *       - in: path
 *         name: publicId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Application retrieved successfully
 *       404:
 *         description: Application not found
 *
 * /api/v1/applications/{id}/status:
 *   patch:
 *     summary: Update application status (approve/reject)
 *     tags: [Applications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [APPROVED, REJECTED, CANCELLED]
 *               decisionNotes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Application status updated successfully
 *       400:
 *         description: Invalid status or application cannot be updated
 *       403:
 *         description: Not authorized
 *       404:
 *         description: Application not found
 *
 * /api/v1/applications/{id}:
 *   delete:
 *     summary: Delete an application
 *     tags: [Applications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Application deleted successfully
 *       400:
 *         description: Cannot delete approved application with lease
 *       403:
 *         description: Not authorized
 *       404:
 *         description: Application not found
 */

// Create application (landlord only)
router.post(
  "/",
  authenticate,
  authorize(["ADMIN"]),
  createApplicationController
);

router.get(
  "/",
  authenticate,
  authorize(["ADMIN"]),
  getAllApplicationsController
);

router.put("/public/:publicId", submitPublicApplicationController);

router.get("/:publicId", getApplicationByPublicIdController);

router.patch(
  "/:id/status",
  authenticate,
  authorize(["ADMIN"]),
  updateApplicationStatusController
);

router.delete(
  "/:id",
  authenticate,
  authorize(["ADMIN"]),
  deleteApplicationController
);

// Bulk delete
router.post(
  "/bulk-delete",
  authenticate,
  authorize(["ADMIN"]),
  bulkDeleteApplicationsController
);

export default router;
