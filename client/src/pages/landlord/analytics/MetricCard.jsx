import React from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";

const MetricCard = ({
  title,
  subtitle,
  description,
  isDark = false,
  icon = null,
}) => {
  return (
    <Card
      className={`${
        isDark
          ? "bg-gray-800 text-white border-gray-800"
          : "bg-white border-gray-300"
      } hover:shadow-lg transition-shadow cursor-pointer`}
    >
      <CardHeader>
        <CardTitle
          className={`text-xl font-bold flex items-center gap-2 ${
            isDark ? "text-white" : ""
          }`}
        >
          {title}
          {icon && icon}
        </CardTitle>
        <CardDescription
          className={`font-semibold ${
            isDark ? "text-gray-300" : "text-gray-600"
          }`}
        >
          {subtitle}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className={`text-sm ${isDark ? "text-gray-300" : "text-gray-600"}`}>
          {description}
        </p>
      </CardContent>
    </Card>
  );
};

export default MetricCard;
