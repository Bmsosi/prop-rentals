export const filterApplications = (applications, searchQuery, filters) => {
    return applications.filter((app) => {
        // Only include applications whose listing is ACTIVE (means still need to RENT)
        if (app.listing?.status !== "ACTIVE") return false;

        // Match search query
        const matchSearch =
            app.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            app.listing?.title?.toLowerCase().includes(searchQuery.toLowerCase());

        // Match application status filter
        const matchStatus = filters.status
            ? app.status === filters.status
            : true;

        // Match submission dates
        const submissionDate = new Date(app.createdAt);
        const matchStart = filters.startDate
            ? submissionDate >= new Date(filters.startDate)
            : true;
        const matchEnd = filters.endDate
            ? submissionDate <= new Date(filters.endDate)
            : true;

        return matchSearch && matchStatus && matchStart && matchEnd;
    });
};
