import express from "express";
import {
  getawsS3PresignedUrl,
  getawsS3DownloadUrl,
  getProfilePhotoUploadUrl,
  uploadImageToSupabase,
  uploadApplicationDocumentToSupabase,
} from "../controllers/uploadController.js";
import { getApplicationProofUploadUrl } from "../controllers/applicationFileController.js";
import { authenticate } from "../middleware/AuthMiddleware.js";
import { submitPublicApplicationController } from "../controllers/requestApplicationController.js";
import multer from "multer";

const imageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, callback) =>
    callback(null, file.mimetype.startsWith("image/")),
});

const documentUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, callback) =>
    callback(null, file.mimetype.startsWith("image/") || file.mimetype === "application/pdf"),
});

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
router.post("/supabase-image", authenticate, imageUpload.single("file"), uploadImageToSupabase);
router.post("/supabase-document", documentUpload.single("file"), uploadApplicationDocumentToSupabase);
router.get("/application-proof-url", getApplicationProofUploadUrl);
router.post("/:publicId/submit", submitPublicApplicationController);

export default router;
