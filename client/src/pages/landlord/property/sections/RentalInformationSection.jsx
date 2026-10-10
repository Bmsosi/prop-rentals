import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CalendarIcon } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { RENTCYCLE_OPTIONS } from "@/constants/rentCycles";

export const RentalInformationSection = ({
  formData,
  fieldErrors,
  handleChange,
  setFormData,
  isPending,
}) => {
  return (
    <div className="border-b border-gray-300 space-y-6 pb-8">
      <label className="block text-sm font-medium mb-4">
        Rental Information
      </label>
      {/* Rent Cycle */}
      <div>
        <label className="block text-sm font-medium mb-2">Rent Cycle</label>
        <Select
          value={formData.rentCycle}
          onValueChange={(value) =>
            handleChange({ target: { name: "rentCycle", value } })
          }
          disabled={isPending}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select rent cycle" />
          </SelectTrigger>
          <SelectContent>
            {RENTCYCLE_OPTIONS.map(({ value, label }) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {fieldErrors.rentCycle && (
          <p className="mt-1 text-red-400 text-sm">{fieldErrors.rentCycle}</p>
        )}
      </div>

      {/* Rent Amount & Security Deposit */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">Rent</label>
          <Input
            name="rentAmount"
            value={formData.rentAmount}
            onChange={handleChange}
            placeholder="$ 1,200"
            className="w-full text-sm"
            required
            disabled={isPending}
          />
          {fieldErrors.rentAmount && (
            <p className="mt-1 text-red-400 text-sm">{fieldErrors.rentAmount}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">
            Security Deposit
          </label>
          <Input
            name="securityDeposit"
            value={formData.securityDeposit}
            onChange={handleChange}
            placeholder="$ 600"
            className="w-full text-sm"
            required
            disabled={isPending}
          />
          {fieldErrors.securityDeposit && (
            <p className="mt-1 text-red-400 text-sm">
              {fieldErrors.securityDeposit}
            </p>
          )}
        </div>
      </div>

      {/* Available From */}
      <div>
        <label className="block text-sm font-medium mb-2">Available From</label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              className={cn(
                "w-1/2 justify-start text-left font-normal border-gray-300 hover:bg-gray-50 bg-card",
                !formData.availableDate && "text-gray-600"
              )}
              disabled={isPending}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {formData.availableDate ? (
                format(formData.availableDate, "PPP")
              ) : (
                <span>Select date</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <Calendar
              mode="single"
              selected={formData.availableDate}
              onSelect={(date) =>
                setFormData((prev) => ({
                  ...prev,
                  availableDate: date,
                }))
              }
              initialFocus
            />
          </PopoverContent>
        </Popover>
        {fieldErrors.availableDate && (
          <p className="mt-1 text-red-400 text-sm">
            {fieldErrors.availableDate}
          </p>
        )}
      </div>
    </div>
  );
};
