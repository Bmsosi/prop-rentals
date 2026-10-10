import React, { useState, useMemo } from "react";
import { ChevronDown, ChevronUp, Info } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const FinancialMetricsTable = ({ properties }) => {
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });

  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const sortedProperties = useMemo(() => {
    if (!sortConfig.key) return properties;

    return [...properties].sort((a, b) => {
      if (a[sortConfig.key] < b[sortConfig.key]) {
        return sortConfig.direction === "asc" ? -1 : 1;
      }
      if (a[sortConfig.key] > b[sortConfig.key]) {
        return sortConfig.direction === "asc" ? 1 : -1;
      }
      return 0;
    });
  }, [properties, sortConfig]);

  const SortIcon = ({ columnKey }) => {
    if (sortConfig.key !== columnKey) {
      return <ChevronDown className="w-4 h-4 text-gray-400" />;
    }
    return sortConfig.direction === "asc" ? (
      <ChevronDown className="w-4 h-4" />
    ) : (
      <ChevronUp className="w-4 h-4" />
    );
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatPercent = (value) => {
    const sign = value >= 0 ? "+" : "";
    return `${sign} ${value.toFixed(2)} %`;
  };

  return (
    <div className="bg-white overflow-hidden mb-4">
      <Table>
        <TableHeader
          className="bg-gray-800"
          style={{
            color: "#FFF",
            fontFamily: "Roboto, sans-serif",
            fontSize: "16px",
            fontWeight: 700,
          }}
        >
          <TableRow className="hover:bg-gray-800 border-b-0">
            <TableHead className="px-2 md:px-4 py-2 md:py-3 text-left text-white">
              <button
                onClick={() => handleSort("name")}
                className="flex items-center gap-1 md:gap-2 hover:text-gray-200"
              >
                <span className="hidden lg:inline">Property Name</span>
                <span className="lg:hidden">Property</span>
                <SortIcon columnKey="name" />
              </button>
            </TableHead>
            <TableHead className="px-2 md:px-4 py-2 md:py-3 text-left hidden md:table-cell text-white">
              <button
                onClick={() => handleSort("address")}
                className="flex items-center gap-1 md:gap-2 hover:text-gray-200"
              >
                Address
                <SortIcon columnKey="address" />
              </button>
            </TableHead>
            <TableHead className="px-2 md:px-4 py-2 md:py-3 text-left text-white">
              <button
                onClick={() => handleSort("gri")}
                className="flex items-center gap-1 md:gap-2 hover:text-gray-200"
              >
                <Info className="w-3 h-3 md:w-4 md:h-4" />
                GRI
                <SortIcon columnKey="gri" />
              </button>
            </TableHead>
            <TableHead className="px-2 md:px-4 py-2 md:py-3 text-left hidden lg:table-cell text-white">
              <button
                onClick={() => handleSort("expenses")}
                className="flex items-center gap-1 md:gap-2 hover:text-gray-200"
              >
                <Info className="w-4 h-4" />
                <span className="hidden xl:inline">Operating Expenses</span>
                <span className="xl:hidden">Op. Exp.</span>
                <SortIcon columnKey="expenses" />
              </button>
            </TableHead>
            <TableHead className="px-2 md:px-4 py-2 md:py-3 text-left text-white">
              <button
                onClick={() => handleSort("noi")}
                className="flex items-center gap-1 md:gap-2 hover:text-gray-200"
              >
                <Info className="w-3 h-3 md:w-4 md:h-4" />
                NOI
                <SortIcon columnKey="noi" />
              </button>
            </TableHead>
            <TableHead className="px-2 md:px-4 py-2 md:py-3 text-left hidden sm:table-cell text-white">
              <button
                onClick={() => handleSort("capRate")}
                className="flex items-center gap-1 md:gap-2 hover:text-gray-200"
              >
                <Info className="w-3 h-3 md:w-4 md:h-4" />
                Cap Rate
                <SortIcon columnKey="capRate" />
              </button>
            </TableHead>
            <TableHead className="px-2 md:px-4 py-2 md:py-3 text-left text-white">
              <button
                onClick={() => handleSort("rent")}
                className="flex items-center gap-1 md:gap-2 hover:text-gray-200"
              >
                <Info className="w-3 h-3 md:w-4 md:h-4" />
                Rent
                <SortIcon columnKey="rent" />
              </button>
            </TableHead>
            <TableHead className="px-2 md:px-4 py-2 md:py-3 text-left hidden lg:table-cell text-white">
              <button
                onClick={() => handleSort("expenseRatio")}
                className="flex items-center gap-1 md:gap-2 hover:text-gray-200"
              >
                <Info className="w-4 h-4" />
                <span className="hidden xl:inline">Expense Ratio</span>
                <span className="xl:hidden">Exp. Ratio</span>
                <SortIcon columnKey="expenseRatio" />
              </button>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody style={{ fontFamily: "Roboto, sans-serif" }}>
          {sortedProperties.map((property, idx) => (
            <TableRow key={idx} className="border-b border-gray-400">
              <TableCell
                className="px-2 md:px-4 py-2 md:py-3 text-center"
                style={{ color: "#000", fontSize: "14px", fontWeight: 400 }}
              >
                {property.name}
              </TableCell>
              <TableCell
                className="px-2 md:px-4 py-2 md:py-3 text-center hidden md:table-cell"
                style={{ color: "#000", fontSize: "14px", fontWeight: 400 }}
              >
                {property.address}
              </TableCell>
              <TableCell
                className="px-2 md:px-4 py-2 md:py-3 text-center"
                style={{ color: "#000", fontSize: "14px", fontWeight: 400 }}
              >
                {formatCurrency(property.gri)}
              </TableCell>
              <TableCell
                className="px-2 md:px-4 py-2 md:py-3 text-center hidden lg:table-cell"
                style={{ color: "#000", fontSize: "14px", fontWeight: 400 }}
              >
                {formatCurrency(property.expenses)}
              </TableCell>
              <TableCell
                className="px-2 md:px-4 py-2 md:py-3 text-center"
                style={{ color: "#000", fontSize: "14px", fontWeight: 400 }}
              >
                {formatCurrency(property.noi)}
              </TableCell>
              <TableCell
                className="px-2 md:px-4 py-2 md:py-3 text-center hidden sm:table-cell"
                style={{ color: "#000", fontSize: "14px", fontWeight: 400 }}
              >
                {property.capRate} %
              </TableCell>
              <TableCell
                className={`px-2 md:px-4 py-2 md:py-3 text-center ${
                  property.rent >= 0 ? "text-green-600" : "text-red-600"
                }`}
                style={{ fontSize: "14px", fontWeight: 400 }}
              >
                {formatPercent(property.rent)}
              </TableCell>
              <TableCell
                className="px-2 md:px-4 py-2 md:py-3 text-center hidden lg:table-cell"
                style={{ color: "#000", fontSize: "14px", fontWeight: 400 }}
              >
                {property.expenseRatio} %
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default FinancialMetricsTable;
