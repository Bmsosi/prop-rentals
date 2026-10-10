import jwt from "jsonwebtoken";

export const signToken = (user) => {
  if (!process.env.JWT_SECRET) {
    throw Object.assign(new Error("JWT_SECRET missing"), { status: 500 });
  }

  return jwt.sign(
    { userId: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "1h" }
  );
};
