import { useState, useEffect } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { X } from "lucide-react";

export const PREDEFINED_AMENITIES = [
    "Air Conditioning",
    "Parking",
    "Dishwasher",
    "Gym/Fitness",
    "Balcony/Patio",
    "Heating",
    "Laundry",
    "Pet Friendly",
    "Swimming Pool",
];

export function AmenitiesSection({ selectedAmenities = [], onAmenitiesChange, disabled }) {
    const [customAmenities, setCustomAmenities] = useState([]);

    // Separate predefined and custom amenities
    useEffect(() => {
        const custom = selectedAmenities.filter(a => !PREDEFINED_AMENITIES.includes(a));
        setCustomAmenities(custom);
    }, [selectedAmenities]);

    const leftColumn = PREDEFINED_AMENITIES.slice(0, 5);
    const rightColumn = PREDEFINED_AMENITIES.slice(5);

    // Distribute custom amenities between left and right columns
    // New amenities go to right column first (index 0, 2, 4...), then left column (index 1, 3, 5...)
    const rightCustomAmenities = customAmenities.filter((_, index) => index % 2 === 0);
    const leftCustomAmenities = customAmenities.filter((_, index) => index % 2 === 1);

    const handleCheckboxChange = (amenity, checked) => {
        if (checked) {
            onAmenitiesChange([...selectedAmenities, amenity]);
        } else {
            onAmenitiesChange(selectedAmenities.filter(item => item !== amenity));
        }
    };

    const handleRemoveCustomAmenity = (amenity) => {
        onAmenitiesChange(selectedAmenities.filter(item => item !== amenity));
    };

    return (
        <div className="space-y-3">
            <div className="grid grid-cols-2 gap-x-10 gap-y-2">
                {/* Left column */}
                <div className="space-y-2">
                    {leftColumn.map((item) => (
                        <label key={item} className="flex items-center space-x-2">
                            <Checkbox
                                id={item}
                                checked={selectedAmenities.includes(item)}
                                onCheckedChange={(checked) => handleCheckboxChange(item, checked)}
                                disabled={disabled}
                            />
                            <span className="text-sm">{item}</span>
                        </label>
                    ))}
                    
                    {/* Custom amenities in the left column */}
                    {leftCustomAmenities.map((amenity) => (
                        <label key={amenity} className="flex items-center space-x-2">
                            <Checkbox
                                id={amenity}
                                checked={selectedAmenities.includes(amenity)}
                                onCheckedChange={(checked) => handleCheckboxChange(amenity, checked)}
                                disabled={disabled}
                            />
                            <span className="text-sm flex-1">{amenity}</span>
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    handleRemoveCustomAmenity(amenity);
                                }}
                                disabled={disabled}
                                className="hover:bg-gray-200 rounded p-0.5 transition-colors ml-1"
                                title="Remove amenity"
                            >
                                <X className="w-3.5 h-3.5 text-gray-600" />
                            </button>
                        </label>
                    ))}
                    
                </div>

                {/* Right column */}
                <div className="space-y-2">
                    {rightColumn.map((item) => (
                        <label key={item} className="flex items-center space-x-2">
                            <Checkbox
                                id={item}
                                checked={selectedAmenities.includes(item)}
                                onCheckedChange={(checked) => handleCheckboxChange(item, checked)}
                                disabled={disabled}
                            />
                            <span className="text-sm">{item}</span>
                        </label>
                    ))}
                    
                    {/* Custom amenities in the right column */}
                    {rightCustomAmenities.map((amenity) => (
                        <label key={amenity} className="flex items-center space-x-2">
                            <Checkbox
                                id={amenity}
                                checked={selectedAmenities.includes(amenity)}
                                onCheckedChange={(checked) => handleCheckboxChange(amenity, checked)}
                                disabled={disabled}
                            />
                            <span className="text-sm flex-1">{amenity}</span>
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    handleRemoveCustomAmenity(amenity);
                                }}
                                disabled={disabled}
                                className="hover:bg-gray-200 rounded p-0.5 transition-colors ml-1"
                                title="Remove amenity"
                            >
                                <X className="w-3.5 h-3.5 text-gray-600" />
                            </button>
                        </label>
                    ))}
                </div>
            </div>
        </div>
    );
}