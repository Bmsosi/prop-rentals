import { Router } from "express";
import {
  createListing,
  fetchAllListings,
  fetchListingById,
  deleteListing,
  updateListing,
  checkListingLeasesController,
} from "../controllers/listingController.js";
import { authenticate } from "../middleware/AuthMiddleware.js";
import { authorize } from "../middleware/authorizeMiddlewear.js";

const router = Router();

/**
 * @swagger
 * /api/listings:
 *   post:
 *     summary: Create a new listing
 *     tags: [Listings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Listing created successfully
 *   get:
 *     summary: Get all listings
 *     tags: [Listings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all listings
 *
 * /api/listings/{id}:
 *   get:
 *     summary: Get a single listing by ID
 *     tags: [Listings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The listing ID
 *     responses:
 *       200:
 *         description: Listing found
 *       404:
 *         description: Listing not found
 *   put:
 *     summary: Update an existing listing by ID
 *     tags: [Listings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Listing ID to update
 *     responses:
 *       200:
 *         description: Listing updated successfully
 *       403:
 *         description: Forbidden access
 *       404:
 *         description: Listing not found
 */

router.post("/", authenticate, authorize(["ADMIN"]), createListing);
router.get(
  "/",
  authenticate,
  authorize(["ADMIN", "LANDLORD", "TENANT"]),
  fetchAllListings
);
router.get(
  "/:id",
  authenticate,
  authorize(["ADMIN", "LANDLORD", "TENANT"]),
  fetchListingById
);
router.put(
  "/:id",
  authenticate,
  authorize(["ADMIN", "LANDLORD"]),
  updateListing
);
router.delete("/:id", authenticate, authorize(["ADMIN"]), deleteListing);
router.get("/:id/check-leases", checkListingLeasesController);

export default router;
