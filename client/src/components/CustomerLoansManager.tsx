"use client";
import { useState, useEffect } from "react";
import AddCustomerLoan from "./AddCustomerLoan";
import CustomerLoansList from "./CustomerLoansList";

interface Business {
  id: string;
  name: string;
  businessId: string;
  createdBy: string;
  createdAt: string;
  joinedAt: string;
  isOwner: boolean;
}

interface CustomerLoan {
  id: string;
  businessId: string;
  customerName: string;
  amount: number;
  description: string;
  isPaid: boolean;
  date: string;
  addedBy: string;
  addedById: string;
  addedByProfilePic?: string;
}

interface CustomerLoansManagerProps {
  business: Business;
  token: string;
}

export default function CustomerLoansManager({
  business,
  token,
}: CustomerLoansManagerProps) {
  const [loans, setLoans] = useState<CustomerLoan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [filterPaid, setFilterPaid] = useState<"all" | "paid" | "unpaid">(
    "all"
  );
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchLoans();
  }, [business.id, filterPaid]);

  const fetchLoans = async () => {
    try {
      setLoading(true);
      setError("");

      let url = `http://localhost:3000/business/${business.id}/loans?limit=100`;
      if (filterPaid !== "all") {
        url += `&isPaid=${filterPaid === "paid"}`;
      }

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        throw new Error(`Error ${res.status}: ${res.statusText}`);
      }

      const data = await res.json();
      setLoans(data.data || []);
    } catch (err: any) {
      console.error("Error fetching loans:", err);
      setError(err.message || "Failed to fetch loans");
    } finally {
      setLoading(false);
    }
  };

  const handleLoanAdded = () => {
    fetchLoans();
    setShowAddForm(false);
  };

  const handleLoanStatusUpdated = () => {
    fetchLoans();
  };

  // Filter loans based on search term
  const filteredLoans = loans.filter((loan) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      loan.customerName.toLowerCase().includes(search) ||
      loan.description?.toLowerCase().includes(search) ||
      loan.addedBy.toLowerCase().includes(search)
    );
  });

  // Calculate summary statistics
  const totalLoans = loans.length;
  const unpaidLoans = loans.filter((loan) => !loan.isPaid);
  const paidLoans = loans.filter((loan) => loan.isPaid);
  const totalUnpaidAmount = unpaidLoans.reduce(
    (sum, loan) => sum + loan.amount,
    0
  );
  const totalPaidAmount = paidLoans.reduce((sum, loan) => sum + loan.amount, 0);

  return (
    <div className="space-y-6">
      {/* Business Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {business.name}
            </h2>
            <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
              <span>
                Business ID:{" "}
                <span className="font-mono font-medium">
                  {business.businessId}
                </span>
              </span>
              <span>•</span>
              <span>{business.isOwner ? "Owner" : "Member"}</span>
              <span>•</span>
              <span>
                Joined {new Date(business.joinedAt).toLocaleDateString()}
              </span>
            </div>
          </div>
          <button
            onClick={() => setShowAddForm(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
          >
            Add Customer Loan
          </button>
        </div>
      </div>

      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-2xl font-bold text-gray-900">{totalLoans}</div>
          <div className="text-sm text-gray-600">Total Loans</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-2xl font-bold text-red-600">
            {unpaidLoans.length}
          </div>
          <div className="text-sm text-gray-600">Unpaid Loans</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-2xl font-bold text-red-600">
            ${totalUnpaidAmount.toFixed(2)}
          </div>
          <div className="text-sm text-gray-600">Amount Outstanding</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-2xl font-bold text-green-600">
            ${totalPaidAmount.toFixed(2)}
          </div>
          <div className="text-sm text-gray-600">Amount Collected</div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0 sm:space-x-4">
          <div className="flex items-center space-x-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Filter by Status
              </label>
              <select
                value={filterPaid}
                onChange={(e) =>
                  setFilterPaid(e.target.value as "all" | "paid" | "unpaid")
                }
                className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Loans</option>
                <option value="unpaid">Unpaid Only</option>
                <option value="paid">Paid Only</option>
              </select>
            </div>
          </div>
          <div className="flex-1 max-w-md">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by customer name, description, or staff..."
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Add Loan Form Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <AddCustomerLoan
              business={business}
              token={token}
              onLoanAdded={handleLoanAdded}
              onCancel={() => setShowAddForm(false)}
            />
          </div>
        </div>
      )}

      {/* Loans List */}
      <CustomerLoansList
        loans={filteredLoans}
        loading={loading}
        token={token}
        onLoanStatusUpdated={handleLoanStatusUpdated}
        searchTerm={searchTerm}
      />
    </div>
  );
}
