import React, { useState, useMemo, useEffect } from "react";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DatePicker } from "@/components/ui/date-picker";
import { PROPERTY_CATEGORY_NAMES, PROPERTY_OPTIONS } from "@/constants/propertyTypes";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axios";
import API_ENDPOINTS from "@/lib/apiEndpoints";
import { toast } from "sonner";
import { useAuthStore } from "@/store/authStore";
import { Label } from "@/components/ui/label";
import { Check, ChevronsUpDown, Search, Loader2, FileText, Upload } from "lucide-react";
import { cn } from "@/lib/utils";
import StandardLeaseStep1 from "./StandardLeaseStep1";
import StandardLeaseStep2 from "./StandardLeaseStep2";
import StandardLeaseStep3 from "./StandardLeaseStep3";
import StandardLeaseStep4 from "./StandardLeaseStep4";

export default function CreateLeaseModal({ open, onClose, tenantId, landlordId, listingId, onSuccess }) {
    const [file, setFile] = useState(null);
    const [step, setStep] = useState(1);

    const [selectedListing, setSelectedListing] = useState("");
    const [listingSearchQuery, setListingSearchQuery] = useState("");
    const [listingPopoverOpen, setListingPopoverOpen] = useState(false);
    const [leaseName, setLeaseName] = useState("");
    const [category, setCategory] = useState("");
    const [type, setType] = useState("");
    const [description, setDescription] = useState("");
    const [isSaving, setIsSaving] = useState(false);
    
    // Custom lease accounting fields
    const [customLeaseAccounting, setCustomLeaseAccounting] = useState({
        rentAmount: "",
        paymentFrequency: "",
        startDate: "",
        endDate: "",
        paymentDay: "",
        securityDeposit: "",
        depositAmount: "",
        paymentMethod: "",
        accountingNotes: ""
    });
    
    // Standard lease form fields
    const [standardLeaseData, setStandardLeaseData] = useState({
        // Parties
        landlordLastName: "",
        landlordFirstName: "",
        landlordPhone: "",
        landlordEmail: "",
        landlord2LastName: "",
        landlord2FirstName: "",
        tenantLastName: "",
        tenantFirstName: "",
        tenant2LastName: "",
        tenant2FirstName: "",
        tenantPhone: "",
        tenantEmail: "",
        tenantOtherPhone: "",
        tenantOtherEmail: "",
        // Rental Unit Address
        unitNumber: "",
        streetAddress: "",
        city: "",
        province: "",
        postalCode: "",
        // Service Address
        serviceAddressType: "landlord", // or "agent"
        serviceUnitNumber: "",
        serviceStreet: "",
        serviceCity: "",
        serviceProvince: "",
        servicePostalCode: "",
        serviceDayPhone: "",
        serviceOtherPhone: "",
        serviceEmail: "",
        serviceFax: "",
        serviceOtherEmail: "",
        // Term
        startDay: "",
        startMonth: "",
        startYear: "",
        tenancyType: "", // "month-to-month", "other-periodic", "fixed-term"
        periodicBasis: "", // "weekly", "bi-weekly", "other"
        periodicOther: "",
        fixedEndDay: "",
        fixedEndMonth: "",
        fixedEndYear: "",
        fixedEndCondition: "", // "continues", "ends"
        vacateReason: "",
        regulationSection: "",
        // Rent
        rentAmount: "",
        rentFrequency: "month", // "day", "week", "month"
        rentDueDay: "",
        rentIncreaseNotice: "month", // "day", "week", "month"
        // Included in Rent
        includedServices: [],
        parkingSpaces: "",
        otherIncluded1: "",
        otherIncluded2: "",
        otherIncluded3: "",
        additionalInfo: "",
        // Deposits
        securityDeposit: "",
        securityDepositDay: "",
        securityDepositMonth: "",
        securityDepositYear: "",
        petDeposit: "",
        petDepositDay: "",
        petDepositMonth: "",
        petDepositYear: "",
        petDepositNA: false,
    });

    const queryClient = useQueryClient();
    const { user } = useAuthStore();

    const handleFile = (e) => setFile(e.target.files[0]);

    const demoRentRanges = [
        { min: 1800, max: 2600 },
        { min: 2600, max: 3200 },
        { min: 3200, max: 4200 },
        { min: 4200, max: 5200 },
    ];

    const demoLeaseNames = [
        "Downtown Executive Suite Lease",
        "Family Home Rental Agreement",
        "Modern Loft Tenancy Contract",
        "Garden-Level Apartment Lease",
        "Luxury Condo Rental Agreement",
        "Urban Studio Lease Package",
    ];

    const demoPaymentMethods = ["Bank Transfer", "E-transfer"];

    const randomFromArray = (arr) => arr[Math.floor(Math.random() * arr.length)];

    const handleDemoFill = () => {
        if (!listings || listings.length === 0) {
            toast.error("No available listings to demo");
            return;
        }

        const listingToUse =
            listings.find((l) => l.id === selectedListing) || randomFromArray(listings);

        if (listingToUse && listingToUse.id !== selectedListing) {
            setSelectedListing(listingToUse.id);
        }

        const today = new Date();
        today.setDate(today.getDate() + 1);
        const startDate = format(today, "yyyy-MM-dd");
        const endDateDate = new Date(today);
        endDateDate.setFullYear(endDateDate.getFullYear() + 1);
        endDateDate.setDate(endDateDate.getDate() - 1);
        const endDate = format(endDateDate, "yyyy-MM-dd");

        const rentPreset = randomFromArray(demoRentRanges);
        const rentAmount = listingToUse?.rentAmount
            ? listingToUse.rentAmount
            : Math.floor(Math.random() * (rentPreset.max - rentPreset.min) + rentPreset.min);

        const securityDepositAmount =
            listingToUse?.securityDeposit ??
            Math.round((rentAmount * 0.5) / 50) * 50;

        const leaseNameChoice = `${randomFromArray(demoLeaseNames)} • ${
            listingToUse?.title || "Residence"
        }`;

        setCustomLeaseAccounting((prev) => ({
            ...prev,
            startDate,
            endDate,
            rentAmount: rentAmount.toString(),
            paymentFrequency: "MONTHLY",
            paymentDay: (Math.floor(Math.random() * 5) + 1).toString(),
            paymentMethod: randomFromArray(demoPaymentMethods),
            securityDeposit: securityDepositAmount.toString(),
            depositAmount: securityDepositAmount.toString(),
        }));

        setLeaseName(leaseNameChoice);
    };

    const yearDropdownOptions = useMemo(() => {
        const currentYear = new Date().getFullYear();
        return {
            captionLayout: "dropdown",
            fromYear: currentYear - 20,
            toYear: currentYear + 10,
        };
    }, []);

    const handleClose = () => {
        onClose();
        setTimeout(() => {
            setStep(1);
            setFile(null);
            setLeaseName("");
            setCategory("");
            setType("");
            setDescription("");
            setSelectedListing("");
            setListingSearchQuery("");
            setListingPopoverOpen(false);
            setIsSaving(false);
            setCustomLeaseAccounting({
                rentAmount: "",
                paymentFrequency: "",
                startDate: "",
                endDate: "",
                paymentDay: "",
                securityDeposit: "",
                depositAmount: "",
                paymentMethod: "",
                accountingNotes: ""
            });
            setStandardLeaseData({
                landlordLastName: "",
                landlordFirstName: "",
                landlordPhone: "",
                landlordEmail: "",
                landlord2LastName: "",
                landlord2FirstName: "",
                tenantLastName: "",
                tenantFirstName: "",
                tenant2LastName: "",
                tenant2FirstName: "",
                tenantPhone: "",
                tenantEmail: "",
                tenantOtherPhone: "",
                tenantOtherEmail: "",
                unitNumber: "",
                streetAddress: "",
                city: "",
                province: "",
                postalCode: "",
                serviceAddressType: "landlord",
                serviceUnitNumber: "",
                serviceStreet: "",
                serviceCity: "",
                serviceProvince: "",
                servicePostalCode: "",
                serviceDayPhone: "",
                serviceOtherPhone: "",
                serviceEmail: "",
                serviceFax: "",
                serviceOtherEmail: "",
                startDay: "",
                startMonth: "",
                startYear: "",
                tenancyType: "",
                periodicBasis: "",
                periodicOther: "",
                fixedEndDay: "",
                fixedEndMonth: "",
                fixedEndYear: "",
                fixedEndCondition: "",
                vacateReason: "",
                regulationSection: "",
                rentAmount: "",
                rentFrequency: "month",
                rentDueDay: "",
                rentIncreaseNotice: "month",
                includedServices: [],
                parkingSpaces: "",
                otherIncluded1: "",
                otherIncluded2: "",
                otherIncluded3: "",
                additionalInfo: "",
                securityDeposit: "",
                securityDepositDay: "",
                securityDepositMonth: "",
                securityDepositYear: "",
                petDeposit: "",
                petDepositDay: "",
                petDepositMonth: "",
                petDepositYear: "",
                petDepositNA: false,
            });
        }, 200);
    };

    // Fetch active listings
    // Fetch all leases to check which listings are occupied
    const { data: allLeases = [] } = useQuery({
        queryKey: ["leases"],
        queryFn: async () => {
            const res = await api.get(API_ENDPOINTS.LEASES.BASE);
            const data = res.data;
            return Array.isArray(data) ? data : data.data || [];
        },
    });

    const { data: allCustomLeases = [] } = useQuery({
        queryKey: ["customleases"],
        queryFn: async () => {
            const res = await api.get(API_ENDPOINTS.CUSTOM_LEASES.BASE);
            return res.data.data || res.data || [];
        },
    });

    const { data: listings = [], isLoading: listingsLoading } = useQuery({
        queryKey: ["listings", user?.id],
        queryFn: async () => {
            const res = await api.get(API_ENDPOINTS.LISTINGS.BASE);
            const allListings = res.data.listing.filter(l => l.status === "ACTIVE");
            
            // Filter out listings that already have an ACTIVE or DRAFT lease
            // Only allow one draft per listing
            return allListings.filter(listing => {
                // Check if this listing has an ACTIVE standard lease
                const hasActiveStandardLease = allLeases.some(
                    lease => lease.listingId === listing.id && lease.leaseStatus === "ACTIVE"
                );
                // Check if this listing has a DRAFT standard lease
                const hasDraftStandardLease = allLeases.some(
                    lease => lease.listingId === listing.id && lease.leaseStatus === "DRAFT"
                );
                // Check if this listing has an ACTIVE custom lease
                const hasActiveCustomLease = allCustomLeases.some(
                    lease => lease.listingId === listing.id && lease.leaseStatus === "ACTIVE"
                );
                // Check if this listing has a DRAFT custom lease
                const hasDraftCustomLease = allCustomLeases.some(
                    lease => lease.listingId === listing.id && lease.leaseStatus === "DRAFT"
                );
                // Only include if no active OR draft leases
                return !hasActiveStandardLease && !hasDraftStandardLease && 
                       !hasActiveCustomLease && !hasDraftCustomLease;
            });
        },
        enabled: allLeases !== undefined && allCustomLeases !== undefined,
    });

    // Filter listings based on search query
    const filteredListings = useMemo(() => {
        if (!listingSearchQuery) return listings;
        const query = listingSearchQuery.toLowerCase();
        return listings.filter((l) => 
            l.title?.toLowerCase().includes(query) ||
            l.streetAddress?.toLowerCase().includes(query) ||
            `${l.title} — ${l.streetAddress}`.toLowerCase().includes(query)
        );
    }, [listings, listingSearchQuery]);

    // Get selected listing display text
    const selectedListingText = useMemo(() => {
        if (!selectedListing) return "";
        const listing = listings.find((l) => l.id === selectedListing);
        return listing ? `${listing.title} — ${listing.streetAddress}` : "";
    }, [selectedListing, listings]);

    useEffect(() => {
        if (!selectedListing) return;
        const listing = listings.find((l) => l.id === selectedListing);
        if (!listing) return;

        if (listing.propertyType) {
            const categoryEntry = Object.entries(PROPERTY_OPTIONS).find(([_, options]) =>
                options.some((opt) => opt.value === listing.propertyType)
            );

            if (categoryEntry) {
                const [matchedCategory] = categoryEntry;
                if (category !== matchedCategory) {
                    setCategory(matchedCategory);
                }
                if (type !== listing.propertyType) {
                    setType(listing.propertyType);
                }
            }
        }

        setCustomLeaseAccounting((prev) => {
            const rentValue =
                typeof listing.rentAmount === "number" ? listing.rentAmount.toString() : prev.rentAmount;
            const depositSource =
                typeof listing.securityDeposit === "number"
                    ? listing.securityDeposit
                    : typeof listing.depositAmount === "number"
                        ? listing.depositAmount
                        : undefined;
            const depositValue = typeof depositSource === "number" ? depositSource.toString() : "";

            const nextState = { ...prev };
            let hasChanges = false;

            if (rentValue && rentValue !== prev.rentAmount) {
                nextState.rentAmount = rentValue;
                hasChanges = true;
            }

            if (depositValue) {
                if (depositValue !== prev.securityDeposit) {
                    nextState.securityDeposit = depositValue;
                    hasChanges = true;
                }
                if (depositValue !== prev.depositAmount) {
                    nextState.depositAmount = depositValue;
                    hasChanges = true;
                }
            }

            return hasChanges ? nextState : prev;
        });
    }, [selectedListing, listings]);

    // Upload PDF to S3
    const uploadPdfMutation = useMutation({
        mutationFn: async (file) => {
            const encoded = encodeURIComponent(file.name);
            const { data } = await api.get(`${API_ENDPOINTS.UPLOADS.BASE}/s3-url`, {
                params: {
                    fileName: encoded,
                    fileType: file.type,
                    category: "leases",
                }
            });

            const { uploadURL, fileUrl } = data.data;

            await fetch(uploadURL, {
                method: "PUT",
                headers: { "Content-Type": file.type },
                body: file,
            });

            return fileUrl;
        }
    });

    // Save lease metadata
    const createLeaseMutation = useMutation({
        mutationFn: async (payload) => {
            const res = await api.post(API_ENDPOINTS.CUSTOM_LEASES.BASE, payload);
            return res.data;
        },
        onSuccess: () => {
            toast.success("Custom lease saved");
            queryClient.invalidateQueries(["customleases"]);
            setIsSaving(false);
            handleClose();
            // Call onSuccess callback if provided (e.g., to switch to custom tab)
            if (onSuccess) {
                onSuccess();
            }
        },
        onError: () => {
            toast.error("Failed to submit lease");
            setIsSaving(false);
        },
    });

    // Handle save lease: first upload PDF, then create lease
    const handleSaveLease = () => {
        if (!file) return toast.error("Please upload a PDF first");

        setIsSaving(true);
        uploadPdfMutation.mutate(file, {
            onSuccess: (fileUrl) => {
                createLeaseMutation.mutate({
                    leaseName,
                    propertyCategory: category,
                    propertyType: type,
                    description,
                    fileUrl,
                    tenantId,
                    landlordId: user.id,
                    listingId: selectedListing,
                    // Accounting fields
                    rentAmount: customLeaseAccounting.rentAmount ? parseFloat(customLeaseAccounting.rentAmount) : null,
                    paymentFrequency: customLeaseAccounting.paymentFrequency || null,
                    startDate: customLeaseAccounting.startDate || null,
                    endDate: customLeaseAccounting.endDate || null,
                    paymentDay: customLeaseAccounting.paymentDay ? parseInt(customLeaseAccounting.paymentDay) : null,
                    securityDeposit: customLeaseAccounting.securityDeposit ? parseFloat(customLeaseAccounting.securityDeposit) : null,
                    depositAmount: customLeaseAccounting.depositAmount ? parseFloat(customLeaseAccounting.depositAmount) : null,
                    paymentMethod: customLeaseAccounting.paymentMethod || null,
                    accountingNotes: customLeaseAccounting.accountingNotes || null,
                });
            },
            onError: () => {
                toast.error("Failed to upload PDF");
                setIsSaving(false);
            },
        });
    };

    const isProcessing = isSaving || uploadPdfMutation.isPending || createLeaseMutation.isPending || uploadPdfMutation.isLoading || createLeaseMutation.isLoading;

    // Handle standard lease submission
    const handleStandardLeaseSubmit = async () => {
        setIsSaving(true);
        try {
            // Prepare the lease data
            const leaseData = {
                listingId: selectedListing,
                landlordId: user.id,
                tenantId: null, // Will be set when tenant signs
                
                // Parties
                landlordFullName: `${standardLeaseData.landlordFirstName} ${standardLeaseData.landlordLastName}`.trim(),
                landlordPhone: standardLeaseData.landlordPhone,
                landlordEmail: standardLeaseData.landlordEmail,
                additionalLandlords: standardLeaseData.landlord2LastName ? [{
                    firstName: standardLeaseData.landlord2FirstName,
                    lastName: standardLeaseData.landlord2LastName
                }] : [],
                tenantFullName: `${standardLeaseData.tenantFirstName} ${standardLeaseData.tenantLastName}`.trim(),
                tenantEmail: standardLeaseData.tenantEmail,
                tenantPhone: standardLeaseData.tenantPhone,
                tenantOtherPhone: standardLeaseData.tenantOtherPhone,
                tenantOtherEmail: standardLeaseData.tenantOtherEmail,
                additionalTenants: standardLeaseData.tenant2LastName ? [{
                    firstName: standardLeaseData.tenant2FirstName,
                    lastName: standardLeaseData.tenant2LastName
                }] : [],
                
                // Address
                unitNumber: standardLeaseData.unitNumber,
                propertyAddress: standardLeaseData.streetAddress,
                propertyCity: standardLeaseData.city,
                propertyState: standardLeaseData.province,
                propertyZipCode: standardLeaseData.postalCode,
                
                // Term
                startDate: new Date(`${standardLeaseData.startYear}-${standardLeaseData.startMonth.padStart(2, '0')}-${standardLeaseData.startDay.padStart(2, '0')}`),
                endDate: standardLeaseData.tenancyType === "fixed-term" 
                    ? new Date(`${standardLeaseData.fixedEndYear}-${standardLeaseData.fixedEndMonth.padStart(2, '0')}-${standardLeaseData.fixedEndDay.padStart(2, '0')}`)
                    : new Date(new Date().setFullYear(new Date().getFullYear() + 1)), // Default 1 year for month-to-month
                leaseTermType: standardLeaseData.tenancyType === "month-to-month" ? "MONTH_TO_MONTH" : 
                               standardLeaseData.tenancyType === "other-periodic" ? "YEAR_TO_YEAR" : "LONG_TERM",
                periodicBasis: standardLeaseData.periodicBasis,
                periodicOther: standardLeaseData.periodicOther,
                fixedEndCondition: standardLeaseData.fixedEndCondition,
                vacateReason: standardLeaseData.vacateReason,
                
                // Rent
                rentAmount: parseFloat(standardLeaseData.rentAmount),
                paymentFrequency: standardLeaseData.rentFrequency === "month" ? "MONTHLY" : 
                                 standardLeaseData.rentFrequency === "week" ? "WEEKLY" : 
                                 standardLeaseData.rentFrequency === "day" ? "DAILY" : 
                                 standardLeaseData.rentFrequency.toUpperCase(),
                paymentDay: parseInt(standardLeaseData.rentDueDay),
                
                // Deposits
                securityDeposit: standardLeaseData.securityDeposit ? parseFloat(standardLeaseData.securityDeposit) : null,
                securityDepositDueDate: standardLeaseData.securityDepositDay ? 
                    new Date(`${standardLeaseData.securityDepositYear}-${standardLeaseData.securityDepositMonth.padStart(2, '0')}-${standardLeaseData.securityDepositDay.padStart(2, '0')}`) : null,
                petDeposit: !standardLeaseData.petDepositNA && standardLeaseData.petDeposit ? parseFloat(standardLeaseData.petDeposit) : null,
                petDepositDueDate: !standardLeaseData.petDepositNA && standardLeaseData.petDepositDay ?
                    new Date(`${standardLeaseData.petDepositYear}-${standardLeaseData.petDepositMonth.padStart(2, '0')}-${standardLeaseData.petDepositDay.padStart(2, '0')}`) : null,
                
                // Services
                includedServices: standardLeaseData.includedServices,
                parkingSpaces: standardLeaseData.parkingSpaces ? parseInt(standardLeaseData.parkingSpaces) : null,
                
                leaseStatus: "DRAFT",
            };

            console.log('🚀 Sending lease data to backend:');
            console.log('unitNumber:', leaseData.unitNumber, '| Type:', typeof leaseData.unitNumber);
            console.log('Full leaseData:', leaseData);

            const response = await api.post(API_ENDPOINTS.LEASES.BASE, leaseData);
            
            toast.success("Standard lease created successfully!");
            queryClient.invalidateQueries(["leases"]);
            handleClose();
            
            if (onSuccess) {
                onSuccess();
            }
        } catch (error) {
            console.error("Error creating standard lease:", error);
            toast.error(error.response?.data?.message || "Failed to create standard lease");
        } finally {
            setIsSaving(false);
        }
    };

    // Calculate total steps for standard lease builder
    const totalSteps = step >= 3 ? 4 : 2; // 4 steps for standard lease, 2 for custom
    const currentStep = step === 1 ? 1 : step === 2 ? 2 : step === 3 ? 1 : step === 4 ? 2 : step === 5 ? 3 : 4;

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent
                onInteractOutside={(e) => e.preventDefault()}
                className="max-w-4xl max-h-[90vh] flex flex-col p-0 rounded-2xl pt-4"
            >
                {/* Progress Indicator - Only show for multi-step flows */}
                {step > 1 && (
                    <div className="flex items-center justify-center gap-2 pt-8 pb-2 px-10">
                        {Array.from({ length: totalSteps }).map((_, index) => {
                            const stepNum = index + 1;
                            const isActive = stepNum === currentStep;
                            const isPast = stepNum < currentStep;
                            
                            return (
                                <React.Fragment key={stepNum}>
                                    <div
                                        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold transition-all ${
                                            isActive
                                                ? "bg-gray-900 text-white border-2 border-gray-900"
                                                : isPast
                                                ? "bg-gray-400 text-white"
                                                : "bg-gray-200 text-gray-400"
                                        }`}
                                    >
                                        {stepNum}
                                    </div>
                                    {stepNum < totalSteps && (
                                        <div className={`h-0.5 w-6 ${isPast ? "bg-gray-400" : "bg-gray-200"}`}></div>
                                    )}
                                </React.Fragment>
                            );
                        })}
                    </div>
                )}

                <div className="flex-1 overflow-y-auto px-10 py-6">
                {/* STEP 1 ------------------------------------ */}
                {step === 1 && (
                    <>
                        <DialogHeader className="p-0 pb-4 border-b mb-6">
                            <DialogTitle className="text-center text-[22px] font-bold text-primary">
                                How would you like to add your lease?
                            </DialogTitle>
                        </DialogHeader>

                        <div
                            onClick={() => {
                                setFile(null); // Reset custom lease file
                                setStep(3);
                            }}
                            className="cursor-pointer border border-gray-200 bg-card rounded-xl p-6 text-center hover:shadow-md transition mb-6"
                        >
                            <div className="w-12 h-12 bg-primary/10 rounded-full mx-auto mb-3 flex items-center justify-center">
                                <FileText className="w-6 h-6 text-primary" />
                            </div>
                            <p className="text-lg font-semibold">Create with PropEase</p>
                            <p className="text-sm text-muted-foreground mt-1">
                                * Recommended for beginners
                            </p>
                            <p className="text-xs text-gray-500 mt-2">
                                Use our guided form to create a standard lease agreement
                            </p>
                        </div>

                        {/* Upload Custom PDF */}
                        <div className="border-2 border-dashed border-gray-300 bg-card rounded-xl p-6 text-center">
                            <div className="w-12 h-12 bg-primary/10 rounded-full mx-auto mb-3 flex items-center justify-center">
                                <Upload className="w-6 h-6 text-primary" />
                            </div>
                            <p className="text-sm text-gray-700">Add your custom-made lease</p>

                            <Label className="block mt-3">
                                <Button asChild variant="outline">
                                    <span>Choose File</span>
                                </Button>
                                <input
                                    type="file"
                                    accept="application/pdf"
                                    className="hidden"
                                    onChange={handleFile}
                                />
                            </Label>

                            {file && (
                                <p className="mt-2 text-xs text-gray-600">{file.name}</p>
                            )}
                        </div>

                        <div className="flex justify-center mt-6">
                            <Button
                                className="w-1/2 rounded-2xl py-6"
                                onClick={() => setStep(2)}
                                disabled={!file || isProcessing}
                            >
                                Next
                            </Button>
                        </div>
                    </>
                )}

                {/* STEP 2 ------------------------------------ */}
                {step === 2 && (
                    <>
                        <DialogHeader className="p-0 pb-4 border-b mb-6">
                            <DialogTitle className="text-center text-[22px] font-bold text-primary">
                                Custom Lease Details
                            </DialogTitle>
                        </DialogHeader>
                        <div className="flex justify-center mb-4">
                            <Button
                                variant="ghost"
                                size="sm"
                                className="rounded-full px-5 bg-blue-50/70 text-blue-700 border border-blue-100 hover:bg-blue-100"
                                onClick={handleDemoFill}
                            >
                                Demo Autofill
                            </Button>
                        </div>

                        <div className="max-h-[60vh] overflow-y-auto pr-2">
                            <div className="space-y-6">
                            {/* Listing Select - Searchable */}
                            <div className="space-y-2">
                                <Label className="text-sm text-gray-600">Select Listing</Label>
                                <Popover open={listingPopoverOpen} onOpenChange={setListingPopoverOpen}>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            role="combobox"
                                            aria-expanded={listingPopoverOpen}
                                            className="w-full justify-between"
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
                            </div>

                            <div className="space-y-2">
                                <Label className="text-gray-900">Custom Lease Name</Label>
                                <Input
                                    placeholder="Lease Name"
                                    value={leaseName}
                                    onChange={(e) => setLeaseName(e.target.value)}
                                />
                            </div>

                            {/* Category + Type */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                                <div className="space-y-2 w-full">
                                    <Label className="text-gray-900">Property Category</Label>
                                    <Select
                                        value={category}
                                        onValueChange={(val) => {
                                            setCategory(val);
                                            setType("");
                                        }}
                                    >
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Select Category" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {Object.entries(PROPERTY_CATEGORY_NAMES).map(([key, label]) => (
                                                <SelectItem key={key} value={key}>{label}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2 w-full">
                                    <Label className="text-gray-900">Property Type</Label>
                                    <Select
                                        value={type}
                                        disabled={!category}
                                        onValueChange={setType}
                                    >
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Select Type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {category && PROPERTY_OPTIONS[category].map((opt) => (
                                                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-gray-900">Description</Label>
                                <Textarea
                                    placeholder="Description (optional)"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                />
                            </div>

                            {/* Accounting Information Section */}
                            <div className="border-t pt-6 space-y-4">
                                <h3 className="text-lg font-semibold text-primary">Accounting Information (Optional)</h3>
                                <p className="text-sm text-gray-600">Extract financial terms from your PDF contract and enter them below for payment tracking.</p>
                                
                                {/* Rent Amount & Payment Frequency */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-gray-900">Rent Amount ($)</Label>
                                        <Input
                                            type="number"
                                            step="0.01"
                                            placeholder="e.g., 2500.00"
                                            value={customLeaseAccounting.rentAmount}
                                            onChange={(e) => setCustomLeaseAccounting({...customLeaseAccounting, rentAmount: e.target.value})}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-gray-900">Payment Frequency</Label>
                                        <Select
                                            value={customLeaseAccounting.paymentFrequency}
                                            onValueChange={(val) => setCustomLeaseAccounting({...customLeaseAccounting, paymentFrequency: val})}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select Frequency" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="DAILY">Daily</SelectItem>
                                                <SelectItem value="WEEKLY">Weekly</SelectItem>
                                                <SelectItem value="MONTHLY">Monthly</SelectItem>
                                                <SelectItem value="QUARTERLY">Quarterly</SelectItem>
                                                <SelectItem value="YEARLY">Yearly</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                {/* Start Date & End Date */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-gray-900">Start Date</Label>
                                        <DatePicker
                                            value={customLeaseAccounting.startDate}
                                            onChange={(date) => setCustomLeaseAccounting({...customLeaseAccounting, startDate: date})}
                                            placeholder="Select start date"
                                    calendarProps={yearDropdownOptions}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-gray-900">End Date</Label>
                                        <DatePicker
                                            value={customLeaseAccounting.endDate}
                                            onChange={(date) => setCustomLeaseAccounting({...customLeaseAccounting, endDate: date})}
                                            placeholder="Select end date"
                                    calendarProps={yearDropdownOptions}
                                        />
                                    </div>
                                </div>

                                {/* Payment Day & Payment Method */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-gray-900">Payment Due Day (1-31)</Label>
                                        <Input
                                            type="number"
                                            min="1"
                                            max="31"
                                            placeholder="e.g., 1"
                                            value={customLeaseAccounting.paymentDay}
                                            onChange={(e) => setCustomLeaseAccounting({...customLeaseAccounting, paymentDay: e.target.value})}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-gray-900">Payment Method</Label>
                                        <Input
                                            placeholder="e.g., Bank Transfer, Cash, Check"
                                            value={customLeaseAccounting.paymentMethod}
                                            onChange={(e) => setCustomLeaseAccounting({...customLeaseAccounting, paymentMethod: e.target.value})}
                                        />
                                    </div>
                                </div>

                                {/* Security Deposit & Deposit Amount */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-gray-900">Security Deposit ($)</Label>
                                        <Input
                                            type="number"
                                            step="0.01"
                                            placeholder="e.g., 2500.00"
                                            value={customLeaseAccounting.securityDeposit}
                                            onChange={(e) => setCustomLeaseAccounting({...customLeaseAccounting, securityDeposit: e.target.value})}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-gray-900">Deposit Amount ($)</Label>
                                        <Input
                                            type="number"
                                            step="0.01"
                                            placeholder="e.g., 2500.00"
                                            value={customLeaseAccounting.depositAmount}
                                            onChange={(e) => setCustomLeaseAccounting({...customLeaseAccounting, depositAmount: e.target.value})}
                                        />
                                    </div>
                                </div>

                                {/* Accounting Notes */}
                                <div className="space-y-2">
                                    <Label className="text-gray-900">Accounting Notes</Label>
                                    <Textarea
                                        placeholder="Any additional financial notes from the contract..."
                                        value={customLeaseAccounting.accountingNotes}
                                        onChange={(e) => setCustomLeaseAccounting({...customLeaseAccounting, accountingNotes: e.target.value})}
                                        rows={3}
                                    />
                                </div>
                            </div>
                            </div>
                        </div>

                        {/* Back + Save Buttons */}
                        <div className="flex justify-between mt-6 gap-4">
                            <Button
                                variant="outline"
                                className="flex-1 py-6 rounded-2xl"
                                onClick={() => setStep(1)}
                                disabled={isProcessing}
                            >
                                Back
                            </Button>

                            <Button
                                className="flex-1 py-6 rounded-2xl"
                                onClick={handleSaveLease}
                                disabled={!leaseName || !category || !type || !file || isProcessing}
                            >
                                {isProcessing ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Processing...
                                    </>
                                ) : (
                                    "Save Lease"
                                )}
                            </Button>
                        </div>
                    </>
                )}

                {/* STEP 3 - Standard Lease Builder - Page 1: Parties & Address ------------------------------------ */}
                {step === 3 && (
                    <StandardLeaseStep1
                        listings={listings}
                        selectedListing={selectedListing}
                        setSelectedListing={setSelectedListing}
                        listingSearchQuery={listingSearchQuery}
                        setListingSearchQuery={setListingSearchQuery}
                        listingPopoverOpen={listingPopoverOpen}
                        setListingPopoverOpen={setListingPopoverOpen}
                        selectedListingText={selectedListingText}
                        filteredListings={filteredListings}
                        standardLeaseData={standardLeaseData}
                        setStandardLeaseData={setStandardLeaseData}
                        onBack={() => setStep(1)}
                        onContinue={() => setStep(4)}
                    />
                )}

                {/* STEP 4 - Term & Rent Details ------------------------------------ */}
                {step === 4 && (
                    <StandardLeaseStep2
                        standardLeaseData={standardLeaseData}
                        setStandardLeaseData={setStandardLeaseData}
                        onBack={() => setStep(3)}
                        onContinue={() => setStep(5)}
                    />
                )}

                {/* STEP 5 - Deposits & Services ------------------------------------ */}
                {step === 5 && (
                    <StandardLeaseStep3
                        standardLeaseData={standardLeaseData}
                        setStandardLeaseData={setStandardLeaseData}
                        onBack={() => setStep(4)}
                        onContinue={() => setStep(6)}
                    />
                )}

                {/* STEP 6 - Review & Submit ------------------------------------ */}
                {step === 6 && (
                    <StandardLeaseStep4
                        standardLeaseData={standardLeaseData}
                        onBack={() => setStep(5)}
                        onSubmit={handleStandardLeaseSubmit}
                        isSubmitting={isSaving}
                    />
                )}

                </div>
            </DialogContent>
        </Dialog>
    );
}
