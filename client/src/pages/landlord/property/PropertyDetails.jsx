import React, { useState } from 'react';
import PropertyHeader from './property-details/PropertyHeader';
import PropertyImages from './property-details/PropertyImages';
import PropertyDescription from './property-details/PropertyDescription';
import RentalInformation from './property-details/RentalInformation';
import PropertyDetailsCard from './property-details/PropertyDetailsCard';
import PropertyAmenities from './property-details/PropertyAmenities';
import ContactInfo from './property-details/ContactInfo';
import AddressCard from './property-details/AddressCard';
import NeighbourhoodScore from './property-details/NeighbourhoodScore';
import OwnerNotes from './property-details/OwnerNotes';
import TenancyInfo from './property-details/TenancyInfo';
import NewListingModal from './NewListingModal';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import API_ENDPOINTS from '@/lib/apiEndpoints';
import { Skeleton } from '@/components/ui/skeleton';
import ErrorState from '@/components/shared/ErrorState';
import EmptyState from '@/components/shared/EmptyState';
import { getRentCycleLabel } from '@/constants/rentCycles';
import { toast } from 'sonner';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const PropertyDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [isDeleting, setIsDeleting] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [activeCard, setActiveCard] = useState('listing'); // 'listing', 'maintenance', 'tenancy'

    const { data: property, isLoading, isError, error } = useQuery({
        queryKey: ['property', id],
        queryFn: async () => {
            const response = await api.get(API_ENDPOINTS.LISTINGS.BY_ID(id));
            return response.data.data;
        },
    });

    // Show edit modal
    const handleEdit = () => {
        setShowEditModal(true);
    };

    // Show delete confirmation dialog
    const handleDelete = () => {
        setShowDeleteDialog(true);
    };

    // Confirm and execute delete
    const confirmDelete = async () => {
        setIsDeleting(true);
        try {
            await api.delete(API_ENDPOINTS.LISTINGS.BY_ID(id));
            toast.success('Property deleted successfully');
            
            // Invalidate queries and navigate back
            queryClient.invalidateQueries(['listings']);
            navigate('/landlord/portfolio');
        } catch (error) {
            console.error('Error deleting property:', error);
            toast.error('Failed to delete property');
        } finally {
            setIsDeleting(false);
            setShowDeleteDialog(false);
        }
    };

    console.log('Fetched property:', property);

    return (
        <div className="h-full overflow-y-auto bg-background">

            {isLoading && (
                <div className="px-4 md:px-8 py-4 space-y-5">
                    <div className="space-y-2">
                        <Skeleton className="h-8 w-40 rounded-xl" />
                        <Skeleton className="h-5 w-64 rounded-lg" />
                    </div>
                    <Skeleton className="h-12 w-full rounded-2xl" />
                    <div className="grid grid-cols-1 lg:grid-cols-[7fr_5fr] gap-5">
                        <div className="space-y-4">
                            <Skeleton className="h-[320px] w-full rounded-2xl" />
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <Skeleton className="h-36 w-full rounded-2xl" />
                                <Skeleton className="h-36 w-full rounded-2xl" />
                            </div>
                            <Skeleton className="h-40 w-full rounded-2xl" />
                        </div>
                        <div className="space-y-4">
                            <Skeleton className="h-32 w-full rounded-2xl" />
                            <Skeleton className="h-28 w-full rounded-2xl" />
                            <Skeleton className="h-36 w-full rounded-2xl" />
                            <Skeleton className="h-32 w-full rounded-2xl" />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {[...Array(3)].map((_, idx) => (
                            <Skeleton key={`details-card-${idx}`} className="h-36 w-full rounded-xl" />
                        ))}
                    </div>
                </div>
            )}
            {isError && <ErrorState message={error.message} />}
            {!isLoading && !isError && !property && <EmptyState message="Property not found" />}
            {!isLoading && !isError && property && (
                <>
                    <PropertyHeader 
                        property={property}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        isDeleting={isDeleting}
                        showActions={activeCard === 'listing'}
                    />

                    <div className="px-4 md:px-8 py-2">
                        {/* Property Details - Only show when listing card is active */}
                        {activeCard === 'listing' && (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Left Column */}
                                <div className="flex flex-col gap-6 h-full">
                                    {/* Property Images */}
                                    <div className="h-[200px] sm:h-[300px] md:h-[400px]">
                                        <PropertyImages images={property.images} />
                                    </div>

                                    {/* Rental Info and Property Details - Side by Side */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                        <RentalInformation
                                            term={getRentCycleLabel(property.rentCycle)}
                                            rent={property.rentAmount}
                                            available={property.availableDate}
                                            deposit={property.securityDeposit}
                                        />
                                        <PropertyDetailsCard
                                            type={property.propertyType}
                                            yearBuilt={property.yearBuilt}
                                            size={property.totalSquareFeet}
                                            bedrooms={property.bedrooms}
                                            bathrooms={property.bathrooms}
                                        />
                                    </div>

                                    {/* Property Amenities - flex-1 to fill remaining space */}
                                    <div className="flex-1">
                                        <PropertyAmenities amenities={property.amenities} />
                                    </div>
                                </div>

                                {/* Right Column */}
                                <div className="flex flex-col gap-3 h-full">
                                    {/* Property Description */}
                                    <PropertyDescription description={property.description} />
                                    
                                    {/* Contact Info */}
                                    <ContactInfo
                                        ownerName={property.propertyOwner}
                                        ownerPhone={property.phoneNumber}
                                        ownerEmail={property.email}
                                    />

                                    {/* Address with Map */}
                                    <div className="mt-3">
                                        <AddressCard fullAddress={property.fullAddress} zipCode={property.zipCode} />
                                    </div>
                                    
                                    {/* Neighbourhood Score */}
                                    <NeighbourhoodScore />
                                </div>
                            </div>
                        )}

                        {/* Maintenance History - Show when maintenance card is active (ABOVE owner notes) */}
                        {activeCard === 'maintenance' && (
                            <div className="mt-8">
                                <OwnerNotes 
                                    propertyId={id}
                                    activeCard={activeCard}
                                    showOnlyMaintenance={true}
                                />
                            </div>
                        )}

                        {/* Tenancy Info - Show when tenancy card is active (ABOVE owner notes) */}
                        {activeCard === 'tenancy' && (
                            <div className="mt-8">
                                <TenancyInfo listingId={id} />
                            </div>
                        )}

                        {/* Owner Notes Section */}
                        <div className="mt-8 p-6">
                            <h2 className="text-xl sm:text-2xl md:text-[32px] font-bold mb-2 text-primary">Owner Notes (Private Section)</h2>
                            {property.notes && (
                                <>
                                    <p className="text-sm sm:text-base md:text-[16px] text-gray-600 mb-6">{property.notes}</p>
                                    <p className="text-sm sm:text-base md:text-[16px] text-gray-700 mb-6">
                                        Here you can review your property's tenancy history and maintenance history; these details are private and will not be shared with applicants or tenants when the listing is published.
                                    </p>
                                </>
                            )}
                            
                            {/* Three Cards Section - At the bottom */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                <div
                                    onClick={() => setActiveCard('listing')}
                                    className={`rounded-2xl p-4 hover:shadow-md transition-all cursor-pointer ${
                                        activeCard === 'listing' ? 'bg-primary text-primary-foreground' : 'bg-card'
                                    }`}
                                >
                                    <h3 className={`text-lg sm:text-xl md:text-[28px] font-bold mb-1 ${activeCard === 'listing' ? 'text-primary-foreground' : 'text-primary'}`}>Listing Details</h3>
                                    <p className={`text-sm sm:text-base md:text-[16px] mb-3 ${activeCard === 'listing' ? 'text-primary-foreground' : 'text-primary'}`}>
                                        Per Property
                                    </p>
                                    <p className={`text-xs sm:text-sm md:text-[13px] ${activeCard === 'listing' ? 'text-gray-300' : 'text-gray-600'}`}>
                                        View your listing details from rental info to amenities
                                    </p>
                                </div>
                                <div
                                    onClick={() => setActiveCard('maintenance')}
                                    className={`rounded-2xl p-4 hover:shadow-md transition-all cursor-pointer ${
                                        activeCard === 'maintenance' ? 'bg-primary text-primary-foreground' : 'bg-card'
                                    }`}
                                >
                                    <h3 className={`text-lg sm:text-xl md:text-[28px] font-bold mb-1 ${activeCard === 'maintenance' ? 'text-primary-foreground' : 'text-primary'}`}>Maintenance Info</h3>
                                    <p className={`text-sm sm:text-base md:text-[16px] mb-3 ${activeCard === 'maintenance' ? 'text-primary-foreground' : 'text-primary'}`}>
                                        Per Property
                                    </p>
                                    <p className={`text-xs sm:text-sm md:text-[13px] ${activeCard === 'maintenance' ? 'text-gray-300' : 'text-gray-600'}`}>
                                        View all maintenance requests and history for this property
                                    </p>
                                </div>
                                <div
                                    onClick={() => setActiveCard('tenancy')}
                                    className={`rounded-2xl p-4 hover:shadow-md transition-all cursor-pointer ${
                                        activeCard === 'tenancy' ? 'bg-primary text-primary-foreground' : 'bg-card'
                                    }`}
                                >
                                    <h3 className={`text-lg sm:text-xl md:text-[28px] font-bold mb-1 ${activeCard === 'tenancy' ? 'text-primary-foreground' : 'text-primary'}`}>Tenancy Info</h3>
                                    <p className={`text-sm sm:text-base md:text-[16px] mb-3 ${activeCard === 'tenancy' ? 'text-primary-foreground' : 'text-primary'}`}>
                                        Per Property
                                    </p>
                                    <p className={`text-xs sm:text-sm md:text-[13px] ${activeCard === 'tenancy' ? 'text-gray-300' : 'text-gray-600'}`}>
                                        Monitor occupancy, current tenant info, tenant turnover, and lease duration
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Property</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete this property? This action cannot be undone.
                            All data associated with this property will be permanently removed.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting} className="rounded-2xl">Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmDelete}
                            disabled={isDeleting}
                            className="bg-red-600 hover:bg-red-700 rounded-2xl"
                        >
                            {isDeleting ? 'Deleting...' : 'Delete'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Edit Property Modal */}
            <NewListingModal
                isOpen={showEditModal}
                onClose={() => setShowEditModal(false)}
                initialData={property}
                propertyId={id}
            />
        </div>
    );
};

export default PropertyDetails;