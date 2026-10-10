import { getUserById, updateUserProfile, changeUserPassword } from "../services/userService.js";
import {
  SuccessResponse,
  NotFound,
  HandleError,
  BadRequest,
} from "../utils/httpResponse.js";
import {
  getFromCache,
  setInCache,
  generateCacheKey,
  invalidateEntityCache,
  CACHE_TTL,
} from "../utils/cache.js";

export const getUserProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Generate cache key
    const cacheKey = generateCacheKey('user', userId);

    // Try to get from cache
    const cachedData = await getFromCache(cacheKey);
    if (cachedData) {
      return res.status(200).json(cachedData);
    }

    const user = await getUserById(userId);

    if (!user) return NotFound(res, "User not found");

    const response = {
      success: true,
      message: "User profile retrieved successfully",
      data: user,
    };

    // Cache the response for 5 minutes
    await setInCache(cacheKey, response, CACHE_TTL.DEFAULT);

    return res.status(200).json(response);
  } catch (err) {
    console.error(err);
    return HandleError(res, err);
  }
};

export const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const updates = req.body;

    const updatedUser = await updateUserProfile(userId, updates);

    // Invalidate user cache
    await invalidateEntityCache('user', userId);

    return SuccessResponse(
      res,
      200,
      "Profile updated successfully",
      updatedUser
    );
  } catch (err) {
    console.error("Update profile error:", err);
    if (err.message === "Email is already in use") {
      return BadRequest(res, err.message);
    }
    return HandleError(res, err);
  }
};

export const changePassword = async (req, res) => {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return BadRequest(res, "Current password and new password are required");
    }

    if (newPassword.length < 6) {
      return BadRequest(res, "Password must be at least 6 characters long");
    }

    await changeUserPassword(userId, currentPassword, newPassword);

    return SuccessResponse(
      res,
      200,
      "Password changed successfully",
      null
    );
  } catch (err) {
    console.error("Change password error:", err);
    if (err.message === "Current password is incorrect") {
      return BadRequest(res, err.message);
    }
    if (err.message === "User not found") {
      return NotFound(res, err.message);
    }
    return HandleError(res, err);
  }
};
