import React, { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ChevronDown, Edit3, TrendingUp, TrendingDown } from "lucide-react"
import AnalyticsChart from "./AnalyticsChart"

export default function AnalyticsScreen({ sectionInfo, currentSection }: any) {
  // Get current user id once
  let userId = ""
  try {
    const token = localStorage.getItem("token")
    userId = require("jwt-decode").jwtDecode(token).sub
  } catch {}

  const [activeTab, setActiveTab] = useState("daily")
  const [loans, setLoans] = useState<any[]>([])
  const [loanHistory, setLoanHistory] = useState<any[]>([])
  const [businessLoans, setBusinessLoans] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [visibleCount, setVisibleCount] = useState(5)
  
  const isBusinessMode = currentSection && currentSection !== "personal"

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      setError("")
      try {
        const token = localStorage.getItem("token")
        if (!token) throw new Error("No token found")
        
        if (isBusinessMode && currentSection) {
          // Fetch business loans for business mode
          const { BusinessService } = await import("@/lib/businessService")
          const businessLoansData = await BusinessService.getBusinessLoans(currentSection)
          setBusinessLoans(businessLoansData || [])
          // Clear personal loans in business mode
          setLoans([])
          setLoanHistory([])
        } else {
          // Fetch personal loans for personal mode
          const res = await fetch("http://localhost:3000/loans", {
            headers: { Authorization: `Bearer ${token}` },
          })
          if (!res.ok) throw new Error(await res.text())
          const { data } = await res.json()
          setLoans(data || [])
          const resHistory = await fetch("http://localhost:3000/loan-history", {
            headers: { Authorization: `Bearer ${token}` },
          })
          if (!resHistory.ok) throw new Error(await resHistory.text())
          const { data: historyData } = await resHistory.json()
          setLoanHistory(historyData || [])
          // Clear business loans in personal mode
          setBusinessLoans([])
        }
      } catch (err: any) {
        setError(err.message || "Failed to fetch data")
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [currentSection, isBusinessMode])

  // Helper: group by week (or day) and sum income/outcome
  function getChartData(loans: any[], loanHistory: any[], businessLoans: any[], tab: string) {
    if (isBusinessMode) {
      // For business mode, use business loans
      const all = businessLoans
      const now = new Date()
      let labels: string[] = []
      let income: number[] = []
      let outcome: number[] = []
      
      if (tab === "weekly") {
        // Last 6 weeks
        for (let i = 5; i >= 0; i--) {
          const start = new Date(now)
          start.setDate(now.getDate() - now.getDay() - i * 7)
          const end = new Date(start)
          end.setDate(start.getDate() + 6)
          labels.push(
            `${start.getMonth() + 1}/${start.getDate()}-${end.getMonth() + 1}/${end.getDate()}`
          )
          let lent = 0, received = 0
          all.forEach((loan) => {
            const d = new Date(loan.date)
            if (d >= start && d <= end) {
              // Count all loans as lent (outgoing)
              lent += Number(loan.amount || 0)
              // If the loan is paid, also count it as received (incoming)
              if (loan.isPaid) {
                received += Number(loan.amount || 0)
              }
            }
          })
          income.push(received) // Money received (green)
          outcome.push(lent) // Money lent (red)
        }
      } else {
        // Daily: last 7 days
        for (let i = 6; i >= 0; i--) {
          const day = new Date(now)
          day.setDate(now.getDate() - i)
          labels.push(`${day.getMonth() + 1}/${day.getDate()}`)
          let lent = 0, received = 0
          all.forEach((loan) => {
            const d = new Date(loan.date)
            if (d.toDateString() === day.toDateString()) {
              // Count all loans as lent (outgoing)
              lent += Number(loan.amount || 0)
              // If the loan is paid, also count it as received (incoming)
              if (loan.isPaid) {
                received += Number(loan.amount || 0)
              }
            }
          })
          income.push(received) // Money received (green)
          outcome.push(lent) // Money lent (red)
        }
      }
      return { labels, income, outcome }
    } else {
      // Personal mode logic (existing)
      const all = [...loans, ...loanHistory]
      // Group by week (or day)
      const now = new Date()
      let labels: string[] = []
      let income: number[] = []
      let outcome: number[] = []
      if (tab === "weekly") {
        // Last 6 weeks
        for (let i = 5; i >= 0; i--) {
          const start = new Date(now)
          start.setDate(now.getDate() - now.getDay() - i * 7)
          const end = new Date(start)
          end.setDate(start.getDate() + 6)
          labels.push(
            `${start.getMonth() + 1}/${start.getDate()}-${end.getMonth() + 1}/${end.getDate()}`
          )
          let inc = 0, out = 0
          all.forEach((rec) => {
            const d = new Date(rec.created_at || rec.date)
            if (d >= start && d <= end) {
              if (rec.lender_id === userId) out += Number(rec.amount || 0)
              if (rec.receiver_id === userId) inc += Number(rec.amount || 0)
            }
          })
          income.push(inc)
          outcome.push(out)
        }
      } else {
        // Daily: last 7 days
        for (let i = 6; i >= 0; i--) {
          const day = new Date(now)
          day.setDate(now.getDate() - i)
          const label = `${day.getMonth() + 1}/${day.getDate()}`
          labels.push(label)
          let inc = 0, out = 0
          all.forEach((rec) => {
            const d = new Date(rec.created_at || rec.date)
            if (
              d.getFullYear() === day.getFullYear() &&
              d.getMonth() === day.getMonth() &&
              d.getDate() === day.getDate()
            ) {
              if (rec.lender_id === userId) out += Number(rec.amount || 0)
              if (rec.receiver_id === userId) inc += Number(rec.amount || 0)
            }
          })
          income.push(inc)
          outcome.push(out)
        }
      }
      return { labels, income, outcome }
    }
  }

  const chart = getChartData(loans, loanHistory, businessLoans, activeTab)
  const totalIncome = chart.income.reduce((a, b) => a + b, 0)
  const totalOutcome = chart.outcome.reduce((a, b) => a + b, 0)
  const balance = totalIncome - totalOutcome

  // Combine and sort transactions by date (descending)
  const allTransactions = isBusinessMode 
    ? businessLoans.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    : [...loans, ...loanHistory].sort((a, b) => {
        const dateA = new Date(a.created_at || a.date).getTime();
        const dateB = new Date(b.created_at || b.date).getTime();
        return dateB - dateA;
      });

  return (
    <div className="px-4 md:px-10 max-w-3xl mx-auto relative z-10 pb-24">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-slate-900 text-4xl md:text-5xl font-extrabold tracking-tight mb-2">
              {isBusinessMode ? `${sectionInfo?.name || 'Business'} Analytics` : 'Analytics'}
            </h1>
            <p className="text-slate-500 text-base font-medium">
              {isBusinessMode ? 'Business financial insights' : 'Your financial insights'}
            </p>
          </div>
          
        </div>
        
      </div>
      
      {/* Tab Buttons */}
      <div className="flex gap-3 mb-8 justify-center">
        <Button
          variant={activeTab === "daily" ? "default" : "outline"}
          onClick={() => setActiveTab("daily")}
          className={`rounded-2xl px-8 py-3 font-semibold transition-all duration-300 ${
            activeTab === "daily"
              ? "bg-[#192168] text-white shadow-lg"
              : "bg-white/60 text-slate-700 border-0 hover:bg-white/80 backdrop-blur-sm"
          }`}
        >
          Daily
        </Button>
        <Button
          variant={activeTab === "weekly" ? "default" : "outline"}
          onClick={() => setActiveTab("weekly")}
          className={`rounded-2xl px-8 py-3 font-semibold transition-all duration-300 ${
            activeTab === "weekly"
              ? "bg-[#192168] text-white shadow-lg"
              : "bg-white/60 text-slate-700 border-0 hover:bg-white/80 backdrop-blur-sm"
          }`}
        >
          Weekly
        </Button>
      </div>

      {/* Chart */}
      <div className="mb-10 bg-white/80 rounded-3xl shadow-lg p-6 border border-slate-100">
        {loading ? (
          <div className="text-center text-slate-500">Loading...</div>
        ) : error ? (
          <div className="text-center text-red-500">{error}</div>
        ) : (
          <AnalyticsChart chartData={chart} labels={chart.labels} />
        )}
      </div>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card className="bg-white/70 border-0 shadow-lg rounded-3xl">
          <CardContent className="p-6 text-center">
            <div className="flex items-center justify-center mb-2">
              <TrendingUp className="h-6 w-6 text-green-600 mr-2" />
              <h3 className="text-lg font-semibold text-green-600">Amount<br />Received</h3>
            </div>
            <p className="text-3xl font-bold text-green-700">रु{totalIncome.toLocaleString()}</p>
            <p className="text-sm text-slate-500 mt-1">{isBusinessMode ? 'Payments received from customers' : 'Money received'}</p>
          </CardContent>
        </Card>
        
        <Card className="bg-white/70 border-0 shadow-lg rounded-3xl">
          <CardContent className="p-6 text-center">
            <div className="flex items-center justify-center mb-2">
              <TrendingDown className="h-6 w-6 text-red-600 mr-2" />
              <h3 className="text-lg font-semibold text-red-600">Amount<br />Lent</h3>
            </div>
            <p className="text-3xl font-bold text-red-700">रु{totalOutcome.toLocaleString()}</p>
            <p className="text-sm text-slate-500 mt-1">{isBusinessMode ? 'Money lent to customers' : 'Money lent out'}</p>
          </CardContent>
        </Card>
        
        <Card className="bg-white/70 border-0 shadow-lg rounded-3xl">
          <CardContent className="p-6 text-center">
            <div className="flex items-center justify-center mb-2">
              <div className={`w-6 h-6 rounded-full mr-2 ${balance >= 0 ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <h3 className="text-lg font-semibold text-slate-800">Net Balance</h3>
            </div>
            <p className={`text-3xl font-bold ${balance >= 0 ? 'text-green-700' : 'text-red-700'}`}>
              रु{Math.abs(balance).toLocaleString()}
            </p>
            <p className="text-sm text-slate-500 mt-1">
              {balance >= 0 ? 'Net positive' : 'Net negative'} balance
            </p>
          </CardContent>
        </Card>
      </div>
      {/* History Section */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-slate-500 text-sm font-medium uppercase tracking-wider">{sectionInfo?.type || "Personal"}</p>
            <h2 className="text-slate-900 text-2xl font-bold">Recent Transactions</h2>
          </div>
          
        </div>
        <div className="space-y-2">
          {allTransactions.slice(0, visibleCount).map((rec, idx) => {
            if (isBusinessMode) {
              // Business loan rendering
              return (
                <Card key={rec.id || idx} className="bg-white/90 border-0 shadow-md rounded-2xl hover:shadow-lg transition-all">
                  <CardContent className="flex items-center justify-between p-5">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow overflow-hidden bg-gray-200">
                        {rec.customerProfilePic ? (
                          <img
                            src={rec.customerProfilePic}
                            alt={rec.customerName}
                            className="w-full h-full object-cover"
                            onError={e => { e.currentTarget.style.display = 'none'; }}
                          />
                        ) : (
                          <span className="text-white font-bold text-lg bg-gradient-to-br from-green-400 to-emerald-500 w-full h-full flex items-center justify-center">
                            {rec.customerName[0] || "C"}
                          </span>
                        )}
                      </div>
                      <div>
                        <p className="text-slate-800 font-semibold text-base">{rec.customerName}</p>
                        {rec.description && (
                          <p className="text-slate-500 text-xs max-w-xs truncate" title={rec.description}>
                            {rec.description.length > 30 ? rec.description.slice(0, 30) + "..." : rec.description}
                          </p>
                        )}
                        <p className="text-slate-400 text-xs">{new Date(rec.date).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-green-600 font-bold text-lg">
                        +रु{Number(rec.amount).toLocaleString()}
                      </p>
                      <div className="flex items-center gap-1 mt-1">
                        <div className={`w-2 h-2 rounded-full ${rec.isPaid ? 'bg-green-500' : 'bg-amber-500'}`}></div>
                        <p className="text-slate-500 text-xs">
                          {rec.isPaid ? 'Paid' : 'Unpaid'}
                        </p>
                      </div>
                      <p className="text-slate-400 text-xs">by {rec.addedBy}</p>
                    </div>
                  </CardContent>
                </Card>
              )
            } else {
              // Personal loan rendering (existing logic)
              let otherName = "Unknown"
              if (rec.lender_id === userId) {
                otherName = rec.receiver?.full_name || "Unknown"
              } else if (rec.receiver_id === userId) {
                otherName = rec.lender?.full_name || "Unknown"
              }
              return (
                <Card key={rec.id || idx} className="bg-white/90 border-0 shadow-md rounded-2xl hover:shadow-lg transition-all">
                  <CardContent className="flex items-center justify-between p-5">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow overflow-hidden bg-gray-200">
                        {(() => {
                          // Get the other person's profile picture
                          const otherPerson = rec.lender_id === userId ? rec.receiver : rec.lender;
                          const profilePic = otherPerson?.profile_pic;
                          
                          if (profilePic) {
                            return (
                              <img
                                src={profilePic}
                                alt={otherName}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  // On error, show initials fallback
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = 'none';
                                  const parent = target.parentElement;
                                  if (parent) {
                                    parent.innerHTML = `<span class="text-white font-bold text-lg bg-gradient-to-br from-blue-400 to-indigo-500 w-full h-full flex items-center justify-center">${otherName[0] || "U"}</span>`;
                                  }
                                }}
                              />
                            );
                          } else {
                            return (
                              <span className="text-white font-bold text-lg bg-gradient-to-br from-blue-400 to-indigo-500 w-full h-full flex items-center justify-center">
                                {otherName[0] || "U"}
                              </span>
                            );
                          }
                        })()}
                      </div>
                      <div>
                        <p className="text-slate-800 font-semibold text-base">{otherName}</p>
                        {/* Remark below name, truncated if too long */}
                        {(rec.reason) && (
                          <p className="text-slate-500 text-xs max-w-xs truncate" title={rec.reason}>
                            {rec.reason.length > 30 ? rec.reason.slice(0, 30) + "..." : rec.reason}
                          </p>
                        )}
                        <p className="text-slate-400 text-xs">{rec.created_at ? new Date(rec.created_at).toLocaleString() : ""}</p>
                      </div>
                    </div>
                    <span className={`text-lg font-bold ${rec.lender_id === userId ? "text-green-700" : "text-rose-700"}`}>
                      {rec.lender_id === userId ? "+" : "-"}रु {rec.amount}
                    </span>
                  </CardContent>
                </Card>
              )
            }
          })}
        </div>
        {/* Load More Button */}
        {visibleCount < allTransactions.length && (
            <Button
              className="w-full rounded-2xl not-only: mt-4 mb-4 bg-[#192168] text-white hover:bg-blue-700 font-semibold"
              onClick={() => setVisibleCount(visibleCount + 5)}
            >
              Load More
            </Button>
        )}
      </div>
    </div>
  )
}
