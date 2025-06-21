"use client";
import { useState } from "react";

interface JoinBusinessProps {
  token: string;
  onBusinessJoined: () => void;
  onCancel: () => void;
}

export default function JoinBusiness({
  token,
  onBusinessJoined,
  onCancel,
}: JoinBusinessProps) {
  const [businessId, setBusinessId] = useState("");
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

    const trimmedId = businessId.trim().toUpperCase();

    if (!trimmedId) {
      setError("Business ID is required");
      setLoading(false);
      return;
    }

    if (trimmedId.length !== 6) {
      setError("Business ID must be exactly 6 characters");
      setLoading(false);
      return;
    }

    if (!/^[A-Z0-9]{6}$/.test(trimmedId)) {
      setError("Business ID must contain only letters and numbers");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("http://localhost:3000/business/join", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          businessId: trimmedId,
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
        onBusinessJoined();
      }, 3000);
    } catch (err: any) {
      console.error("Error joining business:", err);
      setError(err.message || "Failed to join business");
    } finally {
      setLoading(false);
    }
  };

  const handleBusinessIdChange = (value: string) => {
    // Only allow alphanumeric characters and limit to 6 characters
    const cleaned = value
      .replace(/[^A-Za-z0-9]/g, "")
      .toUpperCase()
      .slice(0, 6);
    setBusinessId(cleaned);
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
            Successfully Joined Business!
          </h2>
          <p className="text-gray-600 mb-4">
            You are now a member of{" "}
            <span className="font-medium">"{success.name}"</span>
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <p className="text-sm text-gray-700 mb-2">Business ID:</p>
            <span className="text-xl font-mono font-bold text-blue-600">
              {success.businessId}
            </span>
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
        <h2 className="text-xl font-bold text-gray-900">
          Join Existing Business
        </h2>
        <p className="text-gray-600 mt-1">
          Enter the 6-character Business ID shared by your team.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Business ID <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              type="text"
              value={businessId}
              onChange={(e) => handleBusinessIdChange(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-center font-mono text-lg tracking-wider focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="ABC123"
              maxLength={6}
              required
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-3">
              <span className="text-sm text-gray-400">
                {businessId.length}/6
              </span>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Enter the 6-character alphanumeric ID (letters and numbers only)
          </p>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start">
            <svg
              className="h-5 w-5 text-yellow-600 mt-0.5 mr-2"
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
            <div className="text-sm text-yellow-800">
              <p className="font-medium mb-1">Before joining:</p>
              <ul className="text-xs space-y-1">
                <li>
                  • Make sure you have the correct Business ID from your team
                </li>
                <li>• Business IDs are case-insensitive (ABC123 = abc123)</li>
                <li>
                  • You'll gain access to manage customer loans and credits
                </li>
                <li>• All business members can add and update loan records</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-900 mb-2">
            Need a Business ID?
          </h4>
          <p className="text-xs text-gray-600">
            Ask your team member who created the business to share the
            6-character Business ID with you. They can find it in their business
            dashboard or when they first created the business.
          </p>
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
            disabled={loading || businessId.length !== 6}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-md font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Joining...
              </div>
            ) : (
              "Join Business"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
