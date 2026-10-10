import React from "react";
import { HelpCircle } from "lucide-react";
import AnalyticsCard from "./AnalyticsCard";

const MetricsCardsGrid = () => {
  const metricsCards = [
    {
      title: "Financial Metrics",
      subtitle: "Per Property",
      description: "These help you track income, costs, and performance",
    },
    {
      title: "Tenancy Metrics",
      subtitle: "Per Property",
      description:
        "Monitor occupancy, tenant turnover, and lease duration at a glance.",
    },
    {
      title: "Cost Trends",
      subtitle: "Per Property",
      description:
        "Track maintenance, utility, and renovation costs over time.",
    },
    {
      title: "Market Metrics",
      subtitle: "Local",
      description:
        "Compare local rent prices, vacancy rates, and demand trends.",
    },
    {
      title: "ROI Insights",
      subtitle: "Per Property",
      description:
        "Track your return on investment to measure long-term profitability and growth potential.",
      icon: <HelpCircle className="w-4 h-4 text-gray-400" />,
    },
    {
      title: "Expense Forecast",
      subtitle: "Per Property",
      description:
        "Predict upcoming maintenance and utility costs based on past spending patterns.",
    },
    {
      title: "Calculator",
      subtitle: "Per Property",
      description:
        "Track maintenance, utility, and renovation costs over time.",
    },
    {
      title: "Learn More",
      subtitle: "For Beginners",
      description:
        "Understand key rental analytics, how to interpret them, and what they reveal about your property.",
      isDark: true,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {metricsCards.map((card, index) => (
        <AnalyticsCard
          key={index}
          title={card.title}
          subtitle={card.subtitle}
          description={card.description}
          isDark={card.isDark}
          icon={card.icon}
        />
      ))}
    </div>
  );
};

export default MetricsCardsGrid;
