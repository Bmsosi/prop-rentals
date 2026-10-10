import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { useAuthStore } from "../../store/authStore";
import api from "../../lib/axios";
import API_ENDPOINTS from "../../lib/apiEndpoints";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { toast } from "sonner"; // <-- import toast
import { Mail, Eye, EyeOff } from "lucide-react";

export default function SignUpPage() {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    phone: "",
    role: "TENANT",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  // Validation function
  const validateForm = () => {
    const newErrors = {};

    // First Name validation
    if (!formData.firstName.trim()) {
      newErrors.firstName = "First name is required";
    } else if (formData.firstName.trim().length < 2) {
      newErrors.firstName = "First name must be at least 2 characters";
    }

    // Last Name validation
    if (!formData.lastName.trim()) {
      newErrors.lastName = "Last name is required";
    } else if (formData.lastName.trim().length < 2) {
      newErrors.lastName = "Last name must be at least 2 characters";
    }

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    // Phone validation
    if (!formData.phone.trim()) {
      newErrors.phone = "Phone number is required";
    } else if (!/^[\d\s\-\(\)]+$/.test(formData.phone.trim())) {
      newErrors.phone = "Please enter a valid phone number";
    }

    // Role validation
    if (!formData.role) {
      newErrors.role = "Please select a role";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Parse server errors and map to form fields
  const parseServerErrors = (error) => {
    const serverErrors = {};
    const errorMessage = error.response?.data?.message || "";
    const errorData = error.response?.data?.data || error.response?.data?.errors;

    // Check for field-specific errors
    if (errorData) {
      Object.keys(errorData).forEach((key) => {
        const fieldKey = key.charAt(0).toLowerCase() + key.slice(1);
        if (fieldKey in formData) {
          serverErrors[fieldKey] = Array.isArray(errorData[key]) 
            ? errorData[key][0] 
            : errorData[key];
        }
      });
    }

    // Check for common error messages in the message field
    if (errorMessage) {
      if (errorMessage.toLowerCase().includes("email") || errorMessage.toLowerCase().includes("already exists")) {
        serverErrors.email = "This email is already registered";
      } else if (errorMessage.toLowerCase().includes("password")) {
        serverErrors.password = "Password does not meet requirements";
      } else if (errorMessage.toLowerCase().includes("first") || errorMessage.toLowerCase().includes("firstName")) {
        serverErrors.firstName = errorMessage;
      } else if (errorMessage.toLowerCase().includes("last") || errorMessage.toLowerCase().includes("lastName")) {
        serverErrors.lastName = errorMessage;
      } else if (errorMessage.toLowerCase().includes("phone")) {
        serverErrors.phone = "Please enter a valid phone number";
      } else if (!Object.keys(serverErrors).length) {
        // If no specific field error, show general error in toast
        toast.error(errorMessage || "Registration failed. Please check your information and try again.");
      }
    }

    if (Object.keys(serverErrors).length > 0) {
      setErrors(serverErrors);
    }

    return serverErrors;
  };

  const registerMutation = useMutation({
    mutationFn: async (data) => {
      const res = await api.post(API_ENDPOINTS.AUTH.REGISTER, data);
      return res.data;
    },
    onSuccess: (data) => {
      toast.success("Registration successful!"); // <-- toast success
      // Authenticate immediately
      login(data.data.user, data.data.token);

      const urlParams = new URLSearchParams(window.location.search);
      const redirect = urlParams.get("redirect");

      setTimeout(() => {
        if (redirect) {
          navigate(redirect);
          return;
        }
        navigate("/dashboard");
      }, 1500);
    },
    onError: (err) => {
      const serverErrors = parseServerErrors(err);
      // If there are specific field errors, they're already displayed inline
      // Only show toast if no specific field errors were found
      if (Object.keys(serverErrors).length === 0) {
        toast.error(err.response?.data?.message || err.message || "Registration failed. Please check your information and try again.");
      }
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    // Validate form before submission
    if (!validateForm()) {
      toast.error("Please correct the errors below");
      return;
    }
    registerMutation.mutate(formData);
  };

  const { isPending } = registerMutation;

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
      <div className="absolute inset-0  bg-gradient-to-br from-background/80 via-card/50 to-background backdrop-blur-[1px] z-0"></div>
      <div className="relative z-10 w-full flex flex-col items-center justify-center">
      <div className="w-full max-w-md rounded-2xl shadow-lg backdrop-blur-md bg-card/80">
        <form onSubmit={handleSubmit} className="bg-white backdrop-blur-sm px-8 py-10 rounded-2xl shadow-lg border border-border" autoComplete="off">
          <div className="flex flex-col gap-0 my-4">
            <h1 className="text-2xl font-bold text-left mb-2 text-primary">Sign Up</h1>
            <p className="text-sm text-foreground/80 mb-6">Create your account</p>
          </div>

          <div className="mb-4">
            <label className="block mb-1 text-primary font-medium">First Name <span className="text-red-500">*</span></label>
            <Input
              type="text"
              name="firstName"
              required
              disabled={isPending}
              value={formData.firstName}
              onChange={handleChange}
              className={`w-full p-2 rounded disabled:opacity-50 bg-white text-foreground placeholder:text-foreground/50 ${
                errors.firstName ? "border-red-500 border-2" : ""
              }`}
              placeholder="First name"
              autoComplete="off"
            />
            {errors.firstName && (
              <p className="mt-1 text-sm text-red-500">{errors.firstName}</p>
            )}
          </div>

          <div className="mb-4">
            <label className="block mb-1 text-primary font-medium">Last Name <span className="text-red-500">*</span></label>
            <Input
              type="text"
              name="lastName"
              required
              disabled={isPending}
              value={formData.lastName}
              onChange={handleChange}
              className={`w-full p-2 rounded disabled:opacity-50 bg-white text-foreground placeholder:text-foreground/50 ${
                errors.lastName ? "border-red-500 border-2" : ""
              }`}
              placeholder="Last name"
              autoComplete="off"
            />
            {errors.lastName && (
              <p className="mt-1 text-sm text-red-500">{errors.lastName}</p>
            )}
          </div>

          <div className="mb-4">
            <label className="block mb-1 text-primary font-medium">Email <span className="text-red-500">*</span></label>
            <div className="relative">
              <Input
                type="email"
                name="email"
                required
                disabled={isPending}
                value={formData.email}
                onChange={handleChange}
                className={`w-full p-2 pr-10 rounded disabled:opacity-50 bg-white text-foreground placeholder:text-foreground/50 ${
                  errors.email ? "border-red-500 border-2" : ""
                }`}
                placeholder="your@email.com"
                autoComplete="off"
              />
              <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground" />
            </div>
            {errors.email && (
              <p className="mt-1 text-sm text-red-500">{errors.email}</p>
            )}
          </div>

          <div className="mb-4">
            <label className="block mb-1 text-primary font-medium">Password <span className="text-red-500">*</span></label>
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                name="password"
                required
                disabled={isPending}
                value={formData.password}
                onChange={handleChange}
                className={`w-full p-2 pr-12 rounded disabled:opacity-50 bg-white text-foreground placeholder:text-foreground/50 ${
                  errors.password ? "border-red-500 border-2" : ""
                }`}
                placeholder="Create a password"
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground z-10 cursor-pointer"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="w-full h-full" /> : <Eye className="w-full h-full" />}
              </button>
            </div>
            {errors.password && (
              <p className="mt-1 text-sm text-red-500">{errors.password}</p>
            )}
          </div>

          <div className="mb-4">
            <label className="block mb-1 text-primary font-medium">Phone <span className="text-red-500">*</span></label>
            <Input
              type="tel"
              name="phone"
              required
              disabled={isPending}
              value={formData.phone}
              onChange={handleChange}
              className={`w-full p-2 rounded disabled:opacity-50 bg-white text-foreground placeholder:text-foreground/50 ${
                errors.phone ? "border-red-500 border-2" : ""
              }`}
              placeholder="(555) 000-0000"
              autoComplete="off"
            />
            {errors.phone && (
              <p className="mt-1 text-sm text-red-500">{errors.phone}</p>
            )}
          </div>

          <div className="mb-10">
            <label className="block mb-1 text-primary font-medium">Role <span className="text-red-500">*</span></label>
            <Select
              disabled={isPending}
              value={formData.role}
              onValueChange={(value) => {
                handleChange({ target: { name: "role", value } });
                if (errors.role) {
                  setErrors((prev) => ({ ...prev, role: "" }));
                }
              }}
            >
              <SelectTrigger className={`w-full bg-white text-foreground ${
                errors.role ? "border-red-500 border-2" : ""
              }`}>
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent className="bg-card">
                <SelectItem value="TENANT">Tenant</SelectItem>
                <SelectItem value="ADMIN">Landlord</SelectItem>
              </SelectContent>
            </Select>
            {errors.role && (
              <p className="mt-1 text-sm text-red-500">{errors.role}</p>
            )}
          </div>

          <Button
            type="submit"
            disabled={isPending}
            className="w-full bg-primary text-lg text-primary-foreground p-2 rounded-2xl hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed py-6"
          >
            {isPending ? "Signing up..." : "Sign Up"}
          </Button>

          <div className="mt-4 text-center text-sm text-foreground/80">
            Already have an account?
            <button
              type="button"
              onClick={() => navigate("/login")}
              className="text-primary font-semibold hover:underline ml-3"
            >
              Login
            </button>
          </div>
        </form>
      </div>
      </div>
    </div>
  );
}
