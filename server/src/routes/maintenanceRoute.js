import { Router } from "express";
import {
  createMaintenance,
  fetchAllMaintenanceRequests,
  fetchMaintenanceRequestById,
  updateMaintenance,
  deleteMaintenance,
  fetchMaintenanceMessages,
  postMaintenanceMessage,
} from "../controllers/maintenanceController.js";
import { authenticate } from "../middleware/AuthMiddleware.js";
import { authorize } from "../middleware/authorizeMiddlewear.js";

const router = Router();

/**
 * @swagger
 * /api/v1/maintenance:
 *   post:
 *     summary: Create a new maintenance request
 *     tags: [Maintenance]
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
 *               - title
 *               - description
 *               - category
 *             properties:
 *               listingId:
 *                 type: string
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               category:
 *                 type: string
 *                 enum: [PLUMBING, ELECTRICAL, HVAC, APPLIANCE, STRUCTURAL, PEST_CONTROL, CLEANING, LANDSCAPING, SECURITY, OTHER]
 *               priority:
 *                 type: string
 *                 enum: [LOW, MEDIUM, HIGH, URGENT]
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Maintenance request created successfully
 *       403:
 *         description: No active lease for this property
 *   get:
 *     summary: Get all maintenance requests
 *     tags: [Maintenance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [OPEN, IN_PROGRESS, COMPLETED, CANCELLED]
 *       - in: query
 *         name: priority
 *         schema:
 *           type: string
 *           enum: [LOW, MEDIUM, HIGH, URGENT]
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *       - in: query
 *         name: listingId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Maintenance requests retrieved successfully
 *
 * /api/v1/maintenance/{id}:
 *   get:
 *     summary: Get maintenance request by ID
 *     tags: [Maintenance]
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
 *         description: Maintenance request retrieved successfully
 *       404:
 *         description: Maintenance request not found
 *   patch:
 *     summary: Update maintenance request
 *     tags: [Maintenance]
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
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [OPEN, IN_PROGRESS, COMPLETED, CANCELLED]
 *               priority:
 *                 type: string
 *                 enum: [LOW, MEDIUM, HIGH, URGENT]
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Maintenance request updated successfully
 *   delete:
 *     summary: Delete maintenance request
 *     tags: [Maintenance]
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
 *         description: Maintenance request deleted successfully
 *       400:
 *         description: Cannot delete request in current status
 */

router.post(
  "/",
  authenticate,
  authorize(["ADMIN", "TENANT"]),
  createMaintenance
);
router.get("/", authenticate, fetchAllMaintenanceRequests);
router.get("/:id", authenticate, fetchMaintenanceRequestById);
router.patch(
  "/:id",
  authenticate,
  authorize(["ADMIN", "TENANT"]),
  updateMaintenance
);
router.delete("/:id", authenticate, authorize(["ADMIN", "TENANT"]), deleteMaintenance);

// messages
router.get("/:id/messages", authenticate, fetchMaintenanceMessages);
router.post(
  "/:id/messages",
  authenticate,
  authorize(["ADMIN", "TENANT"]),
  postMaintenanceMessage
);

export default router;
