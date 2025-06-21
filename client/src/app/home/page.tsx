"use client";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import HomeLoansSection from "@/components/HomeLoansSection";
import BusinessOverview from "@/components/BusinessOverview";
import VisibleNotification from "@/components/VisibleNotification";
import { jwtDecode } from "jwt-decode";

// Simple function to handle notification logic
function getNotificationCount(token: string): number {
  try {
    // In a real implementation, this would fetch and return notifications count
    return 0; // Placeholder
  } catch (e) {
    return 0;
  }
}

export default function HomePage() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>("");
  const [profilePic, setProfilePic] = useState<string | null>(null);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const profileDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Get the token from localStorage
    const storedToken = localStorage.getItem("token");
    if (!storedToken) {
      router.push("/login");
      return;
    }
    setToken(storedToken);

    // Get user name and fetch profile
    try {
      const decoded = jwtDecode<{ email: string; sub: string }>(storedToken);
      const email = decoded.email || "";
      // Default username from email
      setUserName(email.split("@")[0]);

      // Fetch user profile for better display name and profile pic
      const fetchProfile = async () => {
        try {
          const res = await fetch("http://localhost:3000/profile", {
            headers: { Authorization: `Bearer ${storedToken}` },
          });

          if (!res.ok) {
            console.log(`Profile response not ok: ${res.status}`);
            return;
          }

          // Check content type to avoid parsing HTML as JSON
          const contentType = res.headers.get("content-type");
          if (!contentType || !contentType.includes("application/json")) {
            console.error(`Expected JSON but got ${contentType}`);
            return;
          }

          const data = await res.json();

          if (data.data && data.data.full_name) {
            setUserName(data.data.full_name);
          }
          if (data.data && data.data.profile_pic) {
            setProfilePic(data.data.profile_pic);
          }
        } catch (err) {
          console.error("Error fetching user profile", err);
          // Continue with default values from email
        }
      };

      fetchProfile();
    } catch (e) {
      console.error("Error decoding token", e);
    }
  }, [router]);

  // Handle clicks outside of profile dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        profileDropdownRef.current &&
        !profileDropdownRef.current.contains(event.target as Node)
      ) {
        setShowProfileDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!token) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your dashboard...</p>
        </div>
      </main>
    );
  }

  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push("/login");
  };
  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      {/* Header with Notification */}
      <header className="bg-white shadow-md border-b border-gray-200">
        <div className="container mx-auto px-6 py-5">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-8">
              <h1 className="text-2xl font-bold text-blue-600">
                <span className="flex items-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-7 w-7 mr-2"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  LendTrack
                </span>
              </h1>{" "}
              <nav className="hidden md:flex space-x-8">
                <Link
                  href="/home"
                  className="font-medium text-gray-700 hover:text-blue-600 transition-colors duration-200 border-b-2 border-transparent hover:border-blue-600 pb-1"
                >
                  Dashboard
                </Link>
                <Link
                  href="/lend"
                  className="font-medium text-gray-700 hover:text-blue-600 transition-colors duration-200 border-b-2 border-transparent hover:border-blue-600 pb-1"
                >
                  Lend Money
                </Link>
                <Link
                  href="/loans"
                  className="font-medium text-gray-700 hover:text-blue-600 transition-colors duration-200 border-b-2 border-transparent hover:border-blue-600 pb-1"
                >
                  All Loans
                </Link>
                <Link
                  href="/business"
                  className="font-medium text-gray-700 hover:text-blue-600 transition-colors duration-200 border-b-2 border-transparent hover:border-blue-600 pb-1"
                >
                  Business
                </Link>
              </nav>
            </div>
            <div className="flex items-center space-x-6">
              {/* Visible Notification Component */}
              {token && <VisibleNotification token={token} />}

              {/* Profile Dropdown */}
              <div className="relative">
                {" "}
                <button
                  onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                  className="flex items-center space-x-2 bg-gray-100 hover:bg-gray-200 transition-all duration-200 px-2 py-1.5 rounded-lg hover:shadow-sm border border-transparent hover:border-gray-200 focus:outline-none"
                >
                  {profilePic ? (
                    <img
                      src={profilePic}
                      alt={userName}
                      className="w-6 h-6 rounded-full object-cover border border-white shadow-sm"
                    />
                  ) : (
                    <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-full flex items-center justify-center shadow-sm">
                      <span className="text-xs font-semibold">
                        {userName.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}{" "}
                  <div className="flex flex-col text-left">
                    <span className="text-xs font-medium text-gray-900">
                      {userName}
                    </span>
                    <span className="text-[10px] text-gray-500">
                      My Account
                    </span>
                  </div>{" "}
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className={`h-3 w-3 text-gray-500 transition-transform duration-200 ${
                      showProfileDropdown ? "transform rotate-180" : ""
                    }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>
                {showProfileDropdown && (
                  <div
                    ref={profileDropdownRef}
                    className="absolute right-0 w-48 bg-white shadow-xl rounded-lg overflow-hidden z-50 mt-2 border border-gray-100"
                  >
                    <div className="py-2 border-b border-gray-100">
                      <p className="px-4 py-1 text-xs font-medium text-gray-500">
                        ACCOUNT
                      </p>
                    </div>
                    <Link
                      href="/profile"
                      className="flex items-center px-4 py-3 hover:bg-blue-50 transition-colors duration-150"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 mr-3 text-gray-500"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                      </svg>
                      <span className="font-medium text-sm">My Profile</span>
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center px-4 py-3 hover:bg-red-50 transition-colors duration-150 text-left"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 mr-3 text-red-500"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                        />
                      </svg>
                      <span className="font-medium text-sm text-red-600">
                        Logout
                      </span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-10">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-2 text-center">
            Your Lending Dashboard
          </h2>
          <p className="text-gray-600 text-center max-w-2xl mx-auto">
            Track your loans, manage payments, and monitor upcoming deadlines
            all in one place.
          </p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              {token && <HomeLoansSection token={token} />}
            </div>
          </div>
          <div className="lg:col-span-1">
            {token && <BusinessOverview token={token} />}
          </div>
        </div>
      </div>
    </main>
  );
}
