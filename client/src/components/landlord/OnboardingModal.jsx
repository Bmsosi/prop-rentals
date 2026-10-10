import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogPortal, DialogOverlay } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { cn } from "@/lib/utils";

const OnboardingModal = ({ isOpen, onClose }) => {
  const navigate = useNavigate();

  const handleCreateListing = () => {
    // Navigate to portfolio and trigger modal opening via URL state
    // Don't close onboarding modal yet - it will close when listing is created
    navigate("/landlord/portfolio", { state: { openListingModal: true, fromOnboarding: true } });
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogPortal>
        <DialogOverlay />
        <DialogPrimitive.Content
          className={cn(
            "bg-white rounded-2xl max-w-md p-8 fixed top-[50%] left-[50%] z-50 grid w-full max-w-[calc(100%-2rem)] translate-x-[-50%] translate-y-[-50%] gap-4 shadow-lg duration-200 sm:max-w-lg",
            "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
          )}
          onInteractOutside={(e) => {
            // Prevent closing when clicking outside
            e.preventDefault();
          }}
          onEscapeKeyDown={(e) => {
            // Prevent closing when pressing ESC
            e.preventDefault();
          }}
        >
          <DialogHeader className="text-center">
            <DialogTitle className="text-3xl font-bold text-gray-900 mb-4 leading-relaxed text-center">
              Welcome to Your Dashboard!
            </DialogTitle>
            <DialogDescription className="text-base text-gray-700 leading-relaxed text-center mb-2">
              It looks like you don't have any listings yet.
              <br />
              <strong>Let's start</strong> by creating your <strong>first property</strong> listing, once
              added, you'll be able to manage leases, tenants, and
              maintenance all in one place.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-center items-center mt-4">
            <Button
              onClick={handleCreateListing}
              className="bg-gray-700 hover:bg-gray-800 text-white rounded-2xl px-6 py-6 text-base font-semibold"
            >
              Create Your First Listing
            </Button>
          </div>
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  );
};

export default OnboardingModal;

