import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate, Navigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { Upload, CheckCircle, XCircle } from "lucide-react";
import api from "@/lib/axios";
import API_ENDPOINTS from "@/lib/apiEndpoints";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { useValidator } from "@/utils/useValidator";
import DocumentPreview from "@/components/shared/DocumentPreview";

/**
 * Multi-step application form for public applicants
 *
 * Steps:
 * 1. Personal
 * 2. Employment (repeatable)
 * 3. Occupants / Pets / Notes
 * 4. Documents + Review + Submit
 *
 * This uses:
 * - GET /api/v1/applications/:publicId  (already exists)
 * - POST /api/v1/upload                 (to upload files; should return { url })
 * - POST /api/v1/applications/:publicId/submit  (new endpoint - see backend sample below)
 */

const ApplyForm = () => {
  const { publicId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [step, setStep] = useState(1);
  const [redirectAfterSubmit, setRedirectAfterSubmit] = useState(false);
  const documentInputRef = useRef(null);
  const employmentProofInputRefs = useRef({});
  
  // Employment field errors state (indexed by employment entry index)
  const [employmentErrors, setEmploymentErrors] = useState({});

  // form state
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    dateOfBirth: null,
    currentAddress: "",
    moveInDate: null,
    monthlyIncome: "",
    occupantsCount: 0,
    petsCount: 0,
    numberOfTenants: 1,
    message: "",
    employmentInfo: [
      // example entry: { employerName: "", jobTitle: "", income: "", duration: "", address: "", proofDocument: null }
    ],
    documents: [], // array of File objects to upload
  });

  const { errors, validateField, validateAll, clearError } = useValidator(form, {
    fullName: [
      v => !v?.trim() && "Full name is required",
    ],
    email: [
      v => !v?.trim() && "Email is required",
      v => !/\S+@\S+\.\S+/.test(v) && "Invalid email format",
    ],
    phone: [
      v => !v && "Phone is required",
      v => v && v.length < 10 && "Phone too short",
    ],
    dateOfBirth: [
      v => !v && "Date of birth required",
    ],
    currentAddress: [
      v => !v?.trim() && "Current address is required",
    ],
    moveInDate: [
      v => !v && "Move-in date is required",
    ],
    monthlyIncome: [
      v => {
        if (!v || (typeof v === 'string' && !v.trim())) return "Monthly income is required";
        const num = parseFloat(v);
        if (isNaN(num) || num <= 0) return "Monthly income must be greater than 0";
        return null;
      },
    ],
    occupantsCount: [
      v => {
        if (v === "" || v === null || v === undefined) return "Number of occupants is required";
        const num = parseFloat(v);
        if (isNaN(num) || num < 0) return "Number of occupants is required";
        return null;
      },
    ],
    numberOfTenants: [
      v => {
        if (v === "" || v === null || v === undefined) return "Number of tenants is required";
        const num = parseFloat(v);
        if (isNaN(num) || num < 1) return "Number of tenants must be at least 1";
        return null;
      },
    ],
    // message is optional, no validation needed
  });


  // load application meta by publicId (listing info & requirements)
  const {
    data: applicationMeta,
    isLoading,
    isError,
    error,
    refetch: refetchApplicationMeta,
  } = useQuery({
    queryKey: ["applicationPublic", publicId],
    queryFn: async () => {
      const res = await api.get(
        `${API_ENDPOINTS.APPLICATIONS.BASE}/${publicId}`
      );
      return res.data.data || res.data;
    },
    enabled: !!publicId,
    staleTime: 1000 * 60 * 5,
    retry: false,
  });

  // (Deprecated) old mutation removed — we now use presigned URL endpoints directly via GET

  // Submit mutation
  const submitMutation = useMutation({
    mutationFn: async (payload) => {
      const res = await api.post(
        `${API_ENDPOINTS.UPLOADS.BASE}/${publicId}/submit`,
        payload
      );
      return res.data;
    },
    onSuccess: async (data) => {
      // Store landlord email before navigation
      const landlordEmail = applicationMeta?.landlord?.email;
      
      // Navigate immediately to prevent showing "already submitted" page
      // This must happen before any cache updates to avoid re-render showing the "already submitted" view
      navigate("/apply/thank-you", { 
        state: { landlordEmail } 
      });
      
      // Update cache in the background after navigation
      // This ensures data is fresh if user navigates back, but doesn't block navigation
      setTimeout(() => {
        queryClient.setQueryData(["applicationPublic", publicId], (oldData) => {
          if (!oldData) return oldData;
          return {
            ...oldData,
            status: data?.data?.status || "NEW",
            fullName: form.fullName,
            email: form.email,
            phone: form.phone,
            submittedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
        });
        queryClient.invalidateQueries({ queryKey: ["applicationPublic", publicId] });
        refetchApplicationMeta();
      }, 100);
      
      toast.success("Application submitted — landlord will be notified.");
    },
    onError: (err) => {
      console.error(err);
      toast.error("Failed to submit application.");
    },
  });

  // Parse requirements from applicationMeta.message (stored as JSON string)
  const requirements = React.useMemo(() => {
    if (!applicationMeta?.message) return null;
    try {
      const parsed = JSON.parse(applicationMeta.message);
      return parsed;
    } catch {
      return null;
    }
  }, [applicationMeta]);

  // Check if application is expired
  const isExpired = React.useMemo(() => {
    if (!applicationMeta?.expirationDate) return false;
    return new Date() > new Date(applicationMeta.expirationDate);
  }, [applicationMeta]);

  // Check if application has already been submitted
  const isAlreadySubmitted = React.useMemo(() => {
    if (!applicationMeta) return false;
    // Check if status is not PENDING (meaning it's been submitted)
    if (applicationMeta.status && applicationMeta.status !== "PENDING") {
      return true;
    }
    // Check if application has real data (not placeholder data)
    const hasRealData = 
      applicationMeta.fullName && 
      applicationMeta.fullName !== "N/A" && 
      applicationMeta.email && 
      applicationMeta.email !== "na@example.com";
    return hasRealData;
  }, [applicationMeta]);

  useEffect(() => {
    // when metadata loads, prefill some fields (if the "application" was created with placeholder info)
    if (applicationMeta) {
      if (applicationMeta.fullName && applicationMeta.fullName !== "N/A") {
        setForm((f) => ({
          ...f,
          fullName: applicationMeta.fullName || f.fullName,
        }));
      }
    }
  }, [applicationMeta]);

  useEffect(() => {
    console.log(
      "Form state updated - documents:",
      form.documents?.length || 0,
      form.documents?.map((d) => d.name)
    );
  }, [form.documents]);

  useEffect(() => {
    if (step === 4) {
      console.log("Step 4 rendered, documents:", form.documents?.length || 0);
    }
  }, [step, form.documents]);

  if (!publicId) return <Navigate to="/" replace />;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-5xl mx-auto space-y-6">
          <div className="space-y-2">
            <Skeleton className="h-6 w-48 rounded-lg" />
            <Skeleton className="h-4 w-64 rounded" />
          </div>
          <Skeleton className="h-14 w-full rounded-2xl" />
          <div className="flex items-center gap-4">
            {[1, 2, 3, 4].map((step) => (
              <Skeleton key={step} className="h-8 w-32 rounded-full" />
            ))}
          </div>
          <div className="flex justify-center">
            <Skeleton className="h-8 w-32 rounded-full" />
          </div>
          <div className="space-y-4">
            {[...Array(3)].map((_, idx) => (
              <Skeleton key={`section-${idx}`} className="h-32 w-full rounded-2xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (isError || !applicationMeta) {
    // Extract error message from API response
    const errorMessage =
      error?.response?.data?.message ||
      error?.response?.data?.details ||
      error?.message ||
      "That application link may be invalid or expired.";

    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-gray-50">
        <div className="max-w-xl w-full bg-stone-50 p-6 rounded-lg shadow border border-stone-200">
          <h2 className="text-lg font-semibold mb-2">Application Error</h2>
          <p className="text-sm text-gray-600">{errorMessage}</p>
        </div>
      </div>
    );
  }

  // Check expiration
  if (isExpired) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-gray-50">
        <div className="max-w-xl w-full bg-stone-50 p-6 rounded-lg shadow border border-stone-200">
          <div className="flex items-center gap-2 mb-2">
            <XCircle className="h-5 w-5 text-red-500" />
            <h2 className="text-lg font-semibold">Application Link Expired</h2>
          </div>
          <p className="text-sm text-gray-600">
            This application link has expired. Please contact the landlord for a new link.
          </p>
          {applicationMeta.expirationDate && (
            <p className="text-xs text-gray-500 mt-2">
              Expired on: {format(new Date(applicationMeta.expirationDate), "PPP")}
            </p>
          )}
        </div>
      </div>
    );
  }

  // Check if already submitted
  if (isAlreadySubmitted) {
    const statusLabels = {
      NEW: "Under Review",
      PENDING: "Pending",
      APPROVED: "Approved",
      REJECTED: "Rejected",
      CANCELLED: "Cancelled",
    };

    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-gray-50">
        <div className="max-w-xl w-full bg-stone-50 p-6 rounded-lg shadow border border-stone-200">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle className="h-6 w-6 text-green-500" />
            <h2 className="text-xl font-semibold">Application Already Submitted</h2>
          </div>
          <div className="space-y-3">
            <p className="text-sm text-gray-600">
              Your application has already been submitted. You cannot submit it again.
            </p>
            {applicationMeta.status && (
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium text-gray-700 mb-1">Status:</p>
                <p className="text-base font-semibold">
                  {statusLabels[applicationMeta.status] || applicationMeta.status}
                </p>
              </div>
            )}
            {applicationMeta.fullName && applicationMeta.fullName !== "N/A" && (
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium text-gray-700 mb-1">Applicant:</p>
                <p className="text-base">{applicationMeta.fullName}</p>
              </div>
            )}
            {applicationMeta.submittedAt && (
              <p className="text-xs text-gray-500">
                Submitted on: {format(new Date(applicationMeta.updatedAt), "PPP 'at' p")}
              </p>
            )}
            <p className="text-sm text-gray-600 mt-4">
              If you need to update your application, please contact the landlord.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ---------- helper handlers ----------
  const updateField = (key, value) => setForm((s) => ({ ...s, [key]: value }));

  // Fill demo data
  const fillDemoData = () => {
    const today = new Date();
    const birthDate = new Date(today.getFullYear() - 30, 5, 15); // 30 years old
    const moveInDate = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days from now
    
    const firstNames = ['John', 'Jane', 'Michael', 'Sarah', 'David', 'Emily', 'Robert', 'Lisa'];
    const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis'];
    const streets = ['Main Street', 'Oak Avenue', 'Maple Drive', 'Pine Road', 'Cedar Lane'];
    const cities = ['Vancouver', 'Victoria', 'Kelowna', 'Surrey', 'Burnaby'];
    
    const randomName = () => ({
      first: firstNames[Math.floor(Math.random() * firstNames.length)],
      last: lastNames[Math.floor(Math.random() * lastNames.length)]
    });
    
    const applicant = randomName();
    const fullName = `${applicant.first} ${applicant.last}`;
    const email = `${applicant.first.toLowerCase()}.${applicant.last.toLowerCase()}@email.com`;
    const phone = `+1 (${Math.floor(Math.random() * 900) + 100}) ${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`;
    const randomStreet = `${Math.floor(Math.random() * 9000) + 1000} ${streets[Math.floor(Math.random() * streets.length)]}`;
    const randomCity = cities[Math.floor(Math.random() * cities.length)];
    const monthlyIncome = (Math.floor(Math.random() * 5000) + 3000).toString();
    
    setForm({
      ...form,
      fullName,
      email,
      phone,
      dateOfBirth: birthDate,
      currentAddress: `${randomStreet}, ${randomCity}, BC`,
      moveInDate,
      monthlyIncome,
      occupantsCount: Math.floor(Math.random() * 3) + 1,
      petsCount: Math.random() > 0.5 ? Math.floor(Math.random() * 2) + 1 : 0,
      numberOfTenants: Math.floor(Math.random() * 2) + 1,
      message: "I am a reliable tenant looking for a long-term rental. I have excellent rental history and stable income.",
      employmentInfo: [
        {
          employerName: ["Tech Corp", "Marketing Inc", "Finance Solutions", "Healthcare Plus"][Math.floor(Math.random() * 4)],
          jobTitle: ["Software Developer", "Marketing Manager", "Financial Analyst", "Project Manager"][Math.floor(Math.random() * 4)],
          income: (Math.floor(Math.random() * 60000) + 40000).toString(),
          duration: ["2 years", "3 years", "1 year", "5 years"][Math.floor(Math.random() * 4)],
          address: `${Math.floor(Math.random() * 9000) + 1000} Business Ave, ${randomCity}, BC`,
          proofDocument: null
        }
      ],
      documents: []
    });
    
    toast.success("Demo data filled!");
  };
  
  // Validate a single employment field
  const validateEmploymentField = (index, field, value) => {
    const emp = form.employmentInfo[index];
    if (!emp) return;
    
    let error = null;
    
    // Validate based on field type
    if (field === 'employerName' && !value?.trim()) {
      error = "Employer name is required";
    } else if (field === 'jobTitle' && !value?.trim()) {
      error = "Job title is required";
    } else if (field === 'income' && (!value || parseFloat(value) <= 0)) {
      error = "Annual income is required";
    } else if (field === 'duration' && !value?.trim()) {
      error = "Duration is required";
    } else if (field === 'address' && !value?.trim()) {
      error = "Address is required";
    }
    
    setEmploymentErrors(prev => ({
      ...prev,
      [`${index}_${field}`]: error
    }));
    
    return error;
  };
  
  // Validate all employment entries
  const validateAllEmployment = () => {
    if (!form.employmentInfo || form.employmentInfo.length === 0) {
      return true; // No employment entries is valid
    }
    
    const newErrors = {};
    let hasError = false;
    
    // Check each employment entry
    form.employmentInfo.forEach((emp, index) => {
      // If employment entry exists, all fields are required
      if (!emp.employerName?.trim()) {
        newErrors[`${index}_employerName`] = "Employer name is required";
        hasError = true;
      }
      if (!emp.jobTitle?.trim()) {
        newErrors[`${index}_jobTitle`] = "Job title is required";
        hasError = true;
      }
      if (!emp.income || parseFloat(emp.income) <= 0) {
        newErrors[`${index}_income`] = "Annual income is required";
        hasError = true;
      }
      if (!emp.duration?.trim()) {
        newErrors[`${index}_duration`] = "Duration is required";
        hasError = true;
      }
      if (!emp.address?.trim()) {
        newErrors[`${index}_address`] = "Address is required";
        hasError = true;
      }
      if (!emp.proofDocumentFile) {
        newErrors[`${index}_proofDocument`] = "Proof document is required";
        hasError = true;
      }
    });
    
    setEmploymentErrors(newErrors);
    return !hasError;
  };
  
  // Clear employment field error
  const clearEmploymentError = (index, field) => {
    setEmploymentErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[`${index}_${field}`];
      return newErrors;
    });
  };

  const addEmployment = () =>
    setForm((s) => ({
      ...s,
      employmentInfo: [
        ...(s.employmentInfo || []),
        {
          employerName: "",
          jobTitle: "",
          income: "",
          duration: "",
          address: "",
          proofDocumentFile: null,
        },
      ],
    }));
  const updateEmployment = (index, field, value) =>
    setForm((s) => {
      const arr = [...(s.employmentInfo || [])];
      arr[index] = { ...arr[index], [field]: value };
      return { ...s, employmentInfo: arr };
    });
  const removeEmployment = (index) => {
    setForm((s) => {
      const arr = [...(s.employmentInfo || [])];
      arr.splice(index, 1);
      return { ...s, employmentInfo: arr };
    });
    
    // Clear errors for this employment entry
    setEmploymentErrors(prev => {
      const newErrors = { ...prev };
      Object.keys(newErrors).forEach(key => {
        if (key.startsWith(`${index}_`)) {
          delete newErrors[key];
        }
      });
      // Reindex remaining errors
      const reindexed = {};
      Object.keys(newErrors).forEach(key => {
        const [oldIdx, field] = key.split('_');
        const oldIndex = parseInt(oldIdx);
        if (oldIndex > index) {
          reindexed[`${oldIndex - 1}_${field}`] = newErrors[key];
        } else if (oldIndex < index) {
          reindexed[key] = newErrors[key];
        }
      });
      return reindexed;
    });
  };

  const handleAddDocument = (files) => {
    const fileArray = Array.isArray(files) ? files : [files];
    const MAX_FILES = 3;
    const currentCount = form.documents?.length || 0;
    const remainingSlots = MAX_FILES - currentCount;
    
    if (remainingSlots <= 0) {
      // Already at max, don't add more
      return;
    }

    const filesToAdd = fileArray.slice(0, remainingSlots);
    setForm((s) => {
      const newDocs = [...(s.documents || []), ...filesToAdd];
      return { ...s, documents: newDocs };
    });
  };

  const handleRemoveDocument = (index) => {
    setForm((s) => {
      const newDocs = [...(s.documents || [])];
      newDocs.splice(index, 1);
      return { ...s, documents: newDocs };
    });
  };

  async function uploadFileToS3(file) {
    const endpoint = "/api/v1/upload/application-proof-url";
    const { data } = await api.get(endpoint, {
      params: {
        fileName: file.name,
        fileType: file.type,
      },
    });

    const { uploadURL, fileUrl } = data.data;

    await fetch(uploadURL, {
      method: "PUT",
      headers: { "Content-Type": file.type },
      body: file,
    });

    return fileUrl;
  }

  const handleSubmit = async () => {

    try {
      // Upload all documents to S3 first
      const documentUrls = await Promise.all(
        (form.documents || []).map((file) => uploadFileToS3(file))
      );

      // Upload all employment proof documents to S3
      const employmentInfoWithUrls = await Promise.all(
        (form.employmentInfo || []).map(async (e) => {
          let proofDocument = null;
          if (e.proofDocumentFile) {
            proofDocument = await uploadFileToS3(e.proofDocumentFile);
          }
          return {
            employerName: e.employerName,
            jobTitle: e.jobTitle,
            income: e.income ? Number(e.income) : null,
            duration: e.duration || null,
            address: e.address || null,
            proofDocument,
          };
        })
      );

      const payload = {
        fullName: form.fullName,
        email: form.email,
        phone: form.phone || null,
        dateOfBirth: form.dateOfBirth ? form.dateOfBirth.toISOString() : null,
        monthlyIncome: form.monthlyIncome ? Number(form.monthlyIncome) : null,
        currentAddress: form.currentAddress || null,
        moveInDate: form.moveInDate ? form.moveInDate.toISOString() : null,
        occupants: form.occupantsCount
          ? { count: Number(form.occupantsCount) }
          : null,
        pets: form.petsCount ? { count: Number(form.petsCount) } : null,
        numberOfTenants: form.numberOfTenants ? Number(form.numberOfTenants) : null,
        documents: documentUrls,
        references: null,
        message: form.message || null,
        employmentInfo: employmentInfoWithUrls,
      };

      await submitMutation.mutateAsync(payload);
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload files. Please try again.");
    }
  };

  // ---------- UI Steps ----------
  return (
    <div className="min-h-screen flex items-start justify-center py-4 md:py-10 px-4 md:px-8 bg-gray-50">
      <div className="w-full max-w-3xl bg-stone-50 rounded-lg shadow p-4 md:p-8 border border-stone-200">
        {/* Header */}
        <div className="mb-4 md:mb-6 space-y-1 md:space-y-2">
          <h1 className="text-lg md:text-2xl font-semibold">
            Apply for {applicationMeta.listing?.title || "property"}
          </h1>
          <p className="text-xs md:text-sm text-gray-600">
            {applicationMeta.listing?.streetAddress}
          </p>
          {applicationMeta.expirationDate && (
            <div className="flex items-center gap-2 text-xs text-gray-500 mt-2">
              <span>Application expires:</span>
              <span className="font-medium">
                {format(new Date(applicationMeta.expirationDate), "PPP")}
              </span>
            </div>
          )}
          
          {/* Application Requirements */}
          {requirements && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h3 className="font-semibold text-sm mb-2 text-blue-900">Required Documents:</h3>
              <ul className="space-y-1">
                {Object.entries(requirements).map(([key, required]) => {
                  if (!required) return null;
                  const label = key
                    .replace(/([A-Z])/g, " $1")
                    .replace(/^./, (str) => str.toUpperCase());
                  return (
                    <li key={key} className="flex items-center gap-2 text-sm text-blue-800">
                      <CheckCircle className="h-4 w-4 text-blue-600 flex-shrink-0" />
                      <span>{label}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>

        {/* Stepper */}
        <div className="flex items-center gap-2 md:gap-4 my-4 md:my-10 overflow-x-auto pb-2">
          <div
            className={`px-2 md:px-3 py-1 rounded-2xl text-xs md:text-sm whitespace-nowrap ${step === 1 ? "bg-black text-white" : "bg-gray-100"
              }`}
          >
            1. Personal
          </div>
          <div
            className={`px-2 md:px-3 py-1 rounded-2xl text-xs md:text-sm whitespace-nowrap ${step === 2 ? "bg-black text-white" : "bg-gray-100"
              }`}
          >
            2. Employment
          </div>
          <div
            className={`px-2 md:px-3 py-1 rounded-2xl text-xs md:text-sm whitespace-nowrap ${step === 3 ? "bg-black text-white" : "bg-gray-100"
              }`}
          >
            3. Occupants
          </div>
          <div
            className={`px-2 md:px-3 py-1 rounded-2xl text-xs md:text-sm whitespace-nowrap ${step === 4 ? "bg-black text-white" : "bg-gray-100"
              }`}
          >
            4. Documents
          </div>
        </div>

        {/* Demo Data Button */}
        <div className="flex justify-center mb-4">
          <Button
            type="button"
            size="sm"
            onClick={fillDemoData}
            className="rounded-full px-5 bg-blue-50/70 text-blue-700 border border-blue-100 hover:bg-blue-100"
          >
            Demo Autofill
          </Button>
        </div>

        {/* Form Body */}
        <div className="space-y-4 md:space-y-6">
          {/* STEP 1: Personal */}
          {step === 1 && (
            <div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                <div className="space-y-1 md:space-y-2">
                  <Label className="mb-1 text-xs md:text-sm">Full name</Label>
                  <Input
                    value={form.fullName}
                    onChange={(e) => {
                      updateField("fullName", e.target.value);
                      clearError("fullName");
                    }}
                    onBlur={(e) => validateField("fullName", e.target.value)}
                    className={`bg-white ${errors.fullName ? "border-red-500" : ""}`}
                    placeholder="Enter your full name"
                  />
                  {errors.fullName && <p className="text-red-500 text-sm">{errors.fullName}</p>}
                </div>
                <div className="space-y-1 md:space-y-2">
                  <Label className="mb-1 text-xs md:text-sm">Email</Label>
                  <Input
                    type="email"
                    value={form.email}
                    onChange={(e) => {
                      updateField("email", e.target.value);
                      clearError("email");
                    }}
                    onBlur={(e) => validateField("email", e.target.value)}
                    className={`bg-white ${errors.email ? "border-red-500" : ""}`}
                    placeholder="Enter your email address"
                  />
                  {errors.email && <p className="text-red-500 text-sm">{errors.email}</p>}
                </div>

                <div className="space-y-1 md:space-y-2">
                  <Label className="mb-1 text-xs md:text-sm">Phone</Label>
                  <Input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => {
                      updateField("phone", e.target.value);
                      clearError("phone");
                    }}
                    onBlur={(e) => validateField("phone", e.target.value)}
                    className={`bg-white ${errors.phone ? "border-red-500" : ""}`}
                    placeholder="Enter your phone number"
                  />
                  {errors.phone && <p className="text-red-500 text-sm">{errors.phone}</p>}
                </div>

                <div className="space-y-1 md:space-y-2">
                  <Label className="mb-1 text-xs md:text-sm">Date of birth</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={`w-full text-left bg-white ${errors.dateOfBirth ? "border-red-500" : ""}`}
                      >
                        {form.dateOfBirth
                          ? format(form.dateOfBirth, "PPP")
                          : "Select date of birth"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="p-0">
                      <Calendar
                        mode="single"
                        selected={form.dateOfBirth}
                        onSelect={(d) => {
                          updateField("dateOfBirth", d)
                          validateField("dateOfBirth", d)
                        }}
                        captionLayout="dropdown"
                        fromYear={1900}
                        toYear={new Date().getFullYear()}
                      />
                    </PopoverContent>
                  </Popover>
                  {errors.dateOfBirth && (
                    <p className="text-red-500 text-sm">{errors.dateOfBirth}</p>
                  )}
                </div>

                <div className="space-y-1 md:space-y-2">
                  <Label className="mb-1 text-xs md:text-sm">Monthly Income</Label>
                  <Input
                    type="number"
                    value={form.monthlyIncome}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === "" || (!isNaN(value) && parseFloat(value) >= 0)) {
                        updateField("monthlyIncome", value);
                        clearError("monthlyIncome");
                      }
                    }}
                    onBlur={(e) => validateField("monthlyIncome", e.target.value)}
                    className={`bg-white ${errors.monthlyIncome ? "border-red-500" : ""}`}
                    placeholder="Enter your monthly income"
                    min="0"
                    step="0.01"
                  />
                  {errors.monthlyIncome && (
                    <p className="text-red-500 text-sm">{errors.monthlyIncome}</p>
                  )}
                </div>

                <div className="space-y-1 md:space-y-2">
                  <Label className="mb-1 text-xs md:text-sm">Move-in Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={`w-full text-left bg-white ${errors.moveInDate ? "border-red-500" : ""}`}
                      >
                        {form.moveInDate
                          ? format(form.moveInDate, "PPP")
                          : "Select move-in date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="p-0">
                      <Calendar
                        mode="single"
                        selected={form.moveInDate}
                        onSelect={(d) => {
                          updateField("moveInDate", d);
                          validateField("moveInDate", d);
                        }}
                        captionLayout="dropdown"
                        fromYear={new Date().getFullYear()}
                        toYear={new Date().getFullYear() + 5}
                      />
                    </PopoverContent>
                  </Popover>
                  {errors.moveInDate && (
                    <p className="text-red-500 text-sm">{errors.moveInDate}</p>
                  )}
                </div>

                <div className="md:col-span-2 space-y-1 md:space-y-2">
                  <Label className="mb-1 text-xs md:text-sm">Current Address</Label>
                  <Input
                    value={form.currentAddress}
                    onChange={(e) => {
                      updateField("currentAddress", e.target.value);
                      clearError("currentAddress");
                    }}
                    onBlur={(e) => validateField("currentAddress", e.target.value)}
                    className={`bg-white ${errors.currentAddress ? "border-red-500" : ""}`}
                    placeholder="Enter your current address"
                  />
                  {errors.currentAddress && (
                    <p className="text-red-500 text-sm">{errors.currentAddress}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Employment (repeatable) */}
          {step === 2 && (
            <div>
              <div className="flex items-center justify-between mb-2 md:mb-3">
                <h3 className="font-medium text-sm md:text-base">Employment Information</h3>
                <Button className="rounded-2xl text-xs md:text-sm px-3 md:px-4" variant="outline" onClick={addEmployment}>
                  Add Employment
                </Button>
              </div>

              <div className="space-y-3 md:space-y-4">
                {(form.employmentInfo || []).length === 0 && (
                  <p className="text-xs md:text-sm text-gray-500">
                    No employment records yet. Add one.
                  </p>
                )}
                {(form.employmentInfo || []).map((emp, idx) => (
                  <div key={idx} className="border p-3 md:p-6 rounded">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                      <div className="space-y-1 md:space-y-2">
                        <Label className="mb-1 text-xs md:text-sm">Employer</Label>
                        <Input
                          value={emp.employerName}
                          onChange={(e) => {
                            updateEmployment(idx, "employerName", e.target.value);
                            clearEmploymentError(idx, "employerName");
                          }}
                          onBlur={(e) => validateEmploymentField(idx, "employerName", e.target.value)}
                          className={`bg-white ${employmentErrors[`${idx}_employerName`] ? "border-red-500" : ""}`}
                          placeholder="Enter employer name"
                        />
                        {employmentErrors[`${idx}_employerName`] && (
                          <p className="text-red-500 text-sm">{employmentErrors[`${idx}_employerName`]}</p>
                        )}
                      </div>
                      <div className="space-y-1 md:space-y-2">
                        <Label className="mb-1 text-xs md:text-sm">Job title</Label>
                        <Input
                          value={emp.jobTitle}
                          onChange={(e) => {
                            updateEmployment(idx, "jobTitle", e.target.value);
                            clearEmploymentError(idx, "jobTitle");
                          }}
                          onBlur={(e) => validateEmploymentField(idx, "jobTitle", e.target.value)}
                          className={`bg-white ${employmentErrors[`${idx}_jobTitle`] ? "border-red-500" : ""}`}
                          placeholder="Enter your job title"
                        />
                        {employmentErrors[`${idx}_jobTitle`] && (
                          <p className="text-red-500 text-sm">{employmentErrors[`${idx}_jobTitle`]}</p>
                        )}
                      </div>
                      <div className="space-y-1 md:space-y-2">
                        <Label className="mb-1 text-xs md:text-sm">Annual Income</Label>
                        <Input
                          type="number"
                          value={emp.income || ""}
                          onChange={(e) => {
                            const value = e.target.value;
                            // Only allow positive numbers or empty string
                            if (value === "" || (!isNaN(value) && parseFloat(value) >= 0)) {
                              updateEmployment(idx, "income", value);
                              clearEmploymentError(idx, "income");
                            }
                          }}
                          onBlur={(e) => {
                            const value = e.target.value;
                            if (!value || parseFloat(value) <= 0) {
                              validateEmploymentField(idx, "income", value);
                            }
                          }}
                          className={`bg-white ${employmentErrors[`${idx}_income`] ? "border-red-500" : ""}`}
                          placeholder="Enter annual income amount"
                          min="0"
                          step="0.01"
                        />
                        {employmentErrors[`${idx}_income`] && (
                          <p className="text-red-500 text-sm">{employmentErrors[`${idx}_income`]}</p>
                        )}
                      </div>
                      <div className="space-y-1 md:space-y-2">
                        <Label className="mb-1 text-xs md:text-sm">Duration</Label>
                        <Input
                          value={emp.duration}
                          onChange={(e) => {
                            updateEmployment(idx, "duration", e.target.value);
                            clearEmploymentError(idx, "duration");
                          }}
                          onBlur={(e) => validateEmploymentField(idx, "duration", e.target.value)}
                          className={`bg-white ${employmentErrors[`${idx}_duration`] ? "border-red-500" : ""}`}
                          placeholder="e.g., 6 months, 1 year, 2 years"
                        />
                        {employmentErrors[`${idx}_duration`] && (
                          <p className="text-red-500 text-sm">{employmentErrors[`${idx}_duration`]}</p>
                        )}
                      </div>
                      <div className="space-y-1 md:space-y-2">
                        <Label className="mb-1 text-xs md:text-sm">Address</Label>
                        <Textarea
                          value={emp.address}
                          onChange={(e) => {
                            updateEmployment(idx, "address", e.target.value);
                            clearEmploymentError(idx, "address");
                          }}
                          onBlur={(e) => validateEmploymentField(idx, "address", e.target.value)}
                          className={`bg-white min-h-[60px] md:min-h-[88px] text-sm md:text-base ${employmentErrors[`${idx}_address`] ? "border-red-500" : ""}`}
                          placeholder="Enter employer address"
                          rows={2}
                        />
                        {employmentErrors[`${idx}_address`] && (
                          <p className="text-red-500 text-sm">{employmentErrors[`${idx}_address`]}</p>
                        )}
                      </div>
                      <div className="space-y-1 md:space-y-2">
                        <Label className="mb-1 text-xs md:text-sm">Proof document</Label>
                        {employmentErrors[`${idx}_proofDocument`] && (
                          <p className="text-red-500 text-sm mb-1">{employmentErrors[`${idx}_proofDocument`]}</p>
                        )}
                        <div>
                          <input
                            ref={(el) => {
                              if (el) employmentProofInputRefs.current[idx] = el;
                            }}
                            type="file"
                            accept="image/*,application/pdf"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              updateEmployment(idx, "proofDocumentFile", file);
                              clearEmploymentError(idx, "proofDocument");
                            }}
                          />
                          {!emp.proofDocumentFile && (
                            <label
                              htmlFor={`proof-${idx}`}
                              className="block border-2 border-dashed rounded-lg p-3 md:p-4 cursor-pointer hover:bg-gray-50 text-center"
                              onClick={() => employmentProofInputRefs.current[idx]?.click()}
                            >
                              <Upload className="w-5 h-5 md:w-6 md:h-6 mx-auto mb-1 md:mb-2 text-gray-400" />
                              <span className="text-xs md:text-sm text-gray-600">Upload proof document</span>
                            </label>
                          )}
                          {emp.proofDocumentFile && (
                            <DocumentPreview
                              files={[emp.proofDocumentFile]}
                              onRemove={() => {
                                updateEmployment(idx, "proofDocumentFile", null);
                              }}
                              onFileClick={() => employmentProofInputRefs.current[idx]?.click()}
                              inputId={`proof-${idx}`}
                            />
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-end mt-3 md:mt-6">
                      <Button
                        className="rounded-2xl text-xs md:text-sm px-3 md:px-4"
                        variant="ghost"
                        onClick={() => removeEmployment(idx)}
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 3: Occupants / Pets / Tenants / Message */}
          {step === 3 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
              <div className="space-y-1 md:space-y-2">
                <Label className="mb-1 text-xs md:text-sm">Number of tenants</Label>
                <Input
                  type="number"
                  value={form.numberOfTenants}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === "" || (!isNaN(value) && parseFloat(value) >= 1)) {
                      updateField("numberOfTenants", value);
                      clearError("numberOfTenants");
                    }
                  }}
                  onBlur={(e) => validateField("numberOfTenants", e.target.value)}
                  className={`bg-white ${errors.numberOfTenants ? "border-red-500" : ""}`}
                  placeholder="Enter number of tenants"
                  min="1"
                />
                {errors.numberOfTenants && (
                  <p className="text-red-500 text-sm">{errors.numberOfTenants}</p>
                )}
              </div>
              <div className="space-y-1 md:space-y-2">
                <Label className="mb-1 text-xs md:text-sm">Number of occupants</Label>
                <Input
                  type="number"
                  value={form.occupantsCount}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === "" || (!isNaN(value) && parseFloat(value) >= 0)) {
                      updateField("occupantsCount", value);
                      clearError("occupantsCount");
                    }
                  }}
                  onBlur={(e) => validateField("occupantsCount", e.target.value)}
                  className={`bg-white ${errors.occupantsCount ? "border-red-500" : ""}`}
                  placeholder="Enter number of occupants"
                  min="0"
                />
                {errors.occupantsCount && (
                  <p className="text-red-500 text-sm">{errors.occupantsCount}</p>
                )}
              </div>
              <div className="space-y-1 md:space-y-2">
                <Label className="mb-1 text-xs md:text-sm">Number of pets</Label>
                <Input
                  type="number"
                  value={form.petsCount}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === "" || (!isNaN(value) && parseFloat(value) >= 0)) {
                      updateField("petsCount", value);
                    }
                  }}
                  className="bg-white"
                  placeholder="Enter number of pets"
                  min="0"
                />
              </div>

              <div className="md:col-span-2 space-y-1 md:space-y-2">
                <Label className="mb-1 text-xs md:text-sm">Additional message</Label>
                <Textarea
                  value={form.message}
                  onChange={(e) => {
                    updateField("message", e.target.value);
                    clearError("message");
                  }}
                  onBlur={(e) => validateField("message", e.target.value)}
                  className={`bg-white text-sm md:text-base ${errors.message ? "border-red-500" : ""}`}
                  placeholder="Any additional information you'd like to share with the landlord..."
                  rows={3}
                />
                {errors.message && (
                  <p className="text-red-500 text-sm">{errors.message}</p>
                )}
              </div>
            </div>
          )}

          {/* STEP 4: Documents & Review */}
          {step === 4 && (
            <div>
              <div className="space-y-3 md:space-y-4">
                <div className="space-y-1 md:space-y-2">
                  <Label className="mb-1 text-xs md:text-sm">Upload documents (ID, payslips etc.)</Label>
                  {form.documents.length === 0 && (
                    <p className="text-red-500 text-sm">At least one document is required</p>
                  )}
                  {form.documents.length > 0 && form.documents.length < 3 && (
                    <p className="text-xs text-gray-500 mb-1">
                      {form.documents.length} of 3 documents uploaded
                    </p>
                  )}
                  {form.documents.length >= 3 && (
                    <p className="text-xs text-gray-500 mb-1">
                      Maximum of 3 documents reached
                    </p>
                  )}
                  <input
                    ref={documentInputRef}
                    type="file"
                    multiple
                    accept="image/*,application/pdf"
                    className="hidden"
                    onChange={(e) => {
                      const files = Array.from(e.target.files || []);
                      if (files.length > 0) {
                        handleAddDocument(files);
                      }
                    }}
                  />
                  {form.documents.length < 3 && (
                    <label
                      htmlFor="document-input"
                      className={`block border-2 border-dashed rounded-lg p-4 md:p-6 cursor-pointer hover:bg-gray-50 text-center mt-2 ${form.documents.length === 0 ? "border-red-500" : ""}`}
                      onClick={() => documentInputRef.current?.click()}
                    >
                      <Upload className="w-6 h-6 md:w-8 md:h-8 mx-auto mb-1 md:mb-2 text-gray-400" />
                      <span className="text-xs md:text-sm text-gray-600">Click to upload documents (Max 3)</span>
                      <p className="text-xs text-gray-500 mt-1">
                        Supports images and PDF files
                      </p>
                    </label>
                  )}
                  {form.documents.length > 0 && (
                    <DocumentPreview
                      files={form.documents}
                      onRemove={handleRemoveDocument}
                      onFileClick={() => documentInputRef.current?.click()}
                      inputId="document-input"
                    />
                  )}
                </div>

                <div className="bg-gray-50 p-3 md:p-4 rounded">
                  <h4 className="font-semibold mb-2 text-sm md:text-base">Review</h4>
                  <div className="space-y-1 md:space-y-2 text-xs md:text-sm">
                    <p>
                      <strong>Name:</strong> {form.fullName}
                    </p>
                    <p>
                      <strong>Email:</strong> {form.email}
                    </p>
                    <p>
                      <strong>Phone:</strong> {form.phone}
                    </p>
                    <p>
                      <strong>Occupants:</strong> {form.occupantsCount}
                    </p>
                    <p>
                      <strong>Number of Tenants:</strong> {form.numberOfTenants}
                    </p>
                    <p>
                      <strong>Pets:</strong> {form.petsCount}
                    </p>
                    <p>
                      <strong>Monthly Income:</strong> {form.monthlyIncome ? `$${form.monthlyIncome}` : "Not provided"}
                    </p>
                    <p>
                      <strong>Move-in Date:</strong> {form.moveInDate ? format(form.moveInDate, "PPP") : "Not selected"}
                    </p>
                  </div>
                  <p className="mt-2 text-xs md:text-sm text-gray-600">
                    <strong>Note:</strong> By submitting you agree that the
                    landlord may review your information.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between mt-4 md:mt-6">
          <div>
            {step > 1 && (
              <Button className="rounded-2xl text-xs md:text-sm px-3 md:px-4" variant="ghost" onClick={() => setStep(step - 1)}>
                Back
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2 md:gap-3">
            {step < 4 && (
              <Button className="rounded-2xl text-xs md:text-sm px-3 md:px-4" onClick={() => {
                // Validate based on current step
                let canProceed = false;
                
                if (step === 1) {
                  // Step 1: Personal info validation - only validate Step 1 fields
                  const step1Fields = {
                    fullName: form.fullName,
                    email: form.email,
                    phone: form.phone,
                    dateOfBirth: form.dateOfBirth,
                    currentAddress: form.currentAddress,
                    monthlyIncome: form.monthlyIncome,
                    moveInDate: form.moveInDate,
                  };
                  canProceed = validateAll(step1Fields);
                  if (!canProceed) {
                    // Show which fields have errors
                    const errorFields = Object.keys(errors).filter(key => errors[key] && step1Fields.hasOwnProperty(key));
                    if (errorFields.length > 0) {
                      toast.error(`Please fill in: ${errorFields.join(", ")}`);
                    } else {
                      toast.error("Please fill in all required fields in step 1.");
                    }
                  }
                } else if (step === 2) {
                  // Step 2: Employment validation - if employment entries exist, they must be complete
                  canProceed = validateAllEmployment();
                  if (!canProceed) {
                    toast.error("Please complete all employment entries. Employer name and job title are required.");
                  }
                } else if (step === 3) {
                  // Step 3: Validate only required fields (occupantsCount, numberOfTenants)
                  const step3Fields = {
                    occupantsCount: form.occupantsCount,
                    numberOfTenants: form.numberOfTenants,
                  };
                  canProceed = validateAll(step3Fields);
                  if (!canProceed) {
                    toast.error("Please fill in all required fields in step 3.");
                  }
                } else if (step === 4) {
                  // Step 4: Validate documents
                  if (!form.documents || form.documents.length === 0) {
                    toast.error("Please upload at least one document.");
                    canProceed = false;
                  } else {
                    canProceed = true;
                  }
                }
                
                if (canProceed) {
                  setStep(step + 1);
                }
              }}>Next </Button>
            )}
            {step === 4 && (
              <Button
                className="rounded-2xl text-xs md:text-sm px-3 md:px-4"
                onClick={handleSubmit}
                disabled={submitMutation.isPending}
              >
                {submitMutation.isPending
                  ? "Submitting..."
                  : "Submit Application"}
              </Button>
            )}
          </div>
        </div>
      </div>

      {
        // redirectAfterSubmit && (
        //   <div className="fixed inset-0 flex items-center justify-center pointer-events-none">
        //     {/* small overlay message or redirect */}
        //     <div className="bg-white p-4 rounded shadow">
        //       Submitted — thank you.
        //     </div>
        //   </div>
        // )
      }
    </div>
  );
};

export default ApplyForm;
