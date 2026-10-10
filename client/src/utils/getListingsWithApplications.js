export const getListingsWithApplications = (listings, applications = []) => {
    const allowedStatuses = ["NEW", "PENDING", "APPROVED", "REJECTED"];

    return listings.filter(listing =>
        applications.some(app =>
            app.listingId === listing.id && allowedStatuses.includes(app.status)
        )
    );
};
