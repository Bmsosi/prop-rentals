import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "../../store/authStore";
import API_ENDPOINTS from "@/lib/apiEndpoints.js";
import api from "@/lib/axios.js";
import { Button } from "@/components/ui/button";
import { Copy, Eye, EyeOff, Mail } from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner"; // <-- import toast

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const loginMutation = useMutation({
    mutationFn: async (data) => {
      const response = await api.post(API_ENDPOINTS.AUTH.LOGIN, data);
      return response.data;
    },
    onSuccess: (data) => {
      // Clear all cached queries to prevent showing stale data from previous user
      queryClient.clear();
      console.log("🧹 Cleared all React Query cache on login");

      toast.success("Login successful!");
      setTimeout(() => {
        login(data.data.user, data.data.token);
        navigate(
          data.data.user.role === "TENANT"
            ? "/tenant/dashboard"
            : "/landlord/dashboard"
        );
      }, 1500);
    },
    onError: (err) => {
      // Prevent default error handling to avoid page blinking
      console.error("Login error:", err);

      // Handle different error response formats
      const errorMessage =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.response?.data?.data?.message ||
        err.message ||
        "Invalid email or password. Please try again.";

      // Show toast with longer duration
      toast.error(errorMessage, {
        duration: 5000, // Show for 5 seconds
      });
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    loginMutation.mutate(formData);
  };

  const { isPending } = loginMutation;

  // Demo credentials
  const demoEmail = "landlord@test.com";
  const demoPassword = "password123";
  const tenantEmail = "tenant@test.com";
  const tenantPassword = "password123";

  // const copyToClipboard = async (text, label) => {
  //   try {
  //     await navigator.clipboard.writeText(text);
  //     toast.success(`${label} copied`);
  //   } catch {
  //     toast.error(`Failed to copy ${label}`);
  //   }
  // };

  const fillDemo = () => {
    setFormData({ email: demoEmail, password: demoPassword });
    toast.success("Demo credentials filled");
  };

  return (
    <div 
      className="min-h-screen flex flex-col items-center justify-center p-4 relative"
      style={{
        backgroundImage: 'url(/images/PropEase_bg.jpg)',
        backgroundAttachment: 'fixed',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundSize: 'cover'
      }}
    >
      {/* Matte filter overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-background/80 via-card/50 to-background backdrop-blur-[1px] z-0"></div>
      <div className="relative z-10 w-full flex flex-col items-center justify-center">
      <div className="w-full max-w-sm rounded-2xl shadow-lg backdrop-blur-md bg-card/80">
        <form
          onSubmit={handleSubmit}
          className="bg-white backdrop-blur-sm px-8 py-10 rounded-2xl shadow-lg border border-border"
          autoComplete="off"
        >
          <div className="flex flex-col gap-0 my-4">
            <h1 className="text-2xl font-bold text-left mb-2 text-primary">
              Login
            </h1>
            <p className="text-sm text-foreground/80 mb-6">
              Please login to your account
            </p>
          </div>
          <div className="mb-4">
            <label className="block mb-1 text-primary font-medium">Email</label>
            <div className="relative">
              <Input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                disabled={isPending}
                autoComplete="off"
                placeholder="your@email.com"
                className="w-full p-2 pr-10 rounded disabled:opacity-50 bg-white text-foreground placeholder:text-foreground/50"
              />
              <div className="absolute inset-y-0 right-3 flex items-center text-foreground/70 pointer-events-none">
                <Mail className="w-5 h-5" />
              </div>
            </div>
          </div>

          <div className="mb-10">
            <label className="block mb-1 text-primary font-medium">
              Password
            </label>
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                disabled={isPending}
                autoComplete="new-password"
                placeholder="Enter your password"
                className="w-full p-2 pr-12 rounded disabled:opacity-50 bg-white text-foreground placeholder:text-foreground/50"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute inset-y-0 right-3 z-10 flex items-center text-foreground/70 hover:text-foreground cursor-pointer"
                aria-label={showPassword ? "Hide password" : "Show password"}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            <div className="mt-1 text-right">
              <button
                type="button"
                onClick={() => navigate("/forgot-password")}
                className="text-sm text-primary/80 hover:text-primary hover:underline"
              >
                Forgot password?
              </button>
            </div>
          </div>

          <Button
            type="submit"
            disabled={isPending}
            className="w-full bg-primary text-lg text-primary-foreground p-2 rounded-2xl hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed py-6"
          >
            {isPending ? "Logging in..." : "Login"}
          </Button>

          <div className="mt-4 text-center text-sm text-foreground/80">
            Don't have an account?
            <button
              type="button"
              onClick={() => navigate("/signup")}
              className="text-primary font-semibold hover:underline ml-3"
            >
              Sign up
            </button>
          </div>
        </form>
      </div>
      {/* Demo Login section (outside the login card) */}
      <div className="w-full max-w-sm mt-20">
        <h2 className="text-lg font-semibold text-primary mb-2">Demo Login</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <div className="p-3 rounded-md border border-border bg-white shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-primary">Landlord</span>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={fillDemo}
                className="h-8 w-8 border-gray-300 hover:bg-gray-100"
                title="Fill landlord credentials"
              >
                <Copy className="h-4 w-4 text-foreground" />
              </Button>
            </div>
          </div>

          <div className="p-3 rounded-md border border-border bg-white shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-primary">Tenant</span>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => {
                  setFormData({ email: tenantEmail, password: tenantPassword });
                  toast.success("Demo tenant credentials filled");
                }}
                className="h-8 w-8 border-gray-300 hover:bg-gray-100"
                title="Fill tenant credentials"
              >
                <Copy className="h-4 w-4 text-foreground" />
              </Button>
            </div>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}
