import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export const PropertyAddressSection = ({
  formData,
  fieldErrors,
  handleChange,
  countries,
  states,
  cities,
  handleCountryChange,
  handleStateChange,
  handleCityChange,
  isPending,
}) => {
  return (
    <div className="border-b border-gray-300 space-y-6 pb-8">
      <label className="block text-sm font-medium mb-4">
        Property Address
      </label>
      <div className="space-y-2">
        <Label htmlFor="country">Country</Label>
        <Select
          value={formData.country}
          onValueChange={(value) =>
            handleCountryChange({ target: { name: "country", value } })
          }
          disabled={isPending}
          required
        >
          <SelectTrigger id="country" className="w-full">
            <SelectValue placeholder="Select country" />
          </SelectTrigger>
          <SelectContent>
            {countries.map((c) => (
              <SelectItem key={c.isoCode} value={c.isoCode}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {fieldErrors.country && (
          <p className="text-sm text-destructive">{fieldErrors.country}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="state">State</Label>
          <Select
            value={formData.state}
            onValueChange={(value) =>
              handleStateChange({ target: { name: "state", value } })
            }
            disabled={!formData.country || isPending}
            required
          >
            <SelectTrigger id="state" className="w-full">
              <SelectValue placeholder="Select state" />
            </SelectTrigger>
            <SelectContent>
              {states.map((s) => (
                <SelectItem key={s.isoCode} value={s.isoCode}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {fieldErrors.state && (
            <p className="text-sm text-destructive">{fieldErrors.state}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="city">City</Label>
          <Select
            value={formData.city}
            onValueChange={(value) =>
              handleCityChange({ target: { name: "city", value } })
            }
            disabled={!formData.state || isPending}
            required
          >
            <SelectTrigger id="city" className="w-full">
              <SelectValue placeholder="Select city" />
            </SelectTrigger>
            <SelectContent>
              {cities.map((c) => (
                <SelectItem key={c.name} value={c.name}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {fieldErrors.city && (
            <p className="text-sm text-destructive">{fieldErrors.city}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="streetAddress">Street Address</Label>
        <Textarea
          id="streetAddress"
          name="streetAddress"
          value={formData.streetAddress}
          onChange={handleChange}
          placeholder="Enter full address.."
          className="min-h-[120px] resize-none"
          required
          disabled={isPending}
        />
        {fieldErrors.streetAddress && (
          <p className="text-sm text-destructive">
            {fieldErrors.streetAddress}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="zipCode">ZIP</Label>
        <Input
          id="zipCode"
          name="zipCode"
          value={formData.zipCode}
          onChange={handleChange}
          className="w-1/2"
          required
          disabled={isPending}
        />
        {fieldErrors.zipCode && (
          <p className="text-sm text-destructive">{fieldErrors.zipCode}</p>
        )}
      </div>
    </div>
  );
};