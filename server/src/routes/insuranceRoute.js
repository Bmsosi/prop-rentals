import express from "express";
import {
  getPresignedUploadUrl,
  getPresignedDownloadUrl,
  createInsuranceController,
  getInsuranceByIdController,
  getAllInsurancesController,
  updateInsuranceController,
  verifyInsuranceController,
  rejectInsuranceController,
  sendReminderController,
  extractInsuranceDataController,
} from "../controllers/insuranceController.js";
import { authenticate } from "../middleware/AuthMiddleware.js";
import { authorize } from "../middleware/authorizeMiddlewear.js";
import { validateRequest } from "../middleware/validateRequest.js";
import {
  createInsuranceSchema,
  updateInsuranceSchema,
  getInsuranceSchema,
  getAllInsurancesSchema,
  verifyInsuranceSchema,
  rejectInsuranceSchema,
  sendReminderSchema,
  presignUrlSchema,
  extractInsuranceSchema,
} from "../validations/insuranceValidation.js";

const router = express.Router();

router.get(
  "/presign",
  authenticate,
  authorize(["TENANT"]),
  validateRequest(presignUrlSchema),
  getPresignedUploadUrl
);

router.get(
  "/download",
  authenticate,
  getPresignedDownloadUrl
);

router.post(
  "/extract",
  authenticate,
  authorize(["TENANT"]),
  validateRequest(extractInsuranceSchema),
  extractInsuranceDataController
);

router.post(
  "/",
  authenticate,
  authorize(["TENANT"]),
  validateRequest(createInsuranceSchema),
  createInsuranceController
);

router.get(
  "/",
  authenticate,
  validateRequest(getAllInsurancesSchema),
  getAllInsurancesController
);

router.get(
  "/:id",
  authenticate,
  validateRequest(getInsuranceSchema),
  getInsuranceByIdController
);

router.patch(
  "/:id",
  authenticate,
  authorize(["TENANT"]),
  validateRequest(updateInsuranceSchema),
  updateInsuranceController
);

router.patch(
  "/:id/verify",
  authenticate,
  authorize(["ADMIN"]),
  validateRequest(verifyInsuranceSchema),
  verifyInsuranceController
);

router.patch(
  "/:id/reject",
  authenticate,
  authorize(["ADMIN"]),
  validateRequest(rejectInsuranceSchema),
  rejectInsuranceController
);

router.post(
  "/:id/notify",
  authenticate,
  authorize(["ADMIN"]),
  validateRequest(sendReminderSchema),
  sendReminderController
);

export default router;

