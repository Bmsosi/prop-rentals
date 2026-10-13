import { useState } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function ContractUploadDialog({ open, onClose, onSubmit, isSubmitting }) {
  const [file, setFile] = useState(null);

  const close = () => {
    setFile(null);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(value) => !value && close()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Send Residential Tenancy Agreement</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-gray-600">Upload the agreement for the tenant to download, complete, sign, and return.</p>
        <Input type="file" accept="application/pdf,.doc,.docx,image/*" onChange={(event) => setFile(event.target.files?.[0] || null)} />
        <DialogFooter>
          <Button variant="secondary" onClick={close}>Cancel</Button>
          <Button disabled={!file || isSubmitting} onClick={() => onSubmit(file)}>
            {isSubmitting ? "Sending..." : "Send Agreement"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
