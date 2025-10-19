"use client";
import React, { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

const PRIMARY_COLOR = "#3a0ca3";
const TEXT_COLOR = "#3a0ca3";

export default function SignInPage() {
    const [showPassword, setShowPassword] = useState(false);
    const [password, setPassword] = useState("");
    const [email, setEmail] = useState("");
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/login`, {
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

            // Check content type before parsing JSON
            const contentType = res.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                throw new Error(`Expected JSON but got ${contentType}`);
            }

            const data = await res.json();
            const token = data.session?.access_token;

            if (token) {
                await onLogin(token);
            } else {
                throw new Error("No access token received");
            }
        } catch (err: any) {
            console.error("Login error:", err);
            setError(err.message || "Login failed");
        }
    };

    const onLogin = async (token: string) => {
        localStorage.setItem("token", token);
        localStorage.setItem("userEmail", email);
        let name = "User";
        let avatar = "/placeholder.svg";
        let phone = "";
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/profile`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (res.ok) {
                const { data } = await res.json();
                if (data) {
                    name = data.full_name || name;
                    avatar = data.profile_pic || avatar;
                    phone = data.ph_number || phone;
                }
            }
        } catch (err) {
            // fallback to defaults
        }
        if (typeof window !== "undefined") {
            localStorage.setItem("userName", name);
            localStorage.setItem("userAvatar", avatar);
            localStorage.setItem("userPhone", phone);
        }
        window.location.href = "/"; // Homepage
    };
    return (
        <div className={`min-h-screen flex flex-col bg-[${PRIMARY_COLOR}]`}>
            <div
                className="w-full min-h-[90vh] flex flex-col items-center justify-start relative"
                style={{ background: PRIMARY_COLOR }}
            >
                <img
                    src="/bara/happy_bara.png"
                    alt="Happy Bara"
                    className="object-contain mt-8 mb-4 drop-shadow-lg z-10"
                    style={{ width: "220px", height: "220px", position: "absolute", right: "20px", top: "60px", zIndex: 100 }}
                />
                <div
                    className="bg-white w-full rounded-t-3xl p-8 max-w-none fixed bottom-0 left-0 right-0 z-20"
                    style={{ minHeight: "70vh" }}
                >
                    <div className="text-left mb-8">
                        <h1 className="text-3xl font-semibold text-gray-900">Hello</h1>
                        <h2 className="text-2xl font-bold" style={{ color: TEXT_COLOR }}>
                            Sign in!
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
                                className="w-full border-b-2 border-gray-300 focus:border-[#3a0ca3] bg-transparent outline-none text-gray-800 placeholder-gray-400 py-2"
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
                        <div className="text-right">
                            <button
                                type="button"
                                className="text-sm text-gray-500 hover:underline"
                            >
                                Forgot password?
                            </button>
                        </div>
                        <button
                            type="submit"
                            className="w-full py-3 rounded-full text-white font-semibold shadow-md transition-all duration-300 hover:scale-105"
                            style={{ background: PRIMARY_COLOR }}
                        >
                            SIGN IN
                        </button>
                        <div className="text-center text-sm text-gray-500 mt-4">
                            Don’t have an account?{' '}
                            <a href="/register" className="font-semibold hover:underline" style={{ color: PRIMARY_COLOR }}>
                                Sign up
                            </a>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}



