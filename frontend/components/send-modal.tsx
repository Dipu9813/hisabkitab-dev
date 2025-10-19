"use client"

import { useState, useEffect, useRef } from "react"
import { X, Phone, Users, QrCode, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import QRScanner from "./qr-scanner"
import ContactSearch from "./contact-search"
import TransactionSuccess from "./transaction-success"

interface SendModalProps {
  onClose: () => void
}

type Step = "method" | "manual" | "contacts" | "qr" | "details" | "processing" | "success"

export default function SendModal({ onClose }: SendModalProps) {
  const [currentStep, setCurrentStep] = useState<Step>("method")
  const [mobileNumber, setMobileNumber] = useState("")
  const [amount, setAmount] = useState("")
  const [remarks, setRemarks] = useState("")
  const [selectedContact, setSelectedContact] = useState<any>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  // Transaction state for details step
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [deadline, setDeadline] = useState("");
  const [transactionDetails, setTransactionDetails] = useState<any>(null);

  // Add user search state
  const [userDetails, setUserDetails] = useState<any>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);

  const isDetailsValid = amount.trim() !== "" && remarks.trim() !== ""

  const handleMethodSelect = (method: Step) => {
    setCurrentStep(method)
  }

  const handleMobileNumberSubmit = (number: string, contact?: any) => {
    setMobileNumber(number)
    setSelectedContact(contact)
    setCurrentStep("details")
  }

  // Simulate getting token from localStorage or props (customize as needed)
  let token = "";
  if (typeof window !== "undefined") {
    token = localStorage.getItem("token") || "";
  }

  // Use the provided handleSubmit logic for sending money
  const handleProceed = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError("");
    setSuccess("");
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/lend`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          ph_number: mobileNumber,
          amount,
          remark: remarks,
          deadline,
        }),
      });
      if (!res.ok) {
        throw new Error(`Error ${res.status}: ${res.statusText}`);
      }
      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error(`Expected JSON but got ${contentType}`);
      }
      await res.json();
      setTransactionDetails({
        amount,
        recipient: selectedContact?.full_name || selectedContact?.name || "Recipient",
        mobileNumber,
        remarks,
      });
      setSuccess("Loan request sent!");
      setMobileNumber("");
      setAmount("");
      setRemarks("");
      setDeadline("");
      setTimeout(() => {
        setIsProcessing(false);
        setCurrentStep("success");
      }, 1000);
    } catch (err: any) {
      setIsProcessing(false);
      setError(err.message || "Failed to create loan record");
      setCurrentStep("details");
    }
  }

  const handleBackToHome = () => {
    onClose()
  }

  const handleQRScan = async (scannedNumber: string) => {
    setMobileNumber(scannedNumber);
    setIsSearching(true);
    setError("");
    setUserDetails(null);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/search/${scannedNumber}`, {
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });
      if (res.status === 404) {
        setUserDetails(null);
        setIsSearching(false);
        setError("User not found for scanned QR");
        return;
      }
      if (!res.ok) throw new Error();
      const data = await res.json();
      setUserDetails(data.data);
      setSelectedContact(data.data);
      setCurrentStep("details");
    } catch {
      setUserDetails(null);
      setError("Failed to fetch user for scanned QR");
    } finally {
      setIsSearching(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case "method":
        return (
          <div className="p-6 bg-[#eaf6ff] rounded-4xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-black">Send Money</h2>
            </div>

            <p className="text-black/60 mb-8">Choose how to enter recipient's mobile number</p>

            <div className="space-y-4">
              <Card
                className="bg-white/50 rounded-3xl border-0 shadow-l cursor-pointer hover:bg-white/70 transition-colors"
                onClick={() => handleMethodSelect("manual")}
              >
                <CardContent className="flex items-center gap-4 p-6">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <Phone className="h-6 w-6 text-[#1b2a3f]" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-black">Manual Entry</h3>
                    <p className="text-sm text-black/60">Type the mobile number manually</p>
                  </div>
                </CardContent>
              </Card>

              <Card
                className="bg-white/50 border-0 shadow-l rounded-3xl cursor-pointer hover:bg-white/70 transition-colors"
                onClick={() => handleMethodSelect("contacts")}
              >
                <CardContent className="flex items-center gap-4 p-6">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <Users className="h-6 w-6 text-[#1b2a3f]" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-black roun">From Contacts</h3>
                    <p className="text-sm text-black/60">Select from your contacts</p>
                  </div>
                </CardContent>
              </Card>

              <Card
                className="bg-white/50 border-0 shadow-l rounded-3xl cursor-pointer hover:bg-white/70 transition-colors"
                onClick={() => handleMethodSelect("qr")}
              >
                <CardContent className="flex items-center gap-4 p-6">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <QrCode className="h-6 w-6 text-[#1b2a3f]" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-black">QR Code Scanner</h3>
                    <p className="text-sm text-black/60">Scan QR code to get number</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )

      case "manual":
        // Debounced phone number search for user details (with Authorization header)
        const searchUser = async (phone: string) => {
          if (!phone || phone.length < 10) {
            setUserDetails(null);
            return;
          }
          setIsSearching(true);
          try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/search/${phone}`, {
              headers: {
                "Authorization": `Bearer ${token}`,
              },
            });
            if (res.status === 404) {
              setUserDetails(null);
              setIsSearching(false);
              return;
            }
            if (!res.ok) {
              throw new Error(`Error ${res.status}: ${res.statusText}`);
            }
            const data = await res.json();
            setUserDetails(data.data);
          } catch (err: any) {
            setUserDetails(null);
          } finally {
            setIsSearching(false);
          }
        };

        const handlePhoneChange = (phone: string) => {
          setMobileNumber(phone);
          setError("");
          setUserDetails(null);
          if (searchTimeout) clearTimeout(searchTimeout);
          if (!phone || phone.length < 10) {
            setIsSearching(false);
            return;
          }
          setIsSearching(true);
          const timeout = setTimeout(() => {
            searchUser(phone);
          }, 500);
          setSearchTimeout(timeout);
        }

        return (
          <div className="p-6">
            <div className="flex items-center gap-4 mb-6">
              <Button variant="ghost" size="icon" onClick={() => setCurrentStep("method")}> <ArrowLeft className="h-6 w-6 text-black" /></Button>
              <h2 className="text-2xl font-bold text-black">Enter Mobile Number</h2>
            </div>

            {/* Call Bara Image */}
            <div className="flex justify-center mb-6">
              <img 
                src="/bara/call_bara.png" 
                alt="Call Bara" 
                className="w-60 h-60 object-contain"
              />
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="mobile" className="text-black font-medium">Mobile Number</Label>
                <Input
                  id="mobile"
                  type="tel"
                  placeholder="9818000000"
                  value={mobileNumber}
                  onChange={e => handlePhoneChange(e.target.value)}
                  className="mt-2 bg-white/50 border-0 text-black placeholder:text-black/40"
                />
              </div>
              {/* User Details Display */}
              {isSearching && (
                <div className="flex items-center p-2 bg-gray-50 rounded">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                  <span className="text-sm text-gray-600">Searching...</span>
                </div>
              )}
              {userDetails && !isSearching && (
                <div className="flex items-center p-3 bg-green-50 border border-green-200 rounded">
                  <div className="flex-shrink-0">
                    {userDetails.profile_pic ? (
                      <img src={userDetails.profile_pic} alt={userDetails.full_name} className="w-10 h-10 rounded-full object-cover" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold">
                        {userDetails.full_name?.charAt(0)?.toUpperCase() || '?'}
                      </div>
                    )}
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">{userDetails.full_name}</p>
                    <p className="text-sm text-gray-500">{userDetails.ph_number}</p>
                  </div>
                  <div className="ml-auto">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Found</span>
                  </div>
                </div>
              )}
              {mobileNumber && !userDetails && !isSearching && mobileNumber.length >= 10 && (
                <div className="flex items-center p-3 bg-red-50 border border-red-200 rounded">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 rounded-full bg-red-500 flex items-center justify-center text-white">✕</div>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-red-900">User not found</p>
                    <p className="text-sm text-red-700">Please check the phone number</p>
                  </div>
                </div>
              )}
              <Button
                onClick={() => handleMobileNumberSubmit(mobileNumber, userDetails)}
                disabled={!mobileNumber.trim() || !userDetails}
                className="w-full bg-[#192168] hover:bg-[#192168cc] text-white"
              >
                Continue
              </Button>
            </div>
          </div>
        )

      case "contacts":
        return <ContactSearch onBack={() => setCurrentStep("method")} onSelect={handleMobileNumberSubmit} />

      case "qr":
        return <QRScanner onBack={() => setCurrentStep("method")} onScan={handleQRScan} />

      case "details":
        return (
          <div className="p-6">
            <div className="flex items-center gap-4 mb-6">
              <Button variant="ghost" size="icon" onClick={() => setCurrentStep("method")}> 
                <ArrowLeft className="h-6 w-6 text-black" />
              </Button>
              <h2 className="text-2xl font-bold text-black">Transaction Details</h2>
            </div>
            {/* Recipient Info */}
            <Card className="bg-white/50 border-0 shadow-lg rounded-3xl mb-6">
              <CardContent className="flex items-center gap-3 p-4">
                <Avatar className="h-10 w-10">
                  {(selectedContact?.profile_pic || selectedContact?.avatar) ? (
                    <img 
                      src={selectedContact.profile_pic || selectedContact.avatar} 
                      alt={selectedContact?.full_name || selectedContact?.name || "User"}
                      className="w-full h-full object-cover rounded-full"
                      onError={(e) => {
                        console.log('Failed to load profile pic:', selectedContact)
                        e.currentTarget.style.display = 'none'
                      }}
                    />
                  ) : null}
                  <AvatarFallback className="bg-[#192168] text-white">
                    {selectedContact?.full_name ? selectedContact.full_name[0] : selectedContact?.name ? selectedContact.name[0] : mobileNumber[0]}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium text-black">{selectedContact?.full_name || selectedContact?.name || "Recipient"}</p>
                  <p className="text-sm text-black/60">{mobileNumber}</p>
                </div>
              </CardContent>
            </Card>
            <form onSubmit={handleProceed} className="space-y-4">
              <div>
                <Label htmlFor="amount" className="text-black font-medium">
                  Amount (Rs) *
                </Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="0"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  className="mt-2 bg-white/50 border-0 text-black placeholder:text-black/40 text-2xl font-bold"
                  required
                />
              </div>
              <div>
                <Label htmlFor="remarks" className="text-black font-medium">
                  Remarks *
                </Label>
                <Input
                  id="remarks"
                  placeholder="Enter transaction remarks"
                  value={remarks}
                  onChange={e => setRemarks(e.target.value)}
                  className="mt-2 bg-white/50 border-0 text-black placeholder:text-black/40"
                  required
                />
              </div>
              <div>
                <Label htmlFor="deadline" className="text-black font-medium">
                  Deadline *
                </Label>
                <Input
                  id="deadline"
                  type="date"
                  value={deadline}
                  onChange={e => setDeadline(e.target.value)}
                  className="mt-2 bg-white/50 border-0 text-black placeholder:text-black/40"
                  required
                />
              </div>
              <Button
                type="submit"
                disabled={!isDetailsValid}
                className="w-full bg-[#192168] rounded-2xl hover:bg-green-700 text-white disabled:opacity-50"
              >
                Proceed
              </Button>
              {error && <div className="text-red-600 text-sm mt-2">{error}</div>}
              {success && <div className="text-green-600 text-sm mt-2">{success}</div>}
            </form>
          </div>
        )

      case "processing":
        return (
          <div className="p-6 flex flex-col items-center justify-center min-h-[400px]">
            <div className="w-16 h-16 border-4 border-green-600 border-t-transparent rounded-full animate-spin mb-6"></div>
            <h2 className="text-2xl font-bold text-black mb-2">Processing Transaction</h2>
            <p className="text-black/60 text-center">Please wait while we process your payment...</p>
          </div>
        )

      case "success":
        return (
          <TransactionSuccess
            amount={transactionDetails?.amount || ""}
            recipient={transactionDetails?.recipient || ""}
            mobileNumber={transactionDetails?.mobileNumber || ""}
            remarks={transactionDetails?.remarks || ""}
            onBackToHome={handleBackToHome}
          />
        )

      default:
        return null
    }
  }

  const modalRef = useRef<HTMLDivElement>(null);

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

  // Fetch recipient name by phone number when mobileNumber changes, but only in manual step
  useEffect(() => {
    if (currentStep !== "manual") return;
    if (!mobileNumber || mobileNumber.length < 10) return;
    let cancelled = false;
    async function fetchRecipientName() {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/search/${encodeURIComponent(mobileNumber)}`);
        if (res.ok) {
          const data = await res.json();
          if (data && data.full_name && !cancelled) {
            setSelectedContact((prev: any) => ({ ...prev, name: data.full_name }));
          }
        }
      } catch {}
    }
    fetchRecipientName();
    return () => { cancelled = true; };
  }, [mobileNumber, currentStep]);

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      style={{ pointerEvents: 'auto', zIndex: 99999 }}
      onClick={handleBackdropClick}
    >
      <div
        ref={modalRef}
        className="bg-[#eaf6ff] w-full max-w-sm mx-auto rounded-3xl max-h-[90vh] overflow-y-auto relative shadow-2xl border border-blue-100"
      >
        {/* Decorative Background (optional, now more subtle) */}
        <div className="absolute top-0 right-0 w-24 h-24 bg-blue-100/40 rounded-full blur-xl"></div>

        {renderStepContent()}
      </div>
    </div>
  )
}

