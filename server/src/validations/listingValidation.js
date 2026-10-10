import { z } from "zod";

export const createListingSchema = z.object({
  // Property Details Section
  title: z
    .string()
    .trim()
    .min(3, "Title must be at least 3 characters")
    .max(200, "Title must be at most 200 characters"),

  propertyType: z.string().trim().optional(),

  propertyOwner: z
    .string()
    .trim()
    .min(2, "Owner name must be at least 2 characters")
    .max(200, "Owner name must be at most 200 characters")
    .optional(),

  bedrooms: z
    .number()
    .int("Bedrooms must be an integer")
    .nonnegative("Bedrooms cannot be negative")
    .optional(),

  bathrooms: z
    .number()
    .int("Bathrooms must be an integer")
    .nonnegative("Bathrooms cannot be negative")
    .optional(),

  totalSquareFeet: z
    .number()
    .int("Total square feet must be an integer")
    .positive("Total square feet must be positive")
    .optional(),

  yearBuilt: z
    .number()
    .int("Year built must be an integer")
    .min(1800, "Year built must be 1800 or later")
    .max(new Date().getFullYear(), `Year built cannot exceed ${new Date().getFullYear()}`)
    .optional(),

  // Address Section
  country: z.string().trim().min(2, "Country is required"),
  state: z.string().trim().min(2, "State is required"),
  city: z.string().trim().min(2, "City is required"),
  streetAddress: z.string().trim().min(3, "Street address is required"),
  zipCode: z.string().trim().optional(),

  // Rental Information Section
  rentCycle: z
    .string()
    .refine(
      (val) => ["DAILY", "WEEKLY", "MONTHLY", "QUARTERLY", "YEARLY"].includes(val),
      { message: "Rent cycle must be DAILY, WEEKLY, MONTHLY, QUARTERLY, or YEARLY" }
    ),

  rentAmount: z.number().positive("Rent amount must be positive"),
  securityDeposit: z.number().nonnegative("Security deposit cannot be negative").optional(),
  petDeposit: z.number().nonnegative("Pet deposit cannot be negative").optional(),
  availableDate: z.coerce.date(),

  // Description Section
  description: z.string().trim().max(5000, "Description can be at most 5000 characters").optional(),

  // Contact Information Section
  contactName: z.string().trim().min(2, "Contact name must be at least 2 characters").max(100, "Contact name must be at most 100 characters").optional(),

  phoneNumber: z
    .string()
    .trim()
    .regex(/^(?!-)[0-9\s\-\+\(\)]+$/, "Invalid phone number format")
    .optional(),

  email: z.string().trim().email("Invalid email format").optional(),

  // Notes Section
  notes: z.string().trim().max(2000, "Notes can be at most 2000 characters").optional(),

  // Relations
  amenities: z.array(z.string().trim().min(1, "Amenity cannot be empty")).optional(),
  images: z.array(z.string().url("Each image must be a valid URL").trim()).optional(),
});
