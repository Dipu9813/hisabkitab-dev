"use client";

import { useState } from "react";
import { ArrowLeft, Building, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { BusinessService } from "@/lib/businessService";
import { useBackdropClick } from "@/hooks/useBackdropClick";

interface AddBusinessModalProps {
  onClose: () => void;
  onBusinessCreated: (businessData: any) => void;
}

export default function AddBusinessModal({
  onClose,
  onBusinessCreated,
}: AddBusinessModalProps) {
  const [businessName, setBusinessName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [createdBusiness, setCreatedBusiness] = useState<any>(null);
  const handleBackdropClick = useBackdropClick(onClose);

  const handleCreateBusiness = async () => {
    if (!businessName.trim()) return;

    setIsCreating(true);

    try {
      // Call the business service to create business
      const business = await BusinessService.createBusiness(
        businessName.trim()
      );

      // Format the business data for display
      const newBusiness = {
        id: business.id,
        name: business.name,
        type: "Business", // Default display type
        balance: "रु0.00",
        cardNumber: `•••• ${Math.floor(1000 + Math.random() * 9000)}`,
        businessCode: business.businessId,
        qrCode: `business_qr_${business.id}`,
        members: 1,
        role: "Owner",
        createdAt: business.createdAt,
      };

      setCreatedBusiness(newBusiness);
      setIsCreating(false);
      setIsSuccess(true);

      // Auto-close and create business after 2 seconds
      setTimeout(() => {
        onBusinessCreated(newBusiness);
        onClose();
      }, 2000);
    } catch (error) {
      console.error("Error creating business:", error);
      setIsCreating(false);
      // You might want to show an error message to the user here
      alert(
        error instanceof Error ? error.message : "Failed to create business"
      );
    }
  };

  if (isSuccess && createdBusiness) {
    return (
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center"
        onClick={handleBackdropClick}
      >
        <div className="bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 w-full max-w-sm mx-auto rounded-t-3xl sm:rounded-3xl max-h-[90vh] overflow-y-auto relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-emerald-200/30 to-transparent rounded-full blur-2xl"></div>

          <div className="p-6 relative z-10 text-center">
            <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center animate-bounce">
              <Check className="h-10 w-10 text-white" />
            </div>

            <h2 className="text-2xl font-bold text-slate-800 mb-2">
              Business Created!
            </h2>
            <p className="text-slate-600 mb-6">
              Your business account has been successfully created
            </p>

            <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg shadow-slate-200/50 rounded-3xl mb-6">
              <CardContent className="p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-3xl flex items-center justify-center">
                    <Building className="h-8 w-8 text-white" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-bold text-slate-800 text-lg">
                      {createdBusiness.name}
                    </h3>
                    <p className="text-slate-600 text-sm">
                      {createdBusiness.type}
                    </p>
                    <p className="text-blue-600 font-bold">
                      {createdBusiness.balance}
                    </p>
                  </div>
                </div>
                <div className="bg-blue-50 rounded-2xl p-3">
                  <p className="text-blue-800 text-sm font-medium">
                    Business Code: {createdBusiness.businessCode}
                  </p>
                </div>
              </CardContent>
            </Card>

            <p className="text-slate-600 text-sm">
              Redirecting to your business account...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center"
      onClick={handleBackdropClick}
    >
      <div className="bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 w-full max-w-sm mx-auto rounded-t-3xl sm:rounded-3xl max-h-[90vh] overflow-y-auto relative">
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-emerald-200/30 to-transparent rounded-full blur-2xl"></div>

        <div className="p-6 relative z-10">
          <div className="flex items-center gap-4 mb-8">
            <Button variant="ghost" size="icon" onClick={onClose}>
              <ArrowLeft className="h-6 w-6 text-slate-800" />
            </Button>
            <h2 className="text-2xl font-bold text-slate-800">
              Create Business Account
            </h2>
          </div>

          <div className="space-y-6">
            <div>
              <Label
                htmlFor="businessName"
                className="text-slate-800 font-medium"
              >
                Business Name *
              </Label>
              <Input
                id="businessName"
                placeholder="Enter your business name"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                className="mt-2 bg-white/50 border-0 text-slate-800 placeholder:text-slate-500 rounded-2xl"
              />
            </div>

            <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-0 rounded-3xl">
              <CardContent className="p-4">
                <h4 className="text-slate-800 font-semibold mb-2">
                  What you'll get:
                </h4>
                <ul className="text-slate-600 text-sm space-y-1">
                  <li>• Dedicated business wallet</li>
                  <li>• Team member management</li>
                  <li>• Business QR code for payments</li>
                  <li>• Transaction analytics</li>
                  <li>• Expense tracking</li>
                </ul>
              </CardContent>
            </Card>

            <Button
              onClick={handleCreateBusiness}
              disabled={!businessName.trim() || isCreating}
              className="w-full bg-[#192168] text-white rounded-3xl py-4 text-lg font-semibold shadow-lg shadow-blue-200/50 transition-all duration-300 disabled:opacity-50"
            >
              {isCreating ? (
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Creating Business...
                </div>
              ) : (
                "Create Business Account"
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

