import React from 'react';
import PropertyCard from './PropertyCard';
import { Checkbox } from '@/components/ui/checkbox';

const PropertyList = ({ properties, selectedItems = new Set(), onSelectionChange }) => (
  <div className="space-y-1">
    {properties.map((property) => (
      <div key={property.id} className="flex items-center gap-3">
        {/* Checkbox outside of the card */}
        <Checkbox
          checked={selectedItems.has(property.id)}
          onCheckedChange={(checked) => onSelectionChange?.(property.id, Boolean(checked))}
          className="!border-black"
          onClick={(e) => e.stopPropagation()}
        />
        {/* Card takes remaining width */}
        <div className="flex-1 cursor-pointer">
          <PropertyCard property={property} />
        </div>
      </div>
    ))}
  </div>
);

export default PropertyList;
