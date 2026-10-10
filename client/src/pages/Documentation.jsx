import React from "react";
import { FileText, Wrench, Calculator, Shield, Home, Users, CreditCard, MessageSquare, ArrowRight, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

const Documentation = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-background">
            {/* Simple header with close button */}
            <div className="sticky top-0 bg-background/95 backdrop-blur-sm border-b border-gray-200 z-50">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
                    <h1 className="text-xl font-bold text-primary">PropEase - Documentation</h1>
                    <button
                        onClick={() => {
                            // Try to close if window was opened by JavaScript
                            if (window.opener) {
                                window.close();
                            } else {
                                // If can't close, navigate to landing page
                                navigate("/");
                            }
                        }}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        aria-label="Close"
                    >
                        <X className="w-5 h-5 text-gray-600" />
                    </button>
                </div>
            </div>
            
            <div className="pt-8 pb-16 px-4 sm:px-6 lg:px-8">
                <div className="max-w-4xl mx-auto">
                    {/* Header */}
                    <div className="text-center mb-12">
                        <h1 className="text-4xl md:text-5xl font-bold text-primary mb-4">
                            Documentation
                        </h1>
                        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                            Everything you need to know about PropEase - Your comprehensive rental management solution
                        </p>
                    </div>

                    {/* Quick Start */}
                    <section className="mb-12 bg-white rounded-2xl p-8 shadow-lg">
                        <h2 className="text-2xl font-bold text-primary mb-4 flex items-center gap-2">
                            <Home className="w-6 h-6" />
                            Getting Started
                        </h2>
                        <div className="space-y-4 text-gray-700">
                            <div>
                                <h3 className="font-semibold text-lg mb-2">For Landlords</h3>
                                <ol className="list-decimal list-inside space-y-2 ml-4">
                                    <li>Sign up for a PropEase account</li>
                                    <li>Create your first property listing</li>
                                    <li>Generate application links for prospective tenants</li>
                                    <li>Review applications and approve tenants</li>
                                    <li>Create and manage lease agreements</li>
                                    <li>Track payments and maintenance requests</li>
                                </ol>
                            </div>
                            <div className="pt-4 border-t">
                                <h3 className="font-semibold text-lg mb-2">For Tenants</h3>
                                <ol className="list-decimal list-inside space-y-2 ml-4">
                                    <li>Apply to properties using the application link</li>
                                    <li>Complete your profile after approval</li>
                                    <li>Sign your lease agreement digitally</li>
                                    <li>Submit maintenance requests as needed</li>
                                    <li>Upload payment receipts and insurance documents</li>
                                    <li>Track your rental information and payments</li>
                                </ol>
                            </div>
                        </div>
                    </section>

                    {/* Features */}
                    <section className="mb-12">
                        <h2 className="text-3xl font-bold text-primary mb-8 text-center">Key Features</h2>
                        <div className="grid md:grid-cols-2 gap-6">
                            {/* Leases */}
                            <div className="bg-white rounded-2xl p-6 shadow-lg">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="p-3 bg-primary/10 rounded-lg">
                                        <FileText className="w-6 h-6 text-primary" />
                                    </div>
                                    <h3 className="text-xl font-bold text-primary">Lease Management</h3>
                                </div>
                                <ul className="space-y-2 text-gray-700">
                                    <li>• Create standard and custom lease agreements</li>
                                    <li>• Digital lease signing and renewal</li>
                                    <li>• Track lease expiration dates</li>
                                    <li>• Automated lease reminders</li>
                                </ul>
                            </div>

                            {/* Maintenance */}
                            <div className="bg-white rounded-2xl p-6 shadow-lg">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="p-3 bg-primary/10 rounded-lg">
                                        <Wrench className="w-6 h-6 text-primary" />
                                    </div>
                                    <h3 className="text-xl font-bold text-primary">Maintenance Requests</h3>
                                </div>
                                <ul className="space-y-2 text-gray-700">
                                    <li>• Submit and track maintenance requests</li>
                                    <li>• Real-time status updates</li>
                                    <li>• Photo attachments for issues</li>
                                    <li>• Communication between landlord and tenant</li>
                                </ul>
                            </div>

                            {/* Accounting */}
                            <div className="bg-white rounded-2xl p-6 shadow-lg">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="p-3 bg-primary/10 rounded-lg">
                                        <Calculator className="w-6 h-6 text-primary" />
                                    </div>
                                    <h3 className="text-xl font-bold text-primary">Accounting & Payments</h3>
                                </div>
                                <ul className="space-y-2 text-gray-700">
                                    <li>• Automated invoice generation</li>
                                    <li>• Payment tracking and history</li>
                                    <li>• Receipt upload and verification</li>
                                    <li>• Financial reports and analytics</li>
                                </ul>
                            </div>

                            {/* Insurance */}
                            <div className="bg-white rounded-2xl p-6 shadow-lg">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="p-3 bg-primary/10 rounded-lg">
                                        <Shield className="w-6 h-6 text-primary" />
                                    </div>
                                    <h3 className="text-xl font-bold text-primary">Insurance Management</h3>
                                </div>
                                <ul className="space-y-2 text-gray-700">
                                    <li>• Upload and verify insurance documents</li>
                                    <li>• Track expiration dates</li>
                                    <li>• Automated expiration reminders</li>
                                    <li>• Document verification workflow</li>
                                </ul>
                            </div>
                        </div>
                    </section>

                    {/* User Guides */}
                    <section className="mb-12 bg-white rounded-2xl p-8 shadow-lg">
                        <h2 className="text-2xl font-bold text-primary mb-6 flex items-center gap-2">
                            <Users className="w-6 h-6" />
                            User Guides
                        </h2>
                        
                        <div className="space-y-6">
                            <div>
                                <h3 className="font-semibold text-lg mb-3 text-primary">Landlord Guide</h3>
                                <div className="space-y-3 text-gray-700">
                                    <div>
                                        <h4 className="font-semibold mb-1">Property Management</h4>
                                        <p className="text-sm">Create and manage multiple property listings. Add property details, photos, amenities, and rental information.</p>
                                    </div>
                                    <div>
                                        <h4 className="font-semibold mb-1">Application Process</h4>
                                        <p className="text-sm">Generate unique application links for each property. Review applications, approve or reject tenants, and manage the entire process digitally.</p>
                                    </div>
                                    <div>
                                        <h4 className="font-semibold mb-1">Lease Creation</h4>
                                        <p className="text-sm">Create standard leases or customize your own. Send lease agreements for digital signing and track all signed documents.</p>
                                    </div>
                                    <div>
                                        <h4 className="font-semibold mb-1">Financial Management</h4>
                                        <p className="text-sm">View payment history, approve/reject payment receipts, generate invoices, and access financial reports.</p>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-6 border-t">
                                <h3 className="font-semibold text-lg mb-3 text-primary">Tenant Guide</h3>
                                <div className="space-y-3 text-gray-700">
                                    <div>
                                        <h4 className="font-semibold mb-1">Applying to Properties</h4>
                                        <p className="text-sm">Use the application link provided by your landlord to apply. Fill out your information and submit your application.</p>
                                    </div>
                                    <div>
                                        <h4 className="font-semibold mb-1">Lease Signing</h4>
                                        <p className="text-sm">Review and sign your lease agreement digitally. All signed documents are stored securely in your account.</p>
                                    </div>
                                    <div>
                                        <h4 className="font-semibold mb-1">Making Payments</h4>
                                        <p className="text-sm">Upload payment receipts after making rent payments. Track your payment history and view upcoming due dates.</p>
                                    </div>
                                    <div>
                                        <h4 className="font-semibold mb-1">Maintenance Requests</h4>
                                        <p className="text-sm">Submit maintenance requests with photos and descriptions. Communicate with your landlord and track request status.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Support */}
                    <section className="mb-12 bg-gradient-to-r from-primary/10 via-primary/5 to-pink-100/20 rounded-2xl p-8">
                        <h2 className="text-2xl font-bold text-primary mb-4 flex items-center gap-2">
                            <MessageSquare className="w-6 h-6" />
                            Need Help?
                        </h2>
                        <p className="text-gray-700 mb-6">
                            If you have any questions or need assistance, we're here to help!
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4">
                            <Button
                                onClick={() => navigate("/#contact")}
                                variant="outline"
                                className="border-primary text-primary hover:bg-primary/10"
                            >
                                Contact Support
                            </Button>
                        </div>
                    </section>

                    {/* CTA */}
                    <div className="text-center bg-white rounded-2xl p-8 shadow-lg">
                        <h2 className="text-2xl font-bold text-primary mb-4">Ready to Get Started?</h2>
                        <p className="text-gray-600 mb-6">
                            Join PropEase today and streamline your rental management process
                        </p>
                        <Button
                            onClick={() => navigate("/signup")}
                            style={{ paddingLeft: '3rem', paddingRight: '3rem', paddingTop: '1.5rem', paddingBottom: '1.5rem' }}
                            className="bg-primary text-primary-foreground hover:bg-primary/90 text-lg"
                        >
                            Sign Up Now
                            <ArrowRight className="w-5 h-5 ml-2" />
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Documentation;

