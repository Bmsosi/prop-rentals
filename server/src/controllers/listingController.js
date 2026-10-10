import { createListingSchema } from "../validations/listingValidation.js";
import {
  createListings,
  getAllListings,
  getListingById,
  deleteListingById,
  updateListingById,
  checkListingHasLeases,
} from "../services/listingService.js";
import {
  CreatedResponse,
  SuccessResponse,
  HandleError,
} from "../utils/httpResponse.js";
import {
  getFromCache,
  setInCache,
  generateCacheKey,
  invalidateEntityCache,
  CACHE_TTL,
} from "../utils/cache.js";

async function createListing(req, res) {
  try {
    const body = createListingSchema.parse(req.body);
    const userId = req.user.id;
    const listing = await createListings(userId, body);

    // Invalidate listings cache for this user
    await invalidateEntityCache('listings', userId);

    return CreatedResponse(res, "Listing created successfully", listing);
  } catch (error) {
    return HandleError(res, error);
  }
}

async function fetchAllListings(req, res) {
  try {
    const userId = req.user?.id; // from JWT payload
    const userRole = req.user?.role; // TENANT, LANDLORD, ADMIN

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: user not found",
      });
    }

    // Generate cache key based on user and role
    const cacheKey = generateCacheKey('listings', userId, { role: userRole });

    // Try to get from cache
    const cachedData = await getFromCache(cacheKey);
    if (cachedData) {
      return res.status(200).json(cachedData);
    }

    const listings = await getAllListings(userId, userRole);

    const response = {
      success: true,
      message: "Listings fetched successfully",
      timestamp: new Date().toISOString(),
      listing: listings,
    };

    // Cache the response for 5 minutes
    await setInCache(cacheKey, response, CACHE_TTL.DEFAULT);

    return res.status(200).json(response);
  } catch (error) {
    return HandleError(res, error);
  }
}

async function fetchListingById(req, res) {
  try {
    const { id } = req.params;
    
    // Generate cache key
    const cacheKey = generateCacheKey('listing', id);

    // Try to get from cache
    const cachedData = await getFromCache(cacheKey);
    if (cachedData) {
      return res.status(200).json(cachedData);
    }

    const listing = await getListingById(id);
    const response = {
      success: true,
      message: "Listing fetched successfully",
      data: listing,
    };

    // Cache the response for 5 minutes
    await setInCache(cacheKey, response, CACHE_TTL.DEFAULT);

    return res.status(200).json(response);
  } catch (error) {
    return HandleError(res, error);
  }
}

async function deleteListing(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const result = await deleteListingById(id, userId);

    // Invalidate cache for this listing and user's listings
    await invalidateEntityCache('listing', id);
    await invalidateEntityCache('listings', userId);

    return SuccessResponse(res, 200, result.message);
  } catch (error) {
    return HandleError(res, error);
  }
}

async function updateListing(req, res) {
  try {
    const { id } = req.params;
    const updates = req.body;
    const userId = req.user.id;
    const updatedListing = await updateListingById(id, userId, updates);

    // Invalidate cache for this listing and user's listings
    await invalidateEntityCache('listing', id);
    await invalidateEntityCache('listings', userId);

    return SuccessResponse(
      res,
      200,
      "Listing updated successfully",
      updatedListing
    );
  } catch (error) {
    return HandleError(res, error);
  }
}

async function checkListingLeasesController(req, res) {
  try {
    const { id } = req.params;

    const result = await checkListingHasLeases(id);

    return SuccessResponse(res, 200, "Lease check successful", result);
  } catch (error) {
    return HandleError(res, error);
  }
}

export {
  createListing,
  fetchAllListings,
  fetchListingById,
  deleteListing,
  updateListing,
  checkListingLeasesController,
};
