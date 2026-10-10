// Centralized API endpoints configuration
// Update these endpoints in one place to affect all API calls

const API_VERSION = "/api/v1";

export const API_ENDPOINTS = {
  // Auth endpoints
  AUTH: {
    LOGIN: `${API_VERSION}/auth/login`,
    REGISTER: `${API_VERSION}/auth/register`,
    REQUEST_RESET: `${API_VERSION}/auth/request-reset`,
    RESET_PASSWORD: `${API_VERSION}/auth/reset-password`,
    REFRESH_TOKEN: `${API_VERSION}/auth/refresh-token`,
  },

  // Listings endpoints
  LISTINGS: {
    BASE: `${API_VERSION}/listings`,
    BY_ID: (id) => `${API_VERSION}/listings/${id}`,
    GET_ALL: `${API_VERSION}/listings`,
  },

  // Upload endpoints
  UPLOADS: {
    BASE: `${API_VERSION}/upload`,
  },

  // Maintenance endpoints
  APPLICATIONS: {
    BASE: `${API_VERSION}/applications`,
    BY_ID: (id) => `${API_VERSION}/applications/${id}`,
    BULK_DELETE: `${API_VERSION}/applications/bulk-delete`,
  },

  // Lease endpoints
  LEASES: {
    BASE: `${API_VERSION}/leases`,
    BY_ID: (id) => `${API_VERSION}/leases/${id}`,
    BY_LISTING_ID: (listingId) => `${API_VERSION}/leases/by-listing/${listingId}`,
    BULK_DELETE: `${API_VERSION}/leases/bulk-delete`,
    REGENERATE_PDF: (id) => `${API_VERSION}/leases/${id}/regenerate-pdf`,
  },

  // custom lease endpoints
  CUSTOM_LEASES: {
    BASE: `${API_VERSION}/customleases`,
    BY_ID: (id) => `${API_VERSION}/customleases/${id}`,
    BY_LISTING_ID: (listingId) =>
      `${API_VERSION}/customleases/by-listing/${listingId}`,
  },

  // get all the tenant leases
  TENANT_LEASES: {
    BASE: `${API_VERSION}/leases/tenant`,
  },

  // leases invite endpoints
  LEASES_INVITE: {
    BASE: `${API_VERSION}/leases-invite`,
  },

  // Maintenance endpoints
  MAINTENANCE: {
    BASE: `${API_VERSION}/maintenance`,
    BY_ID: (id) => `${API_VERSION}/maintenance/${id}`,
  },

  PAYMENTS: {
    BASE: `${API_VERSION}/payments`,
    TENANT: `${API_VERSION}/payments/tenant`,
    UPLOAD_PROOF: (id) => `${API_VERSION}/payments/upload-proof/${id}`,
  },

  // Insurance endpoints
  INSURANCE: {
    BASE: `${API_VERSION}/insurance`,
    BY_ID: (id) => `${API_VERSION}/insurance/${id}`,
    PRESIGN: `${API_VERSION}/insurance/presign`,
    EXTRACT: `${API_VERSION}/insurance/extract`,
    VERIFY: (id) => `${API_VERSION}/insurance/${id}/verify`,
    REJECT: (id) => `${API_VERSION}/insurance/${id}/reject`,
    NOTIFY: (id) => `${API_VERSION}/insurance/${id}/notify`,
    DOWNLOAD: `${API_VERSION}/insurance/download`,
  },

  // User endpoints
  USERS: {
    BASE: `${API_VERSION}/users`,
    BY_ID: (id) => `${API_VERSION}/users/${id}`,
    PROFILE: `${API_VERSION}/users/profile`,
  },

  // User account endpoints
  USER: {
    PROFILE: `${API_VERSION}/user/profile`,
    CHANGE_PASSWORD: `${API_VERSION}/user/change-password`,
  },

  // Payment endpoints
  PAYMENTS: {
    BASE: `${API_VERSION}/payments`,
    BY_ID: (id) => `${API_VERSION}/payments/${id}`,
    SUMMARY: `${API_VERSION}/payments/summary`,
    MARK_PAID: (id) => `${API_VERSION}/payments/${id}/mark-paid`,
    SEND_REMINDER: (id) => `${API_VERSION}/payments/${id}/send-reminder`,
    APPROVE_RECEIPT: (id) => `${API_VERSION}/payments/${id}/approve-receipt`,
    REJECT_RECEIPT: (id) => `${API_VERSION}/payments/${id}/reject-receipt`,
  },

  // Invoice endpoints
  INVOICES: {
    BASE: `${API_VERSION}/invoices`,
    BY_ID: (id) => `${API_VERSION}/invoices/${id}`,
    UPDATE: (id) => `${API_VERSION}/invoices/${id}`,
    UPDATE_STATUS: (id) => `${API_VERSION}/invoices/${id}/status`,
  },
};

export default API_ENDPOINTS;
