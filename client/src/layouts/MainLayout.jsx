import {
  Routes,
  Route,
  Navigate,
  useNavigate,
  useLocation,
} from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import LandlordDashboard from "../pages/landlord/dashboard/Dashboard";
import TenantDashboard from "../pages/tenant/dashboard/Dashboard";
import Analytics from "../pages/landlord/analytics/Analytics";
import PropertyPortfolio from "@/pages/landlord/property/PropertyPortfolio";
import PropertyDetails from "@/pages/landlord/property/PropertyDetails";
import MyLeasesTemplates from "../pages/landlord/leases/MyLeasesTemplates";
import Maintenance from "../pages/landlord/maintenance/Maintenance";
import Applications from "@/pages/landlord/application/Appications";
import LeasesPage from "@/pages/landlord/leases/LeasesPage";
import LeaseDetailPage from "@/pages/landlord/leases/LeaseDetailPage";
import Accounting from "@/pages/landlord/accounting/Accounting";
import TenantAccounting from "@/pages/tenant/accounting/TenantAccounting";
import TenantRentalInfo from "@/pages/tenant/rental-info/RentalInfo";
import RentalInformation from "@/pages/tenant/rentalinfo/RentalInformation";
import Account from "@/pages/account/Account";
import LandlordInsurance from "@/pages/landlord/insurance/LandlordInsurance";
import TenantInsurance from "@/pages/tenant/insurance/TenantInsurance";
import HelpSupport from "@/pages/HelpSupport";

const MainLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuthStore();

  const isLandlord = user?.role === "ADMIN";

  // In MainLayout.jsx, update this section:

  const navItems = isLandlord
    ? [
        { label: "Dashboard", id: "dashboard", path: "/landlord/dashboard" },
        { label: "Portfolio", id: "portfolio", path: "/landlord/portfolio" },
        {
          label: "Applications",
          id: "applications",
          path: "/landlord/applications",
        },
        { label: "Leases", id: "leases", path: "/landlord/leases" },
        {
          label: "Maintenance",
          id: "maintenance",
          path: "/landlord/maintenance",
        },
        { label: "Accounting", id: "accounting", path: "/landlord/accounting" },
        { label: "Insurance", id: "insurance", path: "/landlord/insurance" },
      ]
    : [
        { label: "Dashboard", id: "dashboard", path: "/tenant/dashboard" },
        {
          label: "Rental Info",
          id: "rental-info",
          path: "/tenant/rental-info",
        },
        {
          label: "Maintenance",
          id: "maintenance",
          path: "/tenant/maintenance",
        },
        { label: "Accounting", id: "accounting", path: "/tenant/accounting" },
        { label: "Insurance", id: "insurance", path: "/tenant/insurance" },
      ];

  const activeNav =
    navItems.find((item) => location.pathname.startsWith(item.path))?.id ||
    (location.pathname === "/landlord/account" ||
    location.pathname === "/tenant/account"
      ? "account"
      : location.pathname === "/help-support" ||
        location.pathname === "/landlord/help-support" ||
        location.pathname === "/tenant/help-support"
      ? "help-support"
      : "dashboard");

  const handleNavChange = (id) => {
    const item = navItems.find((nav) => nav.id === id);
    if (item) {
      // Always navigate, even to the same route, to trigger component updates
      navigate(item.path, { replace: false, state: { timestamp: Date.now() } });
    }
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar
        navItems={navItems}
        activeNav={activeNav}
        setActiveNav={handleNavChange}
      />

      <div className="flex-1 flex flex-col overflow-hidden bg-background dark:bg-gray-900">
        <Header user={user} isLandlord={isLandlord} />

        <div className="flex-1 flex flex-col min-h-0 overflow-y-auto">
          <Routes>
            <Route path="/landlord/dashboard" element={<LandlordDashboard />} />
            <Route path="/landlord/portfolio" element={<PropertyPortfolio />} />
            <Route
              path="/landlord/portfolio/:id"
              element={<PropertyDetails />}
            />
            <Route path="/landlord/maintenance" element={<Maintenance />} />
            <Route path="/landlord/applications" element={<Applications />} />
            <Route path="/landlord/accounting" element={<Accounting />} />
            <Route path="/landlord/account" element={<Account />} />
            <Route path="/landlord/analytics" element={<Analytics />} />
            <Route path="/landlord/leases" element={<LeasesPage />} />
            <Route
              path="/landlord/leases/:type/:id"
              element={<LeaseDetailPage />}
            />
            <Route path="/landlord/insurance" element={<LandlordInsurance />} />

            <Route path="/tenant/dashboard" element={<TenantDashboard />} />
            <Route path="/tenant/rental-info" element={<TenantRentalInfo />} />
            <Route path="/tenant/maintenance" element={<Maintenance />} />
            <Route path="/tenant/accounting" element={<TenantAccounting />} />
            <Route path="/tenant/account" element={<Account />} />
            <Route path="/tenant/insurance" element={<TenantInsurance />} />

            <Route path="/help-support" element={<HelpSupport />} />
            <Route path="/landlord/help-support" element={<HelpSupport />} />
            <Route path="/tenant/help-support" element={<HelpSupport />} />

            <Route
              path="*"
              element={<Navigate to="/landlord/dashboard" replace />}
            />
          </Routes>
        </div>
      </div>
    </div>
  );
};

export default MainLayout;
