import React, { useState } from "react";
import { DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

export default function StandardLeaseStep2({
    standardLeaseData,
    setStandardLeaseData,
    onBack,
    onContinue,
}) {
    const [errors, setErrors] = useState({});

    // Function to fill demo data for this step
    const fillDemoData = () => {
        const today = new Date();
        const startDate = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days from now
        const endDate = new Date(startDate.getTime() + 365 * 24 * 60 * 60 * 1000); // 1 year lease
        
        setStandardLeaseData({
            ...standardLeaseData,
            // Start date
            startDay: startDate.getDate().toString(),
            startMonth: (startDate.getMonth() + 1).toString(),
            startYear: startDate.getFullYear().toString(),
            // Tenancy type
            tenancyType: "fixed-term",
            // Fixed end date
            fixedEndDay: endDate.getDate().toString(),
            fixedEndMonth: (endDate.getMonth() + 1).toString(),
            fixedEndYear: endDate.getFullYear().toString(),
            fixedEndCondition: "continues",
            // Rent - preserve existing rentAmount from listing, don't override
            // rentAmount is NOT updated here - keeps the value pre-filled from listing
            rentFrequency: "month",
            rentDueDay: "1",
        });
        
        setErrors({});
    };

    const validateField = (field, value) => {
        let error = "";
        
        switch (field) {
            case "startDay":
            case "fixedEndDay":
                const day = parseInt(value);
                if (!value || isNaN(day) || day < 1 || day > 31) {
                    error = "Day must be between 1 and 31";
                }
                break;
            case "startMonth":
            case "fixedEndMonth":
                const month = parseInt(value);
                if (!value || isNaN(month) || month < 1 || month > 12) {
                    error = "Month must be between 1 and 12";
                }
                break;
            case "startYear":
            case "fixedEndYear":
                const year = parseInt(value);
                if (!value || isNaN(year) || year < 2024) {
                    error = "Please enter a valid year";
                }
                break;
            case "rentAmount":
                const amount = parseFloat(value);
                if (!value || isNaN(amount) || amount <= 0) {
                    error = "Rent amount must be greater than 0";
                }
                break;
            case "rentDueDay":
                const dueDay = parseInt(value);
                if (!value || isNaN(dueDay) || dueDay < 1 || dueDay > 31) {
                    error = "Due day must be between 1 and 31";
                }
                break;
            default:
                break;
        }
        
        setErrors(prev => ({ ...prev, [field]: error }));
        return error === "";
    };

    const validateAll = () => {
        const newErrors = {};
        let isValid = true;

        // Start date validation
        const startDay = parseInt(standardLeaseData.startDay);
        const startMonth = parseInt(standardLeaseData.startMonth);
        const startYear = parseInt(standardLeaseData.startYear);

        if (!standardLeaseData.startDay || isNaN(startDay) || startDay < 1 || startDay > 31) {
            newErrors.startDay = "Day must be between 1 and 31";
            isValid = false;
        }
        if (!standardLeaseData.startMonth || isNaN(startMonth) || startMonth < 1 || startMonth > 12) {
            newErrors.startMonth = "Month must be between 1 and 12";
            isValid = false;
        }
        if (!standardLeaseData.startYear || isNaN(startYear) || startYear < 2024) {
            newErrors.startYear = "Please enter a valid year";
            isValid = false;
        }

        // Tenancy type
        if (!standardLeaseData.tenancyType) {
            newErrors.tenancyType = "Please select a tenancy type";
            isValid = false;
        }

        // Other periodic validation
        if (standardLeaseData.tenancyType === "other-periodic") {
            if (!standardLeaseData.periodicBasis) {
                newErrors.periodicBasis = "Please specify the periodic basis";
                isValid = false;
            }
            if (standardLeaseData.periodicBasis === "other" && !standardLeaseData.periodicOther?.trim()) {
                newErrors.periodicOther = "Please specify the custom period";
                isValid = false;
            }
        }

        // Fixed term validation
        if (standardLeaseData.tenancyType === "fixed-term") {
            const endDay = parseInt(standardLeaseData.fixedEndDay);
            const endMonth = parseInt(standardLeaseData.fixedEndMonth);
            const endYear = parseInt(standardLeaseData.fixedEndYear);

            if (!standardLeaseData.fixedEndDay || isNaN(endDay) || endDay < 1 || endDay > 31) {
                newErrors.fixedEndDay = "Day must be between 1 and 31";
                isValid = false;
            }
            if (!standardLeaseData.fixedEndMonth || isNaN(endMonth) || endMonth < 1 || endMonth > 12) {
                newErrors.fixedEndMonth = "Month must be between 1 and 12";
                isValid = false;
            }
            if (!standardLeaseData.fixedEndYear || isNaN(endYear) || endYear < 2024) {
                newErrors.fixedEndYear = "Please enter a valid year";
                isValid = false;
            }
            if (!standardLeaseData.fixedEndCondition) {
                newErrors.fixedEndCondition = "Please select an end condition (D or E)";
                isValid = false;
            }
            if (standardLeaseData.fixedEndCondition === "ends" && !standardLeaseData.vacateReason?.trim()) {
                newErrors.vacateReason = "Vacate reason is required for option E";
                isValid = false;
            }
        }

        // Rent validation
        const rentAmount = parseFloat(standardLeaseData.rentAmount);
        if (!standardLeaseData.rentAmount || isNaN(rentAmount) || rentAmount <= 0) {
            newErrors.rentAmount = "Rent amount must be greater than 0";
            isValid = false;
        }

        const rentDueDay = parseInt(standardLeaseData.rentDueDay);
        if (!standardLeaseData.rentDueDay || isNaN(rentDueDay) || rentDueDay < 1 || rentDueDay > 31) {
            newErrors.rentDueDay = "Due day must be between 1 and 31";
            isValid = false;
        }

        setErrors(newErrors);
        return isValid;
    };

    const handleContinue = () => {
        if (validateAll()) {
            onContinue();
        }
    };
    return (
        <>
            <DialogHeader className="p-0 pb-4 border-b mb-6 -mt-6">
                <DialogTitle className="text-center text-[20px] font-bold text-primary">
                    Term & Rent Details (Page 2 of 4)
                </DialogTitle>
            </DialogHeader>

            {/* Fill Demo Data Button */}
            <div className="flex justify-center mb-3 -mt-2">
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={fillDemoData}
                    className="rounded-full px-4 bg-blue-50/70 text-blue-700 border border-blue-100 hover:bg-blue-100"
                >
                    Demo Autofill
                </Button>
            </div>

            <div className="space-y-6 max-h-[60vh] overflow-y-auto">
                {/* Tenancy Start Date */}
                <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-900">Tenancy Start Date *</Label>
                    <div className="grid grid-cols-3 gap-3">
                        <div className="space-y-1">
                            <Label className="text-xs text-gray-600">Day</Label>
                            <Input
                                type="number"
                                placeholder="DD"
                                min="1"
                                max="31"
                                value={standardLeaseData.startDay}
                                onChange={(e) => {
                                    setStandardLeaseData(prev => ({ ...prev, startDay: e.target.value }));
                                    if (errors.startDay) setErrors(prev => ({ ...prev, startDay: "" }));
                                }}
                                onBlur={(e) => validateField("startDay", e.target.value)}
                                className={`bg-primary-foreground ${errors.startDay ? "border-red-500" : ""}`}
                            />
                            {errors.startDay && <p className="text-xs text-red-600">{errors.startDay}</p>}
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs text-gray-600">Month</Label>
                            <Input
                                type="number"
                                placeholder="MM"
                                min="1"
                                max="12"
                                value={standardLeaseData.startMonth}
                                onChange={(e) => {
                                    setStandardLeaseData(prev => ({ ...prev, startMonth: e.target.value }));
                                    if (errors.startMonth) setErrors(prev => ({ ...prev, startMonth: "" }));
                                }}
                                onBlur={(e) => validateField("startMonth", e.target.value)}
                                className={`bg-primary-foreground ${errors.startMonth ? "border-red-500" : ""}`}
                            />
                            {errors.startMonth && <p className="text-xs text-red-600">{errors.startMonth}</p>}
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs text-gray-600">Year</Label>
                            <Input
                                type="number"
                                placeholder="YYYY"
                                min="2024"
                                value={standardLeaseData.startYear}
                                onChange={(e) => {
                                    setStandardLeaseData(prev => ({ ...prev, startYear: e.target.value }));
                                    if (errors.startYear) setErrors(prev => ({ ...prev, startYear: "" }));
                                }}
                                onBlur={(e) => validateField("startYear", e.target.value)}
                                className={`bg-primary-foreground ${errors.startYear ? "border-red-500" : ""}`}
                            />
                            {errors.startYear && <p className="text-xs text-red-600">{errors.startYear}</p>}
                        </div>
                    </div>
                </div>

                {/* Tenancy Type */}
                <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-900">Tenancy Type *</Label>
                    <Select value={standardLeaseData.tenancyType} onValueChange={(val) => {
                        setStandardLeaseData(prev => ({ ...prev, tenancyType: val, periodicBasis: "", periodicOther: "", fixedEndCondition: "", vacateReason: "" }));
                        if (errors.tenancyType) setErrors(prev => ({ ...prev, tenancyType: "", periodicBasis: "", periodicOther: "", fixedEndCondition: "", vacateReason: "" }));
                    }}>
                        <SelectTrigger className={`bg-primary-foreground ${errors.tenancyType ? "border-red-500" : ""}`}>
                            <SelectValue placeholder="Select tenancy type" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="month-to-month">A) Month-to-month</SelectItem>
                            <SelectItem value="other-periodic">B) Other periodic basis</SelectItem>
                            <SelectItem value="fixed-term">C) Fixed term</SelectItem>
                        </SelectContent>
                    </Select>
                    {errors.tenancyType && <p className="text-xs text-red-600">{errors.tenancyType}</p>}
                </div>

                {/* Other Periodic Basis Options (if other-periodic selected) */}
                {standardLeaseData.tenancyType === "other-periodic" && (
                    <div className="space-y-3 bg-gray-50 p-4 rounded-lg border border-gray-300">
                        <Label className="text-sm font-semibold text-gray-900">Specify periodic basis:</Label>
                        <RadioGroup value={standardLeaseData.periodicBasis} onValueChange={(val) => {
                            setStandardLeaseData(prev => ({ ...prev, periodicBasis: val }));
                            if (errors.periodicBasis) setErrors(prev => ({ ...prev, periodicBasis: "" }));
                        }}>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="weekly" id="weekly" />
                                <Label htmlFor="weekly" className="text-sm font-normal cursor-pointer">Weekly</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="bi-weekly" id="bi-weekly" />
                                <Label htmlFor="bi-weekly" className="text-sm font-normal cursor-pointer">Bi-weekly</Label>
                            </div>
                            <div className="flex items-start space-x-2">
                                <RadioGroupItem value="other" id="other" className="mt-1" />
                                <div className="flex-1">
                                    <Label htmlFor="other" className="text-sm font-normal cursor-pointer">Other:</Label>
                                    {standardLeaseData.periodicBasis === "other" && (
                                        <Input
                                            placeholder="Specify (e.g., quarterly)"
                                            value={standardLeaseData.periodicOther}
                                            onChange={(e) => {
                                                setStandardLeaseData(prev => ({ ...prev, periodicOther: e.target.value }));
                                                if (errors.periodicOther) setErrors(prev => ({ ...prev, periodicOther: "" }));
                                            }}
                                            className={`mt-1 bg-primary-foreground ${errors.periodicOther ? "border-red-500" : ""}`}
                                        />
                                    )}
                                    {errors.periodicOther && <p className="text-xs text-red-600 mt-1">{errors.periodicOther}</p>}
                                </div>
                            </div>
                        </RadioGroup>
                        {errors.periodicBasis && <p className="text-xs text-red-600">{errors.periodicBasis}</p>}
                    </div>
                )}

                {/* Fixed Term End Date (if fixed-term selected) */}
                {standardLeaseData.tenancyType === "fixed-term" && (
                    <div className="space-y-3 bg-gray-50 p-4 rounded-lg border border-gray-300">
                        <Label className="text-sm font-semibold text-gray-900">Fixed Term End Date</Label>
                        <div className="grid grid-cols-3 gap-3">
                            <div className="space-y-1">
                                <Label className="text-xs text-gray-600">Day</Label>
                                <Input
                                    type="number"
                                    placeholder="DD"
                                    min="1"
                                    max="31"
                                    value={standardLeaseData.fixedEndDay}
                                    onChange={(e) => setStandardLeaseData(prev => ({ ...prev, fixedEndDay: e.target.value }))}
                                    className="bg-primary-foreground"
                                />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs text-gray-600">Month</Label>
                                <Input
                                    type="number"
                                    placeholder="MM"
                                    min="1"
                                    max="12"
                                    value={standardLeaseData.fixedEndMonth}
                                    onChange={(e) => setStandardLeaseData(prev => ({ ...prev, fixedEndMonth: e.target.value }))}
                                    className="bg-primary-foreground"
                                />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs text-gray-600">Year</Label>
                                <Input
                                    type="number"
                                    placeholder="YYYY"
                                    min="2024"
                                    value={standardLeaseData.fixedEndYear}
                                    onChange={(e) => setStandardLeaseData(prev => ({ ...prev, fixedEndYear: e.target.value }))}
                                    className="bg-primary-foreground"
                                />
                            </div>
                        </div>

                        <div className="border-t border-gray-300 pt-3 mt-3">
                            <Label className="text-sm font-semibold text-gray-900 mb-2 block">At the end of the fixed term:</Label>
                            <RadioGroup value={standardLeaseData.fixedEndCondition} onValueChange={(val) => {
                                setStandardLeaseData(prev => ({ ...prev, fixedEndCondition: val }));
                                if (errors.fixedEndCondition) setErrors(prev => ({ ...prev, fixedEndCondition: "" }));
                            }}>
                                <div className="flex items-start space-x-2">
                                    <RadioGroupItem value="continues" id="continues" className="mt-1" />
                                    <Label htmlFor="continues" className="text-sm font-normal cursor-pointer">
                                        <strong>D)</strong> The tenancy will continue on a month-to-month basis, or another fixed length of time, unless the tenant gives notice to end tenancy at least one clear month before the end of the term.
                                    </Label>
                                </div>
                                <div className="flex items-start space-x-2">
                                    <RadioGroupItem value="ends" id="ends" className="mt-1" />
                                    <Label htmlFor="ends" className="text-sm font-normal cursor-pointer">
                                        <strong>E)</strong> The tenancy is ended and the tenant must vacate the rental unit.
                                    </Label>
                                </div>
                            </RadioGroup>
                            {errors.fixedEndCondition && <p className="text-xs text-red-600 mt-1">{errors.fixedEndCondition}</p>}

                            {standardLeaseData.fixedEndCondition === "ends" && (
                                <div className="mt-3 space-y-2 pl-6">
                                    <div className="space-y-1">
                                        <Label className="text-xs text-gray-600">Reason tenant must vacate (required)</Label>
                                        <Input
                                            placeholder="e.g., Landlord's personal use"
                                            value={standardLeaseData.vacateReason}
                                            onChange={(e) => {
                                                setStandardLeaseData(prev => ({ ...prev, vacateReason: e.target.value }));
                                                if (errors.vacateReason) setErrors(prev => ({ ...prev, vacateReason: "" }));
                                            }}
                                            className={`bg-primary-foreground ${errors.vacateReason ? "border-red-500" : ""}`}
                                        />
                                        {errors.vacateReason && <p className="text-xs text-red-600">{errors.vacateReason}</p>}
                                    </div>
                                    <p className="text-xs text-amber-700 bg-amber-50 p-2 rounded border border-amber-200">
                                        ⚠️ The tenant must move out on or before the last day of the tenancy.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Rent Details */}
                <div className="border-t pt-4">
                    <h3 className="font-semibold text-primary mb-3">Rent Details</h3>
                    <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <Label className="text-xs text-gray-600">Rent Amount ($) *</Label>
                                <Input
                                    type="number"
                                    placeholder="e.g., 1500"
                                    min="0"
                                    step="0.01"
                                    value={standardLeaseData.rentAmount}
                                    onChange={(e) => {
                                        setStandardLeaseData(prev => ({ ...prev, rentAmount: e.target.value }));
                                        if (errors.rentAmount) setErrors(prev => ({ ...prev, rentAmount: "" }));
                                    }}
                                    onBlur={(e) => validateField("rentAmount", e.target.value)}
                                    className={`bg-primary-foreground ${errors.rentAmount ? "border-red-500" : ""}`}
                                />
                                {errors.rentAmount && <p className="text-xs text-red-600">{errors.rentAmount}</p>}
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs text-gray-600">Payment Frequency</Label>
                                <Select value={standardLeaseData.rentFrequency} onValueChange={(val) => setStandardLeaseData(prev => ({ ...prev, rentFrequency: val }))}>
                                    <SelectTrigger className="bg-primary-foreground">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="day">Daily</SelectItem>
                                        <SelectItem value="week">Weekly</SelectItem>
                                        <SelectItem value="month">Monthly</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs text-gray-600">Rent Due Day (e.g., 1st, 2nd, 15th) *</Label>
                            <Input
                                type="number"
                                placeholder="e.g., 1"
                                min="1"
                                max="31"
                                value={standardLeaseData.rentDueDay}
                                onChange={(e) => {
                                    setStandardLeaseData(prev => ({ ...prev, rentDueDay: e.target.value }));
                                    if (errors.rentDueDay) setErrors(prev => ({ ...prev, rentDueDay: "" }));
                                }}
                                onBlur={(e) => validateField("rentDueDay", e.target.value)}
                                className={`bg-primary-foreground ${errors.rentDueDay ? "border-red-500" : ""}`}
                            />
                            {errors.rentDueDay && <p className="text-xs text-red-600">{errors.rentDueDay}</p>}
                        </div>
                    </div>
                </div>
            </div>

            {/* Back + Continue Buttons */}
            <div className="flex justify-between mt-6 mb-6 gap-4">
                <Button
                    variant="outline"
                    className="flex-1 py-6 rounded-2xl"
                    onClick={onBack}
                >
                    Back
                </Button>

                <Button
                    className="flex-1 py-6 rounded-2xl"
                    onClick={handleContinue}
                >
                    Continue
                </Button>
            </div>
        </>
    );
}

