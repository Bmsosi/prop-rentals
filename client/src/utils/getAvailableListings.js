export const getAvailableListings = (listings, applications = [], activeLeaseListingIds = []) => {
    return listings.filter(listing => {
        // Exclude listings that have ANY application (regardless of status)
        const hasApplication = applications.some(app => app.listingId === listing.id);
        // Exclude listings that have active leases (rented)
        const hasActiveLease = activeLeaseListingIds.includes(listing.id);
        return !hasApplication && !hasActiveLease;
    });
};
