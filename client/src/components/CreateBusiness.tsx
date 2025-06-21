"use client";
import { useState } from "react";

interface CreateBusinessProps {
  token: string;
  onBusinessCreated: () => void;
  onCancel: () => void;
}

export default function CreateBusiness({
  token,
  onBusinessCreated,
  onCancel,
}: CreateBusinessProps) {
  const [businessName, setBusinessName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState<{
    name: string;
    businessId: string;
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!businessName.trim()) {
      setError("Business name is required");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("http://localhost:3000/business/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: businessName.trim(),
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(
          errorData.error || `Error ${res.status}: ${res.statusText}`
        );
      }

      const data = await res.json();
      setSuccess({
        name: data.business.name,
        businessId: data.business.businessId,
      });

      // Auto-close after showing success for a moment
      setTimeout(() => {
        onBusinessCreated();
      }, 3000);
    } catch (err: any) {
      console.error("Error creating business:", err);
      setError(err.message || "Failed to create business");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
            <svg
              className="h-6 w-6 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Business Created Successfully!
          </h2>
          <p className="text-gray-600 mb-4">
            Your business <span className="font-medium">"{success.name}"</span>{" "}
            has been created.
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <p className="text-sm text-gray-700 mb-2">
              Share this Business ID with team members:
            </p>
            <div className="flex items-center justify-center space-x-2">
              <span className="text-2xl font-mono font-bold text-blue-600">
                {success.businessId}
              </span>
              <button
                onClick={() =>
                  navigator.clipboard?.writeText(success.businessId)
                }
                className="text-blue-600 hover:text-blue-800"
                title="Copy to clipboard"
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
              </button>
            </div>
          </div>
          <p className="text-xs text-gray-500">
            Redirecting to dashboard in a moment...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b">
        <h2 className="text-xl font-bold text-gray-900">Create New Business</h2>
        <p className="text-gray-600 mt-1">
          Create a shared business account for managing customer loans and
          credits.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Business Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter your business name"
            maxLength={255}
            required
          />
          <p className="text-xs text-gray-500 mt-1">
            Choose a name that your team members will recognize
          </p>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start">
            <svg
              className="h-5 w-5 text-blue-600 mt-0.5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">What happens after creation:</p>
              <ul className="text-xs space-y-1">
                <li>• A unique 6-character Business ID will be generated</li>
                <li>• You'll be automatically added as the business owner</li>
                <li>
                  • Share the Business ID with team members to invite them
                </li>
                <li>• Start managing customer loans and credits together</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="flex space-x-3 pt-4">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 py-2 px-4 rounded-md font-medium"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || !businessName.trim()}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Creating...
              </div>
            ) : (
              "Create Business"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
