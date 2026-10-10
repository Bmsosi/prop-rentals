import { getPropertyCategory, getPropertyLabel, PROPERTY_CATEGORY_NAMES, PROPERTY_OPTIONS } from '@/constants/propertyTypes';
import React from 'react';

const PropertyDetailsCard = ({ type, yearBuilt, size, bedrooms, bathrooms }) => {
    return (
        <div className="bg-card rounded-2xl p-6">
            <h2 className="text-lg sm:text-xl md:text-[24px] font-bold mb-4 text-primary">Property Details</h2>
            <div className="grid grid-cols-1 gap-2">
                <div>
                    <p className="text-sm sm:text-base md:text-[16px] text-gray-600">
                        <span className='font-semibold'>{PROPERTY_CATEGORY_NAMES[getPropertyCategory(type)]}</span>: {getPropertyLabel(PROPERTY_OPTIONS, type)}
                    </p>
                </div>
                <div>
                    <p className="text-sm sm:text-base md:text-[16px] text-gray-600">
                        <span className='font-semibold'>Year Build</span>: {yearBuilt}
                    </p>
                </div>
                <div>
                    <p className="text-sm sm:text-base md:text-[16px] text-gray-600">
                        <span className='font-semibold'>Size</span>: {size} sq ft
                    </p>
                </div>
                <div>
                    <p className="text-sm sm:text-base md:text-[16px] text-gray-600">
                        {bedrooms} Bedroom | {bathrooms} Bathroom
                    </p>
                </div>
            </div>
        </div>
    );
};

export default PropertyDetailsCard;