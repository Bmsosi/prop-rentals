import { useQuery } from "@tanstack/react-query";
import API_ENDPOINTS from "@/lib/apiEndpoints.js";
import api from "@/lib/axios.js";

export const useTenantPayments = () => {
  return useQuery({
    queryKey: ["tenant-payments"],
    queryFn: async () => {
      const res = await api.get(API_ENDPOINTS.PAYMENTS.TENANT);

      // Backend returns raw array, not wrapped in { data: ... }
      return Array.isArray(res.data) ? res.data : res.data?.data || [];
    },
  });
};
