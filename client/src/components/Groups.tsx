"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import CreateGroup from "./CreateGroup";

interface Group {
  id: string;
  name: string;
  creator_id: string;
  created_at: string;
}

interface GroupsProps {
  token: string;
  onClose: () => void;
}

export default function Groups({ token, onClose }: GroupsProps) {
  const [groups, setGroups] = useState<Group[]>([]);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Wrap setShowCreateGroup to add debugging
  const debugSetShowCreateGroup = (value: boolean) => {
    console.log(`🔍 setShowCreateGroup called with: ${value}`);
    console.trace("Called from:");
    setShowCreateGroup(value);
  };
  useEffect(() => {
    fetchGroups();
  }, []);
  // Debug when showCreateGroup changes
  useEffect(() => {
    console.log("🔍 showCreateGroup state changed:", showCreateGroup);
    if (showCreateGroup) {
      console.log("✅ Create Group modal should be opening...");
    } else {
      console.log("❌ Create Group modal is closed/closing...");
      // Log the stack trace to see what caused it to close
      console.trace("Stack trace for showCreateGroup = false");
    }
  }, [showCreateGroup]);

  const fetchGroups = async () => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("http://localhost:3000/groups", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        throw new Error(`Error ${res.status}: ${res.statusText}`);
      }

      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error(`Expected JSON but got ${contentType}`);
      }

      const data = await res.json();
      if (data.data && Array.isArray(data.data)) {
        setGroups(data.data);
      }
    } catch (err: any) {
      console.error("Error fetching groups:", err);
      setError(err.message || "Failed to fetch groups");
    } finally {
      setLoading(false);
    }
  };
  const handleGroupCreated = () => {
    console.log("🔍 handleGroupCreated called");
    fetchGroups();
    debugSetShowCreateGroup(false);
  };
  const handleOpenChat = (group: Group) => {
    // Navigate to dedicated group page with all functionality (chat, balances, settlement)
    router.push(
      `/group?groupId=${group.id}&groupName=${encodeURIComponent(group.name)}`
    );
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40">
        <div className="bg-white rounded-lg w-full max-w-4xl mx-4 h-[80vh] flex flex-col">
          {/* Header */}
          <div className="flex justify-between items-center p-6 border-b border-gray-200">
            <h2 className="text-2xl font-bold">My Groups</h2>
            <div className="flex space-x-2">
              {" "}              <button
                onClick={() => {
                  console.log("🔍 Create Group button clicked!");
                  debugSetShowCreateGroup(true);
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
              >
                <span>Create Group</span>
              </button>
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700"
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
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {loading ? (
              <div className="flex justify-center items-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : error ? (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
                {error}
              </div>
            ) : groups.length === 0 ? (
              <div className="text-center py-12">
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No groups yet
                </h3>
                <p className="text-gray-500 mb-4">
                  Create your first group to start chatting with friends!
                </p>
                <button                  onClick={() => {
                    console.log("🔍 Create Group button clicked (bottom)!");
                    debugSetShowCreateGroup(true);
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md"
                >
                  Create Your First Group
                </button>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {groups.map((group) => (
                  <div
                    key={group.id}
                    className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md hover:border-blue-300 transition-all cursor-pointer group"
                    onClick={() => handleOpenChat(group)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-lg truncate group-hover:text-blue-600 transition-colors">
                        {group.name}
                      </h3>
                      <svg
                        className="w-4 h-4 text-gray-400 group-hover:text-blue-600 transition-colors"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                        />
                      </svg>
                    </div>
                    <p className="text-sm text-gray-500">
                      Created {formatDate(group.created_at)}
                    </p>{" "}
                    <div className="mt-3 flex justify-end">
                      <button className="text-blue-600 hover:text-blue-800 text-sm font-medium group-hover:underline transition-all">
                        Open Group →
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>{" "}
      {/* Create Group Modal */}      {showCreateGroup && (        <CreateGroup
          token={token}
          onClose={() => {
            console.log("🔍 CreateGroup onClose called");
            debugSetShowCreateGroup(false);
          }}
          onGroupCreated={handleGroupCreated}
        />
      )}
    </>
  );
}
