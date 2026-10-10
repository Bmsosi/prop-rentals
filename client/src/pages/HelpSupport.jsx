import { useState } from "react";
import {
    Search,
    FileText,
    BookOpen,
    MessageCircle,
    Mail,
    ChevronRight,
    HelpCircle,
    FileCheck,
    Wrench,
    Calculator,
    Shield,
    Briefcase,
    Home,
    Users,
    CreditCard,
    Calendar,
    Settings,
    ChevronDown,
    ChevronUp
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const HelpSupport = () => {
    const [searchQuery, setSearchQuery] = useState("");
    const [expandedCategory, setExpandedCategory] = useState(null);
    const [expandedArticle, setExpandedArticle] = useState(null);

    const helpCategories = [
        {
            id: "getting-started",
            title: "Getting Started",
            icon: <BookOpen className="w-6 h-6" />,
            description: "Learn the basics of using our rental management platform",
            articles: [
                {
                    id: "gs-1",
                    title: "How to create your account",
                    content: "To create your account, click on the 'Sign Up' button on the landing page. Fill in your details including name, email, and password. You'll receive a verification email to activate your account. Once verified, you can log in and complete your profile setup."
                },
                {
                    id: "gs-2",
                    title: "Understanding your dashboard",
                    content: "Your dashboard provides an overview of all your rental activities. For landlords, you'll see property portfolio summaries, active leases, pending applications, and maintenance requests. For tenants, you'll see your rental information, payment history, and maintenance requests."
                },
                {
                    id: "gs-3",
                    title: "Navigating the platform",
                    content: "Use the sidebar menu to navigate between different sections. The main sections include Dashboard, Portfolio (landlords) or Rental Info (tenants), Applications, Leases, Maintenance, Accounting, and Insurance. Click on any menu item to access that section."
                }
            ]
        },
        {
            id: "leases",
            title: "Leases Management",
            icon: <FileCheck className="w-6 h-6" />,
            description: "Create, manage, and track lease agreements",
            articles: [
                {
                    id: "lease-1",
                    title: "Creating a standard lease",
                    content: "Navigate to the Leases section and click 'Create Lease'. Select 'Standard Lease' and fill in the required information including property details, tenant information, rent amount, lease term, and dates. Review all details before finalizing the lease."
                },
                {
                    id: "lease-2",
                    title: "Creating a custom lease",
                    content: "For custom lease agreements, go to Leases and select 'Custom Lease'. Upload your custom lease document or create one using our template builder. Custom leases allow you to add specific terms and conditions tailored to your property and tenant needs."
                },
                {
                    id: "lease-3",
                    title: "Sending lease for signature",
                    content: "Once a lease is created, you can send it to tenants for electronic signature. Click on the lease and select 'Send for Signature'. The tenant will receive an email with a secure link to review and sign the lease digitally."
                },
                {
                    id: "lease-4",
                    title: "Tracking lease expiration",
                    content: "The system automatically tracks lease expiration dates. You'll see expiring leases on your dashboard with alerts. You can filter leases by status (Active, Expired, Terminated) and set up reminders for lease renewals."
                },
                {
                    id: "lease-5",
                    title: "Terminating a lease",
                    content: "To terminate a lease, navigate to the lease details page and click 'Terminate Lease'. You'll need to provide a termination reason and date. The system will notify the tenant and update the lease status accordingly."
                }
            ]
        },
        {
            id: "maintenance",
            title: "Maintenance Requests",
            icon: <Wrench className="w-6 h-6" />,
            description: "Submit, track, and manage maintenance requests",
            articles: [
                {
                    id: "maint-1",
                    title: "Submitting a maintenance request",
                    content: "Tenants can submit maintenance requests by going to the Maintenance section and clicking 'New Request'. Fill in the issue description, select priority level (Low, Medium, High, Urgent), choose a category (Plumbing, Electrical, HVAC, etc.), and upload photos if needed."
                },
                {
                    id: "maint-2",
                    title: "Managing maintenance requests (Landlords)",
                    content: "Landlords can view all maintenance requests in the Maintenance section. You can filter by status (Open, In Progress, Completed, Cancelled) and priority. Update request status, assign contractors, add notes, and track invoices related to each request."
                },
                {
                    id: "maint-3",
                    title: "Tracking request status",
                    content: "Both tenants and landlords can track the status of maintenance requests in real-time. Status updates include Open, In Progress, Completed, and Cancelled. You'll receive notifications when the status changes."
                },
                {
                    id: "maint-4",
                    title: "Uploading maintenance photos",
                    content: "When submitting or updating a maintenance request, you can upload photos to help describe the issue. Supported formats include JPG, PNG, and PDF. Photos help contractors understand the problem better and provide accurate quotes."
                }
            ]
        },
        {
            id: "accounting",
            title: "Accounting & Payments",
            icon: <Calculator className="w-6 h-6" />,
            description: "Manage rent payments, deposits, and financial records",
            articles: [
                {
                    id: "acc-1",
                    title: "Viewing payment history",
                    content: "Navigate to the Accounting section to view all payment transactions. You can see rent payments, deposits, refunds, and other transactions. Filter by date range, payment type, or status (Pending, Paid, Failed)."
                },
                {
                    id: "acc-2",
                    title: "Making a payment (Tenants)",
                    content: "Tenants can make rent payments through the Accounting section. Click 'Make Payment' and select the payment type (Rent, Deposit, etc.). Enter the amount and payment method. You'll receive a receipt once the payment is processed."
                },
                {
                    id: "acc-3",
                    title: "Recording payments (Landlords)",
                    content: "Landlords can manually record payments received outside the platform. Go to Accounting and click 'Record Payment'. Enter the payment details including amount, date, and payment method. This helps maintain accurate financial records."
                },
                {
                    id: "acc-4",
                    title: "Generating receipts",
                    content: "Receipts are automatically generated for all payments. You can view and download receipts from the Accounting section. Receipts include payment details, transaction ID, and can be used for tax purposes."
                },
                {
                    id: "acc-5",
                    title: "Payment reminders",
                    content: "The system automatically sends payment reminders to tenants before rent due dates. Landlords can configure reminder settings and view upcoming payment schedules in the Accounting dashboard."
                }
            ]
        },
        {
            id: "applications",
            title: "Applications",
            icon: <Briefcase className="w-6 h-6" />,
            description: "Manage tenant applications and property listings",
            articles: [
                {
                    id: "app-1",
                    title: "Applying for a property (Tenants)",
                    content: "Tenants can apply for properties by clicking the 'Apply' button on any property listing. Fill out the application form with personal information, employment details, references, and upload required documents. Submit the application for landlord review."
                },
                {
                    id: "app-2",
                    title: "Reviewing applications (Landlords)",
                    content: "Landlords can view all applications in the Applications section. Filter by status (New, Pending, Approved, Rejected). Review applicant details, documents, and background information. Approve or reject applications directly from the platform."
                },
                {
                    id: "app-3",
                    title: "Application status tracking",
                    content: "Tenants can track their application status in real-time. You'll receive notifications when your application status changes. Status options include New, Pending, Approved, Rejected, or Cancelled."
                },
                {
                    id: "app-4",
                    title: "Creating property listings",
                    content: "Landlords can create property listings in the Portfolio section. Click 'New Listing' and fill in property details including address, type, size, amenities, rent amount, and upload photos. Set the listing status to Active to make it visible to tenants."
                }
            ]
        },
        {
            id: "portfolio",
            title: "Property Portfolio",
            icon: <Home className="w-6 h-6" />,
            description: "Manage your property portfolio and listings",
            articles: [
                {
                    id: "port-1",
                    title: "Adding a new property",
                    content: "Go to the Portfolio section and click 'New Listing'. Enter property details including type (Apartment, Condo, House, etc.), address, bedrooms, bathrooms, square footage, and rental information. Add amenities and upload property photos."
                },
                {
                    id: "port-2",
                    title: "Editing property details",
                    content: "Click on any property in your portfolio to view details. Use the 'Edit' button to update property information, rental rates, amenities, or photos. Changes are saved automatically and reflected in your listings."
                },
                {
                    id: "port-3",
                    title: "Managing property images",
                    content: "Upload multiple images for each property to showcase it better. Set a primary image that will be displayed first. You can reorder images by dragging them. Supported formats include JPG, PNG, and WebP."
                },
                {
                    id: "port-4",
                    title: "Viewing rental information",
                    content: "Tenants can view their rental information in the Rental Info section. This includes property details, lease information, rent amount, payment schedule, and contact information for the landlord or property manager."
                }
            ]
        },
        {
            id: "insurance",
            title: "Insurance",
            icon: <Shield className="w-6 h-6" />,
            description: "Track and manage insurance policies",
            articles: [
                {
                    id: "ins-1",
                    title: "Uploading insurance documents",
                    content: "Both landlords and tenants can upload insurance documents in the Insurance section. Click 'Upload Insurance' and select your policy document. The system will track expiration dates and send reminders before policies expire."
                },
                {
                    id: "ins-2",
                    title: "Tracking insurance expiration",
                    content: "The platform automatically tracks insurance expiration dates. You'll see upcoming expirations on your dashboard and receive email reminders 30, 15, and 7 days before expiration. Update your policy information to keep records current."
                },
                {
                    id: "ins-3",
                    title: "Viewing insurance status",
                    content: "Check the Insurance section to view your current insurance status, policy details, and expiration dates. Landlords can also view tenant insurance status for their properties."
                }
            ]
        },
        {
            id: "account",
            title: "Account Settings",
            icon: <Settings className="w-6 h-6" />,
            description: "Manage your account and preferences",
            articles: [
                {
                    id: "acc-settings-1",
                    title: "Updating your profile",
                    content: "Go to Account settings to update your personal information, contact details, and profile picture. Keep your information current to ensure proper communication and account security."
                },
                {
                    id: "acc-settings-2",
                    title: "Changing your password",
                    content: "In Account settings, click 'Change Password' to update your password. Enter your current password and choose a strong new password. Use a combination of letters, numbers, and special characters for better security."
                },
                {
                    id: "acc-settings-3",
                    title: "Notification preferences",
                    content: "Customize your notification settings to control when and how you receive alerts. You can enable or disable email notifications for payments, maintenance requests, lease updates, and application status changes."
                }
            ]
        }
    ];

    const filteredCategories = helpCategories.map(category => ({
        ...category,
        articles: category.articles.filter(article =>
            article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            article.content.toLowerCase().includes(searchQuery.toLowerCase())
        )
    })).filter(category => category.articles.length > 0 || category.title.toLowerCase().includes(searchQuery.toLowerCase()));

    const toggleCategory = (categoryId) => {
        setExpandedCategory(expandedCategory === categoryId ? null : categoryId);
    };

    const toggleArticle = (articleId) => {
        setExpandedArticle(expandedArticle === articleId ? null : articleId);
    };

    return (
        <div className="min-h-screen bg-background py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                {/* Header Section */}
                <div className="text-center mb-12">
                    <div className="flex items-center justify-center gap-3 mb-4">
                        <HelpCircle className="w-8 h-8 md:w-12 md:h-12 text-primary" />
                        <h1 className="text-2xl md:text-4xl lg:text-5xl font-bold text-primary leading-relaxed">
                            Help & Support
                        </h1>
                    </div>
                    <p className="text-base md:text-xl lg:text-2xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
                        Find answers to common questions and learn how to use our rental management platform
                    </p>
                </div>

                {/* Search Bar */}
                <div className="mb-12 max-w-2xl mx-auto">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <Input
                            type="text"
                            placeholder="Search for help articles..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-12 pr-4 py-4 md:py-6 text-sm md:text-lg rounded-2xl border-gray-200 focus:border-primary bg-primary-foreground"
                        />
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
                    <Card className="shadow-none hover:shadow-lg rounded-3xl transition-shadow cursor-pointer min-h-[180px] flex flex-col p-6">
                        <CardHeader className="flex-1 p-0 mb-4">
                            <div className="flex items-center gap-3">
                                <MessageCircle className="w-6 h-6 md:w-8 md:h-8 text-primary" />
                                <CardTitle className="text-base md:text-lg">Contact Support</CardTitle>
                            </div>
                            <CardDescription className="text-sm md:text-base leading-relaxed">
                                Get in touch with our support team for personalized assistance.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="pt-6 p-0">
                            <Button 
                                className="bg-primary text-primary-foreground hover:opacity-90 rounded-2xl py-4 md:py-6 px-4 md:px-6 text-sm md:text-md"
                                onClick={() => window.open('/#contact', '_blank')}
                            >
                                Contact Us
                            </Button>
                        </CardContent>
                    </Card>

                    <Card className="shadow-none hover:shadow-lg rounded-3xl transition-shadow cursor-pointer min-h-[180px] flex flex-col p-6">
                        <CardHeader className="flex-1 p-0 mb-4">
                            <div className="flex items-center gap-3">
                                <Mail className="w-6 h-6 md:w-8 md:h-8 text-primary" />
                                <CardTitle className="text-base md:text-lg">Email Support</CardTitle>
                            </div>
                            <CardDescription className="text-sm md:text-base leading-relaxed">
                                Send us an email and we'll get back to you within 24 hours.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="pt-6 p-0">
                            <Button 
                                variant="outline" 
                                className="border-primary text-primary hover:bg-primary hover:text-primary-foreground rounded-2xl py-4 md:py-6 px-4 md:px-6 text-sm md:text-md"
                                onClick={() => {
                                    const subject = encodeURIComponent('Help & Support Request');
                                    const body = encodeURIComponent('Hello,\n\nI need help with:\n\n\n\nThank you!');
                                    const mailtoLink = `mailto:contact@raccons.dev?subject=${subject}&body=${body}`;
                                    window.location.href = mailtoLink;
                                }}
                            >
                                Send Email
                            </Button>
                        </CardContent>
                    </Card>
                </div>

                {/* Help Categories */}
                <div className="space-y-2">
                    {filteredCategories.map((category) => (
                        <Card
                            key={category.id}
                            className="overflow-hidden hover:border-primary/40 transition-all rounded-3xl p-1.5"
                        >
                            <CardHeader
                                className="cursor-pointer rounded-2xl bg-gradient-to-r from-primary/5.5 to-sidebar-primary-foreground/5 hover:from-primary/2.5 hover:to-primary/3 transition-colors py-3"
                                onClick={() => toggleCategory(category.id)}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4 md:gap-8">
                                        <div className="p-2 md:p-3 text-primary w-8 h-8 md:w-10 md:h-10">
                                            {category.icon}
                                        </div>
                                        <div>
                                            <CardTitle className="text-base md:text-xl text-primary leading-relaxed">
                                                {category.title}
                                            </CardTitle>
                                            <CardDescription className="text-sm md:text-base leading-relaxed">
                                                {category.description}
                                            </CardDescription>
                                        </div>
                                    </div>
                                    {expandedCategory === category.id ? (
                                        <ChevronUp className="w-5 h-5 md:w-6 md:h-6 text-primary" />
                                    ) : (
                                        <ChevronDown className="w-5 h-5 md:w-6 md:h-6 text-primary" />
                                    )}
                                </div>
                            </CardHeader>

                            {expandedCategory === category.id && (
                                <CardContent className="py-6 space-y-4">
                                    {category.articles.map((article) => (
                                        <div
                                            key={article.id}
                                            className="border-l-3 border-primary/30 pl-4 py-2 hover:border-primary/80 transition-colors"
                                        >
                                            <button
                                                onClick={() => toggleArticle(article.id)}
                                                className="w-full text-left flex items-center justify-between group"
                                            >
                                                <h3 className="text-base md:text-lg font-semibold text-gray-900 group-hover:text-primary transition-colors leading-relaxed">
                                                    {article.title}
                                                </h3>
                                                {expandedArticle === article.id ? (
                                                    <ChevronUp className="w-4 h-4 md:w-5 md:h-5 text-primary flex-shrink-0 ml-4" />
                                                ) : (
                                                    <ChevronRight className="w-4 h-4 md:w-5 md:h-5 text-gray-400 group-hover:text-primary transition-colors flex-shrink-0 ml-4" />
                                                )}
                                            </button>
                                            {expandedArticle === article.id && (
                                                <div className="mt-3 text-sm md:text-base text-gray-600 leading-relaxed pr-4 md:pr-8">
                                                    {article.content}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </CardContent>
                            )}
                        </Card>
                    ))}
                </div>

                {/* No Results Message */}
                {searchQuery && filteredCategories.length === 0 && (
                    <div className="text-center py-12">
                        <FileText className="w-12 h-12 md:w-16 md:h-16 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-xl md:text-2xl font-semibold text-gray-700 mb-2">No results found</h3>
                        <p className="text-sm md:text-base text-gray-500">
                            Try searching with different keywords or browse our categories above
                        </p>
                    </div>
                )}

                {/* Footer Help Section */}
                <div className="mt-16 pt-8 pb-20 border-t-2 border-gray-200">
                    <div className="text-center">
                        <h2 className="text-xl md:text-2xl font-bold text-primary mb-4 leading-relaxed">
                            Still need help?
                        </h2>
                        <p className="text-sm md:text-base text-gray-600 mb-6 leading-relaxed">
                            Our support team is here to assist you with any questions or issues
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Button
                                className="bg-primary text-primary-foreground hover:opacity-90 rounded-full text-sm md:text-lg flex items-center gap-3"
                                style={{ 
                                    paddingTop: '1rem', 
                                    paddingBottom: '1rem', 
                                    paddingLeft: '1.5rem', 
                                    paddingRight: '1.5rem',
                                    minWidth: '180px'
                                }}
                                onClick={() => {
                                    const subject = encodeURIComponent('Help & Support Request');
                                    const body = encodeURIComponent('Hello,\n\nI need help with:\n\n\n\nThank you!');
                                    const mailtoLink = `mailto:contact@raccons.dev?subject=${subject}&body=${body}`;
                                    window.location.href = mailtoLink;
                                }}
                            >
                                <Mail className="w-4 h-4 md:w-5 md:h-5" />
                                Email Support
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HelpSupport;

