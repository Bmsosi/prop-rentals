import { generateUploadUrl } from "../services/fileStorageService.js";
import { SuccessResponse, HandleError } from "../utils/httpResponse.js";

export async function getApplicationProofUploadUrl(req, res) {
  try {
    const { fileName, fileType } = req.query;

    if (!fileName || !fileType) {
      return res.status(400).json({ message: "Missing fileName or fileType" });
    }

 
    const category = "applications/proofs";
    const result = await generateUploadUrl(fileName, fileType, category);

    return SuccessResponse(
      res,
      200,
      "Application proof upload URL generated successfully",
      result
    );
  } catch (error) {
    return HandleError(res, error);
  }
}
