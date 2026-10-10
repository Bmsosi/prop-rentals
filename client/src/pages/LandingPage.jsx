import React, { useRef, useEffect, useState } from "react";
import { ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import LandingHeader from "@/components/landing/LandingHeader";
import HeroSection from "@/components/landing/HeroSection";
import FeaturesSection from "@/components/landing/FeaturesSection";
import DashboardImageSection from "@/components/landing/DashboardImageSection";
import PricingSection from "@/components/landing/PricingSection";
import ContactSection from "@/components/landing/ContactSection";
import TeamSection from "@/components/landing/TeamSection";
import LandingFooter from "@/components/landing/LandingFooter";
import LandingStyles from "@/components/landing/LandingStyles";
import { useIntersectionObserver } from "@/hooks/useIntersectionObserver";

const LandingPage = () => {
    const featuresRef = useRef(null);
    const dashboardRef = useRef(null);
    const pricingRef = useRef(null);
    const contactRef = useRef(null);
    const teamRef = useRef(null);

    const refs = [
        { ref: featuresRef, name: 'features' },
        { ref: dashboardRef, name: 'dashboard' },
        { ref: pricingRef, name: 'pricing' },
        { ref: contactRef, name: 'contact' },
        { ref: teamRef, name: 'team' }
    ];

    useIntersectionObserver(refs);
    const [showScrollTop, setShowScrollTop] = useState(false);

    // Auto-scroll to contact section if hash is present
    useEffect(() => {
        if (window.location.hash === '#contact') {
            // Small delay to ensure page is fully rendered
            setTimeout(() => {
                const contactElement = document.getElementById('contact');
                if (contactElement) {
                    contactElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            }, 100);
        }
    }, []);

    // Show/hide scroll to top button based on scroll position
    useEffect(() => {
        const handleScroll = () => {
            if (window.scrollY > 300) {
                setShowScrollTop(true);
            } else {
                setShowScrollTop(false);
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <div className="min-h-screen relative">
            {/* Background Image - Fixed positioning (works on mobile) */}
            {/* Note: background-attachment: fixed doesn't work on mobile, but fixed positioning does */}
            <div
                className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat"
                style={{
                    backgroundImage: 'url(/images/bg-banner.jpg)',
                    // Fixed attachment for desktop parallax effect
                    // On mobile, the fixed div itself keeps the background in place
                    // backgroundAttachment: 'fixed',
                    // WebkitBackgroundAttachment: 'fixed',
                    // willChange: 'transform',
                }}
            ></div>
            {/* Filter overlay - darkens and adds blur */}
            <div
                className="fixed inset-0 z-0 bg-black/75 backdrop-blur-sm"
                style={{
                    WebkitBackdropFilter: 'blur(2px)',
                }}
            ></div>
            <div className="relative z-10">
                <LandingStyles />
                <LandingHeader />
                <HeroSection />
                {/* Sections after HeroSection with gradient background - defined once here */}
                <div className="relative z-20" style={{ position: 'relative' }}>
                    {/* Gradient Background - Applied to all sections except HeroSection */}
                    <div className="absolute inset-0 bg-gradient-to-r from-card via-teal-50 to-pink-50 z-0"></div>
                    <div className="relative z-10">
                        <FeaturesSection
                            sectionRef={featuresRef}
                        />
                        <DashboardImageSection
                            sectionRef={dashboardRef}
                        />
                        <PricingSection
                            sectionRef={pricingRef}
                        />
                        <ContactSection
                            sectionRef={contactRef}
                        />
                        <TeamSection
                            sectionRef={teamRef}
                        />
                        <LandingFooter />
                    </div>
                </div>
            </div>

            {/* Scroll to Top Button */}
            {showScrollTop && (
                <Button
                    onClick={scrollToTop}
                    className="fixed bottom-8 right-8 z-50 rounded-full w-14 h-14 p-0 bg-[#497c87] text-primary-foreground hover:bg-[#497c87]/90 shadow-lg transition-all duration-300 animate-in fade-in slide-in-from-bottom-4"
                    aria-label="Scroll to top"
                >
                    <ChevronUp className="w-6 h-6" />
                </Button>
            )}
        </div>
    );
};

export default LandingPage;
