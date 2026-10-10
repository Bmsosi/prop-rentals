import { 
  registerUser, 
  loginUser, 
  requestPasswordReset, 
  resetPassword, 
  refreshToken 
} from "../services/authService.js";
import { CreatedResponse, SuccessResponse, HandleError } from "../utils/httpResponse.js";

export const register = async (req, res) => {
  try {
    const { user, token } = await registerUser(req.body || {});
    return CreatedResponse(res, "User registered successfully", { user, token });
  } catch (error) {
    return HandleError(res, error);
  }
};

export const login = async (req, res) => {
  try {
    const { user, token } = await loginUser(req.body || {});
    return SuccessResponse(res, 200, "Login successful", { user, token });
  } catch (error) {
    return HandleError(res, error);
  }
};


export const requestReset = async (req, res) => {
  try {
    const { email } = req.body;
    const result = await requestPasswordReset(email);
    return SuccessResponse(res, 200, result.message);
  } catch (error) {
    return HandleError(res, error);
  }
};

export const resetController = async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    const result = await resetPassword(token, newPassword);
    return SuccessResponse(res, 200, result.message);
  } catch (error) {
    return HandleError(res, error);
  }
};

export const refreshTokenController = async (req, res) => {
  try {
    const token = req.headers.authorization?.replace("Bearer ", "") || req.body.token;
    const result = await refreshToken(token);
    return SuccessResponse(res, 200, "Token refreshed successfully", result);
  } catch (error) {
    return HandleError(res, error);
  }
};
