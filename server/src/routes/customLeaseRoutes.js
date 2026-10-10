import { Router } from "express";
import {
    createCustomLeaseController,
    getAllCustomLeasesController,
    getCustomLeaseByIdController,
    updateCustomLeaseController,
    deleteCustomLeaseController,
    getCustomLeaseByListingIdController,
} from "../controllers/customLeaseController.js";
import { authenticate } from "../middleware/AuthMiddleware.js";
import { authorize } from "../middleware/authorizeMiddlewear.js";

const router = Router();

router.post("/", authenticate, authorize(["LANDLORD", "ADMIN"]), createCustomLeaseController);
router.get("/", authenticate, getAllCustomLeasesController);
router.get("/:id", authenticate, getCustomLeaseByIdController);
router.get("/by-listing/:listingId", authenticate, getCustomLeaseByListingIdController);
router.put("/:id", authenticate, authorize(["LANDLORD", "ADMIN"]), updateCustomLeaseController);
router.delete("/:id", authenticate, authorize(["LANDLORD", "ADMIN"]), deleteCustomLeaseController);

export default router;
