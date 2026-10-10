export const PROPERTY_OPTIONS = {
  RESIDENTIAL: [
    { value: "APARTMENT", label: "Apartment" },
    { value: "CONDO", label: "Condo" },
    { value: "TOWNHOUSE", label: "Townhouse" },
    { value: "MULTI_FAMILY", label: "Multi-Family" },
    { value: "SINGLE_FAMILY", label: "Single Family" },
    { value: "STUDIO", label: "Studio" },
  ],
  COMMERCIAL: [
    { value: "INDUSTRIAL", label: "Industrial" },
    { value: "OFFICE", label: "Office" },
    { value: "RETAIL", label: "Retail" },
    { value: "SHOPPING_CENTER", label: "Shopping Center" },
    { value: "STORAGE", label: "Storage" },
    { value: "PARKING_SPACE", label: "Parking Space" },
    { value: "WAREHOUSE", label: "Warehouse" },
  ],
};

export const PROPERTY_CATEGORY_NAMES = {
  RESIDENTIAL: "Residential",
  COMMERCIAL: "Commercial",
};

// helper to find category from value
export const getPropertyCategory = (typeValue) => {
  for (const [category, types] of Object.entries(PROPERTY_OPTIONS)) {
    if (types.some((t) => t.value === typeValue)) return category;
  }
  return null;
};

export const getPropertyLabel = (options, value) => {
  if (!options || !value) return value;

  const flatOptions = Array.isArray(options)
    ? options
    : Object.values(options).flat();

  return flatOptions.find((opt) => opt.value === value)?.label || value;
};
