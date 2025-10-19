"use client";
import React, { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

const PRIMARY_COLOR = "#3a0ca3";
const TEXT_COLOR = "#3a0ca3";

export default function SignUpPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    try {
      const res = await fetch("http://localhost:3000/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        const contentType = res.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const errorData = await res.json();
          throw new Error(errorData.error || `Error ${res.status}: ${res.statusText}`);
        } else {
          const text = await res.text();
          throw new Error(text || `Error ${res.status}: ${res.statusText}`);
        }
      }
      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error(`Expected JSON but got ${contentType}`);
      }
      const data = await res.json();
      setSuccess("Registration successful! Check your email.");
      setEmail("");
      setPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setError(err.message || "Network error");
    }
  };

  return (
    <div className={`min-h-screen flex flex-col bg-[${PRIMARY_COLOR}]`}>
      <div
        className="w-full min-h-[90vh] flex items-end justify-center"
        style={{ background: PRIMARY_COLOR }}
      >
        <div
            className="object-contain mt-8 mb-4 drop-shadow-lg z-10"
            style={{ width: "220px", height: "220px", position: "absolute", right: "20px", top: "60px", zIndex: 100 }}
          >
            <img
              src="/bara/happy_bara.png"
              alt="Happy Bara"
              style={{ width: "100%", height: "100%" }}
            />
          </div>
        <div
          className="bg-white w-full rounded-t-3xl p-8 max-w-none absolute bottom-0 left-0 right-0"
          style={{ minHeight: "70vh" }}
        >
          <div className="text-left mb-8">
            <h1 className="text-3xl font-semibold text-gray-900">Hello</h1>
            <h2 className="text-2xl font-bold" style={{ color: TEXT_COLOR }}>
              Create Account
            </h2>
          </div>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium mb-1"
                style={{ color: TEXT_COLOR }}
              >
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                placeholder="you@example.com"
                className="w-full border-b-2 border-gray-300 focus:border-[#ba0f39] bg-transparent outline-none text-gray-800 placeholder-gray-400 py-2"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium mb-1"
                style={{ color: TEXT_COLOR }}
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="••••••"
                  className="w-full border-b-2 border-gray-300 focus:border-[#3a0ca3] bg-transparent outline-none text-gray-800 placeholder-gray-400 py-2 pr-10"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-2 text-gray-400 hover:text-[#3a0ca3]"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>
            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium mb-1"
                style={{ color: TEXT_COLOR }}
              >
                Confirm Password
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  placeholder="••••••"
                  className="w-full border-b-2 border-gray-300 focus:border-[#3a0ca3] bg-transparent outline-none text-gray-800 placeholder-gray-400 py-2 pr-10"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-2 top-2 text-gray-400 hover:text-[#3a0ca3]"
                  tabIndex={-1}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
              {confirmPassword && confirmPassword !== password && (
                <p className="text-red-500 text-xs mt-1">
                  Passwords do not match.
                </p>
              )}
            </div>
            {error && <div className="text-red-600 text-center mt-2">{error}</div>}
            {success && <div className="text-green-600 text-center mt-2">{success}</div>}
            <button
              type="submit"
              className="w-full py-3 rounded-full text-white font-semibold shadow-md transition-all duration-300 hover:scale-105"
              style={{ background: PRIMARY_COLOR }}
            >
              SIGN UP
            </button>
            <div className="text-center text-sm text-gray-500 mt-4">
              Already have an account?{' '}
              <a href="/login" className="font-semibold hover:underline" style={{ color: PRIMARY_COLOR }}>
                Sign in
              </a>
            </div>
          </form>
          
        </div>
      </div>
    </div>
  );
}
