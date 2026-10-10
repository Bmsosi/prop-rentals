import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  PROPERTY_CATEGORY_NAMES,
  PROPERTY_OPTIONS,
} from "@/constants/propertyTypes";

export const PropertyDetailsSection = ({
  formData,
  fieldErrors,
  handleChange,
  setFormData,
  isPending,
}) => {
  return (
    <div className="border-b border-gray-300 space-y-6 pb-8">
      {/* Property Title */}
      <div>
        <label className="block text-sm font-medium mb-2">Property Title</label>
        <Input
          name="title"
          value={formData.title}
          onChange={handleChange}
          placeholder="Enter property name"
          className="w-full"
          required
          disabled={isPending}
        />
        {fieldErrors.title && (
          <p className="mt-1 text-red-400 text-sm">{fieldErrors.title}</p>
        )}
      </div>

      {/* Property Type */}
      <div>
        <label className="block text-sm font-medium mb-2">Property Type</label>
        <Select
          value={formData.propertyType}
          onValueChange={(value) =>
            setFormData({ ...formData, propertyType: value })
          }
          disabled={isPending}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select property type" />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(PROPERTY_OPTIONS).map(([category, types]) => (
              <div key={category}>
                <p className="px-3 py-1 text-xs font-semibold text-gray-500">
                  {PROPERTY_CATEGORY_NAMES[category]}
                </p>
                {types.map(({ value, label }) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </div>
            ))}
          </SelectContent>
        </Select>
        {fieldErrors.propertyType && (
          <p className="mt-1 text-red-400 text-sm">{fieldErrors.propertyType}</p>
        )}
      </div>

      {/* Property Owner */}
      <div>
        <label className="block text-sm font-medium mb-2">Property Owner</label>
        <Input
          name="propertyOwner"
          value={formData.propertyOwner}
          onChange={handleChange}
          placeholder="Enter full legal name"
          className="w-full"
          required
          disabled={isPending}
        />
        {fieldErrors.propertyOwner && (
          <p className="mt-1 text-red-400 text-sm">{fieldErrors.propertyOwner}</p>
        )}
      </div>

      {/* Bedrooms & Bathrooms */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">Bedrooms</label>
          <Input
            type="number"
            name="bedrooms"
            value={formData.bedrooms}
            onChange={handleChange}
            placeholder="0"
            className="w-full"
            disabled={isPending}
            onWheel={(e) => e.target.blur()}
          />
          {fieldErrors.bedrooms && (
            <p className="mt-1 text-red-400 text-sm">{fieldErrors.bedrooms}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Bathrooms</label>
          <Input
            type="number"
            name="bathrooms"
            value={formData.bathrooms}
            onChange={handleChange}
            placeholder="0"
            className="w-full"
            disabled={isPending}
            onWheel={(e) => e.target.blur()}
          />
          {fieldErrors.bathrooms && (
            <p className="mt-1 text-red-400 text-sm">{fieldErrors.bathrooms}</p>
          )}
        </div>
      </div>

      {/* Total Square Feet & Year Built */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">Total Square Feet</label>
          <Input
            type="number"
            name="totalSquareFeet"
            value={formData.totalSquareFeet}
            onChange={handleChange}
            className="w-full"
            disabled={isPending}
            onWheel={(e) => e.target.blur()}
          />
          {fieldErrors.totalSquareFeet && (
            <p className="mt-1 text-red-400 text-sm">{fieldErrors.totalSquareFeet}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Year Built</label>
          <Input
            type="number"
            name="yearBuilt"
            value={formData.yearBuilt}
            onChange={handleChange}
            className="w-full"
            disabled={isPending}
            onWheel={(e) => e.target.blur()}
          />
          {fieldErrors.yearBuilt && (
            <p className="mt-1 text-red-400 text-sm">{fieldErrors.yearBuilt}</p>
          )}
        </div>
      </div>
    </div>
  );
};
