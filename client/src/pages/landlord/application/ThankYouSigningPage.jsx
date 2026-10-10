import React from "react";
import { CheckCircle } from "lucide-react"; // ShadCN-compatible icon
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const ThankYouSigningPage = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
            <Card className="max-w-md w-full text-center py-10 px-6">
                <CardContent className="flex flex-col items-center gap-4">
                    <CheckCircle className="w-16 h-16 text-green-500" />
                    <h1 className="text-2xl font-bold">Lease Signed!</h1>
                    <p className="text-gray-700">
                        Thank you for signing your lease. Everything is complete and your lease agreement is now confirmed.
                    </p>
                    <Button
                        className="mt-4 rounded-2xl"
                        onClick={() => navigate("/tenant/dashboard")}
                    >
                        Go to Dashboard
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
};

export default ThankYouSigningPage;
