export const RENTCYCLE_OPTIONS = [
  { value: "MONTHLY", label: "Monthly" },
  { value: "QUARTERLY", label: "Quarterly" },
  { value: "YEARLY", label: "Yearly" },
];

export const getRentCycleLabel = (value) => {
  const found = RENTCYCLE_OPTIONS.find(option => option.value === value);
  return found ? found.label : value;
};
