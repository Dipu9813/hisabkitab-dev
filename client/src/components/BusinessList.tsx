"use client";
import { useState } from "react";

interface Business {
  id: string;
  name: string;
  businessId: string;
  createdBy: string;
  createdAt: string;
  joinedAt: string;
  isOwner: boolean;
}

interface BusinessListProps {
  businesses: Business[];
  selectedBusiness: Business | null;
  onBusinessSelect: (business: Business) => void;
  onRefresh: () => void;
}

export default function BusinessList({
  businesses,
  selectedBusiness,
  onBusinessSelect,
  onRefresh,
}: BusinessListProps) {
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await onRefresh();
    setRefreshing(false);
  };

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-4 border-b">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-medium text-gray-900">My Businesses</h2>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
          >
            <svg
              className={`h-5 w-5 ${refreshing ? "animate-spin" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </button>
        </div>
      </div>

      <div className="divide-y divide-gray-200">
        {businesses.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            <svg
              className="mx-auto h-12 w-12 text-gray-400 mb-2"
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
            <p className="text-sm">No businesses yet</p>
            <p className="text-xs text-gray-400 mt-1">
              Create or join a business to get started
            </p>
          </div>
        ) : (
          businesses.map((business) => (
            <div
              key={business.id}
              className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                selectedBusiness?.id === business.id
                  ? "bg-blue-50 border-r-2 border-blue-500"
                  : ""
              }`}
              onClick={() => onBusinessSelect(business)}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <h3 className="text-sm font-medium text-gray-900 truncate">
                      {business.name}
                    </h3>
                    {business.isOwner && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                        Owner
                      </span>
                    )}
                  </div>
                  <div className="mt-1 flex items-center space-x-2">
                    <span className="text-xs text-gray-500">
                      ID: {business.businessId}
                    </span>
                    <span className="text-xs text-gray-400">•</span>
                    <span className="text-xs text-gray-500">
                      Joined {new Date(business.joinedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <div className="flex items-center">
                  {selectedBusiness?.id === business.id && (
                    <svg
                      className="h-5 w-5 text-blue-500"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {businesses.length > 0 && (
        <div className="p-3 bg-gray-50 text-xs text-gray-500 text-center">
          {businesses.length} business{businesses.length !== 1 ? "es" : ""}
        </div>
      )}
    </div>
  );
}
