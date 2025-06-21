"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

interface Business {
  id: string;
  name: string;
  businessId: string;
  createdBy: string;
  createdAt: string;
  joinedAt: string;
  isOwner: boolean;
}

interface BusinessOverviewProps {
  token: string;
}

export default function BusinessOverview({ token }: BusinessOverviewProps) {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchBusinesses();
  }, []);

  const fetchBusinesses = async () => {
    try {
      const res = await fetch("http://localhost:3000/business/my-businesses", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        throw new Error(`Error ${res.status}: ${res.statusText}`);
      }

      const data = await res.json();
      setBusinesses(data.data || []);
    } catch (err: any) {
      console.error("Error fetching businesses:", err);
      setError(err.message || "Failed to fetch businesses");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center space-x-3 mb-4">
          <svg
            className="h-6 w-6 text-blue-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-2m-2 0H7m5 0V9"
            />
          </svg>
          <h3 className="text-lg font-semibold text-gray-900">
            Business Accounts
          </h3>
        </div>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-3"></div>
          <span className="text-gray-600">Loading businesses...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center space-x-3 mb-4">
          <svg
            className="h-6 w-6 text-blue-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-2m-2 0H7m5 0V9"
            />
          </svg>
          <h3 className="text-lg font-semibold text-gray-900">
            Business Accounts
          </h3>
        </div>
        <div className="text-center py-4">
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <svg
            className="h-6 w-6 text-blue-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-2m-2 0H7m5 0V9"
            />
          </svg>
          <h3 className="text-lg font-semibold text-gray-900">
            Business Accounts
          </h3>
        </div>
        <Link
          href="/business"
          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
        >
          View All →
        </Link>
      </div>

      {businesses.length === 0 ? (
        <div className="text-center py-8">
          <svg
            className="mx-auto h-12 w-12 text-gray-400 mb-4"
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
          <h4 className="text-gray-900 font-medium mb-2">
            No Business Accounts
          </h4>
          <p className="text-gray-600 text-sm mb-4">
            Create or join a business to manage customer loans together with
            your team.
          </p>
          <div className="space-x-3">
            <Link
              href="/business"
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
            >
              Get Started
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {businesses.slice(0, 3).map((business) => (
            <div
              key={business.id}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <span className="text-blue-600 font-medium text-sm">
                    {business.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">{business.name}</h4>
                  <div className="flex items-center space-x-2 text-xs text-gray-500">
                    <span>ID: {business.businessId}</span>
                    {business.isOwner && (
                      <>
                        <span>•</span>
                        <span className="text-blue-600 font-medium">Owner</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <Link
                href="/business"
                className="text-blue-600 hover:text-blue-800 text-sm"
              >
                Manage →
              </Link>
            </div>
          ))}

          {businesses.length > 3 && (
            <div className="text-center pt-2">
              <Link
                href="/business"
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                View {businesses.length - 3} more business
                {businesses.length - 3 !== 1 ? "es" : ""} →
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
