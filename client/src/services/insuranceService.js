import api from "../lib/axios";
import API_ENDPOINTS from "../lib/apiEndpoints";
import axios from "axios";

/**
 * Get presigned URL for uploading insurance document
 */
export const getPresignedUploadUrl = async (fileName, fileType) => {
  const response = await api.get(API_ENDPOINTS.INSURANCE.PRESIGN, {
    params: { fileName, fileType },
  });
  return response.data.data;
};

/**
 * Upload file to S3 using presigned URL
 */
export const uploadFileToS3 = async (presignedUrl, file, onProgress) => {
  await axios.put(presignedUrl, file, {
    headers: {
      "Content-Type": file.type,
    },
    onUploadProgress: (progressEvent) => {
      if (onProgress) {
        const percentCompleted = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total
        );
        onProgress(percentCompleted);
      }
    },
  });
};

/**
 * Extract insurance data from uploaded document using OCR
 */
export const extractInsuranceData = async (documentUrl, fileType) => {
  const response = await api.post(API_ENDPOINTS.INSURANCE.EXTRACT, {
    documentUrl,
    fileType,
  });
  return response.data.data;
};

/**
 * Create new insurance record
 */
export const createInsurance = async (insuranceData) => {
  const response = await api.post(API_ENDPOINTS.INSURANCE.BASE, insuranceData);
  return response.data.data;
};

/**
 * Get all insurances (with optional filters)
 */
export const getAllInsurances = async (filters = {}) => {
  const response = await api.get(API_ENDPOINTS.INSURANCE.BASE, {
    params: filters,
  });
  return response.data.data;
};

/**
 * Get insurance by ID
 */
export const getInsuranceById = async (id) => {
  const response = await api.get(API_ENDPOINTS.INSURANCE.BY_ID(id));
  return response.data.data;
};

/**
 * Update insurance record
 */
export const updateInsurance = async (id, updateData) => {
  const response = await api.patch(
    API_ENDPOINTS.INSURANCE.BY_ID(id),
    updateData
  );
  return response.data.data;
};

/**
 * Verify insurance (landlord only)
 */
export const verifyInsurance = async (id) => {
  const response = await api.patch(API_ENDPOINTS.INSURANCE.VERIFY(id));
  return response.data.data;
};

/**
 * Reject insurance (landlord only)
 */
export const rejectInsurance = async (id, rejectionReason) => {
  const response = await api.patch(API_ENDPOINTS.INSURANCE.REJECT(id), {
    rejectionReason,
  });
  return response.data.data;
};

/**
 * Send reminder to tenant (landlord only)
 */
export const sendInsuranceReminder = async (id, message = "") => {
  const response = await api.post(API_ENDPOINTS.INSURANCE.NOTIFY(id), {
    message,
  });
  return response.data.data;
};

/**
 * Get download URL for insurance document
 */
export const getDownloadUrl = async (documentKey) => {
  const response = await api.get(API_ENDPOINTS.INSURANCE.DOWNLOAD, {
    params: { key: documentKey },
  });
  return response.data.data.downloadURL;
};

/**
 * Complete upload workflow: upload file, extract data, return both
 */
export const uploadAndExtractInsurance = async (file, onUploadProgress) => {
  try {
    // Step 1: Get presigned URL
    const { uploadURL, fileUrl, key } = await getPresignedUploadUrl(
      file.name,
      file.type
    );

    // Step 2: Upload file to S3
    await uploadFileToS3(uploadURL, file, onUploadProgress);

    // Step 3: Extract data using OCR
    const extractedData = await extractInsuranceData(fileUrl, file.type);

    return {
      documentUrl: fileUrl,
      documentKey: key,
      extractedData,
    };
  } catch (error) {
    console.error("Error in upload and extract workflow:", error);
    throw error;
  }
};

