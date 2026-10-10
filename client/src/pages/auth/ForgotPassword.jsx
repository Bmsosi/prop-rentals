import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import api from "../../lib/axios";
import API_ENDPOINTS from "../../lib/apiEndpoints";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");

  const forgotPasswordMutation = useMutation({
    mutationFn: async (email) => {
      const response = await api.post(API_ENDPOINTS.AUTH.REQUEST_RESET, {
        email,
      });
      return response.data;
    },
    onSuccess: () => {
      setTimeout(() => {
        navigate("/login");
      }, 3000);
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    forgotPasswordMutation.mutate(email);
  };

  const { isPending, error, isSuccess } = forgotPasswordMutation;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md">
        {isSuccess && (
          <div className="mb-4 p-3 text-green-700 bg-green-100 border border-green-300 rounded">
            Password reset link sent! Check your email.
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 text-red-700 bg-red-100 border border-red-300 rounded">
            {error.response?.data?.message || error.message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow">
          <h1 className="text-2xl font-bold text-center mb-2">
            Forgot Password
          </h1>
          <p className="text-gray-600 text-center mb-6 text-sm">
            Enter your email and we'll send you a reset link
          </p>

          <div className="mb-4">
            <label className="block mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isPending || isSuccess}
              className="w-full p-2 border rounded disabled:opacity-50"
              placeholder="your@email.com"
            />
          </div>

          <button
            type="submit"
            disabled={isPending || isSuccess}
            className="w-full bg-gray-700 text-white p-2 rounded hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPending ? "Sending..." : "Send Reset Link"}
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
