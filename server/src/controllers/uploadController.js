import {
  generateUploadUrl,
  generateDownloadUrl,
} from "../services/fileStorageService.js";
import { SuccessResponse, HandleError } from "../utils/httpResponse.js";

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
