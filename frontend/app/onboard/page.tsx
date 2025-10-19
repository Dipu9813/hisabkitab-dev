"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ProfileForm from "@/components/ProfileForm";

const PRIMARY_COLOR = "#3a0ca3";
const TEXT_COLOR = "#3a0ca3";

export default function ProfilePage() {
  const [token, setToken] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    // Try to get token from localStorage
    const t = localStorage.getItem("token");
    if (!t) {
      router.replace("/login");
    } else {
      setToken(t);
    }
  }, [router]);

  if (!token) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </main>
    );
  }
  
  return (
    <div className={`min-h-screen flex flex-col bg-[${PRIMARY_COLOR}]`}>
      <div
        className="w-full min-h-[90vh] flex flex-col items-center justify-start relative"
        style={{ background: PRIMARY_COLOR }}
      >
        <img
          src="/bara/happy_bara.png"
          alt="Happy Bara"
          className="object-contain mt-8 mb-4 drop-shadow-lg z-10"
          style={{ width: "220px", height: "220px", position: "absolute", right: "20px", top: "60px", zIndex: 100 }}
        />
        <div
          className="bg-white w-full rounded-t-3xl p-8 max-w-none fixed bottom-0 left-0 right-0 z-20"
          style={{ minHeight: "70vh" }}
        >
          <div className="text-left mb-6">
            <h1 className="text-3xl font-semibold text-gray-900">Complete Your Profile</h1>
            <h3 className="text-lg font-bold" style={{ color: "#3a0ca3" }}>
              Just a few more details to personalize your experience.
            </h3>
          </div>
          <div className="space-y-5">
            <ProfileForm token={token} />
          </div>
        </div>
      </div>
    </div>
  );
}
