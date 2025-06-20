"use client";
import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { jwtDecode } from "jwt-decode";
import GroupChatInterface from "@/components/GroupChatInterface";
import BalancesSummary from "@/components/BalancesSummary";
import SettlementPhase from "@/components/SettlementPhase";
import SettlementInitiator from "@/components/SettlementInitiator";

interface Group {
  id: string;
  name: string;
  creator_id: string;
  created_at: string;
  phase?: "active" | "settlement";
}

function GroupPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [token, setToken] = useState<string | null>(null);
  const [group, setGroup] = useState<Group | null>(null);
  const [activeTab, setActiveTab] = useState<
    "chat" | "balances" | "settlement"
  >("chat");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentUserId, setCurrentUserId] = useState<string>("");

  const groupId = searchParams.get("groupId");
  const groupName = searchParams.get("groupName");
  useEffect(() => {
    console.log("🚀 Group page useEffect triggered");
    console.log("📋 URL params:", { groupId, groupName });

    // Get the token from localStorage
    const storedToken = localStorage.getItem("token");
    if (!storedToken) {
      console.log("❌ No token found, redirecting to login");
      router.push("/login");
      return;
    }
    console.log("✅ Token found");
    setToken(storedToken);

    // Get current user ID from token
    try {
      const decoded = jwtDecode<{ sub: string }>(storedToken);
      console.log("✅ Token decoded, user ID:", decoded.sub);
      setCurrentUserId(decoded.sub);
    } catch (e) {
      console.error("Error decoding token", e);
      router.push("/login");
      return;
    } // If we have group name in URL params, use it temporarily
    if (groupId && groupName) {
      console.log("📝 Setting temporary group data");
      setGroup({
        id: groupId,
        name: decodeURIComponent(groupName),
        creator_id: "",
        created_at: "",
        phase: "active", // Default to active, will be updated when we fetch full group details
      });
      // Don't set loading to false here - let fetchGroupDetails handle it
    }
  }, [router, groupId, groupName]);
  // Separate useEffect for fetching group details after token is set
  useEffect(() => {
    if (!token || !groupId) {
      console.log("⏳ Waiting for token and groupId...", {
        token: !!token,
        groupId,
      });
      return;
    }

    const fetchGroupDetails = async () => {
      if (!groupId || !token) {
        console.log("❌ Missing required data:", { groupId, token: !!token });
        setLoading(false);
        return;
      }
      try {
        // First, test if the server is reachable
        console.log("🔍 Testing server connectivity...");
        const healthResponse = await fetch(`http://localhost:3000/protected`, {
          headers: {
            "Content-Type": "application/json",
          },
        });
        console.log("🏥 Health check response:", healthResponse.status);

        console.log("🔍 Fetching group details for:", groupId);
        console.log("🔍 Using token:", token.substring(0, 20) + "...");

        const response = await fetch(
          `http://localhost:3000/groups/${groupId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        console.log("📡 Response status:", response.status);
        console.log(
          "📡 Response headers:",
          Object.fromEntries(response.headers.entries())
        );

        if (!response.ok) {
          const errorText = await response.text();
          console.error(
            "❌ Failed to fetch group details:",
            response.status,
            response.statusText
          );
          console.error("❌ Error response body:", errorText);
          throw new Error(
            `Failed to fetch group details: ${response.status} ${errorText}`
          );
        }

        const data = await response.json();
        console.log("✅ Group details fetched:", data);
        console.log("🔍 Group phase:", data.group?.phase);
        console.log("🔍 Group creator:", data.group?.creator_id);
        console.log("🔍 Current user:", currentUserId);
        console.log("🔍 Is creator?", data.group?.creator_id === currentUserId);
        setGroup((prev) => ({
          ...prev,
          ...data.group,
        }));
        setLoading(false);
      } catch (err) {
        console.error("Error fetching group details:", err);
        const errorMessage =
          err instanceof Error ? err.message : "Unknown error";
        setError(`Failed to load group details: ${errorMessage}`);
        setLoading(false);
      }
    };

    console.log("🔄 About to call fetchGroupDetails");
    fetchGroupDetails();
  }, [token, groupId, currentUserId]); // This will run when token, groupId, or currentUserId changes
  const handleSettlementInitiated = async () => {
    // Refresh group data to get updated phase
    if (!token || !groupId) return;

    try {
      console.log("🔄 Refreshing group data after settlement...");
      const response = await fetch(`http://localhost:3000/groups/${groupId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log("✅ Group data refreshed after settlement:", data);
        console.log("🔍 New group phase:", data.group?.phase);
        setGroup((prev) => ({
          ...prev,
          ...data.group,
        }));
        // Switch to balances tab to show settlement view
        setActiveTab("balances");
      } else {
        console.error("❌ Failed to refresh group data:", response.status);
      }
    } catch (err) {
      console.error("❌ Error refreshing group data:", err);
    }
  };

  if (!groupId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Group not found</p>
          <button
            onClick={() => router.push("/home")}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading group...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>{" "}
          <button
            onClick={() => {
              setError("");
              setLoading(true);
              // Force re-render to trigger useEffect
              setToken(localStorage.getItem("token"));
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 mr-2"
          >
            Retry
          </button>
          <button
            onClick={() => router.push("/home")}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  if (!token || !group) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push("/home")}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  {group.name}
                </h1>
                <p className="text-sm text-gray-500">Group Details</p>
              </div>
            </div>
          </div>
        </div>
      </header>{" "}
      {/* Tab Navigation */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-6">
          <div className="flex space-x-8">
            <button
              onClick={() => setActiveTab("chat")}
              className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                activeTab === "chat"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <div className="flex items-center space-x-2">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
                <span>Chat</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab("balances")}
              className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                activeTab === "balances"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <div className="flex items-center space-x-2">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span>
                  {group?.phase === "settlement" ? "Settlement" : "Balances"}
                </span>
              </div>
            </button>{" "}
            {group?.phase === "active" &&
              group?.creator_id === currentUserId && (
                <button
                  onClick={() => setActiveTab("settlement")}
                  className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === "settlement"
                      ? "border-orange-500 text-orange-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <span>Initiate Settlement</span>
                  </div>
                </button>
              )}
            {/* Debug info - remove this after testing */}
            <div className="text-xs text-gray-400 ml-4">
              Phase: {group?.phase || "undefined"} | Creator:{" "}
              {group?.creator_id === currentUserId ? "Yes" : "No"}
            </div>
          </div>
        </div>
      </div>{" "}
      {/* Content */}
      <div className="container mx-auto px-6 py-6">
        {" "}
        {activeTab === "chat" && (
          <div className="bg-white rounded-lg shadow-sm">
            <GroupChatInterface
              token={token}
              groupId={groupId}
              groupName={group.name}
              groupPhase={group.phase}
            />
          </div>
        )}
        {activeTab === "balances" && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            {group?.phase === "settlement" ? (
              <SettlementPhase
                token={token}
                groupId={groupId}
                currentUserId={currentUserId}
                onBack={() => setActiveTab("chat")}
              />
            ) : (
              <BalancesSummary
                token={token}
                groupId={groupId}
                currentUserId={currentUserId}
              />
            )}
          </div>
        )}
        {activeTab === "settlement" && group?.phase === "active" && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <SettlementInitiator
              token={token}
              groupId={groupId}
              isCreator={group?.creator_id === currentUserId}
              onSettlementInitiated={handleSettlementInitiated}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default function GroupPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        </div>
      }
    >
      <GroupPageContent />
    </Suspense>
  );
}
