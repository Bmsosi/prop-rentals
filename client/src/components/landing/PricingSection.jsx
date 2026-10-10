import React from "react";
import { Button } from "@/components/ui/button";
import { Check, X } from "lucide-react";

const PricingSection = ({ sectionRef }) => {

    return (
        <section id="pricing" className="pt-8 py-16 sm:pt-16 sm:py-32 px-4 sm:px-6 lg:px-8 scroll-mt-24 relative overflow-hidden">
            <div className="max-w-7xl mx-auto relative z-10">
                <div className="text-center mb-6 sm:mb-12 md:mb-16" ref={sectionRef}>
                    <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-primary mb-4 sm:mb-6 md:mb-8 leading-relaxed">
                        Choose Your Plan
                    </h2>
                    <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-gray-500 max-w-2xl mx-auto leading-relaxed">
                        Flexible pricing options to suit your property management needs
                    </p>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                    {/* Free Plan */}
                    <div className="pricing-card bg-card border border-gray-200 rounded-2xl shadow-sm transition-all duration-300 hover:shadow-lg hover:border-primary/30 hover:scale-105 hover:-translate-y-1 flex flex-col">
                        <div className="p-6 md:p-8 flex flex-col flex-1">
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Free</h3>
                            <p className="text-gray-600 mb-6">Perfect for single property owners</p>

                            <div className="flex items-baseline mb-8">
                                <span className="text-4xl md:text-5xl font-extrabold text-gray-900">$0</span>
                                <span className="pricing-duration text-gray-500 font-medium ml-2">/ month</span>
                            </div>

                            <ul className="space-y-4 text-gray-600 mb-6">
                                <li className="flex items-start">
                                    <Check className="pricing-check w-5 h-5 text-primary mr-3 mt-0.5 flex-shrink-0" />
                                    <span>1 property limit</span>
                                </li>
                                <li className="flex items-start">
                                    <Check className="pricing-check w-5 h-5 text-primary mr-3 mt-0.5 flex-shrink-0" />
                                    <span>Basic rent & tenant tracking only</span>
                                </li>
                                <li className="flex items-start opacity-50">
                                    <X className="w-5 h-5 text-gray-400 mr-3 mt-0.5 flex-shrink-0" />
                                    <span>No analytics or PropEase lease creation</span>
                                </li>
                                <li className="flex items-start opacity-50">
                                    <X className="w-5 h-5 text-gray-400 mr-3 mt-0.5 flex-shrink-0" />
                                    <span>Payment tracking</span>
                                </li>
                                <li className="flex items-start opacity-50">
                                    <X className="w-5 h-5 text-gray-400 mr-3 mt-0.5 flex-shrink-0" />
                                    <span>Maintenance requests</span>
                                </li>
                            </ul>

                            <Button
                                onClick={() => {
                                    const contactSection = document.getElementById('contact');
                                    if (contactSection) {
                                        contactSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                    }
                                }}
                                style={{ backgroundColor: '#53848F', color: 'white' }}
                                className="w-full py-3 sm:py-4 md:py-6 px-4 sm:px-5 md:px-6 rounded-lg sm:rounded-xl text-sm sm:text-base md:text-lg font-semibold transition-colors duration-300 hover:opacity-90 mt-auto"
                            >
                                Get Started
                            </Button>
                        </div>
                    </div>

                    {/* Premium Plan */}
                    <div className="pricing-card pricing-popular bg-primary rounded-2xl shadow-lg text-white transition-all duration-300 hover:shadow-2xl hover:scale-105 hover:-translate-y-1 relative overflow-hidden flex flex-col">
                        <div className="p-6 md:p-8 flex flex-col flex-1">
                            <h3 className="text-xl font-bold mb-2">Premium</h3>
                            <p className="text-primary-foreground/80 mb-6">For professional property management</p>

                            <div className="flex items-baseline mb-8">
                                <span className="text-4xl md:text-5xl font-extrabold">$30</span>
                                <span className="pricing-duration text-primary-foreground/80 font-medium ml-2">/ month</span>
                            </div>

                            <ul className="space-y-4 text-white mb-6">
                                <li className="flex items-start">
                                    <Check className="pricing-check w-5 h-5 text-white mr-3 mt-0.5 flex-shrink-0" />
                                    <span>1-5 properties</span>
                                </li>
                                <li className="flex items-start">
                                    <Check className="pricing-check w-5 h-5 text-white mr-3 mt-0.5 flex-shrink-0" />
                                    <span>Includes lease management</span>
                                </li>
                                <li className="flex items-start">
                                    <Check className="pricing-check w-5 h-5 text-white mr-3 mt-0.5 flex-shrink-0" />
                                    <span>Payment tracking</span>
                                </li>
                                <li className="flex items-start">
                                    <Check className="pricing-check w-5 h-5 text-white mr-3 mt-0.5 flex-shrink-0" />
                                    <span>Maintenance requests and reminders</span>
                                </li>
                            </ul>

                            <Button
                                onClick={() => {
                                    const contactSection = document.getElementById('contact');
                                    if (contactSection) {
                                        contactSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                    }
                                }}
                                className="w-full py-3 sm:py-4 md:py-6 px-4 sm:px-5 md:px-6 rounded-lg sm:rounded-xl bg-white text-primary text-sm sm:text-base md:text-lg font-semibold transition-colors duration-300 hover:bg-white/90 mt-auto"
                            >
                                Get Started
                            </Button>
                        </div>
                    </div>

                    {/* Modules Plan */}
                    <div className="pricing-card group border border-gray-200 rounded-2xl shadow-sm transition-all duration-300 hover:shadow-lg hover:border-primary/30 hover:scale-105 hover:-translate-y-1 flex flex-col" style={{ backgroundColor: '#53848F' }}>
                        <div className="p-6 md:p-8 flex flex-col flex-1">
                            <h3 className="text-xl font-bold text-white mb-2">Modules</h3>
                            <p className="text-white/80 mb-6">Add-on modules for enhanced features</p>

                            <div className="flex items-baseline mb-8">
                                <span className="text-4xl md:text-5xl font-extrabold text-white">+$5</span>
                                <span className="pricing-duration text-white/80 group-hover:text-white font-medium ml-2 transition-colors duration-300">/ month</span>
                            </div>

                            <ul className="space-y-4 text-white mb-6">
                                <li className="flex items-start">
                                    <Check className="pricing-check w-5 h-5 text-white mr-3 mt-0.5 flex-shrink-0" />
                                    <span><span className="font-semibold">Analytics Module:</span> +$20/month</span>
                                </li>
                                <li className="flex items-start">
                                    <Check className="pricing-check w-5 h-5 text-white mr-3 mt-0.5 flex-shrink-0" />
                                    <span><span className="font-semibold">Lease Module:</span> +$5/month digital lease creation, signing, and renewal tools</span>
                                </li>
                                <li className="flex items-start">
                                    <Check className="pricing-check w-5 h-5 text-white mr-3 mt-0.5 flex-shrink-0" />
                                    <span>Add extra properties for <span className="font-semibold">$2.99/property/month</span></span>
                                </li>
                            </ul>

                            <Button
                                onClick={() => {
                                    const contactSection = document.getElementById('contact');
                                    if (contactSection) {
                                        contactSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                    }
                                }}
                                className="w-full py-3 sm:py-4 md:py-6 px-4 sm:px-5 md:px-6 rounded-lg sm:rounded-xl bg-white text-primary text-sm sm:text-base md:text-lg font-semibold transition-colors duration-300 hover:bg-white/90 mt-auto"
                            >
                                Get Started
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default PricingSection;

