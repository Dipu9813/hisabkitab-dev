"use client";
import { useState, useEffect } from "react";
import BusinessList from "./BusinessList";
import CreateBusiness from "./CreateBusiness";
import JoinBusiness from "./JoinBusiness";
import CustomerLoansManager from "./CustomerLoansManager";
import BusinessMemberManager from "./BusinessMemberManager";
import BusinessLoanVerificationManager from "./BusinessLoanVerificationManager";

interface Business {
  id: string;
  name: string;
  businessId: string;
  createdBy: string;
  createdAt: string;
  joinedAt: string;
  isOwner: boolean;
}

interface BusinessDashboardProps {
  token: string;
}

export default function BusinessDashboard({ token }: BusinessDashboardProps) {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(
    null
  );  const [activeTab, setActiveTab] = useState<"dashboard" | "members" | "verification" | "create" | "join">(
    "dashboard"
  );const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentUserId, setCurrentUserId] = useState<string>("");
  useEffect(() => {
    fetchBusinesses();
    
    // Decode user ID from token
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      setCurrentUserId(payload.sub || "");
    } catch (error) {
      console.error("Error decoding token:", error);
    }
  }, [token]);

  const fetchBusinesses = async () => {
    try {
      setLoading(true);
      const res = await fetch("http://localhost:3000/business/my-businesses", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        throw new Error(`Error ${res.status}: ${res.statusText}`);
      }

      const data = await res.json();
      setBusinesses(data.data || []);

      // Auto-select first business if available
      if (data.data && data.data.length > 0 && !selectedBusiness) {
        setSelectedBusiness(data.data[0]);
      }
    } catch (err: any) {
      console.error("Error fetching businesses:", err);
      setError(err.message || "Failed to fetch businesses");
    } finally {
      setLoading(false);
    }
  };

  const handleBusinessCreated = () => {
    fetchBusinesses();
    setActiveTab("dashboard");
  };

  const handleBusinessJoined = () => {
    fetchBusinesses();
    setActiveTab("dashboard");
  };

  const handleBusinessSelect = (business: Business) => {
    setSelectedBusiness(business);
    setActiveTab("dashboard");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading businesses...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-gray-900">
                Business Dashboard
              </h1>
              {selectedBusiness && (
                <div className="flex items-center space-x-2">
                  <span className="text-gray-500">•</span>
                  <span className="font-medium text-blue-600">
                    {selectedBusiness.name}
                  </span>
                  <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                    ID: {selectedBusiness.businessId}
                  </span>
                </div>
              )}
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setActiveTab("create")}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Create Business
              </button>
              <button
                onClick={() => setActiveTab("join")}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Join Business
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">            <button
              onClick={() => setActiveTab("dashboard")}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "dashboard"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Dashboard
            </button>            <button
              onClick={() => setActiveTab("members")}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "members"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Members
            </button>
            <button
              onClick={() => setActiveTab("verification")}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "verification"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Loan Verification
            </button>
            <button
              onClick={() => setActiveTab("create")}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "create"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Create Business
            </button>
            <button
              onClick={() => setActiveTab("join")}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "join"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Join Business
            </button>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {activeTab === "dashboard" && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Business List Sidebar */}
            <div className="lg:col-span-1">
              <BusinessList
                businesses={businesses}
                selectedBusiness={selectedBusiness}
                onBusinessSelect={handleBusinessSelect}
                onRefresh={fetchBusinesses}
              />
            </div>

            {/* Main Content Area */}
            <div className="lg:col-span-3">
              {selectedBusiness ? (
                <CustomerLoansManager
                  business={selectedBusiness}
                  token={token}
                />
              ) : (
                <div className="bg-white rounded-lg shadow p-8 text-center">
                  <div className="text-gray-500">
                    <svg
                      className="mx-auto h-16 w-16 mb-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1}
                        d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-2m-2 0H7m5 0V9"
                      />
                    </svg>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No Business Selected
                    </h3>
                    <p className="text-gray-500 mb-4">
                      {businesses.length === 0
                        ? "Create or join a business to get started with customer loan management."
                        : "Select a business from the sidebar to manage customer loans."}
                    </p>
                    {businesses.length === 0 && (
                      <div className="space-x-3">
                        <button
                          onClick={() => setActiveTab("create")}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                        >
                          Create Business
                        </button>
                        <button
                          onClick={() => setActiveTab("join")}
                          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                        >
                          Join Business
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "create" && (
          <div className="max-w-md mx-auto">
            <CreateBusiness
              token={token}
              onBusinessCreated={handleBusinessCreated}
              onCancel={() => setActiveTab("dashboard")}
            />
          </div>
        )}        {activeTab === "join" && (
          <div className="max-w-md mx-auto">
            <JoinBusiness
              token={token}
              onBusinessJoined={handleBusinessJoined}
              onCancel={() => setActiveTab("dashboard")}
            />
          </div>
        )}

        {activeTab === "members" && (
          <div className="max-w-4xl mx-auto">
            {selectedBusiness ? (              <BusinessMemberManager
                businessId={selectedBusiness.id}
                token={token}
                currentUserId={currentUserId}
                onClose={() => setActiveTab("dashboard")}
              />
            ) : (
              <div className="bg-white rounded-lg shadow p-8 text-center">
                <div className="text-gray-500">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No Business Selected
                  </h3>
                  <p className="text-gray-500 mb-4">
                    Please select a business to manage its members.
                  </p>
                  <button
                    onClick={() => setActiveTab("dashboard")}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                  >
                    Go to Dashboard
                  </button>
                </div>
              </div>
            )}
          </div>        )}

        {activeTab === "verification" && (
          <div className="max-w-6xl mx-auto">
            <BusinessLoanVerificationManager token={token} />
          </div>
        )}
      </div>
    </div>
  );
}
