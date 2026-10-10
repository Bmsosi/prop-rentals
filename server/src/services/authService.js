import bcrypt from "bcrypt";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { randomUUID } from "crypto";
import { signToken } from "../utils/signJwtToken.js";
import { prisma, UserRole } from "../prisma/client.js";
import { sendPasswordResetEmail } from "./emailService.js";

const buildSafeUser = (user) => ({
  id: user.id,
  firstName: user.firstName,
  lastName: user.lastName,
  email: user.email,
  phone: user.phone,
  role: user.role,
  profileImage: user.profileImage,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

export const registerUser = async (body = {}) => {
  try {
    const {
      email,
      password,
      firstName,
      lastName,
      phone,
      role,
    } = body;
    
    // Validate inputs
    if (!email || !password) {
      const err = new Error("Email and password are required");
      err.status = 400;
      throw err;
    }

    // Validate role - use direct comparison instead of Object.values
    const validRoles = ["ADMIN", "TENANT"];
    if (!role || !validRoles.includes(role)) {
      const err = new Error("Invalid role. Allowed values: TENANT or ADMIN");
      err.status = 400;
      throw err;
    }

    // Check if prisma client is initialized
    if (!prisma) {
      const err = new Error("Database connection not available");
      err.status = 503;
      throw err;
    }

    const hashedPassword = await bcrypt.hash(
      password,
      Number(process.env.SALT_ROUNDS) || 12
    );

    const user = await prisma.user.create({
      data: {
        id: randomUUID(),
        email: email.toLowerCase().trim(),
        password: hashedPassword,
        firstName: firstName?.trim() || null,
        lastName: lastName?.trim() || null,
        phone: phone?.trim() || null,
        role,
        updatedAt: new Date(),
      },
    });

    const token = signToken(user);

    return { user: buildSafeUser(user), token };
  } catch (err) {
    // Handle Prisma-specific errors
    if (err.code === "P2002" && err.meta?.target?.includes("email")) {
      const conflict = new Error("Email already exists");
      conflict.status = 409;
      throw conflict;
    }
    if (err.code?.startsWith("P")) {
      const dbError = new Error("Database operation failed. Please try again.");
      dbError.status = 500;
      throw dbError;
    }
    // Re-throw if it's already our custom error
    throw err;
  }
};

export const loginUser = async (body = {}) => {
  try {
    const { email, password } = body;
    
    // Validate inputs
    if (!email || !password) {
      const err = new Error("Email and password are required");
      err.status = 400;
      throw err;
    }

    // Check if prisma client is initialized
    if (!prisma) {
      const err = new Error("Database connection not available");
      err.status = 503;
      throw err;
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!user) {
      const err = new Error("Invalid credentials");
      err.status = 401;
      throw err;
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      const err = new Error("Invalid credentials");
      err.status = 401;
      throw err;
    }

    const token = signToken(user);

    return { user: buildSafeUser(user), token };
  } catch (err) {
    // Handle Prisma-specific errors
    if (err.code === "P2002") {
      const conflict = new Error("Database constraint violation");
      conflict.status = 409;
      throw conflict;
    }
    if (err.code?.startsWith("P")) {
      const dbError = new Error("Database operation failed. Please try again.");
      dbError.status = 500;
      throw dbError;
    }
    // Re-throw if it's already our custom error
    throw err;
  }
};

export const requestPasswordReset = async (email) => {
  try {
    if (!email || !email.trim()) {
      const err = new Error("Email is required");
      err.status = 400;
      throw err;
    }

    if (!prisma) {
      const err = new Error("Database connection not available");
      err.status = 503;
      throw err;
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!user) {
      const err = new Error(
        "User not found. Please check the email you provided."
      );
      err.status = 404;
      throw err;
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenExpiry = new Date(Date.now() + 1000 * 60 * 30); // 30 minutes

    await prisma.user.update({
      where: { email: email.toLowerCase().trim() },
      data: { resetToken, resetTokenExpiry },
    });

    // Send email with reset link
    try {
      await sendPasswordResetEmail(user.email, resetToken);
    } catch (error) {
      console.error("Email sending error:", error);
      const err = new Error(
        "Failed to send reset email. Please try again later."
      );
      err.status = 500;
      throw err;
    }

    return { message: "Password reset link sent to your email" };
  } catch (err) {
    // Handle Prisma-specific errors
    if (err.code?.startsWith("P")) {
      const dbError = new Error("Database operation failed. Please try again.");
      dbError.status = 500;
      throw dbError;
    }
    throw err;
  }
};

export const resetPassword = async (token, newPassword) => {
  try {
    if (!token || !newPassword) {
      const err = new Error("Token and new password are required");
      err.status = 400;
      throw err;
    }

    if (!prisma) {
      const err = new Error("Database connection not available");
      err.status = 503;
      throw err;
    }

    const user = await prisma.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExpiry: { gte: new Date() },
      },
    });

    if (!user) {
      const err = new Error("Invalid or expired reset token");
      err.status = 400;
      throw err;
    }

    const hashedPassword = await bcrypt.hash(
      newPassword,
      Number(process.env.SALT_ROUNDS) || 12
    );

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null,
      },
    });

    return { message: "Password reset successful" };
  } catch (err) {
    // Handle Prisma-specific errors
    if (err.code?.startsWith("P")) {
      const dbError = new Error("Database operation failed. Please try again.");
      dbError.status = 500;
      throw dbError;
    }
    throw err;
  }
};

export const refreshToken = async (token) => {
  try {
    if (!token) {
      const err = new Error("Refresh token is required");
      err.status = 400;
      throw err;
    }

    if (!prisma) {
      const err = new Error("Database connection not available");
      err.status = 503;
      throw err;
    }

    // Verify the refresh token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (jwtError) {
      if (jwtError.name === "JsonWebTokenError") {
        const err = new Error("Invalid token");
        err.status = 401;
        throw err;
      }
      if (jwtError.name === "TokenExpiredError") {
        const err = new Error("Token has expired. Please login again.");
        err.status = 401;
        throw err;
      }
      throw jwtError;
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!user) {
      const err = new Error("User not found");
      err.status = 404;
      throw err;
    }

    // Generate new token
    const newToken = signToken(user);

    return {
      token: newToken,
      user: buildSafeUser(user),
    };
  } catch (err) {
    // Handle Prisma-specific errors
    if (err.code?.startsWith("P")) {
      const dbError = new Error("Database operation failed. Please try again.");
      dbError.status = 500;
      throw dbError;
    }
    throw err;
  }
};
