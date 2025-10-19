"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Send, Bot, User, Sparkles, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import ReactMarkdown from "react-markdown"

interface Message {
  id: string
  text: string
  sender: "user" | "bot"
  timestamp: Date
}

const GEMINI_API_URL = process.env.NEXT_PUBLIC_GEMINI_API_URL;

export default function AIChatScreen() {
  // Load chat history from sessionStorage on mount (before state init)
  const getInitialMessages = () => {
    if (typeof window !== "undefined") {
      const saved = sessionStorage.getItem("capy_ai_chat_history")
      if (saved) {
        try {
          const parsed = JSON.parse(saved)
          if (Array.isArray(parsed)) return parsed
        } catch {}
      }
    }
    return [
      {
        id: "1",
        text: "Namaste! I'm your Capy AI, a HisabKitab assistant. I can help with transactions, account info, and wallet questions. How can I help?",
        sender: "bot",
        timestamp: new Date(),
      },
    ]
  }
  const [messages, setMessages] = useState<Message[]>(getInitialMessages())
  const [inputText, setInputText] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  // Scroll to bottom on mount and when messages change
  useEffect(() => {
    scrollToBottom()
    // Also scroll to bottom on mount (when switching pages)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Save chat history to sessionStorage whenever messages change
  useEffect(() => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem("capy_ai_chat_history", JSON.stringify(messages))
    }
  }, [messages])

  // Fetch user loan history
  const fetchLoanHistory = async (token: string) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/loan-history", {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) return null
      const data = await res.json()
      return data.data || []
    } catch {
      return null
    }
  }

  // Fetch user present loans
  const fetchLoans = async (token: string) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/loans", {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) return null
      const data = await res.json()
      return data.data || []
    } catch {
      return null
    }
  }

  // Enhanced Gemini fetch: only answer finance/account questions, else reply with not relevant
  const fetchGeminiFinanceResponse = async (userMessage: string) => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null
    let loanHistory = []
    let presentLoans = []
    if (token) {
      loanHistory = await fetchLoanHistory(token)
      presentLoans = await fetchLoans(token)
    }
    // Summarize and format context for Gemini
    // Helper to map userId to name
    const userMap: Record<string, string> = {}
    ;[...(loanHistory || []), ...(presentLoans || [])].forEach((l: any) => {
      if (l.lender && l.lender.full_name) userMap[l.lender_id] = l.lender.full_name
      if (l.receiver && l.receiver.full_name) userMap[l.receiver_id] = l.receiver.full_name
    })
    const summarizeLoans = (loans: any[], userId: string) =>
      loans.length > 0
        ? loans.map((l: any) => `- ${l.lender_id === userId ? `Lent $${l.amount} to ${userMap[l.receiver_id] || 'Unknown'}` : `Borrowed $${l.amount} from ${userMap[l.lender_id] || 'Unknown'}`}${l.reason ? ` (${l.reason})` : ''}${l.due_date ? ' due ' + new Date(l.due_date).toLocaleDateString() : ''}${l.created_at ? ' on ' + new Date(l.created_at).toLocaleDateString() : ''}${l.paid_at ? ', paid on ' + new Date(l.paid_at).toLocaleDateString() : ''} [Status: ${l.status || 'N/A'}]`).join('\n')
        : 'No records.'
    let userId = ''
    if (token) {
      try {
        userId = JSON.parse(atob(token.split('.')[1])).sub
      } catch {}
    }
    const context = `.You are Capy AI, a friendly financial assistant.The amounts that you are reading are all in Nepali rupess (रु) , when the users ask you to show them the amount use the rupee notaion and show the same amount as in the homescreen.\n\nUser's Loan History (summarized):\n${summarizeLoans(loanHistory, userId)}\n\nCurrent Loans (summarized):\n${summarizeLoans(presentLoans, userId)}\n\nUser Query: ${userMessage}\n\nIf the question is not about finance, loans, or account, reply: 'Sorry, I can only answer questions related to your finances, loans, or account.' Otherwise, answer in friendly, concise markdown, summarizing only the most relevant details for the user.`
    try {
      const res = await fetch(GEMINI_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            { parts: [{ text: context }] },
          ],
        }),
      })
      const data = await res.json()
      return data?.candidates?.[0]?.content?.parts?.[0]?.text || "Sorry, I couldn't get a response from Gemini."
    } catch (error) {
      return "Sorry, there was an error connecting to Gemini."
    }
  }

  // Fetch Gemini API response
  const fetchGeminiResponse = async (userMessage: string): Promise<string> => {
    if (!GEMINI_API_URL) {
      return "Gemini API URL is not set. Please check your .env configuration."
    }
    try {
      const res = await fetch(GEMINI_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: userMessage }],
            },
          ],
        }),
      })
      const data = await res.json()
      return data?.candidates?.[0]?.content?.parts?.[0]?.text || "Sorry, I couldn't get a response from Gemini."
    } catch (error) {
      return "Sorry, there was an error connecting to Gemini."
    }
  }

  const handleSendMessage = async () => {
    if (!inputText.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText,
      sender: "user",
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInputText("")
    setIsTyping(true)

    const botText = await fetchGeminiFinanceResponse(inputText)
    const botResponse: Message = {
      id: (Date.now() + 1).toString(),
      text: botText,
      sender: "bot",
      timestamp: new Date(),
    }
    setMessages((prev) => [...prev, botResponse])
    setIsTyping(false)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const quickActions = ["Check my balance", "Recent transactions", "Send money help", "Group information"]

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-[#eaf6ff] to-[#f8fbff]">
      {/* Header (Capy AI) - fixed */}
      <div className="fixed top-0 left-0 right-0 z-30 border-b px-6 py-4 bg-white/80 backdrop-blur-xl rounded-b-3xl shadow-[#b7dfef] shadow-2xl">
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          <div className="flex items-center gap-3">
       <Avatar className="h-10 w-10 shadow ring-2 ring-[#95e1ff] flex-shrink-0 bg-white relative overflow-visible">
                  <img
                    src="/chatbot.png"
                    alt="Capy AI Bot"
                    className="object-contain absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 z-10 pointer-events-none select-none"
                    style={{ filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.15))' }}
                  />
                  <AvatarFallback className="text-white bg-transparent">
                    {/* <Bot className="h-5 w-5" /> */}
                  </AvatarFallback>
                </Avatar>
        <div>
          <h1 className="text-xl font-bold text-[#192168] tracking-tight">HisabKitab AI</h1>
        </div>
          </div>
          <Button
        variant="ghost"
        size="sm"
        className="rounded-xl px-3 py-2 transition-colors duration-200 bg-[#c2def3] text-[#035fa5] hover:bg-[#048abf] hover:text-white"
        onClick={() => {
          const actions = ["Check my balance", "Recent transactions", "Send money help", "Group information"]
          const randomAction = actions[Math.floor(Math.random() * actions.length)]
          setInputText(randomAction)
        }}
        aria-label="Quick action"
          >
        <Sparkles className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Message Section - scrollable only */}
      <div className="flex-1 flex flex-col justify-end max-w-2xl w-full mx-auto px-2 sm:px-0 relative pt-[72px]" style={{ maxHeight: '80vh' }}>
        <div className="flex-1 overflow-y-auto py-6 space-y-6 mb-4 scrollbar-thin scrollbar-thumb-[#95e1ff]/60 scrollbar-track-transparent" style={{ scrollPaddingTop: '88px' }}>
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 items-end ${message.sender === "user" ? "justify-end" : "justify-start"}`}
            >
              {message.sender === "bot" && (
                <Avatar className="h-9 w-9 shadow ring-2 ring-[#95e1ff] flex-shrink-0 bg-gradient-to-br from-[#035fa5] to-[#048abf]">
                  <AvatarFallback className="text-white bg-transparent">
                    <Bot className="h-5 w-5" />
                  </AvatarFallback>
                </Avatar>
              )}
              <div className={`max-w-[80%] ${message.sender === "user" ? "order-1" : ""}`}>
                <Card
                  className={`rounded-2xl shadow-md border-0 transition-all duration-200 ${message.sender === "user" ? "bg-gradient-to-br from-[#035fa5] to-[#048abf] text-white" : "bg-white/90 text-[#192168]"}`}
                >
                  <CardContent className="p-4 pt-2 pb-2">
                    {message.sender === "bot" ? (
                      <div className="prose prose-sm max-w-none" style={{ color: '#192168' }}>
                        <ReactMarkdown>{message.text}</ReactMarkdown>
                      </div>
                    ) : (
                      <p className="text-sm leading-relaxed whitespace-pre-line">{message.text}</p>
                    )}
                  </CardContent>
                </Card>
              </div>
              {message.sender === "user" && (
                <Avatar className="h-9 w-9  order-2 flex-shrink-0 bg-gradient-to-br from-[#192168] to-[#035fa5]">
                  <img
                    src={typeof window !== "undefined" ? (localStorage.getItem("userAvatar") || "/placeholder.svg") : "/placeholder.svg"}
                    alt="User Avatar"
                    className="object-cover w-full h-full rounded-full"
                  />
                  <AvatarFallback className="text-white bg-transparent">
                    <User className="h-5 w-5" />
                  </AvatarFallback>
                </Avatar>
              )}
            </div>
          ))}

          {isTyping && (
            <div className="flex gap-3 items-end justify-start animate-pulse">
              <Avatar className="h-9 w-9 shadow ring-2 ring-[#95e1ff] flex-shrink-0 bg-gradient-to-br from-[#035fa5] to-[#048abf]">
                <AvatarFallback className="text-white bg-transparent">
                  <Bot className="h-5 w-5" />
                </AvatarFallback>
              </Avatar>
              <Card className="rounded-2xl shadow-md border-0 bg-white/90">
                <CardContent className="p-4 flex gap-1">
                  <div className="w-2 h-2 rounded-full bg-[#035fa5] animate-bounce" />
                  <div className="w-2 h-2 rounded-full bg-[#048abf] animate-bounce delay-100" />
                  <div className="w-2 h-2 rounded-full bg-[#95e1ff] animate-bounce delay-200" />
                </CardContent>
              </Card>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area - fixed above bottom nav */}
        <div className="fixed left-0 right-0 z-40 bottom-22 sm:bottom-24 py-4 px-2 sm:px-0">
          <div className="w-full max-w-2xl mx-auto">
            <Card className="rounded-2xl border-0 bg-white/95">
              <CardContent className="p-3 flex items-center gap-3">
                <Input
                  ref={inputRef}
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask me anything about your finances..."
                  className="border-0 rounded-xl py-3 px-4 text-sm bg-[#eaf6ff] focus:bg-white focus:ring-2 focus:ring-[#95e1ff] transition-all duration-200 w-full shadow-none"
                  style={{ color: "#192168" }}
                  aria-label="Type your message"
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!inputText.trim() || isTyping}
                  size="icon"
                  className="rounded-2xl shadow-lg transition-all duration-300 disabled:opacity-70 h-10 w-10 flex-shrink-0 bg-[#192168] text-white hover:scale-105 focus:ring-2 focus:ring-[#048abf]"
                  aria-label="Send message"
                >
                  <Send className="h-6 w-6" />
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}


