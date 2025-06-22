"use client";
import { useEffect, useState } from "react";

interface BusinessLoanVerification {
  id: string;
  customer_name: string;
  amount: number;
  loan_date: string;
  payment_requested_at: string;
  payment_method?: string;
  payment_reference?: string;
  verification_status: string;
  businesses: {
    id: string;
    name: string;
    unique_short_id: string;
  };
}

interface BusinessLoanVerificationManagerProps {
  token: string;
}

export default function BusinessLoanVerificationManager({ token }: BusinessLoanVerificationManagerProps) {
  const [pendingLoans, setPendingLoans] = useState<BusinessLoanVerification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [processingLoan, setProcessingLoan] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const testSchema = async () => {
    try {
      console.log("🧪 Testing schema...");
      const res = await fetch("http://localhost:3000/test/business-loans-schema", {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      const data = await res.json();
      console.log("🧪 Schema test result:", data);
      setDebugInfo(data);    } catch (err: any) {
      console.error("❌ Schema test failed:", err);
      setDebugInfo({ error: err.message || "Unknown error" });
    }
  };

  const createSampleData = async () => {
    try {
      console.log("🧪 Creating sample data...");
      const res = await fetch("http://localhost:3000/test/create-sample-business-loan", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      
      const data = await res.json();
      console.log("🧪 Sample data result:", data);
      setDebugInfo(data);
      
      if (data.loan) {
        setSuccess("Sample business loan created! Follow the instructions to test the verification workflow.");
      }
    } catch (err: any) {
      console.error("❌ Sample data creation failed:", err);
      setError(err.message || "Failed to create sample data");
    }
  };
  const fetchPendingVerifications = async () => {
    setLoading(true);
    setError("");
    
    try {
      console.log("🔍 Fetching pending verifications...");
      const res = await fetch("http://localhost:3000/business-loans/pending-verification", {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log("📡 Response status:", res.status);
      console.log("📡 Response headers:", res.headers.get("content-type"));

      if (!res.ok) {
        const errorText = await res.text();
        console.error("❌ API Error:", errorText);
        throw new Error(`Error ${res.status}: ${res.statusText}`);
      }

      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error(`Expected JSON but got ${contentType}`);
      }

      const data = await res.json();
      console.log("✅ Received data:", data);
      setPendingLoans(data.data || []);
    } catch (err: any) {
      console.error("Error fetching pending verifications:", err);
      setError(err.message || "Failed to fetch pending verifications");
    } finally {
      setLoading(false);
    }
  };
  const verifyPayment = async (loanId: string, approved: boolean, rejectionReason?: string) => {
    setProcessingLoan(loanId);
    setError("");
    setSuccess("");

    try {
      console.log("🔄 Verifying payment:", { loanId, approved, rejectionReason });
      const res = await fetch(`http://localhost:3000/business-loans/${loanId}/verify-payment`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          approved,
          rejection_reason: rejectionReason,
        }),
      });

      console.log("📡 Verify response status:", res.status);

      if (!res.ok) {
        const errorText = await res.text();
        console.error("❌ Verify API Error:", errorText);
        throw new Error(`Error ${res.status}: ${res.statusText}`);
      }

      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error(`Expected JSON but got ${contentType}`);
      }

      const data = await res.json();
      console.log("✅ Verify response data:", data);
      
      if (approved) {
        setSuccess("Payment verified and loan marked as paid successfully!");
      } else {
        setSuccess("Payment verification rejected successfully.");
      }
      
      // Refresh the list
      fetchPendingVerifications();
    } catch (err: any) {
      console.error("Error verifying payment:", err);
      setError(err.message || "Failed to verify payment");
    } finally {
      setProcessingLoan(null);
    }
  };

  const handleApprove = (loanId: string) => {
    if (window.confirm("Are you sure you want to approve this payment and mark the loan as paid?")) {
      verifyPayment(loanId, true);
    }
  };

  const handleReject = (loanId: string) => {
    const reason = window.prompt("Please enter a reason for rejection (optional):");
    if (reason !== null) { // User didn't cancel
      verifyPayment(loanId, false, reason || "Payment verification rejected");
    }
  };

  useEffect(() => {
    fetchPendingVerifications();
  }, []);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto mt-8">
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">Loading pending verifications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto mt-8">      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">🏢 Business Loan Verification</h2>        <div className="flex gap-2">
          <button
            onClick={createSampleData}
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
          >
            🎯 Create Sample Loan
          </button>
          <button
            onClick={testSchema}
            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
          >
            🧪 Test Schema
          </button>
          <button
            onClick={fetchPendingVerifications}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
          >
            🔄 Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="text-red-600 mb-4 p-3 bg-red-50 rounded-lg border border-red-200">
          {error}
        </div>
      )}
        {success && (
        <div className="text-green-600 mb-4 p-3 bg-green-50 rounded-lg border border-green-200">
          {success}
        </div>
      )}

      {debugInfo && (
        <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h3 className="font-bold text-blue-800 mb-2">🧪 Debug Information:</h3>
          <pre className="text-xs text-blue-700 overflow-auto">
            {JSON.stringify(debugInfo, null, 2)}
          </pre>
        </div>
      )}

      {pendingLoans.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">✅</div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">All caught up!</h3>
          <p className="text-gray-600">No payment verifications pending at the moment.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {pendingLoans.map((loan) => (
            <div key={loan.id} className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <h3 className="text-lg font-semibold">{loan.customer_name}</h3>
                    <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs">
                      ⏳ Verification Pending
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-gray-600">Amount</p>
                      <p className="font-semibold">₹{loan.amount.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Business</p>
                      <p className="font-semibold">{loan.businesses.name}</p>
                      <p className="text-xs text-gray-500">#{loan.businesses.unique_short_id}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Loan Date</p>
                      <p className="font-semibold">{new Date(loan.loan_date).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Payment Requested</p>
                      <p className="font-semibold">{new Date(loan.payment_requested_at).toLocaleDateString()}</p>
                      <p className="text-xs text-gray-500">{new Date(loan.payment_requested_at).toLocaleTimeString()}</p>
                    </div>
                  </div>

                  {(loan.payment_method || loan.payment_reference) && (
                    <div className="bg-gray-50 rounded-lg p-3 mb-4">
                      <p className="text-sm font-medium text-gray-700 mb-2">Payment Details</p>
                      {loan.payment_method && (
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Method:</span> {loan.payment_method}
                        </p>
                      )}
                      {loan.payment_reference && (
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Reference:</span> {loan.payment_reference}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  onClick={() => handleApprove(loan.id)}
                  disabled={processingLoan === loan.id}
                  className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center gap-2"
                >
                  {processingLoan === loan.id ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      ✅ Approve & Mark Paid
                    </>
                  )}
                </button>
                
                <button
                  onClick={() => handleReject(loan.id)}
                  disabled={processingLoan === loan.id}
                  className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center gap-2"
                >
                  {processingLoan === loan.id ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      ❌ Reject Payment
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
