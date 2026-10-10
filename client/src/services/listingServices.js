import API_ENDPOINTS from "@/lib/apiEndpoints";
import api from "@/lib/axios";
import { useQuery } from "@tanstack/react-query";

export const useListingLeaseCheck = (listingId) => {
    return useQuery({
        queryKey: ["listingLeases", listingId],
        queryFn: async () => {
            if (!listingId) return null; // <-- safety check
            const res = await api.get(`${API_ENDPOINTS.LISTINGS.BY_ID(listingId)}/check-leases`);
            return res.data.data; // { listingId, hasLease, leaseCount }
        },
        enabled: !!listingId, 
    });
};

