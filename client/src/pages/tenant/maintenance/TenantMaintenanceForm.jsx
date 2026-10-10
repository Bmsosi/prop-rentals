import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload } from "lucide-react";
import {
  MAINTENANCE_PRIORITY,
  MAINTENANCE_CATEGORY,
  maintenanceApi,
} from "@/lib/maintenanceApi";
import axios from "@/lib/axios";
import API_ENDPOINTS from "@/lib/apiEndpoints";

const TenantMaintenanceForm = ({
  user,
  properties,
  onClose,
  onRequestCreated,
}) => {
  const [formData, setFormData] = useState({
    title: "",
    listingId: "",
    category: "",
    priority: MAINTENANCE_PRIORITY.MEDIUM,
    description: "",
    image: null,
  });
  const [submitting, setSubmitting] = useState(false);
  // console.log(formData);
  const handleChange = (e) => {
    const { name, value, files } = e.target;
    setFormData({
      ...formData,
      [name]: files ? files[0] : value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      !formData.title ||
      !formData.listingId ||
      !formData.category ||
      !formData.description
    ) {
      alert("Please fill in all required fields");
      return;
    }

    setSubmitting(true);

    try {
      const requestData = {
        title: formData.title,
        listingId: formData.listingId,
        priority: formData.priority,
        category: formData.category,
        description: formData.description,
        tenantId: user?.id,
      };

      if (formData.image) {
        const imageData = new FormData();
        imageData.append("file", formData.image);
        const uploadRes = await axios.post(
          API_ENDPOINTS.UPLOAD.IMAGE,
          imageData,
          {
            headers: { "Content-Type": "multipart/form-data" },
          }
        );
        requestData.imageUrl = uploadRes.data.url;
      }

      await maintenanceApi.createRequest(requestData);

      // alert("Maintenance request submitted successfully!");

      setFormData({
        title: "",
        listingId: "",
        category: "",
        priority: MAINTENANCE_PRIORITY.MEDIUM,
        description: "",
        image: null,
      });

      onClose();
      onRequestCreated();
    } catch (error) {
      console.error("Error submitting tenant request:", error);
      alert("Failed to submit request.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-lg w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-semibold mb-4 text-left md:text-center">New Maintenance Request</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium">Title</label>
            <Input
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g. My door is broken"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium">Property</label>
              <select
                name="listingId"
                value={formData.listingId}
                onChange={handleChange}
                className="border rounded-md w-full p-2"
                required
              >
                <option value="">Select property</option>
                {properties.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title || p.streetAddress || "Untitled Property"}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium">Priority</label>
              <select
                name="priority"
                value={formData.priority}
                onChange={handleChange}
                className="border rounded-md w-full p-2"
              >
                <option value={MAINTENANCE_PRIORITY.LOW}>Low</option>
                <option value={MAINTENANCE_PRIORITY.MEDIUM}>Normal</option>
                <option value={MAINTENANCE_PRIORITY.HIGH}>Important</option>
                <option value={MAINTENANCE_PRIORITY.URGENT}>Urgent</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium">Category</label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="border rounded-md w-full p-2"
              required
            >
              <option value="">Select category</option>
              {Object.values(MAINTENANCE_CATEGORY).map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium">Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={4}
              className="border rounded-md w-full p-2"
              placeholder="Describe the issue..."
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Image</label>
            <label className="border-2 border-dashed rounded-lg flex flex-col items-center justify-center h-32 cursor-pointer hover:bg-muted/10">
              <Upload className="size-6 mb-2" />
              <span className="text-sm text-muted-foreground">
                Upload image
              </span>
              <input
                type="file"
                name="image"
                className="hidden"
                onChange={handleChange}
                accept="image/*"
              />
            </label>
          </div>

          <div className="flex justify-between items-center pt-2">
            <Button
              variant="outline"
              type="button"
              onClick={onClose}
              className="w-24"
            >
              Cancel
            </Button>

            <div className="flex gap-3">
              <Button
                type="button"
                variant="secondary"
                disabled={submitting}
                onClick={() =>
                  alert("Your form is saved as draft (not yet submitted)")
                }
                className="w-24"
              >
                Save
              </Button>

              <Button type="submit" disabled={submitting} className="w-24">
                {" "}
                {submitting ? "Submitting..." : "Submit"}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TenantMaintenanceForm;
