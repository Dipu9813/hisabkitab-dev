"use client";

import { useState, useEffect, useRef } from "react";
import { X, Edit, Copy, Check, Phone, Mail, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PushNotificationManager } from "./push-notification-service";

interface ProfileModalProps {
  onClose: () => void;
}

export default function ProfileModal({ onClose }: ProfileModalProps) {
  const [copied, setCopied] = useState(false);
  const [qrCodePicUrl, setQrCodePicUrl] = useState("");
  const modalRef = useRef<HTMLDivElement>(null);

  // Get user info from localStorage
  let userName = "";
  let userEmail = "";
  let userPhone = "";
  if (typeof window !== "undefined") {
    userName = localStorage.getItem("userName") || "User";
    userEmail = localStorage.getItem("userEmail") || "";
    userPhone = localStorage.getItem("userPhone") || "";
  }

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // Close on backdrop click
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  // Fetch QR code from profile
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token =
          typeof window !== "undefined" ? localStorage.getItem("token") : null;
        if (!token) return;
        const res = await fetch("http://localhost:3000/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return;
        const { data } = await res.json();
        if (data && data.qr_code_pic) setQrCodePicUrl(data.qr_code_pic);
      } catch (err) {
        // Optionally handle error
      }
    };
    fetchProfile();
  }, []);

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      style={{ pointerEvents: "auto", zIndex: 99999 }}
      onClick={handleBackdropClick}
    >
      <div
        ref={modalRef}
        className="w-full max-w-sm mx-auto rounded-3xl max-h-[90vh] overflow-y-auto relative"
        style={{ backgroundColor: "#eaf6ff" }}
      >
        {/* Decorative Background */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-emerald-200/30 to-transparent rounded-full blur-2xl"></div>

        <div className="p-6 relative z-10">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold text-slate-800">Profile</h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="rounded-2xl hover:bg-white/30"
            >
              <X className="h-6 w-6 text-slate-600" />
            </Button>
          </div>

          {/* Profile Info */}
          <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg shadow-slate-200/50 rounded-3xl mb-6">
            <CardContent className="p-6">
              <div className="flex items-center gap-5 mb-8">
                <div className="relative">
                  <Avatar className="h-24 w-24 ring-4 ring-[#7bc6ff] shadow-xl transition-transform duration-200 hover:scale-105">
                    <AvatarImage
                      src={
                        typeof window !== "undefined"
                          ? localStorage.getItem("userAvatar") ||
                            "/placeholder.svg"
                          : "/placeholder.svg"
                      }
                      className="object-cover"
                    />
                    <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white text-3xl font-bold">
                      {typeof window !== "undefined"
                        ? (localStorage.getItem("userName") || "U").charAt(0)
                        : "U"}
                    </AvatarFallback>
                  </Avatar>
                  <span className="absolute bottom-1 right-1 bg-white rounded-full p-1 shadow-md"></span>
                </div>
                <div className="flex-1">
                  <h3 className="text-slate-800 font-extrabold text-2xl mb-1 tracking-tight">
                    {userName}
                  </h3>
                  <Button
                    variant="outline"
                    size="sm"
                    className="bg-[#eaf6ff] border border-[#7bc6ff] text-[#2196f3] hover:bg-[#d0eaff] rounded-xl px-4 py-1 font-medium transition shadow-[0_2px_8px_#7bc6ff33]"
                    onClick={() => (window.location.href = "/onboard")}
                  >
                    Edit Profile
                  </Button>
                </div>
              </div>

              {/* Contact Details */}
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-2xl flex items-center justify-center">
                    <Phone className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-slate-800 font-medium truncate max-w-xs">
                      {userPhone}
                    </p>
                    <p className="text-slate-600 text-sm">Phone Number</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-2xl flex items-center justify-center">
                    <Mail className="h-5 w-5 text-green-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-slate-800 font-medium truncate max-w-xs">
                      {userEmail}
                    </p>
                    <p className="text-slate-600 text-sm">Email Address</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Esewa Details */}
          <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg shadow-slate-200/50 rounded-3xl mb-6">
            <CardContent className="p-6">
              <h4 className="text-slate-800 font-bold text-lg mb-4">
                Payment Details
              </h4>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-800 font-medium">{userPhone}</p>
                  <p className="text-slate-600 text-sm">ESEWA ID</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(userPhone);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    } catch (err) {
                      console.error("Failed to copy ESEWA ID:", err);
                    }
                  }}
                  className="rounded-2xl hover:bg-emerald-100"
                >
                  {copied ? (
                    <Check className="h-5 w-5 text-emerald-600" />
                  ) : (
                    <Copy className="h-5 w-5 text-slate-600" />
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Personal QR Code */}
          <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg shadow-slate-200/50 rounded-3xl">
            <CardContent className="p-6 text-center">
              <h4 className="text-slate-800 font-bold text-lg mb-4">
                Your Esewa QR Code
              </h4>
              <div className="flex items-center justify-center mb-4">
                <div
                  className="bg-white rounded-2xl shadow-inner flex items-center justify-center"
                  style={{ width: 320, height: 320 }}
                >
                  {qrCodePicUrl ? (
                    <img
                      src={qrCodePicUrl}
                      alt="Personal QR Code"
                      className="object-contain rounded-lg w-full h-full"
                      style={{ maxWidth: "100%", maxHeight: "100%" }}
                    />
                  ) : (
                    <img
                      src="/placeholder.svg?height=320&width=320&text=Personal+QR"
                      alt="Personal QR Code"
                      className="object-contain rounded-lg w-full h-full"
                      style={{ maxWidth: "100%", maxHeight: "100%" }}
                    />
                  )}
                </div>
              </div>{" "}
              <p className="text-slate-600 text-sm">
                Share this QR code to receive payments
              </p>
            </CardContent>
          </Card>

          {/* Push Notifications Settings */}
          <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg shadow-slate-200/50 rounded-3xl mb-6">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-slate-800">
                  Loan Reminders
                </h3>
              </div>
              <p className="text-slate-600 text-sm mb-4">
                Get notified about upcoming loan due dates and overdue payments
              </p>
              <PushNotificationManager />
            </CardContent>
          </Card>
        </div>
        {/* Sign Out Button */}
        <div className="p-6 pt-0">
          <Button
            className="w-full bg-red-400 hover:bg-red-500 text-white font-bold py-3 rounded-2xl shadow-md transition-all duration-200"
            onClick={() => {
              localStorage.clear();
              window.location.href = "/login";
            }}
          >
            Sign Out
          </Button>
        </div>
      </div>
    </div>
  );
}
