import React from "react";
import { CheckCircle } from "lucide-react"; // ShadCN-compatible icon
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLocation } from "react-router-dom";

const ThankYouApplyPage = () => {
    const location = useLocation();
    const landlordEmail = location.state?.landlordEmail || null;
    
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
            <Card className="max-w-md w-full text-center py-10 px-6">
                <CardContent className="flex flex-col items-center gap-4">
                    <CheckCircle className="w-16 h-16 text-green-500" />
                    <h1 className="text-2xl font-bold">Application Submitted!</h1>
                    <p className="text-gray-700">
                        Thank you for submitting your application. The landlord will review your details and will send you a link to sign the lease agreement shortly.
                    </p>
                    {landlordEmail && (
                        <p className="text-gray-600 text-sm mt-2">
                            Landlord contact: <strong>{landlordEmail}</strong>
                        </p>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default ThankYouApplyPage;
