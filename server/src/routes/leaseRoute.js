import { Router } from "express";
import {
  createLeaseController,
  getAllLeasesController,
  getLeaseByIdController,
  updateLeaseController,
  deleteLeaseController,
  bulkDeleteLeasesController,
  getTenantLeasesController,
  getLeaseByListingIdController,
  regenerateContractPdfController,
} from "../controllers/leaseController.js";
import { authenticate } from "../middleware/AuthMiddleware.js";
import { authorize } from "../middleware/authorizeMiddlewear.js";

const router = Router();


router.get('/tenant', authenticate, authorize(["TENANT"]), getTenantLeasesController);
router.get('/by-listing/:listingId', authenticate, getLeaseByListingIdController);
/**
 * @swagger
 * /api/v1/leases:
 *   post:
 *     summary: Create a new lease
 *     tags: [Leases]
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
 *               - tenantId
 *               - startDate
 *               - endDate
 *               - rentAmount
 *               - paymentFrequency
 *             properties:
 *               listingId:
 *                 type: string
 *               tenantId:
 *                 type: string
 *               startDate:
 *                 type: string
 *                 format: date
 *               endDate:
 *                 type: string
 *                 format: date
 *               rentAmount:
 *                 type: number
 *               paymentFrequency:
 *                 type: string
 *                 enum: [WEEKLY, BI_WEEKLY, MONTHLY, QUARTERLY, YEARLY]
 *               securityDeposit:
 *                 type: number
 *               paymentMethod:
 *                 type: string
 *               leaseStatus:
 *                 type: string
 *                 enum: [DRAFT, ACTIVE, EXPIRED, TERMINATED]
 *               leaseDocument:
 *                 type: string
 *               signedContract:
 *                 type: string
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Lease created successfully
 *       403:
 *         description: Unauthorized
 *       404:
 *         description: Listing or tenant not found
 */
router.post(
  "/",
  authenticate,
  authorize(["LANDLORD", "ADMIN"]),
  createLeaseController
);

/**
 * @swagger
 * /api/v1/leases:
 *   get:
 *     summary: Get all leases (filtered by user role)
 *     tags: [Leases]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: leaseStatus
 *         schema:
 *           type: string
 *           enum: [DRAFT, ACTIVE, EXPIRED, TERMINATED]
 *         description: Filter by lease status
 *       - in: query
 *         name: listingId
 *         schema:
 *           type: string
 *         description: Filter by listing ID
 *     responses:
 *       200:
 *         description: Leases retrieved successfully
 */
router.get("/", authenticate, getAllLeasesController);

/**
 * @swagger
 * /api/v1/leases/bulk-delete:
 *   post:
 *     summary: Bulk delete leases
 *     tags: [Leases]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - ids
 *             properties:
 *               ids:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of lease IDs to delete
 *     responses:
 *       200:
 *         description: Leases deleted successfully
 *       400:
 *         description: Invalid request or no leases deleted
 *       403:
 *         description: Unauthorized
 */
router.post(
  "/bulk-delete",
  authenticate,
  authorize(["LANDLORD", "ADMIN"]),
  bulkDeleteLeasesController
);

/**
 * @swagger
 * /api/v1/leases/{id}:
 *   get:
 *     summary: Get a single lease by ID
 *     tags: [Leases]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The lease ID
 *     responses:
 *       200:
 *         description: Lease retrieved successfully
 *       403:
 *         description: Unauthorized
 *       404:
 *         description: Lease not found
 */
router.get("/:id", authenticate, getLeaseByIdController);

/**
 * @swagger
 * /api/v1/leases/{id}/regenerate-pdf:
 *   post:
 *     summary: Regenerate contract PDF for a lease
 *     tags: [Leases]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The lease ID
 *     responses:
 *       200:
 *         description: Contract PDF regenerated successfully
 *       403:
 *         description: Unauthorized
 *       404:
 *         description: Lease not found
 */
router.post(
  "/:id/regenerate-pdf",
  authenticate,
  authorize(["LANDLORD", "ADMIN"]),
  regenerateContractPdfController
);

/**
 * @swagger
 * /api/v1/leases/{id}:
 *   put:
 *     summary: Update lease details
 *     tags: [Leases]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The lease ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               endDate:
 *                 type: string
 *                 format: date
 *               rentAmount:
 *                 type: number
 *               paymentFrequency:
 *                 type: string
 *                 enum: [WEEKLY, BI_WEEKLY, MONTHLY, QUARTERLY, YEARLY]
 *               securityDeposit:
 *                 type: number
 *               paymentMethod:
 *                 type: string
 *               leaseStatus:
 *                 type: string
 *                 enum: [DRAFT, ACTIVE, EXPIRED, TERMINATED]
 *               leaseDocument:
 *                 type: string
 *               signedContract:
 *                 type: string
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Lease updated successfully
 *       403:
 *         description: Unauthorized
 *       404:
 *         description: Lease not found
 */
router.put(
  "/:id",
  authenticate,
  authorize(["LANDLORD", "ADMIN"]),
  updateLeaseController
);

/**
 * @swagger
 * /api/v1/leases/{id}:
 *   delete:
 *     summary: Delete a lease
 *     tags: [Leases]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The lease ID
 *     responses:
 *       200:
 *         description: Lease deleted successfully
 *       400:
 *         description: Cannot delete active lease
 *       403:
 *         description: Unauthorized
 *       404:
 *         description: Lease not found
 */
router.delete(
  "/:id",
  authenticate,
  authorize(["LANDLORD", "ADMIN"]),
  deleteLeaseController
);

export default router;
