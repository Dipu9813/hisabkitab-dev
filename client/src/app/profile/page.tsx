"use client";
import { useEffect, useState } from "react";
import ProfileForm from "../../components/ProfileForm";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
  const [token, setToken] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    // Try to get token from localStorage
    const t = localStorage.getItem("token");
    if (!t) {
      router.replace("/login");
    } else {
      setToken(t);
    }
  }, [router]);
  if (!token) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </main>
    );
  }
  
  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <header className="bg-white shadow-md border-b border-gray-200 mb-8">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center">
            <button 
              onClick={() => router.push('/home')}
              className="mr-4 text-gray-600 hover:text-blue-600 flex items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Dashboard
            </button>
            <h1 className="text-xl font-semibold text-gray-800">Profile Settings</h1>
          </div>
        </div>
      </header>
      
      <div className="container mx-auto px-4 py-6">
        <ProfileForm token={token} />
      </div>
    </main>
  );
}
