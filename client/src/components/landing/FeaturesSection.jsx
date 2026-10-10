import React from "react";
import { Button } from "@/components/ui/button";
import { FileText, Wrench, Calculator, ArrowRight } from "lucide-react";

const FeaturesSection = ({ sectionRef }) => {

    return (
        <section id="features" className="py-16 sm:py-32 px-4 sm:px-6 lg:px-8 scroll-mt-16 relative overflow-hidden">
            <div className="max-w-7xl mx-auto relative z-10">
                <div className="text-center mb-6 sm:mb-12 md:mb-16" ref={sectionRef}>
                    <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-primary mb-4 sm:mb-6 md:mb-8 leading-relaxed">
                        Powerful Modules
                    </h2>
                    <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-gray-500 max-w-2xl mx-auto leading-relaxed">
                        Everything you need to manage your rental properties efficiently
                    </p>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                    {/* Leases Module */}
                    <div className="group relative cursor-pointer overflow-hidden bg-white rounded-4xl p-8 pb-4 shadow-lg ring-1 ring-gray-900/5 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl">
                        <span className="absolute top-8 z-0 h-20 w-20 rounded-full bg-primary transition-all duration-300 group-hover:scale-[20]"></span>
                        <span className="absolute bottom-0 right-0 w-32 h-32 bg-primary/10 rounded-tl-full opacity-50"></span>
                        <div className="relative z-10">
                            <div className="grid h-20 w-20 rounded-full place-items-center transition-all duration-300 group-hover:bg-white mb-6">
                                <FileText className="w-8 h-8 text-primary-foreground transition-all group-hover:text-primary" />
                            </div>
                            <h3 className="text-2xl font-bold text-primary mb-4 leading-relaxed transition-all duration-300 group-hover:text-primary-foreground">Leases</h3>
                            <p className="text-xl text-gray-500 mb-4 leading-relaxed transition-all duration-300 group-hover:text-primary-foreground/90">
                                Create and manage standard and custom lease agreements with ease.
                            </p>
                        </div>
                    </div>

                    {/* Maintenance Module */}
                    <div className="group relative cursor-pointer overflow-hidden bg-white rounded-4xl p-8 pb-4 shadow-lg ring-1 ring-gray-900/5 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl">
                        <span className="absolute top-8 z-0 h-20 w-20 rounded-full bg-primary transition-all duration-300 group-hover:scale-[20]"></span>
                        <span className="absolute bottom-0 right-0 w-32 h-32 bg-primary/10 rounded-tl-full opacity-50"></span>
                        <div className="relative z-10">
                            <div className="grid h-20 w-20 rounded-full place-items-center transition-all duration-300 group-hover:bg-white mb-6">
                                <Wrench className="w-8 h-8 text-primary-foreground transition-all group-hover:text-primary" />
                            </div>
                            <h3 className="text-2xl font-bold text-primary mb-4 leading-relaxed transition-all duration-300 group-hover:text-primary-foreground">Maintenance</h3>
                            <p className="text-xl text-gray-500 mb-4 leading-relaxed transition-all duration-300 group-hover:text-primary-foreground/90">
                                Track and manage maintenance requests efficiently.
                            </p>
                        </div>
                    </div>

                    {/* Accounting Module */}
                    <div className="group relative cursor-pointer overflow-hidden bg-white rounded-4xl p-8 pb-4 shadow-lg ring-1 ring-gray-900/5 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl">
                        <span className="absolute top-8 z-0 h-20 w-20 rounded-full bg-primary transition-all duration-300 group-hover:scale-[20]"></span>
                        <span className="absolute bottom-0 right-0 w-32 h-32 bg-primary/10 rounded-tl-full opacity-50"></span>
                        <div className="relative z-10">
                            <div className="grid h-20 w-20 rounded-full place-items-center transition-all duration-300 group-hover:bg-white mb-6">
                                <Calculator className="w-8 h-8 text-primary-foreground transition-all group-hover:text-primary" />
                            </div>
                            <h3 className="text-2xl font-bold text-primary mb-4 leading-relaxed transition-all duration-300 group-hover:text-primary-foreground">Accounting</h3>
                            <p className="text-xl text-gray-500 mb-4 leading-relaxed transition-all duration-300 group-hover:text-primary-foreground/90">
                                Manage financial transactions, auto generate invoices and payments.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Secondary Button */}
                <div className="flex justify-center mt-6 sm:mt-12 md:mt-16">
                    <Button
                        onClick={() => {
                            const contactSection = document.getElementById('contact');
                            if (contactSection) {
                                contactSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                            }
                        }}
                        style={{ border: '1px solid #53848F', boxShadow: '0 3px 0px rgba(254, 255, 248, 0.1), 0 3px 7px rgba(254, 255, 248, 0.1)' }}
                        className="text-primary bg-primary-foreground hover:opacity-90 hover:text-primary-foreground rounded-2xl sm:rounded-4xl text-base sm:text-xl md:text-2xl lg:text-3xl px-6 py-6 sm:px-8 sm:py-6 md:px-12 md:py-6 lg:px-16 lg:py-10 min-w-[200px] sm:min-w-[220px] md:min-w-[250px] flex items-center justify-center gap-2 sm:gap-2"
                    >
                        <span>Get Started</span>
                        <ArrowRight className="w-5 h-5 sm:w-5 sm:h-5 md:w-6 md:h-6 lg:w-7 lg:h-8" />
                    </Button>
                </div>
            </div>
        </section>
    );
};

export default FeaturesSection;

