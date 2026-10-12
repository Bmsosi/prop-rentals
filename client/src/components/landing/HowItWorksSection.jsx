const landlordSteps = [
  "Sign up for a MucoProps account",
  "Create your first property listing",
  "Get a notification when a tenant shows interest in your property",
  "Pre-approve tenants and request additional information",
  "Generate application links for prospective tenants",
  "Review applications and approve tenants",
  "Create and manage lease agreements",
  "Track payments and maintenance requests",
];

const tenantSteps = [
  "Sign up for a MucoProps account",
  "Browse available properties and save your favorites",
  "Apply to properties using the application link",
  "Complete your profile after pre-approval",
  "Sign your lease agreement digitally",
  "Submit maintenance requests as needed",
  "Upload payment receipts and insurance documents",
  "Track your rental information and payments",
];

const StepsList = ({ title, steps, accentClass }) => (
  <div className="rounded-3xl bg-white/80 p-6 sm:p-8 shadow-lg ring-1 ring-primary/10">
    <h3 className={`text-2xl sm:text-3xl font-bold mb-6 ${accentClass}`}>
      {title}
    </h3>
    <ol className="space-y-4">
      {steps.map((step, index) => (
        <li
          key={step}
          className="flex items-start gap-4 text-base sm:text-lg text-gray-700"
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">
            {index + 1}
          </span>
          <span className="pt-1">{step}</span>
        </li>
      ))}
    </ol>
  </div>
);

const HowItWorksSection = () => (
  <section
    id="how-it-works"
    className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden"
  >
    <div className="max-w-7xl mx-auto relative z-10">
      <div className="text-center mb-10 sm:mb-14">
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-primary mb-4">
          How MucoProps works
        </h2>
        <p className="text-base sm:text-lg text-gray-500 max-w-2xl mx-auto">
          Everything you need for a simpler rental experience, from application
          to move-in and beyond.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <StepsList
          title="For Landlords"
          steps={landlordSteps}
          accentClass="text-primary"
        />
        <StepsList
          title="For Tenants"
          steps={tenantSteps}
          accentClass="text-[#497c87]"
        />
      </div>
    </div>
  </section>
);

export default HowItWorksSection;
