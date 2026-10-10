import express from "express";
import {
  getawsS3PresignedUrl,
  getawsS3DownloadUrl,
  getProfilePhotoUploadUrl,
} from "../controllers/uploadController.js";
import { getApplicationProofUploadUrl } from "../controllers/applicationFileController.js";
import { authenticate } from "../middleware/AuthMiddleware.js";
import { submitPublicApplicationController } from "../controllers/requestApplicationController.js";

const router = express.Router();

/**
 * @swagger
 * /api/v1/upload/s3-url:
 *   get:
 *     summary: Get S3 presigned URL for file upload
 *     tags: [Upload]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: fileName
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: fileType
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           description: Category folder (listings, maintenance, profiles, etc)
 *     responses:
 *       200:
 *         description: Upload URL generated successfully
 *
 * /api/v1/upload/s3-download-url:
 *   get:
 *     summary: Get S3 presigned URL for file download
 *     tags: [Upload]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: key
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Download URL generated successfully
 */

router.get("/s3-url", authenticate, getawsS3PresignedUrl);
router.get("/s3-download-url", authenticate, getawsS3DownloadUrl);
router.get("/profile-photo-upload-url", authenticate, getProfilePhotoUploadUrl);
router.get("/application-proof-url", getApplicationProofUploadUrl);
router.post("/:publicId/submit", submitPublicApplicationController);

export default router;
