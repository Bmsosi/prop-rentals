import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const LeaseList = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleOpenModal = () => setIsModalOpen(true);
  const handleCloseModal = () => setIsModalOpen(false);

  return (
    <div className="p-6">
      {/* Header Section */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Leases</h1>
        <Button onClick={handleOpenModal}>Create New Lease</Button>
      </div>

      {/* Table Placeholder */}
      <div className="border rounded-lg p-4 text-center text-gray-500">
        <p>No leases found.</p>
      </div>

      {/* Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Lease</DialogTitle>
          </DialogHeader>
          <p className="text-gray-600 text-sm mt-2">This is where your popup form will go.</p>
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="outline" onClick={handleCloseModal}>Cancel</Button>
            <Button onClick={handleCloseModal}>Save</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LeaseList;
