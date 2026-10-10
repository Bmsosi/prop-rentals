import React from "react";

const AnalyticsCard = ({
  title,
  subtitle,
  description,
  isDark = false,
  icon = null,
}) => {
  return (
    <div
      className={`${
        isDark ? "bg-gray-800 text-white" : "bg-white"
      } border border-gray-300 rounded-lg p-6 hover:shadow-lg transition-shadow cursor-pointer flex flex-col gap-4 w-full`}
      style={{
        height: "165px",
        flexShrink: 0,
      }}
    >
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <h3
            className={`text-xl font-bold ${
              isDark ? "text-white" : "text-gray-900"
            }`}
          >
            {title}
          </h3>
          {icon && icon}
        </div>
        <p
          className={`font-semibold ${
            isDark ? "text-gray-300" : "text-gray-600"
          }`}
        >
          {subtitle}
        </p>
      </div>

      <p className={`text-sm ${isDark ? "text-gray-300" : "text-gray-600"}`}>
        {description}
      </p>
    </div>
  );
};

export default AnalyticsCard;
