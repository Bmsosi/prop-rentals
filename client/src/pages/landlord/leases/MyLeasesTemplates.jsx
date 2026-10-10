import { useState } from "react";
import { Search, Filter } from "lucide-react";
import LeaseTable from "../../../components/landlord/LeaseTable";

const MyLeasesTemplates = () => {
  const [searchTerm, setSearchTerm] = useState("");

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-primary">My Lease Templates</h1>
        <p className="text-sm text-gray-500">Template Archive</p>
      </div>

      {/* Search and buttons */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2 border border-gray-300 rounded-lg px-3 py-1 w-80">
          <Search className="w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 outline-none text-sm"
          />
          <Filter className="w-4 h-4 text-gray-500" />
        </div>
        <div className="flex gap-2">
          <button className="border border-gray-300 text-sm rounded-lg px-4 py-2 hover:bg-gray-100">
            Leases Per Property
          </button>
          <button className="bg-gray-900 text-white text-sm rounded-lg px-4 py-2 hover:bg-gray-800">
            + New Lease
          </button>
        </div>
      </div>

      {/* Table */}
      <LeaseTable searchTerm={searchTerm} />
    </div>
  );
};

export default MyLeasesTemplates;
