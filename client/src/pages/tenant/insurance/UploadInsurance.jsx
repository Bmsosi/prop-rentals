import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Loader2, AlertCircle } from "lucide-react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import FileUploader from "@/components/shared/FileUploader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  uploadAndExtractInsurance,
  createInsurance,
} from "@/services/insuranceService";

const insuranceSchema = z.object({
  providerName: z.string().min(1, "Provider name is required"),
  policyNumber: z.string().min(1, "Policy number is required"),
  coverageType: z.string().min(1, "Coverage type is required"),
  coverageAmount: z.string().optional(),
  monthlyCost: z.string().optional(),
  startDate: z.string().min(1, "Effective date is required"),
  expiryDate: z.string().min(1, "Expiration date is required"),
  notes: z.string().optional(),
});

const UploadInsurance = ({ onSuccess, onCancel, leaseId, customLeaseId }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [extracting, setExtracting] = useState(false);
  const [file, setFile] = useState(null);
  const [documentUrl, setDocumentUrl] = useState("");
  const [documentKey, setDocumentKey] = useState("");

  const form = useForm({
    resolver: zodResolver(insuranceSchema),
    defaultValues: {
      providerName: "",
      policyNumber: "",
      coverageType: "",
      coverageAmount: "",
      monthlyCost: "",
      startDate: "",
      expiryDate: "",
      notes: "",
    },
  });

  const handleFileSelect = async (selectedFile) => {
    if (!selectedFile) {
      setFile(null);
      setDocumentUrl("");
      setDocumentKey("");
      return;
    }

    setFile(selectedFile);
    setLoading(true);
    setUploadProgress(0);

    try {
      const result = await uploadAndExtractInsurance(
        selectedFile,
        (progress) => {
          setUploadProgress(progress);
          if (progress === 100) {
            setExtracting(true);
          }
        }
      );

      setDocumentUrl(result.documentUrl);
      setDocumentKey(result.documentKey);

      // Auto-fill form with extracted data
      const extracted = result.extractedData || {};
      if (extracted.providerName)
        form.setValue("providerName", extracted.providerName);
      if (extracted.policyNumber)
        form.setValue("policyNumber", extracted.policyNumber);
      if (extracted.coverageType)
        form.setValue("coverageType", extracted.coverageType);
      if (extracted.coverageAmount)
        form.setValue("coverageAmount", String(extracted.coverageAmount));
      if (extracted.monthlyCost)
        form.setValue("monthlyCost", String(extracted.monthlyCost));
      if (extracted.startDate)
        form.setValue("startDate", extracted.startDate.split("T")[0]);
      if (extracted.expiryDate)
        form.setValue("expiryDate", extracted.expiryDate.split("T")[0]);

      toast.success("Document uploaded and processed successfully");
    } catch (error) {
      console.error("Error uploading document:", error);
      toast.error("Failed to process document. Please fill in the details manually.");
    } finally {
      setLoading(false);
      setExtracting(false);
      setUploadProgress(0);
    }
  };

  const handleSubmit = async (values) => {
    if (!documentUrl) {
      toast.error("Please upload an insurance document");
      return;
    }

    if (!values.startDate || !values.expiryDate) {
      toast.error("Please provide start and expiry dates");
      return;
    }

    if (values.expiryDate <= values.startDate) {
      toast.error("Expiration date must be after effective date");
      return;
    }

    setLoading(true);

    try {
      const insuranceData = {
        ...(leaseId && { leaseId }),
        ...(customLeaseId && { customLeaseId }),
        providerName: values.providerName,
        policyNumber: values.policyNumber,
        coverageType: values.coverageType,
        coverageAmount: values.coverageAmount
          ? parseFloat(values.coverageAmount)
          : undefined,
        monthlyCost: values.monthlyCost
          ? parseFloat(values.monthlyCost)
          : undefined,
        startDate: values.startDate,
        expiryDate: values.expiryDate,
        documentUrl,
        documentKey,
        notes: values.notes || undefined,
      };

      console.log('📝 UploadInsurance - Creating insurance with:', insuranceData);
      console.log('📝 UploadInsurance - leaseId:', leaseId, 'customLeaseId:', customLeaseId);

      await createInsurance(insuranceData);
      toast.success("Insurance submitted successfully");
      
      if (onSuccess) {
        onSuccess();
      } else {
        navigate("/tenant/insurance");
      }
    } catch (error) {
      console.error("Error creating insurance:", error);
      toast.error(error.response?.data?.message || "Failed to submit insurance");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 overflow-auto p-6 pb-20 md:pb-6">
      <div className="max-w-3xl mx-auto">
      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-primary">Upload Insurance Document</h2>
          <p className="text-gray-600 mt-1">
            Upload your renter's insurance certificate. We'll automatically extract the key details.
          </p>
        </div>
        <Button
          type="button"
          className="w-fit bg-blue-50/70 text-blue-700 hover:bg-blue-100 border border-blue-100 rounded-full text-sm"
          onClick={() => {
            form.reset({
              providerName: "Evertrust Insurance Group",
              policyNumber: "POL-" + Math.floor(Math.random() * 900000 + 100000),
              coverageType: "Comprehensive Renter's",
              coverageAmount: "50000",
              monthlyCost: "42",
              startDate: new Date().toISOString().split("T")[0],
              expiryDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1))
                .toISOString()
                .split("T")[0],
              notes: "Demo policy coverage for primary residence.",
            });
            toast.success("Demo data applied");
          }}
        >
          Demo Autofill
        </Button>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        {/* File Upload Section */}
        <div className="bg-card rounded-2xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold mb-4 text-primary">Insurance Document</h3>
          <FileUploader
            onFileSelect={handleFileSelect}
            acceptedFileTypes=".pdf,.jpg,.jpeg,.png"
            maxSizeMB={10}
            disabled={loading}
          />

          {loading && (
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">
                  {extracting ? "Extracting data..." : "Uploading..."}
                </span>
                <span className="text-gray-900 font-medium">{uploadProgress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Insurance Details Form */}
        <div className="bg-card rounded-2xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold mb-4 text-primary">Insurance Details</h3>
          
          {!documentUrl && (
            <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-start space-x-3">
              <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
              <p className="text-sm text-blue-800">
                Upload your insurance document first for automatic data extraction, or fill in the details manually.
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="providerName"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel className="text-primary">Provider Name *</FormLabel>
                  <FormControl>
                    <Input className="bg-primary-foreground" placeholder="e.g., State Farm" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="policyNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-primary">Policy Number *</FormLabel>
                  <FormControl>
                    <Input className="bg-primary-foreground" placeholder="e.g., POL-123456" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="coverageType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-primary">Coverage Type *</FormLabel>
                  <FormControl>
                    <Input className="bg-primary-foreground" placeholder="e.g., Standard Renter's Insurance" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="coverageAmount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-primary">Coverage Amount ($)</FormLabel>
                  <FormControl>
                    <Input className="bg-primary-foreground" type="number" placeholder="e.g., 50000" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="monthlyCost"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-primary">Monthly Cost ($)</FormLabel>
                  <FormControl>
                    <Input className="bg-primary-foreground" type="number" step="0.01" placeholder="e.g., 50.00" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="startDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel className="text-primary">Effective Date *</FormLabel>
                  <DatePicker
                    value={field.value}
                    onChange={field.onChange}
                    className="bg-primary-foreground"
                    calendarProps={{
                      captionLayout: "dropdown",
                      fromYear: new Date().getFullYear() - 20,
                      toYear: new Date().getFullYear() + 10,
                    }}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="expiryDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel className="text-primary">Expiration Date *</FormLabel>
                  <DatePicker
                    value={field.value}
                    onChange={field.onChange}
                    className="bg-primary-foreground"
                    calendarProps={{
                      captionLayout: "dropdown",
                      fromYear: new Date().getFullYear() - 20,
                      toYear: new Date().getFullYear() + 10,
                    }}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel className="text-primary">Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      className="bg-primary-foreground"
                      rows={3}
                      placeholder="Any additional information about your insurance policy"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              if (onCancel) {
                onCancel();
              } else {
                navigate("/tenant/insurance");
              }
            }}
            disabled={loading}
            className="rounded-2xl"
          >
            Cancel
          </Button>
          <Button type="submit" disabled={loading || !documentUrl} className="rounded-2xl">
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Submit Insurance
          </Button>
        </div>
      </form>
      </Form>
      </div>
    </div>
  );
};

export default UploadInsurance;

