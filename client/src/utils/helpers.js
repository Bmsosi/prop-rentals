export const formatReadableDate = (isoDate) => {
    if (!isoDate) return '';

    const date = new Date(isoDate);
    // example output: "October 24, 2025"
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
};
