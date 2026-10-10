import express from "express";
import { 
    generateLeaseInviteController, 
    getLeaseInviteController, 
    signLeaseController 
} from "../controllers/inviteLeaseController.js";
import { authenticate } from "../middleware/AuthMiddleware.js";

const router = express.Router();

// POST /api/v1/leases-invite/:id/invite - Generate invite link (requires auth)
router.post("/:id/invite", authenticate, generateLeaseInviteController);

// GET /api/v1/leases-invite/invite/:token - Check lease status (public, uses token)
router.get("/invite/:token", getLeaseInviteController);

// POST /api/v1/leases-invite/sign/:token - Sign lease (public, uses token + userId for verification)
router.post("/sign/:token", signLeaseController);

export default router;
