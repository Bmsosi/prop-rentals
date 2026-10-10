import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { Country } from "country-state-city";

// Get country calling code by ISO (e.g., CA -> 1, MM -> 95)
const getCountryPhoneCode = (isoCode) => {
  if (!isoCode) return "";
  const c = Country.getCountryByCode(isoCode);
  return c?.phonecode || "";
};

// Format as international: (+CC) ############### (digits only after prefix)
const formatIntlPhone = (value, phoneCode) => {
  const digits = (value || "").replace(/\D/g, "");
  const code = String(phoneCode || "").replace(/\D/g, "");

  // Remove leading code if user typed it manually
  let localDigits = digits;
  if (code && localDigits.startsWith(code)) {
    localDigits = localDigits.slice(code.length);
  }

  // Limit to 15 total digits recommended by E.164 (excluding the country code here)
  const limited = localDigits.slice(0, 15);
  return code ? `(+${code}) ${limited}` : limited;
};

// Get placeholder and max length based on calling code
const getIntlConfig = (isoCode) => {
  const code = getCountryPhoneCode(isoCode);
  const prefix = code ? `(+${code}) ` : "";
  // prefix length plus up to 15 digits
  return { placeholder: code ? `(+${code}) ____________` : "Select country first", maxLength: prefix.length + 15, prefix, code };
};

export const ContactInformationSection = ({
  formData,
  fieldErrors,
  handleChange,
  setFormData,
  isPending,
}) => {
  const [phoneError, setPhoneError] = useState("");
  const [prevCountryCode, setPrevCountryCode] = useState("");
  const countryIso = formData.country || "";
  const intlConfig = getIntlConfig(countryIso);

  // Reset phone number when country changes
  useEffect(() => {
    if (prevCountryCode && prevCountryCode !== countryIso && formData.phoneNumber) {
      setFormData((prev) => ({ ...prev, phoneNumber: "" }));
      setPhoneError("");
    }
    if (countryIso !== prevCountryCode) setPrevCountryCode(countryIso);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [countryIso]);

  const handlePhoneChange = (e) => {
    const formatted = formatIntlPhone(e.target.value, intlConfig.code);
    setFormData((prev) => ({ ...prev, phoneNumber: formatted }));
    // Clear error while typing
    setPhoneError("");
  };

  const handlePhoneBlur = () => {
    if (!countryIso) {
      setPhoneError("Please select a country first");
      return;
    }
    const digits = (formData.phoneNumber || "").replace(/\D/g, "");
    const code = String(intlConfig.code || "");
    const local = code && digits.startsWith(code) ? digits.slice(code.length) : digits;
    // Basic validation: at least 6 digits local part (conservative) and up to 15
    if (local && (local.length < 6 || local.length > 15)) {
      setPhoneError("Enter a valid phone number (6-15 digits after country code)");
    } else {
      setPhoneError("");
    }
  };

  return (
    <div className="border-b border-gray-300 space-y-6 pb-8">
      <label className="block text-sm font-medium mb-4">
        Contact Information
      </label>

      <div>
        <label className="block text-sm font-medium mb-2">Name</label>
        <Input
          name="contactName"
          value={formData.contactName}
          onChange={handleChange}
          placeholder="Enter your name or property manager"
          className="w-full"
          required
          disabled={isPending}
        />
        {fieldErrors.contactName && (
          <p className="mt-1 text-red-400 text-sm">{fieldErrors.contactName}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Phone Number</label>
        <Input
          name="phoneNumber"
          value={formData.phoneNumber}
          onChange={handlePhoneChange}
          onBlur={handlePhoneBlur}
          onPaste={(e) => {
            e.preventDefault();
            const formatted = formatIntlPhone(e.clipboardData.getData("text"), intlConfig.code);
            setFormData((prev) => ({ ...prev, phoneNumber: formatted }));
          }}
          placeholder={intlConfig.placeholder}
          type="tel"
          className="w-full"
          required
          disabled={isPending || !countryIso}
          maxLength={intlConfig.maxLength}
        />
        {!countryIso && (
          <p className="mt-1 text-gray-500 text-sm">Please select a country first</p>
        )}
        {(phoneError || fieldErrors.phoneNumber) && (
          <p className="mt-1 text-red-400 text-sm">{phoneError || fieldErrors.phoneNumber}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Email</label>
        <Input
          name="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="contact@example.com"
          type="email"
          className="w-full"
          required
          disabled={isPending}
        />
        {fieldErrors.email && (
          <p className="mt-1 text-red-400 text-sm">{fieldErrors.email}</p>
        )}
      </div>
    </div>
  );
};
