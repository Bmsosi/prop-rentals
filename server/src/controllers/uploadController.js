import {
  generateUploadUrl,
  generateDownloadUrl,
} from "../services/fileStorageService.js";
import { SuccessResponse, HandleError } from "../utils/httpResponse.js";
import { uploadImage } from "../services/supabaseStorageService.js";

export async function uploadImageToSupabase(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Missing image file" });
    }

    const category = req.body.category || "listings";
    const result = await uploadImage(req.file, req.user.id, category);
    return SuccessResponse(res, 201, "Image uploaded successfully", result);
  } catch (error) {
    return HandleError(res, error);
  }
}

export async function uploadApplicationDocumentToSupabase(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "A document file is required" });
    }
    const result = await uploadImage(req.file, req.user?.id || "public", "applications");
    return SuccessResponse(res, 201, "Application document uploaded successfully", result);
  } catch (error) {
    return HandleError(res, error);
  }
}

export async function getawsS3PresignedUrl(req, res) {
  try {
    const { fileName, fileType, category } = req.query;

    if (!fileName || !fileType) {
      return res.status(400).json({ message: "Missing fileName or fileType" });
    }

    const result = await generateUploadUrl(fileName, fileType, category);
    return SuccessResponse(
      res,
      200,
      "Upload URL generated successfully",
      result
    );
  } catch (error) {
    return HandleError(res, error);
  }
}

export async function getawsS3DownloadUrl(req, res) {
  try {
    const { key } = req.query;

    if (!key) {
      return res.status(400).json({ message: "Missing file key" });
    }

    const downloadURL = await generateDownloadUrl(key);
    return SuccessResponse(res, 200, "Download URL generated successfully", {
      downloadURL,
    });
  } catch (error) {
    return HandleError(res, error);
  }
}

export async function getProfilePhotoUploadUrl(req, res) {
  try {
    const { fileName, fileType } = req.query;

    if (!fileName || !fileType) {
      return res.status(400).json({ message: "Missing fileName or fileType" });
    }

    // Validate file type
    if (!fileType.startsWith('image/')) {
      return res.status(400).json({ message: "Only image files are allowed" });
    }

    const category = "profiles";
    const result = await generateUploadUrl(fileName, fileType, category);

    return SuccessResponse(
      res,
      200,
      "Profile photo upload URL generated successfully",
      result
    );
  } catch (error) {
    return HandleError(res, error);
  }
}
