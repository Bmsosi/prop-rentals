import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { v4 as uuidv4 } from "uuid";

const s3Client = new S3Client({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

export const uploadToS3 = async (file, folderPath = "uploads") => {
  if (!file) throw new Error("No file provided");

  const fileKey = `${folderPath}/${uuidv4()}-${file.originalname}`;

  const params = {
    Bucket: process.env.AWS_S3_BUCKET || process.env.S3_BUCKET_NAME,
    Key: fileKey,
    Body: file.buffer,
    ContentType: file.mimetype,
  };

  try {
    const command = new PutObjectCommand(params);
    await s3Client.send(command);

    // Construct the URL manually (assuming standard S3 URL format)
    const region = process.env.AWS_REGION || "us-east-1";
    const bucket = process.env.AWS_S3_BUCKET || process.env.S3_BUCKET_NAME;
    const url = `https://${bucket}.s3.${region}.amazonaws.com/${fileKey}`;

    return url;
  } catch (error) {
    console.error("S3 upload error:", error);
    throw new Error(`Failed to upload file to S3: ${error.message}`);
  }
};
