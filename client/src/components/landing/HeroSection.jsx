import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, X, Download, Github } from "lucide-react";

const HeroSection = () => {
    const navigate = useNavigate();
    const [showMaintenanceAlert, setShowMaintenanceAlert] = useState(false);

    const handleDownloadProposal = () => {
        const link = document.createElement('a');
        link.href = '/PropEase_Proposal.pdf';
        link.download = 'PropEase_Proposal.pdf';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <section
            id="home"
            className="min-h-screen pt-0 pb-32 md:pt-24 md:pb-40 lg:pt-24 lg:pb-48 px-4 sm:px-6 lg:px-8 relative overflow-hidden flex items-center"
        >
            <style>{`
                .download-icon-proposal {
                    width: 1.5rem;
                    height: 1.5rem;
                }
                @media (min-width: 640px) {
                    .download-icon-proposal {
                        width: 1.5rem;
                        height: 1.5rem;
                    }
                }
                @media (min-width: 768px) {
                    .download-icon-proposal {
                        width: 1.75rem;
                        height: 1.75rem;
                    }
                }
                @media (min-width: 1024px) {
                    .download-icon-proposal {
                        width: 2rem;
                        height: 2rem;
                    }
                }
                @media (min-width: 1280px) {
                    .download-icon-proposal {
                        width: 2rem;
                        height: 2rem;
                    }
                }
            `}</style>
            <div className="max-w-7xl mx-auto relative z-[3]">
                <div className="text-center">
                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 leading-relaxed bg-gradient-to-r from-primary-foreground via-primary-foreground to-primary-foreground/70 bg-clip-text text-transparent">
                        Streamline Your Rental Management
                    </h1>
                    <p className="text-base sm:text-lg md:text-xl lg:text-2xl xl:text-3xl mb-12 sm:mb-16 md:mb-20 max-w-3xl mx-auto leading-relaxed bg-gradient-to-r from-primary-foreground/90 via-primary-foreground/70 to-primary-foreground/50 bg-clip-text text-transparent">
                        Manage properties, leases, and payments all in one place.
                    </p>
                    <div className="flex flex-row gap-3 sm:gap-4 md:gap-8 justify-center items-center flex-wrap">
                        {/* <Button
                            onClick={() => setShowMaintenanceAlert(true)}
                            style={{ background: 'linear-gradient(to right, rgb(29 55 66 / 100%), rgb(29 55 66 / 85%))', boxShadow: '0 3px 0px rgba(254, 255, 248, 0.1), 0 3px 7px rgba(254, 255, 248, 0.1)' }}
                            className="text-primary-foreground hover:opacity-90 rounded-2xl sm:rounded-4xl text-base sm:text-xl md:text-2xl lg:text-3xl px-6 py-6 sm:px-8 sm:py-6 md:px-12 md:py-6 lg:px-16 lg:py-10 w-[calc(50%-6px)] sm:w-[220px] md:w-[250px] lg:w-[280px] animate-bounce-button flex items-center justify-center gap-2 sm:gap-2"
                        >
                            <span>Try the Demo </span>
                            <ArrowRight className="w-5 h-5 sm:w-5 sm:h-5 md:w-6 md:h-6 lg:w-7 lg:h-8" />
                        </Button> */}
                        <Button
                            onClick={handleDownloadProposal}
                            style={{ background: 'linear-gradient(to right, rgb(29 55 66 / 100%), rgb(29 55 66 / 85%))', boxShadow: '0 3px 0px rgba(254, 255, 248, 0.1), 0 3px 7px rgba(254, 255, 248, 0.1)' }}
                            className="text-primary-foreground hover:opacity-90 rounded-2xl sm:rounded-4xl text-base sm:text-xl md:text-2xl lg:text-3xl px-6 py-6 sm:px-8 sm:py-6 md:px-12 md:py-6 lg:px-16 lg:py-10 w-[calc(50%-6px)] sm:w-[220px] md:w-[250px] lg:w-[280px] animate-bounce-button flex items-center justify-center gap-3 sm:gap-3 md:gap-4"
                        >
                            <Download className="download-icon-proposal" />
                            <span>Proposal</span>
                        </Button>
                        <Button
                            onClick={() => window.open("https://github.com/demilade111/Rental-management", "_blank")}
                            variant="outline"
                            style={{ border: '2px solid rgba(254, 255, 248, 0.3)' }}
                            className="text-primary bg-primary-foreground/85 hover:bg-primary-foreground/55 rounded-2xl sm:rounded-4xl text-base sm:text-xl md:text-2xl lg:text-3xl px-6 py-6 sm:px-8 sm:py-6 md:px-12 md:py-6 lg:px-16 lg:py-10 w-[calc(50%-6px)] sm:w-[220px] md:w-[250px] lg:w-[280px] flex items-center justify-center gap-3 sm:gap-3 md:gap-4"
                        >
                            <Github className="download-icon-proposal" />
                            <span>GitHub</span>
                        </Button>
                    </div>
                </div>
            </div>

            {/* Maintenance Mode Alert */}
            {showMaintenanceAlert && (
                <div 
                    className="fixed inset-0 z-[100] flex items-center justify-center"
                    onClick={() => setShowMaintenanceAlert(false)}
                    style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
                >
                    <div 
                        className="bg-white/10 backdrop-blur-md rounded-xl sm:rounded-2xl p-4 sm:p-6 md:p-8 max-w-md mx-4 shadow-2xl border border-white/20 text-center"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="relative mb-3 sm:mb-4">
                            <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-primary-foreground">
                                Maintenance Mode
                            </h3>
                        </div>
                        <p className="text-sm sm:text-base md:text-lg lg:text-xl text-primary-foreground/90 mb-4 sm:mb-6">
                            App is in maintenance mode right now. Please try again later.
                        </p>
                        <Button
                            onClick={() => setShowMaintenanceAlert(false)}
                            className="w-full bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg sm:rounded-xl text-sm sm:text-base md:text-lg py-3 sm:py-4 md:py-6"
                        >
                            OK
                        </Button>
                    </div>
                </div>
            )}
        </section>
    );
};

export default HeroSection;

