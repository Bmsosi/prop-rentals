import React from "react";

const PageHeader = ({ title, subtitle, total }) => {
    return (
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-primary mb-1">
                    {title} {total !== undefined && <span className="text-primary font-semibold text-xl sm:text-2xl md:text-[28px]">({total})</span>}
                </h1>
                {subtitle && (
                    <p className="text-xs sm:text-sm md:text-base text-primary">
                        {subtitle}
                    </p>
                )}
            </div>
        </div>
    );
};

export default PageHeader;
