import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

/**
 * Get presigned URL for payment receipt upload
 */
export async function getPaymentReceiptUploadUrl(req, res) {
  try {
    const { fileName, fileType } = req.query;

    if (!fileName || !fileType) {
      return res.status(400).json({
        success: false,
        message: 'fileName and fileType are required',
      });
    }

    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
    const timestamp = Date.now();
    const key = `payment-receipts/${timestamp}-${sanitizedFileName}`;

    const command = new PutObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET,
      Key: key,
      ContentType: fileType,
    });

    const uploadURL = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
    const fileUrl = `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;

    res.status(200).json({
      success: true,
      data: {
        uploadURL,
        fileUrl,
      },
    });
  } catch (error) {
    console.error('Error generating payment receipt upload URL:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate upload URL',
      error: error.message,
    });
  }
}

/**
 * Get presigned URL for downloading payment receipt
 */
export async function getPaymentReceiptDownloadUrl(req, res) {
  try {
    const { fileUrl } = req.query;

    if (!fileUrl) {
      return res.status(400).json({
        success: false,
        message: 'fileUrl is required',
      });
    }

    // Extract key from the file URL
    const url = new URL(fileUrl);
    const key = url.pathname.substring(1); // Remove leading slash

    const command = new GetObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET,
      Key: key,
    });

    const downloadURL = await getSignedUrl(s3Client, command, { expiresIn: 3600 });

    res.status(200).json({
      success: true,
      data: {
        downloadURL,
      },
    });
  } catch (error) {
    console.error('Error generating payment receipt download URL:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate download URL',
      error: error.message,
    });
  }
}

