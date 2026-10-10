import { s3 } from "../config/aws.js";
import { PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export async function generateUploadUrl(
  fileName,
  fileType,
  category = "general"
) {
  const folder = category || "general";
  const sanitizedFolder = folder.replace(/[^a-zA-Z0-9_-]/g, "");
  // sanitize file name (keep extension)
  const lastDot = fileName.lastIndexOf(".");
  const base = lastDot > 0 ? fileName.slice(0, lastDot) : fileName;
  const ext = lastDot > 0 ? fileName.slice(lastDot) : "";
  const safeBase = base
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "") // remove non word/space/hyphen
    .trim()
    .replace(/[\s_]+/g, "-") // spaces/underscores to hyphen
    .toLowerCase();
  const safeExt = ext.replace(/[^.a-zA-Z0-9]/g, "");
  const safeName = safeBase || "file";

  const Key = `${sanitizedFolder}/${Date.now()}-${safeName}${safeExt}`;
  const command = new PutObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET,
    Key,
    ContentType: fileType,
  });

  // Increase expiration to 1 hour (3600 seconds) instead of 5 minutes
  const uploadURL = await getSignedUrl(s3, command, {
    expiresIn: Number(process.env.AWS_SIGNED_URL_EXPIRATION) || 3600,
  });

  const fileUrl = `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${Key}`;

  return { uploadURL, key: Key, fileUrl };
}

export async function generateDownloadUrl(key) {
  const command = new GetObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET,
    Key: key,
  });

  // Increase expiration to 1 hour (3600 seconds) instead of 5 minutes
  const downloadURL = await getSignedUrl(s3, command, {
    expiresIn: Number(process.env.AWS_SIGNED_URL_EXPIRATION) || 3600,
  });

  return downloadURL;
}
