"use client";
import { useState } from "react";

interface SettlementInitiatorProps {
  token: string;
  groupId: string;
  isCreator: boolean;
  onSettlementInitiated: () => void;
}

interface SettlementStats {
  totalMoneyFlow: number;
  actualTransactions: number;
  maxPossibleTransactions: number;
  efficiencyPercentage: string;
  reductionRatio: string;
}

export default function SettlementInitiator({
  token,
  groupId,
  isCreator,
  onSettlementInitiated,
}: SettlementInitiatorProps) {
  const [isInitiating, setIsInitiating] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [stats, setStats] = useState<SettlementStats | null>(null);
  const [error, setError] = useState("");

  const initiateSettlement = async () => {
    if (!isCreator) {
      setError("Only the group creator can initiate settlement");
      return;
    }

    setIsInitiating(true);
    setError("");

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/groups/${groupId}/settle`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to initiate settlement");
      }

      const data = await response.json();
      setStats(data.stats);
      onSettlementInitiated();
    } catch (err: any) {
      console.error("Error initiating settlement:", err);
      setError(err.message || "Failed to initiate settlement");
    } finally {
      setIsInitiating(false);
    }
  };

  if (!isCreator) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <div className="flex items-center space-x-3">
          <div className="text-amber-600">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-medium text-amber-900">
              Waiting for Settlement
            </h3>
            <p className="text-sm text-amber-700 mt-1">
              Only the group creator can initiate the settlement phase. Once
              initiated, no new expenses can be added and optimal settlement
              transactions will be calculated.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Initiate Settlement Card */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="text-center space-y-4">
          <div className="text-blue-600">
            <svg
              className="w-12 h-12 mx-auto"
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
          </div>
          <div>
            <h3 className="text-lg font-semibold text-blue-900">
              Ready to Settle?
            </h3>
            <p className="text-blue-700 mt-2">
              Initiate the settlement phase to lock the group and calculate
              optimal payment transactions. This will prevent new expenses from
              being added.
            </p>
          </div>

          <div className="space-y-3">
            {!showPreview ? (
              <button
                onClick={() => setShowPreview(true)}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Preview Settlement
              </button>
            ) : (
              <div className="space-y-3">
                <button
                  onClick={initiateSettlement}
                  disabled={isInitiating}
                  className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold"
                >
                  {isInitiating ? (
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Calculating Settlements...</span>
                    </div>
                  ) : (
                    "🚀 Initiate Settlement Phase"
                  )}
                </button>
                <button
                  onClick={() => setShowPreview(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Algorithm Explanation */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h4 className="font-medium text-gray-900 mb-3">
          How Settlement Optimization Works
        </h4>
        <div className="space-y-3 text-sm text-gray-700">
          <div className="flex items-start space-x-3">
            <div className="text-green-600 mt-0.5">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <span>
              <strong>Greedy Algorithm:</strong> We use a "minimize cash flow"
              algorithm that reduces the number of transactions needed.
            </span>
          </div>
          <div className="flex items-start space-x-3">
            <div className="text-green-600 mt-0.5">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <span>
              <strong>Optimal Matching:</strong> Instead of everyone paying
              everyone, we create direct paths for maximum efficiency.
            </span>
          </div>
          <div className="flex items-start space-x-3">
            <div className="text-green-600 mt-0.5">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <span>
              <strong>Validation:</strong> All settlements are mathematically
              verified to ensure accuracy.
            </span>
          </div>
        </div>
      </div>

      {/* Success Stats Display */}
      {stats && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h4 className="font-medium text-green-900 mb-3">
            ✅ Settlement Optimization Complete!
          </h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-green-700">Total Money Flow:</span>
              <p className="font-semibold text-green-900">
                ₹{stats.totalMoneyFlow.toFixed(2)}
              </p>
            </div>
            <div>
              <span className="text-green-700">Transactions Needed:</span>
              <p className="font-semibold text-green-900">
                {stats.actualTransactions}
              </p>
            </div>
            <div>
              <span className="text-green-700">Efficiency Gained:</span>
              <p className="font-semibold text-green-900">
                {stats.efficiencyPercentage}%
              </p>
            </div>
            <div>
              <span className="text-green-700">Reduction Ratio:</span>
              <p className="font-semibold text-green-900">
                {stats.reductionRatio}:1
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <div className="text-red-600">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <span className="text-red-800">{error}</span>
          </div>
        </div>
      )}
    </div>
  );
}

