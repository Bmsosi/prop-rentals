import React from "react";

const DashboardImageSection = ({ sectionRef }) => {
    return (
        <section className="pt-8 py-16 sm:pt-16 sm:py-32 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
            <div className="max-w-7xl mx-auto flex justify-center relative z-10" ref={sectionRef}>
                <img
                    src="/images/dashboard-frame.png"
                    alt="Dashboard Preview"
                    className="w-full max-w-5xl"
                />
            </div>
        </section>
    );
};

export default DashboardImageSection;

