"use client";
import { useState, useEffect, useRef } from "react";

interface Business {
  id: string;
  name: string;
  businessId: string;
  createdBy: string;
  createdAt: string;
  joinedAt: string;
  isOwner: boolean;
}

interface User {
  id: string;
  full_name: string;
  ph_number: string;
  display_text: string;
}

interface AddCustomerLoanProps {
  business: Business;
  token: string;
  onLoanAdded: () => void;
  onCancel: () => void;
}

export default function AddCustomerLoan({
  business,
  token,
  onLoanAdded,
  onCancel,
}: AddCustomerLoanProps) {
  const [customerName, setCustomerName] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<User | null>(null);
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const searchRef = useRef<HTMLDivElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Search for users as the user types
  const searchUsers = async (query: string) => {
    if (query.trim().length < 2) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }

    setIsSearching(true);
    try {
      const res = await fetch(
        `http://localhost:3000/users/search?q=${encodeURIComponent(query)}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!res.ok) {
        throw new Error(`Error ${res.status}: ${res.statusText}`);
      }

      const data = await res.json();
      setSearchResults(data.data || []);
      setShowDropdown(true);
    } catch (err) {
      console.error("Error searching users:", err);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Handle input change with debounced search
  const handleCustomerNameChange = (value: string) => {
    setCustomerName(value);
    setSelectedCustomer(null);

    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Set new timeout for search
    searchTimeoutRef.current = setTimeout(() => {
      searchUsers(value);
    }, 300); // 300ms debounce
  };

  // Handle user selection from dropdown
  const handleUserSelect = (user: User) => {
    setSelectedCustomer(user);
    setCustomerName(user.display_text);
    setSearchResults([]);
    setShowDropdown(false);
  };

  // Handle clicks outside of search dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Validation
    if (!selectedCustomer && !customerName.trim()) {
      setError("Please select a customer from the search results");
      setLoading(false);
      return;
    }

    if (!amount.trim()) {
      setError("Amount is required");
      setLoading(false);
      return;
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError("Amount must be a positive number");
      setLoading(false);
      return;
    }

    try {
      const payload: any = {
        businessId: business.id,
        customerName: selectedCustomer
          ? selectedCustomer.display_text
          : customerName.trim(),
        amount: numAmount,
        description: description.trim() || undefined,
      };

      // Include customer user ID if a user was selected
      if (selectedCustomer) {
        payload.customerUserId = selectedCustomer.id;
      }

      const res = await fetch("http://localhost:3000/business/loan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(
          errorData.error || `Error ${res.status}: ${res.statusText}`
        );
      }

      onLoanAdded();
    } catch (err: any) {
      console.error("Error adding loan:", err);
      setError(err.message || "Failed to add loan");
    } finally {
      setLoading(false);
    }
  };

  const handleAmountChange = (value: string) => {
    // Only allow numbers and decimal point
    const numericValue = value.replace(/[^0-9.]/g, "");

    // Prevent multiple decimal points
    const parts = numericValue.split(".");
    if (parts.length > 2) {
      return;
    }

    // Limit decimal places to 2
    if (parts[1] && parts[1].length > 2) {
      return;
    }

    setAmount(numericValue);
  };

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b">
        <h2 className="text-xl font-bold text-gray-900">Add Customer Loan</h2>
        <p className="text-gray-600 mt-1">
          Record a loan or credit given to a customer for{" "}
          <span className="font-medium">{business.name}</span>
        </p>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        {" "}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Customer <span className="text-red-500">*</span>
          </label>
          <div className="relative" ref={searchRef}>
            <input
              type="text"
              value={customerName}
              onChange={(e) => handleCustomerNameChange(e.target.value)}
              className={`w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                selectedCustomer ? "bg-green-50 border-green-300" : ""
              }`}
              placeholder="Type to search by name or phone number..."
              required
            />

            {/* Loading indicator */}
            {isSearching && (
              <div className="absolute right-3 top-2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
              </div>
            )}

            {/* Selected user indicator */}
            {selectedCustomer && (
              <div className="absolute right-3 top-2">
                <svg
                  className="h-5 w-5 text-green-500"
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
            )}

            {/* Search results dropdown */}
            {showDropdown && searchResults.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                {searchResults.map((user) => (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() => handleUserSelect(user)}
                    className="w-full text-left px-4 py-3 hover:bg-blue-50 focus:bg-blue-50 focus:outline-none border-b border-gray-100 last:border-b-0"
                  >
                    <div className="font-medium text-gray-900">
                      {user.full_name}
                    </div>
                    <div className="text-sm text-gray-600">
                      {user.ph_number}
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* No results message */}
            {showDropdown &&
              searchResults.length === 0 &&
              customerName.length >= 2 &&
              !isSearching && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
                  <div className="px-4 py-3 text-gray-500 text-sm">
                    No users found. You can still add this customer manually.
                  </div>
                </div>
              )}
          </div>

          {selectedCustomer ? (
            <div className="flex items-center mt-2">
              <svg
                className="h-4 w-4 text-green-500 mr-1"
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
              <p className="text-xs text-green-600">
                Selected: {selectedCustomer.full_name} (
                {selectedCustomer.ph_number})
              </p>
              <button
                type="button"
                onClick={() => {
                  setSelectedCustomer(null);
                  setCustomerName("");
                }}
                className="ml-2 text-xs text-red-600 hover:text-red-800"
              >
                Clear
              </button>
            </div>
          ) : (
            <p className="text-xs text-gray-500 mt-1">
              Search for existing users by name or phone number
            </p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Amount <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <span className="absolute left-3 top-2 text-gray-500">$</span>
            <input
              type="text"
              value={amount}
              onChange={(e) => handleAmountChange(e.target.value)}
              className="w-full border border-gray-300 rounded-md pl-8 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="0.00"
              required
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Enter the amount given to the customer on credit
          </p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description <span className="text-gray-400">(optional)</span>
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="What was purchased or the reason for the loan..."
            rows={3}
            maxLength={500}
          />
          <p className="text-xs text-gray-500 mt-1">
            Optional details about the loan or purchase
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
              <p className="font-medium mb-1">Recording this loan:</p>
              <ul className="text-xs space-y-1">
                <li>• The loan will be marked as "unpaid" by default</li>
                <li>
                  • You can mark it as paid later when the customer settles
                </li>
                <li>• All business members can see and manage this loan</li>
                <li>• A record will show who added this loan entry</li>
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
            disabled={loading || !customerName.trim() || !amount.trim()}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Adding...
              </div>
            ) : (
              "Add Loan"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
