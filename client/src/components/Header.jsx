import { useState, useRef, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "../store/authStore";
import NotificationDropdown from "./NotificationDropdown";
import ProfileImage from "./shared/ProfileImage";
import { User, LogOut } from "lucide-react";

const Header = ({ user, isLandlord }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { logout } = useAuthStore();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const profileMenuRef = useRef(null);

  const showGreeting =
    location.pathname === "/landlord/dashboard" ||
    location.pathname === "/tenant/dashboard";

  // Get page title from pathname
  const getPageTitle = () => {
    const path = location.pathname;
    
    // Dashboard pages show greeting, not title
    if (path === "/landlord/dashboard" || path === "/tenant/dashboard") {
      return null;
    }

    // Map pathnames to titles
    const titleMap = {
      "/landlord/portfolio": "Portfolio",
      "/landlord/applications": "Applications",
      "/landlord/leases": "Leases",
      "/landlord/maintenance": "Maintenance",
      "/landlord/accounting": "Accounting",
      "/landlord/insurance": "Insurance",
      "/landlord/account": "Account Settings",
      "/tenant/rental-info": "Rental Info",
      "/tenant/maintenance": "Maintenance",
      "/tenant/accounting": "Accounting",
      "/tenant/insurance": "Renter's Insurance",
      "/tenant/account": "Account Settings",
    };

    // Check for exact matches first
    if (titleMap[path]) {
      return titleMap[path];
    }

    // Check for path starts with (for detail pages)
    for (const [key, value] of Object.entries(titleMap)) {
      if (path.startsWith(key) && path !== key) {
        // For detail pages, you might want to show the parent page title
        // or extract a more specific title. For now, return the parent title.
        return value;
      }
    }

    return null;
  };

  // Get page description from pathname
  const getPageDescription = () => {
    const path = location.pathname;
    
    // Dashboard pages show greeting, not description
    if (path === "/landlord/dashboard" || path === "/tenant/dashboard") {
      return null;
    }

    // Map pathnames to descriptions
    const descriptionMap = {
      "/landlord/portfolio": "Per Property",
      "/landlord/applications": "Manage rental applications",
      "/landlord/leases": "Per property",
      "/landlord/maintenance": "Track and manage all property maintenance tasks",
      "/landlord/accounting": "Track payments, and manage financial records",
      "/landlord/insurance": "Manage and track your tenants' insurance status",
      "/landlord/account": "Manage your profile and security settings",
      "/tenant/rental-info": "View your rental information",
      "/tenant/maintenance": "Track and manage maintenance requests",
      "/tenant/accounting": "View your payment history",
      "/tenant/insurance": "Manage and track your renter's insurance policies",
      "/tenant/account": "Manage your profile and security settings",
    };

    // Check for exact matches first
    if (descriptionMap[path]) {
      return descriptionMap[path];
    }

    // Check for path starts with (for detail pages)
    for (const [key, value] of Object.entries(descriptionMap)) {
      if (path.startsWith(key) && path !== key) {
        return value;
      }
    }

    return null;
  };

  const pageTitle = getPageTitle();
  const pageDescription = getPageDescription();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    queryClient.clear();
    console.log('🧹 Cleared all React Query cache on logout');
    logout();
    navigate("/login");
  };

  const handleAccountClick = () => {
    setShowProfileMenu(false);
    navigate(isLandlord ? "/landlord/account" : "/tenant/account");
  };

  return (
    <div className="px-4 mt-2 sm:mt-0 sm:px-6 md:px-8 pb-2 pt-4 flex justify-between items-center">
      <div className="flex items-center gap-3">
        {showGreeting ? (
          <h2 className="text-sm sm:text-base md:text-[16px] font-medium text-primary">
            Good morning, <span className="font-bold text-primary">
              {user?.firstName} {user?.lastName}!
            </span>
          </h2>
        ) : (
          <>
            {/* Page Title and Description - Mobile Only */}
            {pageTitle && (
              <div className="md:hidden">
                <h1 className="text-2xl font-extrabold text-primary mb-1">
                  {pageTitle}
                </h1>
                {pageDescription && (
                  <p className="text-xs text-primary">
                    {pageDescription}
                  </p>
                )}
              </div>
            )}
          </>
        )}
      </div>

      <div className="flex my-2 items-center gap-2 sm:gap-3 md:gap-4">
        <NotificationDropdown />
        
        {/* Profile Dropdown */}
        <div className="relative" ref={profileMenuRef}>
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden hover:ring-2 hover:ring-gray-300 transition-all"
          >
            {user?.profileImage ? (
              <ProfileImage
                imageUrl={user.profileImage}
                alt={`${user?.firstName} ${user?.lastName}`}
                className="w-full h-full object-cover"
              />
            ) : (
              <User className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
            )}
          </button>

          {/* Dropdown Menu */}
          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
              <button
                onClick={handleAccountClick}
                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <User className="w-4 h-4" />
                <span>Account</span>
              </button>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Header;
