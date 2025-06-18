"use client";
import { useState } from 'react';

export default function SimpleNotification({ token }: { token: string }) {
  const [showDropdown, setShowDropdown] = useState(false);

  if (!token) return null;

  return (
    <div className="relative">
      <button 
        onClick={() => setShowDropdown(!showDropdown)}
        className="flex items-center justify-center p-2 bg-blue-500 text-white rounded-full"
        title="Notifications"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
      </button>
      
      {showDropdown && (
        <div className="absolute right-0 mt-2 w-64 bg-white rounded-md shadow-lg z-50">
          <div className="p-3 border-b">
            <h3 className="font-semibold text-gray-800">Notifications</h3>
          </div>
          <div className="p-4 text-center text-gray-600">
            Notifications will appear here
          </div>
        </div>
      )}
    </div>
  );
}
