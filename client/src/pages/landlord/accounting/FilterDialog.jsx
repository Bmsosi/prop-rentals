import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const FilterDialog = ({ open, onOpenChange, filters, onApplyFilters, tenants = [], properties = [] }) => {
  const [status, setStatus] = useState('');
  const [type, setType] = useState('');
  const [tenantId, setTenantId] = useState('');
  const [listingId, setListingId] = useState('');

  // Initialize filters when dialog opens
  useEffect(() => {
    if (open && filters) {
      setStatus(filters.status || 'ALL');
      setType(filters.type || 'ALL');
      setTenantId(filters.tenantId || 'ALL');
      setListingId(filters.listingId || 'ALL');
    }
  }, [open, filters]);

  const handleApply = () => {
    onApplyFilters({
      status,
      type,
      tenantId,
      listingId,
    });
    onOpenChange(false);
  };

  const handleReset = () => {
    setStatus('ALL');
    setType('ALL');
    setTenantId('ALL');
    setListingId('ALL');
    onApplyFilters({
      status: 'ALL',
      type: 'ALL',
      tenantId: 'ALL',
      listingId: 'ALL',
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md pt-8 px-8 pb-8 rounded-xl">
        <DialogHeader>
          <DialogTitle className="text-[18px] text-primary">Filter Payments</DialogTitle>
        </DialogHeader>

        {/* Single Column Layout */}
        <div className="space-y-4 mt-4">
          {/* Status Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-primary">Payment Status</label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="PAID">Paid</SelectItem>
                <SelectItem value="FAILED">Failed</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Type Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-primary">Payment Type</label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All</SelectItem>
                <SelectItem value="RENT">Rent</SelectItem>
                <SelectItem value="DEPOSIT">Deposit</SelectItem>
                <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
                <SelectItem value="REFUND">Refund</SelectItem>
                <SelectItem value="OTHER">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Tenant Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-primary">Tenant</label>
            <Select value={tenantId} onValueChange={setTenantId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="All Tenants" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Tenants</SelectItem>
                {tenants.map((tenant) => (
                  <SelectItem key={tenant.id} value={tenant.id}>
                    {tenant.firstName} {tenant.lastName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Property Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-primary">Property</label>
            <Select value={listingId} onValueChange={setListingId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="All Properties" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Properties</SelectItem>
                {properties.map((property) => (
                  <SelectItem key={property.id} value={property.id}>
                    {property.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Footer Buttons */}
        <div className="flex justify-between gap-3 pt-3">
          <Button
            variant="outline"
            onClick={handleReset}
            className="w-1/2 rounded-xl bg-primary-foreground"
          >
            Reset
          </Button>

          <Button
            onClick={handleApply}
            className="bg-primary text-primary-foreground hover:bg-primary/90 w-1/2 rounded-xl"
          >
            Apply
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FilterDialog;

