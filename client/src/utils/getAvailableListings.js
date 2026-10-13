export const getAvailableListings = (listings, applications = [], activeLeaseListingIds = []) => {
    return listings.filter(listing => {
        // A property can receive applications from multiple tenants. Only hide
        // properties that are already rented through an active lease.
        const hasActiveLease = activeLeaseListingIds.includes(listing.id);
        return !hasActiveLease;
    });
};
