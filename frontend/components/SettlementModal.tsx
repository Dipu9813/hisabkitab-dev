"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface SettlementModalProps {
  groupId: string;
  token: string;
  onClose: () => void;
}

export default function SettlementModal({
  groupId,
  token,
  onClose,
}: SettlementModalProps) {
  const [settlements, setSettlements] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [phase, setPhase] = useState<string>("");
  const [loadingStep, setLoadingStep] = useState("");
  // Auto-initiate settlement when modal opens
  useEffect(() => {
    const initiateAndFetchSettlements = async () => {
      setLoading(true);
      setError("");
      setSuccess("");
      try {
        // First check current group phase
        setLoadingStep("Checking group status...");
        const groupRes = await fetch(
          `http://localhost:3000/groups/${groupId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        const groupData = await groupRes.json();
        const currentPhase = groupData.group?.phase || "";
        setPhase(currentPhase);

        // If not in settlement phase, initiate settlement
        if (currentPhase !== "settlement") {
          setLoadingStep("Initiating settlement...");
          setSuccess("Initiating settlement...");
          const settleRes = await fetch(
            `http://localhost:3000/groups/${groupId}/settle`,
            {
              method: "POST",
              headers: { Authorization: `Bearer ${token}` },
            }
          );
          const settleData = await settleRes.json();
          if (!settleRes.ok)
            throw new Error(
              settleData.error || "Failed to initiate settlement"
            );
          setPhase("settlement");
        }

        // Fetch optimized settlements
        setLoadingStep("Generating optimized splits...");
        setSuccess("Generating optimized splits...");
        const res = await fetch(
          `http://localhost:3000/groups/${groupId}/optimized-settlements`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        const data = await res.json();
        setSettlements(data.data || []);
        setSuccess("Settlement splits generated successfully!");
        setLoadingStep("");
      } catch (err: any) {
        setError(err.message || "Failed to process settlement");
        setLoadingStep("");
      } finally {
        setLoading(false);
      }
    };
    initiateAndFetchSettlements();
  }, [groupId, token]);

  return (
    <div
      className="fixed inset-0 bg-transparent backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl max-w-lg w-full shadow-2xl p-6 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-800"
        >
          ✕
        </button>{" "}
        <h2 className="text-2xl font-bold mb-4 text-black">Group Settlement</h2>
        {error && <div className="text-red-600 mb-2">{error}</div>}
        {success && <div className="text-green-600 mb-2">{success}</div>}
        {loading && (
          <div className="flex flex-col items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-3"></div>
            <span className="text-gray-600 text-center">
              {loadingStep || "Processing settlement..."}
            </span>
          </div>
        )}
        {!loading && phase === "settlement" && (
          <div>
            <h3 className="text-lg mb-4 text-black ">Optimized Splits</h3>
            {settlements.length === 0 && (
              <div className="text-black text-center">
                No settlements found.
              </div>
            )}
            <div className="grid gap-4 mb-6">
              {settlements.map((s, idx) => (
                <div
                  key={idx}
                  className="grid grid-cols-[1.2fr_1fr_1.5fr] items-center bg-white/90 rounded-xl shadow p-4 border border-gray-100 overflow-hidden max-w-full"
                >
                  <div className="flex items-center gap-2 min-w-0 max-w-full">
                    <Avatar className="h-9 w-9 flex-shrink-0">
                      <AvatarImage
                        src={
                          s.debtor?.profile_pic ||
                          "/placeholder.svg?height=40&width=40"
                        }
                      />
                      <AvatarFallback>
                        {s.debtor?.full_name
                          ?.split(" ")
                          .map((n: string) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-medium text-black truncate max-w-[80px]">
                      {s.debtor?.full_name || "Debtor"}
                    </span>
                  </div>
                  <div className="flex flex-col items-center justify-center">
                    <span className="text-xs text-gray-500">pays</span>
                    <span className="font-semibold text-[#192168] text-lg flex-shrink-0">
                      रु{s.amount}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 min-w-0 max-w-full justify-end">
                    <span className="text-xs text-gray-500 flex-shrink-0">
                      to
                    </span>
                    <Avatar className="h-9 w-9 flex-shrink-0">
                      <AvatarImage
                        src={
                          s.creditor?.profile_pic ||
                          "/placeholder.svg?height=40&width=40"
                        }
                      />
                      <AvatarFallback>
                        {s.creditor?.full_name
                          ?.split(" ")
                          .map((n: string) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-medium text-black truncate max-w-[100px]">
                      {s.creditor?.full_name || "Creditor"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex flex-col gap-2 w-full">
              <button
                className="w-full px-4 py-2 rounded-lg bg-gray-200 text-black font-semibold hover:bg-gray-300 transition"
                onClick={onClose}
              >
                Close
              </button>
              <button
                className="w-full px-4 py-2 rounded-lg bg-[#192168] text-white font-semibold hover:bg-blue-700 transition"
                onClick={() => {
                  const text = settlements
                    .map(
                      (s) =>
                        `${s.debtor?.full_name || "Debtor"} pays रु${
                          s.amount
                        } to ${s.creditor?.full_name || "Creditor"}`
                    )
                    .join("\n");
                  if (navigator.share) {
                    navigator.share({ title: "Group Settlement", text });
                  } else {
                    navigator.clipboard.writeText(text);
                    alert("Settlement copied to clipboard!");
                  }
                }}
              >
                Share
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
