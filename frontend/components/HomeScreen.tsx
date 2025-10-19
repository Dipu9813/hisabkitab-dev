import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import {
  ArrowUpRight,
  ArrowDownLeft,
  Users,
  ChevronDown,
  QrCode,
  Bot,
  Check,
  X,
} from "lucide-react";
import { jwtDecode } from "jwt-decode";
import BusinessTransactions from "./BusinessTransactions";
import { BusinessService } from "@/lib/businessService";

export default function HomeScreen({
  sectionInfo,
  currentSection,
  recipients,
  transactions,
  handleSendClick,
  handleReceiveClick,
  setActiveScreen,
  handleGroupClick,
  setShowBusinessContacts,
  setShowBusinessQR,
  getCurrentSectionData,
  setShowAIChat,
  setShowAddBusinessLoan,
  refreshBusinessBalances,
  businessRefreshKey,
}: any) {
  // Get user name from localStorage for personal section
  let userName = sectionInfo.name;
  if (typeof window !== "undefined" && currentSection === "personal") {
    userName = localStorage.getItem("userName") || sectionInfo.name;
  }

  // Pending Requests State
  const [pendingApprovals, setPendingApprovals] = useState<any[]>([]); // user is receiver, status 'pending'
  const [paymentConfirmations, setPaymentConfirmations] = useState<any[]>([]); // user is lender, status 'payment_requested'
  const [pendingError, setPendingError] = useState("");
  useEffect(() => {
    const fetchPendingRequests = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;
        let currentUserId = "";
        try {
          currentUserId = jwtDecode<{ sub: string }>(token).sub;
        } catch {}
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/loans`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error(`Error ${res.status}: ${res.statusText}`);
        const contentType = res.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          throw new Error(`Expected JSON but got ${contentType}`);
        }
        const { data } = await res.json();
        // Filter for requests
        setPendingApprovals(
          (data || []).filter(
            (loan: any) =>
              loan.receiver_id === currentUserId && loan.status === "pending"
          )
        );
        setPaymentConfirmations(
          (data || []).filter(
            (loan: any) =>
              loan.lender_id === currentUserId &&
              loan.status === "payment_requested"
          )
        );
      } catch (err: any) {
        setPendingError(err.message || "Failed to fetch pending requests");
        setPendingApprovals([]);
        setPaymentConfirmations([]);
      }
    };
    fetchPendingRequests();
    // Optionally poll or listen for updates
  }, [currentSection]);

  // Ongoing and Past Records State
  const [ongoingRecords, setOngoingRecords] = useState<any[]>([]);
  const [pastRecords, setPastRecords] = useState<any[]>([]);
  useEffect(() => {
    const fetchRecords = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;
        let currentUserId = "";
        try {
          currentUserId = jwtDecode<{ sub: string }>(token).sub;
        } catch {}
        // Ongoing: confirmed or payment_requested
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/loans`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error(`Error ${res.status}: ${res.statusText}`);
        const contentType = res.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          throw new Error(`Expected JSON but got ${contentType}`);
        }
        const { data } = await res.json();
        const ongoing = (data || []).filter(
          (loan: any) =>
            (loan.lender_id === currentUserId ||
              loan.receiver_id === currentUserId) &&
            (loan.status === "confirmed" || loan.status === "payment_requested")
        );
        setOngoingRecords(ongoing);
        // Past: from loan_history
        const resHistory = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/loan-history`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!resHistory.ok)
          throw new Error(
            `Error ${resHistory.status}: ${resHistory.statusText}`
          );
        const contentType2 = resHistory.headers.get("content-type");
        if (!contentType2 || !contentType2.includes("application/json")) {
          throw new Error(`Expected JSON but got ${contentType2}`);
        }
        const { data: historyData } = await resHistory.json();
        setPastRecords(historyData || []);
      } catch {
        setOngoingRecords([]);
        setPastRecords([]);
      }
    };
    fetchRecords();
  }, [currentSection]);

  // Calculate To Pay and To Receive from ongoingRecords
  const [sumToPay, setSumToPay] = useState(0);
  const [sumToReceive, setSumToReceive] = useState(0);
  useEffect(() => {
    let token = localStorage.getItem("token");
    let currentUserId = "";
    try {
      currentUserId = jwtDecode<{ sub: string }>(token || "").sub;
    } catch {}
    setSumToPay(
      ongoingRecords
        .filter((rec: any) => rec.lender_id === currentUserId)
        .reduce((sum: number, rec: any) => sum + Number(rec.amount || 0), 0)
    );
    setSumToReceive(
      ongoingRecords
        .filter((rec: any) => rec.receiver_id === currentUserId)
        .reduce((sum: number, rec: any) => sum + Number(rec.amount || 0), 0)
    );
  }, [ongoingRecords]);

  // Modal state
  const [selectedOngoing, setSelectedOngoing] = useState<any | null>(null);

  // State for controlling how many records to show
  const [ongoingRecordsToShow, setOngoingRecordsToShow] = useState(5);
  const [pastRecordsToShow, setPastRecordsToShow] = useState(5);

  // Add error and success state for mark as paid
  const [markPaidError, setMarkPaidError] = useState("");
  const [markPaidSuccess, setMarkPaidSuccess] = useState("");

  // Add error and success state for send reminder
  const [reminderError, setReminderError] = useState("");
  const [reminderSuccess, setReminderSuccess] = useState("");

  // State for highlighting specific loan from notifications
  const [highlightedLoanId, setHighlightedLoanId] = useState<string | null>(
    null
  );

  // Check for highlighted loan ID from localStorage (set by service worker)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const loanId = localStorage.getItem("highlightLoanId");
      const action = localStorage.getItem("loanAction");

      if (loanId) {
        setHighlightedLoanId(loanId);
        // Auto-open the loan modal if highlighted
        const loan = ongoingRecords.find((record) => record.id === loanId);
        if (loan) {
          setSelectedOngoing(loan);

          // If action is 'pay', we could auto-trigger payment flow here
          if (action === "pay") {
            console.log("💳 Auto-triggering payment flow for loan:", loanId);
            // You could add additional logic here to auto-open payment confirmation
          }
        }
        // Clear highlight after 5 seconds
        setTimeout(() => {
          setHighlightedLoanId(null);
        }, 5000);

        // Clean up localStorage items
        localStorage.removeItem("highlightLoanId");
        localStorage.removeItem("loanAction");
      }
    }
  }, [ongoingRecords]);

  // Ongoing Record Modal
  function OngoingRecordModal({
    record,
    onClose,
    onMarkPaid,
    onSendReminder,
  }: {
    record: any;
    onClose: () => void;
    onMarkPaid: () => void;
    onSendReminder: () => void;
  }) {
    // Close on Escape key
    useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") onClose();
      };
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }, [onClose]);

    // Close on backdrop click
    const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.target === e.currentTarget) onClose();
    };

    return (
      <div
        className="fixed inset-0 bg-black/5 backdrop-blur-sm z-[99999] flex items-center justify-center p-4"
        style={{ pointerEvents: "auto", zIndex: 99999 }}
        onClick={handleBackdropClick}
      >
        <div className="bg-white rounded-3xl max-w-md w-full p-8 shadow-2xl relative flex flex-col items-center">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-400 hover:text-slate-800 text-2xl font-bold bg-white rounded-full w-10 h-10 flex items-center justify-center shadow-md transition"
          >
            ×
          </button>
          <h2 className="text-2xl font-extrabold mb-6 text-slate-800 tracking-tight">
            Ongoing Record
          </h2>
          <div className="w-full space-y-4 mb-6">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-slate-700">Lender:</span>
              <span className="text-slate-900 font-medium">
                {record.lender?.full_name || "Unknown"}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-semibold text-slate-700">Receiver:</span>
              <span className="text-slate-900 font-medium">
                {record.receiver?.full_name || "Unknown"}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-semibold text-slate-700">Amount:</span>
              <span className="text-emerald-700 font-bold">
                रु {record.amount}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-semibold text-slate-700">Status:</span>
              <span className="capitalize text-blue-700 font-semibold">
                {record.status.replace("_", " ")}
              </span>
            </div>
            {record.due_date && (
              <div className="flex justify-between items-center">
                <span className="font-semibold text-slate-700">Due Date:</span>
                <span className="text-slate-900">
                  {new Date(record.due_date).toLocaleDateString()}
                </span>
              </div>
            )}
            <div className="flex justify-between items-center">
              <span className="font-semibold text-slate-700">Remarks:</span>
              <span className="text-slate-900">
                {truncateReason(record.reason)}
              </span>
            </div>
          </div>
          {markPaidError && (
            <div className="text-red-600 mb-2 text-sm bg-red-50 rounded p-2 w-full text-center">
              {markPaidError}
            </div>
          )}
          {markPaidSuccess && (
            <div className="text-green-600 mb-2 text-sm bg-green-50 rounded p-2 w-full text-center">
              {markPaidSuccess}
            </div>
          )}
          {reminderError && (
            <div className="text-red-600 mb-2 text-sm bg-red-50 rounded p-2 w-full text-center">
              {reminderError}
            </div>
          )}
          {reminderSuccess && (
            <div className="text-green-600 mb-2 text-sm bg-green-50 rounded p-2 w-full text-center">
              {reminderSuccess}
            </div>
          )}
          {/* Action button: Send Reminder or Mark as Paid */}
          <div className="w-full mt-4">
            {(() => {
              const token =
                typeof window !== "undefined"
                  ? localStorage.getItem("token")
                  : null;
              let currentUserId = "";
              try {
                currentUserId = jwtDecode<{ sub: string }>(token || "").sub;
              } catch {}
              if (record.lender_id === currentUserId) {
                return (
                  <button
                    className="w-full bg-[#192168] hover:from-blue-600 hover:to-blue-700 text-white font-bold py-3 rounded-2xl shadow-lg transition-all duration-200 text-lg"
                    onClick={onSendReminder}
                  >
                    Send Reminder
                  </button>
                );
              } else {
                return (
                  <button
                    onClick={onMarkPaid}
                    className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold py-3 rounded-2xl shadow-lg transition-all duration-200 text-lg"
                  >
                    Send Paid Request
                  </button>
                );
              }
            })()}
          </div>
        </div>
      </div>
    );
  }

  // Helper to truncate reason/remarks
  function truncateReason(reason: string, maxLength = 32) {
    if (!reason) return "No remarks";
    if (reason.length <= maxLength) return reason;
    // Truncate at the last space before maxLength, or just cut off
    const truncated = reason.slice(0, maxLength);
    const lastSpace = truncated.lastIndexOf(" ");
    return (lastSpace > 0 ? truncated.slice(0, lastSpace) : truncated) + "...";
  }

  // Business total amount state
  const [businessTotal, setBusinessTotal] = useState(0);

  // Calculate business total when on business page
  useEffect(() => {
    const fetchBusinessTotal = async () => {
      if (currentSection !== "personal") {
        try {
          const total = await BusinessService.getBusinessTotalAmount(
            currentSection
          );
          setBusinessTotal(total);
        } catch (error) {
          console.error("Error fetching business total:", error);
          setBusinessTotal(0);
        }
      }
    };

    fetchBusinessTotal();
  }, [currentSection]);

  return (
    <>
      <div className={selectedOngoing ? "blur-sm pointer-events-none" : ""}>
        <div className="px-6 relative z-10 pb-24">
          <div className="mb-8">
            <p className="text-slate-600 text-sm mb-2 font-medium">
              {sectionInfo.type}
            </p>
            {currentSection === "personal" ? (
              <h1 className="text-slate-800 text-3xl font-bold mb-6 tracking-tight">
                Welcome Back, {userName} !
              </h1>
            ) : (
              <h1 className="text-slate-800 text-3xl font-bold mb-6 tracking-tight">
                {sectionInfo.name}
              </h1>
            )}
          </div>
          {/* Info section with outstanding and expected amounts */}
          {currentSection === "personal" ? (
            <div className="grid grid-cols-2 gap-4 mb-10 w-full">
              {/* To Pay Card */}
              <div className="bg-white rounded-3xl shadow-lg p-5 flex flex-col items-center border border-rose-100 hover:shadow-rose-200 transition-shadow duration-300 w-full">
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-rose-100 to-red-200 mb-2">
                  <ArrowUpRight className="h-7 w-7 text-rose-600" />
                </div>
                <p className="text-slate-500 text-xs font-semibold mb-1 tracking-wide">
                  Amount Lent
                </p>
                <p className="text-rose-700 text-2xl font-extrabold mb-1">
                  रु {sumToPay}
                </p>
              </div>
              {/* To Receive Card */}
              <div className="bg-white rounded-3xl shadow-lg p-5 flex flex-col items-center border border-emerald-100 hover:shadow-emerald-200 transition-shadow duration-300 w-full">
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-emerald-100 to-green-200 mb-2">
                  <ArrowDownLeft className="h-7 w-7 text-emerald-600" />
                </div>
                <p className="text-slate-500 text-xs font-semibold mb-1 tracking-wide">
                  Amount Borrowed
                </p>
                <p className="text-emerald-700 text-2xl font-extrabold mb-1">
                  रु {sumToReceive}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex justify-center mb-10 w-full">
              {/* Business Amount Lent Card */}
              <div className="bg-white rounded-3xl shadow-lg p-6 flex flex-col items-center  transition-shadow duration-300 w-full max-w-xs ring-2 ring-red-200">
                <div className="flex items-center justify-center w-16 h-15 rounded-full bg-gradient-to-br from-red-100 to-rose-200 mb-3 border-2 border-red-300 shadow-lg">
                  <ArrowUpRight className="h-8 w-8 text-red-600" />
                </div>
                <p className="text-gray-500 text-sm font-semibold mb-2 tracking-wide">
                  Total Amount Lent
                </p>
                <p className="text-red-700 text-3xl font-extrabold mb-1">
                  रु {businessTotal}
                </p>
                <p className="text-gray-600 text-xs">by this business</p>
              </div>
            </div>
          )}

          <hr
            className="border-t my-8 w-full"
            style={{ borderColor: "#1b2a3f" }}
          />

          {/* Action Buttons */}
          <div className="flex justify-center gap-4 mb-6">
            {currentSection === "personal" ? (
              <>
                <div className="flex flex-col items-center">
                  <Button
                    size="icon"
                    onClick={handleSendClick}
                    className="w-24 h-24 rounded-3xl bg-[#048ABF] hover:bg-[#036a91] text-white shadow-xl shadow-blue-200/50 transition-all duration-300 hover:scale-105 font-extrabold"
                  >
                    <ArrowUpRight className="h-10 w-10" />
                  </Button>
                  <span className="text-slate-700 text-base mt-4 font-medium">
                    Lend
                  </span>
                </div>
                <div className="flex flex-col items-center">
                  <Button
                    size="icon"
                    onClick={handleReceiveClick}
                    className="w-24 h-24 rounded-3xl  bg-[#035fa5] hover:bg-[#02467e] text-white shadow-xl shadow-blue-200/50 transition-all duration-300 hover:scale-105"
                  >
                    <ArrowDownLeft className="h-10 w-10" />
                  </Button>
                  <span className="text-slate-700 text-sm mt-3 font-medium">
                    Borrow
                  </span>
                </div>
                <div className="flex flex-col items-center">
                  <Button
                    size="icon"
                    onClick={() => setActiveScreen("groups")}
                    className="w-24 h-24 rounded-3xl bg-[#023E73] hover:bg-[#022c50] text-white shadow-xl shadow-blue-200/50 transition-all duration-300 hover:scale-105"
                  >
                    <Users className="h-10 w-10" />
                  </Button>
                  <span className="text-slate-700 text-sm mt-3 font-medium">
                    Groups
                  </span>
                </div>
              </>
            ) : (
              <>
                <div className="flex flex-col items-center">
                  <Button
                    size="icon"
                    onClick={() =>
                      setShowAddBusinessLoan && setShowAddBusinessLoan(true)
                    }
                    className="w-24 h-24 rounded-3xl bg-[#048ABF] hover:bg-[#036a91] text-white shadow-xl shadow-blue-200/50 transition-all duration-300 hover:scale-105 font-extrabold"
                  >
                    <ArrowUpRight className="h-10 w-10" />
                  </Button>
                  <span className="text-slate-700 text-sm mt-2 font-medium">
                    Add Loan
                  </span>
                </div>
                <div className="flex flex-col items-center">
                  <Button
                    size="icon"
                    onClick={() => setShowBusinessContacts(true)}
                    className="w-24 h-24 rounded-3xl bg-[#035fa5] hover:from-orange-600 hover:to-red-700 text-white  transition-all duration-300 hover:scale-105"
                  >
                    <Users className="h-10 w-10" />
                  </Button>
                  <span className="text-slate-700 text-sm mt-2 font-medium">
                    Team
                  </span>
                </div>
                <div className="flex flex-col items-center">
                  <Button
                    size="icon"
                    onClick={() => setShowBusinessQR(true)}
                    className="w-24 h-24 rounded-3xl bg-[#023E73] hover:from-indigo-600 hover:to-purple-700 text-white shadow-xl shadow-indigo-200/50 transition-all duration-300 hover:scale-105"
                  >
                    <QrCode className="h-10 w-10" />
                  </Button>
                  <span className="text-slate-700 text-sm mt-2 font-medium">
                    Share QR
                  </span>
                </div>
              </>
            )}
          </div>

          {/* Business Transactions Section */}
          {currentSection !== "personal" && (
            <div className="mb-8">
              <BusinessTransactions
                businessId={currentSection}
                businessName={sectionInfo.name}
                isOwner={sectionInfo.isOwner || false}
                refreshBusinessBalances={refreshBusinessBalances}
                key={businessRefreshKey} // Force re-render when refresh key changes
              />
            </div>
          )}

          {/* Pending Request - Only show for personal accounts */}
          {currentSection === "personal" &&
            (pendingApprovals.length > 0 ||
              paymentConfirmations.length > 0) && (
              <div className="space-y-4">
                <h2 className="text-slate-800 text-xl font-bold mb-2 flex items-center gap-2">
                  <span className="inline-block w-2 h-2 bg-[#192168] rounded-full animate-pulse"></span>
                  Pending Requests
                </h2>
                {pendingError && (
                  <div className="text-[#192168] text-sm mb-2">
                    {pendingError}
                  </div>
                )}

                {/* Payment Confirmation Needed Section */}
                {paymentConfirmations.length > 0 && (
                  <div>
                    <h3 className="text-[#035fa5] font-semibold mb-1">
                      Payment Confirmation:
                    </h3>
                    {paymentConfirmations.map(
                      (transaction: any, index: number) => (
                        <Card
                          key={transaction.id || index}
                          className="bg-white border-0 shadow-sm shadow-[#95e1ff] rounded-3xl flex items-center justify-between p-5 hover:shadow-[#1b2a3f] transition-all duration-200 mb-2"
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-orange-200 flex items-center justify-center text-[#1b2a3f] font-bold text-lg shadow-md">
                              {transaction.receiver?.full_name
                                ? transaction.receiver.full_name
                                    .split(" ")
                                    .map((n: string) => n[0])
                                    .join("")
                                : "U"}
                            </div>
                            <div>
                              <span className="text-slate-800 font-semibold text-base block">
                                {transaction.receiver?.full_name || "Unknown"}
                              </span>
                              <span className="text-slate-500 text-xs block mb-1">
                                {truncateReason(transaction.reason)}
                              </span>
                              <span className="text-[#1b2a3f] font-bold text-lg">
                                रु {transaction.amount}
                              </span>
                            </div>
                          </div>
                          <div className="flex flex-col gap-2 ml-auto">
                            <Button
                              variant="outline"
                              className="bg-white border-2 border-emerald-500 text-emerald-700 hover:bg-emerald-50 font-semibold px-4 py-2 rounded-4xl shadow-sm flex items-center gap-2 active:scale-95 transition-transform duration-150"
                              onClick={async () => {
                                const token = localStorage.getItem("token");
                                await fetch(
                                  `${process.env.NEXT_PUBLIC_API_URL}/loans/${transaction.id}/confirm-payment`,
                                  {
                                    method: "POST",
                                    headers: {
                                      Authorization: `Bearer ${token}`,
                                    },
                                  }
                                );
                                setPaymentConfirmations((prev) =>
                                  prev.filter((t) => t.id !== transaction.id)
                                );
                              }}
                              aria-label="Confirm Payment"
                            >
                              <span className="flex items-center justify-center">
                                <Check className="h-5 w-5 text-emerald-600" />
                              </span>
                            </Button>
                            <Button
                              variant="outline"
                              className="bg-white border-2 border-rose-500 text-rose-700 hover:bg-rose-50 font-semibold px-4 py-2 rounded-4xl shadow-sm flex items-center gap-2 active:scale-95 transition-transform duration-150"
                              onClick={async () => {
                                const token = localStorage.getItem("token");
                                await fetch(
                                  `${process.env.NEXT_PUBLIC_API_URL}/loans/${transaction.id}/decline-payment`,
                                  {
                                    method: "POST",
                                    headers: {
                                      Authorization: `Bearer ${token}`,
                                    },
                                  }
                                );
                                setPaymentConfirmations((prev) =>
                                  prev.filter((t) => t.id !== transaction.id)
                                );
                              }}
                              aria-label="Decline Payment"
                            >
                              <span className="flex items-center justify-center">
                                <X className="h-5 w-5 text-rose-600" />
                              </span>
                            </Button>
                          </div>
                        </Card>
                      )
                    )}
                  </div>
                )}

                {/* Pending Approval Section */}
                {pendingApprovals.length > 0 && (
                  <div>
                    <h3 className="text-[#035fa5] font-semibold mb-1">
                      Pending Approval
                    </h3>
                    {pendingApprovals.map((transaction: any, index: number) => (
                      <Card
                        key={transaction.id || index}
                        className="bg-white border-0 shadow-sm shadow-[#95e1ff] rounded-3xl flex items-center justify-between p-5 hover:shadow-[#192168] transition-all duration-200 mb-2"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-full bg-[#95e1ff] flex items-center justify-center text-[#192168] font-bold text-lg shadow-md">
                            {transaction.lender?.full_name
                              ? transaction.lender.full_name
                                  .split(" ")
                                  .map((n: string) => n[0])
                                  .join("")
                              : "U"}
                          </div>
                          <div>
                            <span className="text-slate-800 font-semibold text-base block">
                              {transaction.lender?.full_name || "Unknown"}
                            </span>
                            <span className="text-slate-500 text-xs block mb-1">
                              {truncateReason(transaction.reason)}
                            </span>
                            <span className="text-[#192168] font-bold text-lg">
                              रु {transaction.amount}
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-col gap-2 ml-auto">
                          <Button
                            variant="outline"
                            className="bg-white border-2 border-emerald-500 text-emerald-700 hover:bg-emerald-50 font-semibold px-4 py-2 rounded-4xl shadow-sm flex items-center gap-2 active:scale-95 transition-transform duration-150"
                            onClick={async () => {
                              const token = localStorage.getItem("token");
                              await fetch(
                                `${process.env.NEXT_PUBLIC_API_URL}/loans/${transaction.id}/confirm`,
                                {
                                  method: "POST",
                                  headers: { Authorization: `Bearer ${token}` },
                                }
                              );
                              setPendingApprovals((prev) =>
                                prev.filter((t) => t.id !== transaction.id)
                              );
                            }}
                            aria-label="Accept"
                          >
                            <span className="flex items-center justify-center">
                              <Check className="h-5 w-5 text-emerald-600" />
                            </span>
                          </Button>
                          <Button
                            variant="outline"
                            className="bg-white border-2 border-rose-500 text-rose-700 hover:bg-rose-50 font-semibold px-4 py-2 rounded-4xl shadow-sm flex items-center gap-2 active:scale-95 transition-transform duration-150"
                            onClick={async () => {
                              // Optionally implement decline logic
                              setPendingApprovals((prev) =>
                                prev.filter((t) => t.id !== transaction.id)
                              );
                            }}
                            aria-label="Decline"
                          >
                            <span className="flex items-center justify-center">
                              <X className="h-5 w-5 text-rose-600" />
                            </span>
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}

          {/* Ongoing and Past Records - Only show for personal accounts */}
          {currentSection === "personal" && (
            <>
              {/* Ongoing Records */}
              <div className="space-y-4 mt-10">
                <h2 className="text-slate-800 text-xl font-bold">
                  Ongoing Records
                </h2>
                {ongoingRecords.length === 0 ? (
                  <p className="text-gray-500">No ongoing records</p>
                ) : (
                  <>
                    <div className="space-y-4">
                      {ongoingRecords
                        .slice(0, ongoingRecordsToShow)
                        .map((transaction: any, index: number) => (
                          <Card
                            key={transaction.id || index}
                            className="bg-white/70 backdrop-blur-sm border-0 shadow-lg shadow-slate-200/50 rounded-3xl cursor-pointer hover:bg-white/80 transition-all duration-300 ease-in-out transform hover:scale-[1.02] animate-in slide-in-from-bottom-2 fade-in"
                            onClick={() => setSelectedOngoing(transaction)}
                            style={{
                              animationDelay: `${index * 100}ms`,
                              animationDuration: "500ms",
                              animationFillMode: "both",
                            }}
                          >
                            <CardContent className="flex items-center justify-between p-6 relative">
                              <div className="flex items-center gap-4">
                                {/* Arrow icon for send/receive instead of initials */}
                                <div
                                  className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                                    transaction.lender_id ===
                                    jwtDecode<{ sub: string }>(
                                      localStorage.getItem("token") || ""
                                    ).sub
                                      ? "bg-gradient-to-br from-red-100 to-rose-100 "
                                      : "bg-gradient-to-br from-green-100 to-emerald-100"
                                  }`}
                                >
                                  {transaction.lender_id ===
                                  jwtDecode<{ sub: string }>(
                                    localStorage.getItem("token") || ""
                                  ).sub ? (
                                    <ArrowUpRight className="h-7 w-7 text-rose-600" />
                                  ) : (
                                    <ArrowDownLeft className="h-7 w-7 text-emerald-600" />
                                  )}
                                </div>
                                <div>
                                  <span className="text-slate-800 font-semibold text-base block">
                                    {/* Show receiver's name if lending, lender's name if borrowing */}
                                    {transaction.lender_id ===
                                    jwtDecode<{ sub: string }>(
                                      localStorage.getItem("token") || ""
                                    ).sub
                                      ? transaction.receiver?.full_name ||
                                        "Unknown"
                                      : transaction.lender?.full_name ||
                                        "Unknown"}
                                  </span>
                                  <span className="text-slate-500 text-xs block mb-1">
                                    {transaction.reason || "No remarks"}
                                  </span>
                                  <span className="text-[#192168] font-bold text-lg">
                                    रु {transaction.amount}
                                  </span>
                                </div>
                              </div>
                              {/* Status and Due Date layout fix */}
                              <div className="flex flex-col items-end justify-between h-full flex-1">
                                <span className="text-xs text-slate-500 mb-auto mt-1 mr-2 self-end">
                                  {transaction.status === "payment_requested"
                                    ? "Requested"
                                    : transaction.status === "confirmed"
                                    ? "Ongoing"
                                    : "Paid"}
                                </span>
                                {transaction.due_date && (
                                  <span className="absolute bottom-4 right-6 text-xs text-blue-600">
                                    Due:{" "}
                                    {new Date(
                                      transaction.due_date
                                    ).toLocaleDateString()}
                                  </span>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                    </div>
                    {ongoingRecordsToShow < ongoingRecords.length && (
                      <div className="mt-4 animate-in slide-in-from-bottom-4 fade-in duration-300">
                        <Button
                          onClick={() =>
                            setOngoingRecordsToShow(ongoingRecordsToShow + 5)
                          }
                          className="w-full bg-[#035fa5] hover:bg-[#023E73] text-white px-6 py-2 rounded-2xl shadow transition-all duration-300 hover:shadow-lg hover:scale-105"
                        >
                          Load More
                        </Button>
                      </div>
                    )}
                  </>
                )}
                {/* Ongoing Record Modal */}
                {selectedOngoing && (
                  <OngoingRecordModal
                    record={selectedOngoing}
                    onClose={() => setSelectedOngoing(null)}
                    onMarkPaid={async () => {
                      setMarkPaidError("");
                      setMarkPaidSuccess("");
                      try {
                        // Check if loan is in confirmed status before making payment request
                        if (selectedOngoing.status !== "confirmed") {
                          setMarkPaidError(
                            "Only confirmed loans can have payment requests"
                          );
                          return;
                        }

                        const token = localStorage.getItem("token");
                        const res = await fetch(
                          `${process.env.NEXT_PUBLIC_API_URL}/loans/${selectedOngoing.id}/payment-request`,
                          {
                            method: "POST",
                            headers: { Authorization: `Bearer ${token}` },
                          }
                        );
                        if (!res.ok) {
                          throw new Error(
                            `Error ${res.status}: ${res.statusText}`
                          );
                        }
                        const contentType = res.headers.get("content-type");
                        if (
                          !contentType ||
                          !contentType.includes("application/json")
                        ) {
                          throw new Error(
                            `Expected JSON but got ${contentType}`
                          );
                        }
                        await res.json();
                        setMarkPaidSuccess("Payment request submitted!");
                        setTimeout(() => {
                          setSelectedOngoing(null);
                          setMarkPaidSuccess("");
                        }, 1200);
                        // Refresh records after a short delay
                        setTimeout(() => {
                          if (typeof window !== "undefined")
                            window.location.reload();
                        }, 1300);
                      } catch (err: any) {
                        setMarkPaidError(
                          err.message || "Failed to submit payment request"
                        );
                      }
                    }}
                    onSendReminder={async () => {
                      setReminderError("");
                      setReminderSuccess("");
                      try {
                        const token = localStorage.getItem("token");
                        const res = await fetch(
                          `${process.env.NEXT_PUBLIC_API_URL}/loans/${selectedOngoing.id}/send-reminder`,
                          {
                            method: "POST",
                            headers: { Authorization: `Bearer ${token}` },
                          }
                        );
                        if (!res.ok) {
                          throw new Error(
                            `Error ${res.status}: ${res.statusText}`
                          );
                        }
                        setReminderSuccess("Reminder sent successfully!");
                        setTimeout(() => {
                          setReminderSuccess("");
                        }, 1200);
                      } catch (err: any) {
                        const errorMessage =
                          err.message || "Failed to send reminder";

                        if (
                          errorMessage.includes("push notifications yet") ||
                          errorMessage.includes(
                            "push notification subscription has expired"
                          )
                        ) {
                          setReminderError(
                            "The borrower hasn't enabled push notifications yet or their subscription has expired."
                          );
                        } else if (
                          errorMessage.includes("EXPIRED_PUSH_SUBSCRIPTION")
                        ) {
                          setReminderError(
                            "The borrower's push notification subscription has expired. They need to enable notifications again."
                          );
                        } else {
                          setReminderError(errorMessage);
                        }
                      }
                    }}
                  />
                )}
              </div>
              {/* Past Records */}
              <div className="space-y-4 mt-10">
                <h2 className="text-slate-800 text-xl font-bold">
                  Past Records
                </h2>
                {pastRecords.length === 0 ? (
                  <p className="text-gray-500">No past records</p>
                ) : (
                  <>
                    {pastRecords
                      .slice(0, pastRecordsToShow)
                      .map((transaction: any, index: number) => (
                        <Card
                          key={transaction.id || index}
                          className="bg-white/70 backdrop-blur-sm border-0 shadow-lg shadow-slate-200/50 rounded-3xl cursor-pointer hover:bg-white/80 transition-colors"
                        >
                          <CardContent className="flex items-center justify-between p-6 relative">
                            <div className="flex items-center gap-4">
                              <div
                                className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                                  transaction.lender_id ===
                                  jwtDecode<{ sub: string }>(
                                    localStorage.getItem("token") || ""
                                  ).sub
                                    ? "bg-gradient-to-br from-green-100 to-emerald-100"
                                    : "bg-gradient-to-br from-red-100 to-rose-100"
                                }`}
                              >
                                {transaction.lender_id ===
                                jwtDecode<{ sub: string }>(
                                  localStorage.getItem("token") || ""
                                ).sub ? (
                                  <ArrowUpRight className="h-7 w-7 text-emerald-600" />
                                ) : (
                                  <ArrowDownLeft className="h-7 w-7 text-rose-600" />
                                )}
                              </div>
                              <div>
                                <span className="text-slate-800 font-semibold text-base block">
                                  {transaction.lender?.full_name || "Unknown"}
                                </span>
                                <span className="text-slate-500 text-xs block mb-1">
                                  {truncateReason(transaction.reason)}
                                </span>
                                <span className="text-[#192168] font-bold text-lg">
                                  रु {transaction.amount}
                                </span>
                              </div>
                            </div>
                            <div className="flex flex-col items-end justify-between h-full flex-1">
                              <span className="text-xs text-slate-500 mb-auto mt-1 mr-2">
                                Paid
                              </span>
                              {transaction.due_date && (
                                <span className="absolute bottom-4 right-6 text-xs text-blue-600">
                                  Due:{" "}
                                  {new Date(
                                    transaction.due_date
                                  ).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    {pastRecordsToShow < pastRecords.length && (
                      <div className="mt-4">
                        <Button
                          onClick={() =>
                            setPastRecordsToShow(pastRecordsToShow + 5)
                          }
                          className="w-full bg-[#035fa5] hover:bg-[#023E73] text-white px-6 py-2 rounded-2xl shadow"
                        >
                          Load More
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </div>
      {selectedOngoing && (
        <OngoingRecordModal
          record={selectedOngoing}
          onClose={() => setSelectedOngoing(null)}
          onMarkPaid={async () => {
            setMarkPaidError("");
            setMarkPaidSuccess("");
            try {
              // Check if loan is in confirmed status before making payment request
              if (selectedOngoing.status !== "confirmed") {
                setMarkPaidError(
                  "Only confirmed loans can have payment requests"
                );
                return;
              }

              const token = localStorage.getItem("token");
              const res = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/loans/${selectedOngoing.id}/payment-request`,
                {
                  method: "POST",
                  headers: { Authorization: `Bearer ${token}` },
                }
              );
              if (!res.ok) {
                throw new Error(`Error ${res.status}: ${res.statusText}`);
              }
              const contentType = res.headers.get("content-type");
              if (!contentType || !contentType.includes("application/json")) {
                throw new Error(`Expected JSON but got ${contentType}`);
              }
              await res.json();
              setMarkPaidSuccess("Payment request submitted!");
              setTimeout(() => {
                setSelectedOngoing(null);
                setMarkPaidSuccess("");
              }, 1200);
              // Refresh records after a short delay
              setTimeout(() => {
                if (typeof window !== "undefined") window.location.reload();
              }, 1300);
            } catch (err: any) {
              setMarkPaidError(
                err.message || "Failed to submit payment request"
              );
            }
          }}
          onSendReminder={async () => {
            setReminderError("");
            setReminderSuccess("");
            try {
              const token = localStorage.getItem("token");
              const res = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/loans/${selectedOngoing.id}/send-reminder`,
                {
                  method: "POST",
                  headers: { Authorization: `Bearer ${token}` },
                }
              );
              if (!res.ok) {
                throw new Error(`Error ${res.status}: ${res.statusText}`);
              }
              setReminderSuccess("Reminder sent successfully!");
              setTimeout(() => {
                setReminderSuccess("");
              }, 1200);
            } catch (err: any) {
              const errorMessage = err.message || "Failed to send reminder";

              if (
                errorMessage.includes("push notifications yet") ||
                errorMessage.includes(
                  "push notification subscription has expired"
                )
              ) {
                setReminderError(
                  "The borrower hasn't enabled push notifications yet or their subscription has expired."
                );
              } else if (errorMessage.includes("EXPIRED_PUSH_SUBSCRIPTION")) {
                setReminderError(
                  "The borrower's push notification subscription has expired. They need to enable notifications again."
                );
              } else {
                setReminderError(errorMessage);
              }
            }
          }}
        />
      )}
    </>
  );
}



