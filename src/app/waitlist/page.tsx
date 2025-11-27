"use client";

import { useState } from "react";

export default function WaitlistPage() {
  const CALENDLY_URL = process.env.NEXT_PUBLIC_CALENDLY_URL;
  const [activeTab, setActiveTab] = useState<"book" | "waitlist" | null>(null);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleWaitlistSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!fullName.trim()) {
      setSubmitMessage({ type: "error", text: "Full name is required" });
      return;
    }

    if (!email.trim()) {
      setSubmitMessage({ type: "error", text: "Email is required" });
      return;
    }

    if (!validateEmail(email)) {
      setSubmitMessage({ type: "error", text: "Please enter a valid email" });
      return;
    }

    setIsSubmitting(true);
    setSubmitMessage(null);

    try {
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const response = await fetch(`${apiBaseUrl}/api/public/waitlist-signup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fullName: fullName.trim(),
          email: email.trim(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to join waitlist");
      }

      setSubmitMessage({
        type: "success",
        text: "Thank you! You've been added to our waitlist. Check your email for confirmation.",
      });
      setFullName("");
      setEmail("");
    } catch (error) {
      setSubmitMessage({
        type: "error",
        text:
          error instanceof Error ? error.message : "Failed to join waitlist",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    setActiveTab(null);
    setFullName("");
    setEmail("");
    setSubmitMessage(null);
  };

  return (
    <div className="min-h-screen bg-[#fff8f3] flex flex-col">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <a href="/" className="text-2xl font-extrabold text-orange-500 tracking-tight hover:opacity-80 transition-opacity">
            HÜNGY
          </a>
          <a
            href="/"
            className="flex items-center text-orange-500 hover:text-orange-600 font-medium transition-colors"
          >
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back Home
          </a>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-4 py-6">
        <div className="w-full max-w-2xl">
          {/* Initial Choice Screen */}
          {activeTab === null && (
            <div className="animate-fadeIn">
              <div className="text-center mb-12">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  Join Our Community
                </h1>
                <p className="text-gray-600">
                  Choose how you'd like to get involved
                </p>
              </div>

              {/* Option Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Book Now Card */}
                <button
                  onClick={() => setActiveTab("book")}
                  className="group relative bg-white rounded-lg shadow-lg border border-gray-100 p-8 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer"
                >
                  <div className="text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-100 rounded-full mb-4 group-hover:bg-orange-200 transition-colors">
                      <svg
                        className="w-8 h-8 text-orange-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 mb-2">
                      Book Now
                    </h2>
                    <p className="text-sm text-gray-600">
                        Schedule a 1:1 call with Hungy’s founders to explore how your organization can pilot the platform
                    </p>
                  </div>
                </button>

                {/* Join Waitlist Card */}
                <button
                  onClick={() => setActiveTab("waitlist")}
                  className="group relative bg-white rounded-lg shadow-lg border border-gray-100 p-8 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer"
                >
                  <div className="text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4 group-hover:bg-blue-200 transition-colors">
                      <svg
                        className="w-8 h-8 text-blue-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 mb-2">
                      Join Waitlist
                    </h2>
                    <p className="text-sm text-gray-600">
                    Get early access to Hungy’s next rollout and be the first to know when new pilot spots open.                    
                    </p>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* Content Container */}
          {activeTab !== null && (
            <div className="animate-fadeIn">
              {/* Back Button */}
              <button
                onClick={handleBack}
                className="mb-6 flex items-center text-orange-500 hover:text-orange-600 font-medium transition-colors"
              >
                <svg
                  className="w-5 h-5 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
                Back
              </button>

              {/* Book Now Content */}
              {activeTab === "book" && (
                <div className="animate-slideIn">
                  <div className="text-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 mb-1">
                      Schedule Your Meeting
                    </h2>
                    <p className="text-sm text-gray-600">
                      Choose a time that works best for you
                    </p>
                  </div>

                  <div className="bg-white rounded-lg shadow-lg overflow-hidden border border-gray-100">
                    <div
                      style={{
                        position: "relative",
                        paddingBottom: "120%",
                        height: 0,
                        overflow: "hidden",
                      }}
                    >
                      <iframe
                        src={`${CALENDLY_URL}?hide_event_type_details=1&hide_gdpr_block=1`}
                        width="100%"
                        height="100%"
                        title="Schedule a meeting with us"
                        style={{
                          position: "absolute",
                          top: 0,
                          left: 0,
                          width: "100%",
                          height: "100%",
                        }}
                        allowFullScreen
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Join Waitlist Content */}
              {activeTab === "waitlist" && (
                <div className="animate-slideIn">
                  <div className="text-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 mb-1">
                      Join Our Waitlist
                    </h2>
                    <p className="text-sm text-gray-600">
                      We'll notify you when opportunities are available
                    </p>
                  </div>

                  <div className="bg-white rounded-lg shadow-lg p-8 border border-gray-100">
                    <form onSubmit={handleWaitlistSubmit} className="space-y-4">
                      <div>
                        <label
                          htmlFor="fullName"
                          className="block text-sm font-medium text-gray-700 mb-2"
                        >
                          Full Name
                        </label>
                        <input
                          id="fullName"
                          type="text"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          placeholder="Enter your full name"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          disabled={isSubmitting}
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="email"
                          className="block text-sm font-medium text-gray-700 mb-2"
                        >
                          Email Address
                        </label>
                        <input
                          id="email"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="Enter your email"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          disabled={isSubmitting}
                        />
                      </div>

                      {submitMessage && (
                        <div
                          className={`p-3 rounded-lg text-sm animate-fadeIn ${
                            submitMessage.type === "success"
                              ? "bg-green-50 text-green-800 border border-green-200"
                              : "bg-red-50 text-red-800 border border-red-200"
                          }`}
                        >
                          {submitMessage.text}
                        </div>
                      )}

                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full bg-blue-500 text-white py-3 rounded-lg font-semibold hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isSubmitting ? "Joining..." : "Join Waitlist"}
                      </button>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t py-4 mt-auto">
        <div className="max-w-5xl mx-auto px-4 text-center text-gray-500 text-xs">
          <p>© 2025 HÜNGY - Waitlist</p>
        </div>
      </footer>

      {/* Animations */}
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.3s ease-in-out;
        }

        .animate-slideIn {
          animation: slideIn 0.3s ease-in-out;
        }
      `}</style>
    </div>
  );
}
