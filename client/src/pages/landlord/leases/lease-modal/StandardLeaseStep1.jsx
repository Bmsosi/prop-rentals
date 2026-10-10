import React, { useState, useEffect } from "react";
import { DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Check, ChevronsUpDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";

export default function StandardLeaseStep1({
    listings,
    selectedListing,
    setSelectedListing,
    listingSearchQuery,
    setListingSearchQuery,
    listingPopoverOpen,
    setListingPopoverOpen,
    selectedListingText,
    filteredListings,
    standardLeaseData,
    setStandardLeaseData,
    onBack,
    onContinue,
}) {
    const [errors, setErrors] = useState({});

    // Pre-fill rent amount when listing is selected
    useEffect(() => {
        console.log('useEffect triggered - selectedListing:', selectedListing);
        console.log('Current rentAmount:', standardLeaseData.rentAmount);
        
        if (selectedListing && listings.length > 0) {
            const listing = listings.find(l => l.id === selectedListing);
            console.log('Found listing:', listing?.title, 'Rent:', listing?.rentAmount);
            
            // Pre-fill rent if listing has rentAmount and current rent is empty or not set
            if (listing && listing.rentAmount) {
                const currentRent = standardLeaseData.rentAmount;
                if (!currentRent || currentRent === '' || currentRent === '0') {
                    console.log('✅ Pre-filling rent from listing:', listing.rentAmount);
                    setStandardLeaseData(prev => ({
                        ...prev,
                        rentAmount: listing.rentAmount.toString()
                    }));
                } else {
                    console.log('⚠️ Rent already set, not overriding:', currentRent);
                }
            } else {
                console.log('⚠️ Listing has no rent or listing not found');
            }
        } else {
            console.log('⚠️ No listing selected or listings empty');
        }
    }, [selectedListing, listings]);

    // Function to generate random demo data
    const fillDemoData = () => {
        const firstNames = ['John', 'Jane', 'Michael', 'Sarah', 'David', 'Emily', 'Robert', 'Lisa'];
        const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis'];
        const streets = ['Main Street', 'Oak Avenue', 'Maple Drive', 'Pine Road', 'Cedar Lane'];
        const cities = ['Vancouver', 'Victoria', 'Kelowna', 'Surrey', 'Burnaby'];
        const provinces = ['BC', 'BC', 'BC', 'AB', 'ON'];
        
        const randomName = () => ({
            first: firstNames[Math.floor(Math.random() * firstNames.length)],
            last: lastNames[Math.floor(Math.random() * lastNames.length)]
        });
        
        const landlord = randomName();
        const tenant = randomName();
        const randomCity = cities[Math.floor(Math.random() * cities.length)];
        const randomStreet = `${Math.floor(Math.random() * 9000) + 1000} ${streets[Math.floor(Math.random() * streets.length)]}`;
        const randomUnit = `${Math.floor(Math.random() * 500) + 100}`; // Always generate unit number
        const postalCodes = ['V6B 1A1', 'V5K 0A1', 'V6Z 1Y6', 'V7Y 1B3', 'V3M 5Z5'];
        
        // Auto-select first listing if available and get its rent
        let listingToUse = listings.find(l => l.id === selectedListing);
        if (listings.length > 0 && !selectedListing) {
            setSelectedListing(listings[0].id);
            listingToUse = listings[0];
        }
        
        setStandardLeaseData({
            ...standardLeaseData,
            landlordLastName: landlord.last,
            landlordFirstName: landlord.first,
            landlordPhone: `+1 (${Math.floor(Math.random() * 900) + 100}) ${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`,
            landlordEmail: `${landlord.first.toLowerCase()}.${landlord.last.toLowerCase()}@example.com`,
            tenantLastName: tenant.last,
            tenantFirstName: tenant.first,
            tenantPhone: `+1 (${Math.floor(Math.random() * 900) + 100}) ${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`,
            tenantEmail: `${tenant.first.toLowerCase()}.${tenant.last.toLowerCase()}@email.com`,
            tenantOtherPhone: Math.random() > 0.5 ? `+1 (${Math.floor(Math.random() * 900) + 100}) ${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}` : '',
            tenantOtherEmail: Math.random() > 0.5 ? `${tenant.first.toLowerCase()}2@email.com` : '',
            unitNumber: randomUnit,
            streetAddress: randomStreet,
            city: randomCity,
            province: provinces[Math.floor(Math.random() * provinces.length)],
            postalCode: postalCodes[Math.floor(Math.random() * postalCodes.length)],
            // Keep existing rentAmount if already set (from listing pre-fill)
            // rentAmount is NOT updated here - preserves the listing's rent
        });
        
        // Clear any errors
        setErrors({});
    };

    const validateField = (field, value) => {
        let error = "";
        
        switch (field) {
            case "landlordLastName":
            case "tenantLastName":
                if (!value || value.trim() === "") {
                    error = "This field is required";
                }
                break;
            case "streetAddress":
                if (!value || value.trim() === "") {
                    error = "Street address is required";
                }
                break;
            case "city":
                if (!value || value.trim() === "") {
                    error = "City is required";
                }
                break;
            case "province":
                if (!value || value.trim() === "") {
                    error = "Province is required";
                }
                break;
            case "postalCode":
                if (value && !/^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$/.test(value)) {
                    error = "Invalid postal code format (e.g., A1A 1A1)";
                }
                break;
            case "tenantEmail":
                if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
                    error = "Invalid email format";
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

        if (!selectedListing) {
            newErrors.selectedListing = "Please select a listing";
            isValid = false;
        }
        if (!standardLeaseData.landlordLastName?.trim()) {
            newErrors.landlordLastName = "Landlord last name is required";
            isValid = false;
        }
        if (!standardLeaseData.tenantLastName?.trim()) {
            newErrors.tenantLastName = "Tenant last name is required";
            isValid = false;
        }
        if (!standardLeaseData.streetAddress?.trim()) {
            newErrors.streetAddress = "Street address is required";
            isValid = false;
        }
        if (!standardLeaseData.city?.trim()) {
            newErrors.city = "City is required";
            isValid = false;
        }
        if (!standardLeaseData.province?.trim()) {
            newErrors.province = "Province is required";
            isValid = false;
        }
        if (standardLeaseData.postalCode && !/^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$/.test(standardLeaseData.postalCode)) {
            newErrors.postalCode = "Invalid postal code format";
            isValid = false;
        }
        if (standardLeaseData.tenantEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(standardLeaseData.tenantEmail)) {
            newErrors.tenantEmail = "Invalid email format";
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
                    Parties & Rental Unit (Page 1 of 4)
                </DialogTitle>
            </DialogHeader>

            {/* Fill Demo Data Button */}
            <div className="flex justify-center mb-3">
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

            <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2">
                {/* Listing Select */}
                <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-900">Select Listing</Label>
                    <Popover open={listingPopoverOpen} onOpenChange={setListingPopoverOpen}>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                role="combobox"
                                className="w-full justify-between bg-primary-foreground"
                                disabled={listings.length === 0}
                            >
                                {selectedListingText || (listings.length === 0 ? "No available listings" : "Choose a listing")}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="p-0" align="start" style={{ width: 'var(--radix-popover-trigger-width)' }}>
                            <div className="p-2">
                                <div className="relative">
                                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Search listings..."
                                        value={listingSearchQuery}
                                        onChange={(e) => setListingSearchQuery(e.target.value)}
                                        className="pl-8 bg-primary-foreground"
                                    />
                                </div>
                            </div>
                            <div className="max-h-[300px] overflow-y-auto">
                                {filteredListings.length > 0 ? (
                                    <div className="p-1">
                                        {filteredListings.map((l) => (
                                            <div
                                                key={l.id}
                                                className={cn(
                                                    "relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground",
                                                    selectedListing === l.id && "bg-accent"
                                                )}
                                                            onClick={() => {
                                                                setSelectedListing(l.id === selectedListing ? "" : l.id);
                                                                setListingPopoverOpen(false);
                                                                setListingSearchQuery("");
                                                                if (errors.selectedListing) setErrors(prev => ({ ...prev, selectedListing: "" }));
                                                                
                                                                // Pre-fill rent amount from listing
                                                                if (l.id !== selectedListing && l.rentAmount) {
                                                                    setStandardLeaseData(prev => ({
                                                                        ...prev,
                                                                        rentAmount: l.rentAmount.toString()
                                                                    }));
                                                                }
                                                            }}
                                            >
                                                <Check
                                                    className={cn(
                                                        "mr-2 h-4 w-4",
                                                        selectedListing === l.id ? "opacity-100" : "opacity-0"
                                                    )}
                                                />
                                                <span className="flex-1 truncate">
                                                    {l.title} — {l.streetAddress}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="p-4 text-center text-sm text-muted-foreground">
                                        {listingSearchQuery ? "No listings found." : "No available listings"}
                                    </div>
                                )}
                            </div>
                        </PopoverContent>
                    </Popover>
                    {errors.selectedListing && <p className="text-xs text-red-600 mt-1">{errors.selectedListing}</p>}
                </div>

                <div className="border-t pt-4">
                    <h3 className="font-semibold text-primary mb-3">Landlord Information</h3>
                    <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <Label className="text-xs text-gray-600">Last Name *</Label>
                                <Input
                                    placeholder="Last name"
                                    value={standardLeaseData.landlordLastName}
                                    onChange={(e) => {
                                        setStandardLeaseData(prev => ({ ...prev, landlordLastName: e.target.value }));
                                        if (errors.landlordLastName) setErrors(prev => ({ ...prev, landlordLastName: "" }));
                                    }}
                                    onBlur={(e) => validateField("landlordLastName", e.target.value)}
                                    className={`bg-primary-foreground ${errors.landlordLastName ? "border-red-500" : ""}`}
                                />
                                {errors.landlordLastName && <p className="text-xs text-red-600">{errors.landlordLastName}</p>}
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs text-gray-600">First & Middle Name(s)</Label>
                                <Input
                                    placeholder="First and middle name(s)"
                                    value={standardLeaseData.landlordFirstName}
                                    onChange={(e) => setStandardLeaseData(prev => ({ ...prev, landlordFirstName: e.target.value }))}
                                    className="bg-primary-foreground"
                                />
                            </div>
                        </div>
                        <p className="text-xs text-gray-500 mb-2">Contact Information for Landlord(s)</p>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <Label className="text-xs text-gray-600">Phone (optional)</Label>
                                <Input
                                    type="tel"
                                    placeholder="Phone number"
                                    value={standardLeaseData.landlordPhone}
                                    onChange={(e) => setStandardLeaseData(prev => ({ ...prev, landlordPhone: e.target.value }))}
                                    className="bg-primary-foreground"
                                />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs text-gray-600">Email (optional)</Label>
                                <Input
                                    type="email"
                                    placeholder="Email address"
                                    value={standardLeaseData.landlordEmail}
                                    onChange={(e) => setStandardLeaseData(prev => ({ ...prev, landlordEmail: e.target.value }))}
                                    className="bg-primary-foreground"
                                />
                            </div>
                        </div>
                        <p className="text-xs text-gray-500">Additional landlord (optional)</p>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <Label className="text-xs text-gray-600">Last Name</Label>
                                <Input
                                    placeholder="Last name"
                                    value={standardLeaseData.landlord2LastName}
                                    onChange={(e) => setStandardLeaseData(prev => ({ ...prev, landlord2LastName: e.target.value }))}
                                    className="bg-primary-foreground"
                                />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs text-gray-600">First & Middle Name(s)</Label>
                                <Input
                                    placeholder="First and middle name(s)"
                                    value={standardLeaseData.landlord2FirstName}
                                    onChange={(e) => setStandardLeaseData(prev => ({ ...prev, landlord2FirstName: e.target.value }))}
                                    className="bg-primary-foreground"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="border-t pt-4">
                    <h3 className="font-semibold text-primary mb-3">Tenant Information</h3>
                    <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <Label className="text-xs text-gray-600">Last Name *</Label>
                                <Input
                                    placeholder="Last name"
                                    value={standardLeaseData.tenantLastName}
                                    onChange={(e) => {
                                        setStandardLeaseData(prev => ({ ...prev, tenantLastName: e.target.value }));
                                        if (errors.tenantLastName) setErrors(prev => ({ ...prev, tenantLastName: "" }));
                                    }}
                                    onBlur={(e) => validateField("tenantLastName", e.target.value)}
                                    className={`bg-primary-foreground ${errors.tenantLastName ? "border-red-500" : ""}`}
                                />
                                {errors.tenantLastName && <p className="text-xs text-red-600">{errors.tenantLastName}</p>}
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs text-gray-600">First & Middle Name(s)</Label>
                                <Input
                                    placeholder="First and middle name(s)"
                                    value={standardLeaseData.tenantFirstName}
                                    onChange={(e) => setStandardLeaseData(prev => ({ ...prev, tenantFirstName: e.target.value }))}
                                    className="bg-primary-foreground"
                                />
                            </div>
                        </div>
                        <p className="text-xs text-gray-500 mb-2">Contact Information for Tenant(s)</p>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <Label className="text-xs text-gray-600">Phone (optional)</Label>
                                <Input
                                    type="tel"
                                    placeholder="Phone number"
                                    value={standardLeaseData.tenantPhone}
                                    onChange={(e) => setStandardLeaseData(prev => ({ ...prev, tenantPhone: e.target.value }))}
                                    className="bg-primary-foreground"
                                />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs text-gray-600">Email (optional)</Label>
                                <Input
                                    type="email"
                                    placeholder="Email address"
                                    value={standardLeaseData.tenantEmail}
                                    onChange={(e) => {
                                        setStandardLeaseData(prev => ({ ...prev, tenantEmail: e.target.value }));
                                        if (errors.tenantEmail) setErrors(prev => ({ ...prev, tenantEmail: "" }));
                                    }}
                                    onBlur={(e) => validateField("tenantEmail", e.target.value)}
                                    className={`bg-primary-foreground ${errors.tenantEmail ? "border-red-500" : ""}`}
                                />
                                {errors.tenantEmail && <p className="text-xs text-red-600">{errors.tenantEmail}</p>}
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <Label className="text-xs text-gray-600">Other Phone (optional)</Label>
                                <Input
                                    type="tel"
                                    placeholder="Other phone number"
                                    value={standardLeaseData.tenantOtherPhone}
                                    onChange={(e) => setStandardLeaseData(prev => ({ ...prev, tenantOtherPhone: e.target.value }))}
                                    className="bg-primary-foreground"
                                />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs text-gray-600">Other Email (optional)</Label>
                                <Input
                                    type="email"
                                    placeholder="Other email address"
                                    value={standardLeaseData.tenantOtherEmail}
                                    onChange={(e) => setStandardLeaseData(prev => ({ ...prev, tenantOtherEmail: e.target.value }))}
                                    className="bg-primary-foreground"
                                />
                            </div>
                        </div>
                        <p className="text-xs text-gray-500">Additional tenant (optional)</p>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <Label className="text-xs text-gray-600">Last Name</Label>
                                <Input
                                    placeholder="Last name"
                                    value={standardLeaseData.tenant2LastName}
                                    onChange={(e) => setStandardLeaseData(prev => ({ ...prev, tenant2LastName: e.target.value }))}
                                    className="bg-primary-foreground"
                                />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs text-gray-600">First & Middle Name(s)</Label>
                                <Input
                                    placeholder="First and middle name(s)"
                                    value={standardLeaseData.tenant2FirstName}
                                    onChange={(e) => setStandardLeaseData(prev => ({ ...prev, tenant2FirstName: e.target.value }))}
                                    className="bg-primary-foreground"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="border-t pt-4">
                    <h3 className="font-semibold text-primary mb-3">Rental Unit Address</h3>
                    <div className="space-y-3">
                        <div className="space-y-1">
                            <Label className="text-xs text-gray-600">Unit Number (optional)</Label>
                            <Input
                                placeholder="Unit #"
                                value={standardLeaseData.unitNumber}
                                onChange={(e) => setStandardLeaseData(prev => ({ ...prev, unitNumber: e.target.value }))}
                                className="bg-primary-foreground"
                            />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs text-gray-600">Street Number and Name *</Label>
                            <Input
                                placeholder="e.g., 123 Main Street"
                                value={standardLeaseData.streetAddress}
                                onChange={(e) => {
                                    setStandardLeaseData(prev => ({ ...prev, streetAddress: e.target.value }));
                                    if (errors.streetAddress) setErrors(prev => ({ ...prev, streetAddress: "" }));
                                }}
                                onBlur={(e) => validateField("streetAddress", e.target.value)}
                                className={`bg-primary-foreground ${errors.streetAddress ? "border-red-500" : ""}`}
                            />
                            {errors.streetAddress && <p className="text-xs text-red-600">{errors.streetAddress}</p>}
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                            <div className="space-y-1">
                                <Label className="text-xs text-gray-600">City *</Label>
                                <Input
                                    placeholder="City"
                                    value={standardLeaseData.city}
                                    onChange={(e) => {
                                        setStandardLeaseData(prev => ({ ...prev, city: e.target.value }));
                                        if (errors.city) setErrors(prev => ({ ...prev, city: "" }));
                                    }}
                                    onBlur={(e) => validateField("city", e.target.value)}
                                    className={`bg-primary-foreground ${errors.city ? "border-red-500" : ""}`}
                                />
                                {errors.city && <p className="text-xs text-red-600">{errors.city}</p>}
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs text-gray-600">Province *</Label>
                                <Input
                                    placeholder="Province"
                                    value={standardLeaseData.province}
                                    onChange={(e) => {
                                        setStandardLeaseData(prev => ({ ...prev, province: e.target.value }));
                                        if (errors.province) setErrors(prev => ({ ...prev, province: "" }));
                                    }}
                                    onBlur={(e) => validateField("province", e.target.value)}
                                    className={`bg-primary-foreground ${errors.province ? "border-red-500" : ""}`}
                                />
                                {errors.province && <p className="text-xs text-red-600">{errors.province}</p>}
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs text-gray-600">Postal Code</Label>
                                <Input
                                    placeholder="A1A 1A1"
                                    value={standardLeaseData.postalCode}
                                    onChange={(e) => {
                                        setStandardLeaseData(prev => ({ ...prev, postalCode: e.target.value }));
                                        if (errors.postalCode) setErrors(prev => ({ ...prev, postalCode: "" }));
                                    }}
                                    onBlur={(e) => validateField("postalCode", e.target.value)}
                                    className={`bg-primary-foreground ${errors.postalCode ? "border-red-500" : ""}`}
                                />
                                {errors.postalCode && <p className="text-xs text-red-600">{errors.postalCode}</p>}
                            </div>
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

