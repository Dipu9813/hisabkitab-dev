"use client";
import { useState, useEffect, useRef } from "react";
import { jwtDecode } from "jwt-decode";

interface Message {
  id: string;
  message: string;
  sender_id: string;
  sent_at: string;
  details?: {
    full_name: string;
    profile_pic?: string;
  };
}

interface GroupChatInterfaceProps {
  token: string;
  groupId: string;
  groupName: string;
}

export default function GroupChatInterface({ token, groupId, groupName }: GroupChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Get current user id from JWT
  let currentUserId = "";
  let currentUserName = "";
  try {
    const decoded = jwtDecode<{ sub: string; name?: string }>(token);
    currentUserId = decoded.sub;
    currentUserName = decoded.name || "You";
  } catch {}
  useEffect(() => {
    fetchMessages();
    
    // Set up real-time polling every 1.5 seconds for better responsiveness
    const interval = setInterval(() => {
      fetchMessages();
    }, 1500);
    
    return () => clearInterval(interval);
  }, [groupId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Focus input on load
    inputRef.current?.focus();
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  const fetchMessages = async () => {
    console.log('📥 Fetching messages for group:', groupId);
    
    try {
      const res = await fetch(`http://localhost:3000/groups/${groupId}/messages`, {
        headers: { "Authorization": `Bearer ${token}` },
      });
      
      if (!res.ok) {
        throw new Error(`Error ${res.status}: ${res.statusText}`);
      }
      
      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error(`Expected JSON but got ${contentType}`);
      }
      
      const data = await res.json();
      if (data.data && Array.isArray(data.data)) {
        setMessages(data.data);
      }
      setError(""); // Clear error on successful fetch
    } catch (err: any) {
      console.error("Error fetching messages:", err);
      setError("Failed to load messages");
    }
  };
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMessage.trim()) return;
    
    const messageToSend = newMessage.trim();
    setNewMessage("");
    setLoading(true);
    setError("");
      // Simulate typing indicator for others
    setIsTyping(true);
      console.log('🚀 Sending message:', messageToSend, 'to group:', groupId);
    console.log('🔑 Using token:', token ? 'Token present' : 'No token');
    console.log('📋 Request payload:', JSON.stringify({ message: messageToSend }));
    
    try {
      const res = await fetch(`http://localhost:3000/groups/${groupId}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },        body: JSON.stringify({
          message: messageToSend,
        }),
      });      console.log('📡 Response status:', res.status);
      console.log('📡 Response headers:', res.headers.get('content-type'));      if (!res.ok) {
        const contentType = res.headers.get('content-type');
        console.log('❌ Request failed with status:', res.status);
        console.log('❌ Content type:', contentType);
        
        try {
          if (contentType && contentType.includes('application/json')) {
            const errorData = await res.json();
            console.log('❌ Error response data:', errorData);
            throw new Error(`Server error (${res.status}): ${errorData.error || res.statusText}`);
          } else {
            const textResponse = await res.text();
            console.log('❌ Non-JSON error response:', textResponse);
            throw new Error(`Server error (${res.status}): ${textResponse || res.statusText}`);
          }
        } catch (parseError) {
          console.log('❌ Failed to parse error response:', parseError);
          throw new Error(`Server error (${res.status}): ${res.statusText}`);
        }
      }

      // Immediately fetch new messages to update UI
      fetchMessages();      
    } catch (err: any) {
      console.error("Error sending message:", err);
      console.error("Full error details:", err);
      setError("Failed to send message");
      setNewMessage(messageToSend); // Restore message on error
    } finally {
      setLoading(false);
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    
    if (isToday) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' }) + 
             ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
  };
  const renderMessage = (message: Message, index: number) => {
    const isOwn = message.sender_id === currentUserId;
    const prevMessage = index > 0 ? messages[index - 1] : null;
    const nextMessage = index < messages.length - 1 ? messages[index + 1] : null;
    const showSender = !prevMessage || prevMessage.sender_id !== message.sender_id;
    const isLast = !nextMessage || nextMessage.sender_id !== message.sender_id;
    const senderName = message.details?.full_name || (isOwn ? "You" : "Unknown User");

    return (
      <div key={message.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-1`}>
        <div className={`max-w-xs lg:max-w-md ${isOwn ? 'order-2' : 'order-1'}`}>
          {showSender && !isOwn && (
            <div className="text-xs text-gray-500 mb-1 px-3 font-medium">{senderName}</div>
          )}
          <div
            className={`px-4 py-2 shadow-sm ${
              isOwn
                ? 'bg-blue-600 text-white rounded-2xl rounded-br-md'
                : 'bg-white text-gray-900 border border-gray-100 rounded-2xl rounded-bl-md'
            } ${
              showSender && isLast 
                ? ''
                : showSender 
                  ? isOwn ? 'rounded-br-2xl' : 'rounded-bl-2xl'
                  : isLast
                    ? isOwn ? 'rounded-br-md' : 'rounded-bl-md'
                    : 'rounded-2xl'
            }`}
          >
            <p className="text-sm break-words leading-relaxed">{message.message}</p>
            {isLast && (
              <div className={`text-xs mt-1 ${isOwn ? 'text-blue-100' : 'text-gray-500'}`}>
                {formatTime(message.sent_at)}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {error && (
          <div className="text-center py-4">
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          </div>
        )}
        
        {messages.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-gray-500 mb-4">
              <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <p className="text-lg font-medium">Welcome to {groupName}!</p>
              <p className="text-sm">Start the conversation by sending a message.</p>
            </div>
          </div>
        ) : (
          messages.map((message, index) => renderMessage(message, index))
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input Area */}
      <div className="border-t bg-white p-4">
        <form onSubmit={handleSendMessage} className="flex items-end space-x-3">
          <div className="flex-1">
            <div className="relative">
              <input
                ref={inputRef}
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type a message..."
                className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                disabled={loading}
              />
              {/* Emoji button placeholder */}
              <button
                type="button"
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
            </div>
          </div>
          
          <button
            type="submit"
            disabled={loading || !newMessage.trim()}
            className={`p-3 rounded-full transition-all ${
              newMessage.trim() && !loading
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            )}
          </button>
        </form>
        
        {isTyping && (
          <div className="mt-2 text-xs text-gray-500">
            Someone is typing...
          </div>
        )}
      </div>
    </div>
  );
}
