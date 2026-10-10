import axios from "./axios";

const MAINTENANCE_API_BASE = "/api/v1/maintenance";

export const maintenanceApi = {
  getAllRequests: async (filters = {}) => {
    const params = new URLSearchParams();

    if (filters.status) params.append("status", filters.status);
    if (filters.priority) params.append("priority", filters.priority);
    if (filters.category) params.append("category", filters.category);
    if (filters.listingId) params.append("listingId", filters.listingId);

    const queryString = params.toString();
    const url = queryString
      ? `${MAINTENANCE_API_BASE}?${queryString}`
      : MAINTENANCE_API_BASE;

    const response = await axios.get(url);
    return response.data;
  },

  getRequestById: async (id) => {
    const response = await axios.get(`${MAINTENANCE_API_BASE}/${id}`);
    return response.data;
  },

  createRequest: async (requestData) => {
    const response = await axios.post(MAINTENANCE_API_BASE, requestData);
    return response.data;
  },

  updateRequest: async (id, updateData) => {
    const response = await axios.patch(
      `${MAINTENANCE_API_BASE}/${id}`,
      updateData
    );
    return response.data;
  },

  deleteRequest: async (id) => {
    const response = await axios.delete(`${MAINTENANCE_API_BASE}/${id}`);
    return response.data;
  },

  updateStatus: async (id, status) => {
    return maintenanceApi.updateRequest(id, { status });
  },

  updatePriority: async (id, priority) => {
    return maintenanceApi.updateRequest(id, { priority });
  },

  // messages
  getMessages: async (id) => {
    const response = await axios.get(`${MAINTENANCE_API_BASE}/${id}/messages`);
    return response.data;
  },
  sendMessage: async (id, body) => {
    const response = await axios.post(`${MAINTENANCE_API_BASE}/${id}/messages`, { body });
    return response.data;
  },
};

export const MAINTENANCE_STATUS = {
  OPEN: "OPEN",
  IN_PROGRESS: "IN_PROGRESS",
  COMPLETED: "COMPLETED",
  CANCELLED: "CANCELLED",
};

export const MAINTENANCE_PRIORITY = {
  LOW: "LOW",
  MEDIUM: "MEDIUM",
  HIGH: "HIGH",
  URGENT: "URGENT",
};

export const MAINTENANCE_CATEGORY = {
  PLUMBING: "PLUMBING",
  ELECTRICAL: "ELECTRICAL",
  HVAC: "HVAC",
  APPLIANCE: "APPLIANCE",
  STRUCTURAL: "STRUCTURAL",
  PEST_CONTROL: "PEST_CONTROL",
  CLEANING: "CLEANING",
  LANDSCAPING: "LANDSCAPING",
  SECURITY: "SECURITY",
  OTHER: "OTHER",
};

export const getStatusDisplayName = (status) => {
  const statusMap = {
    [MAINTENANCE_STATUS.OPEN]: "Requests",
    [MAINTENANCE_STATUS.IN_PROGRESS]: "In Progress",
    [MAINTENANCE_STATUS.COMPLETED]: "Resolved",
    [MAINTENANCE_STATUS.CANCELLED]: "Cancelled",
  };
  return statusMap[status] || status;
};

export const getPriorityDisplayName = (priority) => {
  const priorityMap = {
    [MAINTENANCE_PRIORITY.LOW]: "Low",
    [MAINTENANCE_PRIORITY.MEDIUM]: "Normal",
    [MAINTENANCE_PRIORITY.HIGH]: "Important",
    [MAINTENANCE_PRIORITY.URGENT]: "Urgent",
  };
  return priorityMap[priority] || priority;
};

export const getCategoryDisplayName = (category) => {
  const categoryMap = {
    [MAINTENANCE_CATEGORY.PLUMBING]: "Plumbing",
    [MAINTENANCE_CATEGORY.ELECTRICAL]: "Electrical",
    [MAINTENANCE_CATEGORY.HVAC]: "HVAC",
    [MAINTENANCE_CATEGORY.APPLIANCE]: "Appliance",
    [MAINTENANCE_CATEGORY.STRUCTURAL]: "Structural",
    [MAINTENANCE_CATEGORY.PEST_CONTROL]: "Pest Control",
    [MAINTENANCE_CATEGORY.CLEANING]: "Cleaning",
    [MAINTENANCE_CATEGORY.LANDSCAPING]: "Landscaping",
    [MAINTENANCE_CATEGORY.SECURITY]: "Security",
    [MAINTENANCE_CATEGORY.OTHER]: "Other",
  };
  return categoryMap[category] || category;
};
