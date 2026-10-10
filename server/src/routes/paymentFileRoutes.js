import express from 'express';
import { authenticate } from '../middleware/AuthMiddleware.js';
import * as paymentFileController from '../controllers/paymentFileController.js';

const router = express.Router();

// Get presigned URL for uploading payment receipt
router.get('/payment-receipt-upload-url', authenticate, paymentFileController.getPaymentReceiptUploadUrl);

// Get presigned URL for downloading payment receipt
router.get('/payment-receipt-download-url', authenticate, paymentFileController.getPaymentReceiptDownloadUrl);

export default router;

