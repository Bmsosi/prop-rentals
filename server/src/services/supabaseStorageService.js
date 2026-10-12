import crypto from "crypto";
import path from "path";
import { supabaseAdmin, getStorageBucket } from "../config/supabase.js";

export async function uploadImage(file, userId, category = "listings") {
  if (!supabaseAdmin) {
    const error = new Error(
      "Supabase Storage is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY."
    );
    error.status = 503;
    throw error;
  }

  const extension = path.extname(file.originalname).toLowerCase() || ".bin";
  const bucket = getStorageBucket(category);
  const objectPath = `${category}/${userId}/${crypto.randomUUID()}${extension}`;

  const { error } = await supabaseAdmin.storage
    .from(bucket)
    .upload(objectPath, file.buffer, {
      contentType: file.mimetype,
      cacheControl: "31536000",
      upsert: false,
    });

  if (error) {
    const uploadError = new Error(`Supabase Storage upload failed: ${error.message}`);
    uploadError.status = 502;
    throw uploadError;
  }

  const { data } = supabaseAdmin.storage.from(bucket).getPublicUrl(objectPath);

  return {
    bucket,
    path: objectPath,
    fileUrl: data.publicUrl,
  };
}
