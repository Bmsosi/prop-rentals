import { useState } from "react";
import LeaseTabs from "./LeaseTabs";
import PageHeader from "@/components/shared/PageHeader";
import StandardLeases from "./StandardLeases";
import CustomLeases from "./CustomLeases";

export default function LeasesPage() {
  const [activeTab, setActiveTab] = useState("standard");
  const [standardLeasesTotal, setStandardLeasesTotal] = useState(0);
  const [customLeasesTotal, setCustomLeasesTotal] = useState(0);

  const displayTotal = activeTab === "standard" ? standardLeasesTotal : customLeasesTotal;

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="px-4 md:px-8 py-4 flex-shrink-0">
        <div className="hidden md:block">
          <PageHeader title="Leases" subtitle="Per property" total={displayTotal} />
        </div>
        <LeaseTabs activeTab={activeTab} setActiveTab={setActiveTab} />
      </div>
      
      {/* Content based on active tab */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden px-4 md:px-8 pb-4">
        {activeTab === "standard" ? (
          <StandardLeases onTotalChange={setStandardLeasesTotal} />
        ) : (
          <CustomLeases onTotalChange={setCustomLeasesTotal} />
        )}
      </div>
    </div>
  );
}
