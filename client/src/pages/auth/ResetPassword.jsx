import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import api from "../../lib/axios";
import API_ENDPOINTS from "../../lib/apiEndpoints";

export default function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [formData, setFormData] = useState({
    newPassword: "",
    confirmPassword: "",
  });
  const [validationError, setValidationError] = useState("");

  const resetPasswordMutation = useMutation({
    mutationFn: async ({ token, newPassword }) => {
      const response = await api.patch(API_ENDPOINTS.AUTH.RESET_PASSWORD, {
        token,
        newPassword,
      });
      return response.data;
    },
    onSuccess: () => {
      setTimeout(() => {
        navigate("/login");
      }, 2000);
    },
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setValidationError("");
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (formData.newPassword !== formData.confirmPassword) {
      setValidationError("Passwords do not match");
      return;
    }

    if (formData.newPassword.length < 6) {
      setValidationError("Password must be at least 6 characters");
      return;
    }

    if (!token) {
      setValidationError("Invalid reset token");
      return;
    }

    resetPasswordMutation.mutate({
      token,
      newPassword: formData.newPassword,
    });
  };

  const { isPending, error, isSuccess } = resetPasswordMutation;

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="w-full max-w-md">
          <div className="bg-white p-6 rounded shadow text-center">
            <h1 className="text-2xl font-bold mb-4">Invalid Reset Link</h1>
            <p className="text-gray-600 mb-4">
              This password reset link is invalid or has expired.
            </p>
            <button
              onClick={() => navigate("/forgot-password")}
              className="bg-gray-700 text-white px-4 py-2 rounded hover:bg-gray-800"
            >
              Request New Link
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md">
        {isSuccess && (
          <div className="mb-4 p-3 text-green-700 bg-green-100 border border-green-300 rounded">
            Password reset successful! Redirecting to login...
          </div>
        )}

        {(error || validationError) && (
          <div className="mb-4 p-3 text-red-700 bg-red-100 border border-red-300 rounded">
            {validationError || error.response?.data?.message || error.message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow">
          <h1 className="text-2xl font-bold text-center mb-6">
            Reset Password
          </h1>

          <div className="mb-4">
            <label className="block mb-1">New Password</label>
            <input
              type="password"
              name="newPassword"
              value={formData.newPassword}
              onChange={handleChange}
              required
              disabled={isPending || isSuccess}
              className="w-full p-2 border rounded disabled:opacity-50"
              placeholder="Enter new password"
              minLength={6}
            />
          </div>

          <div className="mb-4">
            <label className="block mb-1">Confirm Password</label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              disabled={isPending || isSuccess}
              className="w-full p-2 border rounded disabled:opacity-50"
              placeholder="Confirm new password"
            />
          </div>

          <button
            type="submit"
            disabled={isPending || isSuccess}
            className="w-full bg-gray-700 text-white p-2 rounded hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPending ? "Resetting..." : "Reset Password"}
          </button>

          <div className="mt-4 text-center text-sm text-gray-600">
            Remember your password?{" "}
            <button
              type="button"
              onClick={() => navigate("/login")}
              className="text-blue-500 hover:underline"
            >
              Login
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
