"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import Logo from "../../components/Logo";

interface PayCaseData {
  caseId: string;
  customerName: string;
  amountMinor: number;
  plan: string;
  failureReason: string;
  invoiceId: string;
  dueDate: string;
}

export default function CustomerPayPortalPage() {
  const params = useParams();
  const rawCaseId = (params?.caseId as string) || "RC-1001";
  const caseIdNormalized = rawCaseId.toUpperCase();

  const [paymentMethod, setPaymentMethod] = useState<"upi" | "card" | "netbanking">("upi");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPaid, setIsPaid] = useState(false);
  const [appliedDiscount, setAppliedDiscount] = useState<number>(0);
  const [extensionGranted, setExtensionGranted] = useState(false);

  // Card Form State
  const [cardNumber, setCardNumber] = useState("4532 8901 2345 6789");
  const [cardExpiry, setCardExpiry] = useState("09/28");
  const [cardCvv, setCardCvv] = useState("842");
  const [cardHolder, setCardHolder] = useState("Varun Das");

  // AI Concierge Chat State
  const [chatMessages, setChatMessages] = useState<Array<{ role: "ai" | "user"; text: string }>>([
    {
      role: "ai",
      text: "Hello! I am your Aurum Recovery Concierge. If you need a brief grace period or have billing questions, feel free to ask.",
    },
  ]);
  const [chatInput, setChatInput] = useState("");

  const [caseData, setCaseData] = useState<PayCaseData>({
    caseId: caseIdNormalized,
    customerName: caseIdNormalized === "RC-1004" ? "Cyberdyne Systems" : "Varun Das",
    amountMinor: caseIdNormalized === "RC-1004" ? 249900 : 249900,
    plan: "Enterprise Pro Subscription",
    failureReason: "Card Expiration / Issuer Timeout",
    invoiceId: `INV-2026-${caseIdNormalized.replace(/[^0-9]/g, "") || "8841"}`,
    dueDate: "Immediate Renewal",
  });

  // Fetch real case from backend if connected
  useEffect(() => {
    async function loadCase() {
      try {
        const res = await fetch(`http://localhost:8001/api/recovery/cases`, {
          headers: { "X-API-Key": "demo-api-key-123" },
        });
        if (res.ok) {
          const data = await res.json();
          const found = data.find((c: any) => c.caseId?.toUpperCase() === caseIdNormalized);
          if (found) {
            setCaseData({
              caseId: found.caseId,
              customerName: found.customerName || "Enterprise Customer",
              amountMinor: found.amountMinor || 249900,
              plan: found.plan || "Enterprise Pro Plan",
              failureReason: found.failureReason || "Temporary Gateway Timeout",
              invoiceId: `INV-2026-${found.caseId.replace(/[^0-9]/g, "")}`,
              dueDate: "Immediate",
            });
            if (found.status === "RECOVERED") {
              setIsPaid(true);
            }
          }
        }
      } catch (e) {
        // use fallback defaults
      }
    }
    loadCase();
  }, [caseIdNormalized]);

  const payableAmountMinor = Math.round(caseData.amountMinor * (1 - appliedDiscount));
  const payableRupees = payableAmountMinor / 100;

  const handleCompletePayment = async (method: string) => {
    setIsProcessing(true);
    await new Promise((r) => setTimeout(r, 1200));

    // Post settlement to backend if possible
    try {
      await fetch(`http://localhost:8001/api/recovery/cases/${caseData.caseId}/execute`, {
        method: "POST",
        headers: { "X-API-Key": "demo-api-key-123" },
      });
    } catch (e) {
      // ignore in offline mode
    }

    setIsProcessing(false);
    setIsPaid(true);
  };

  const handleSendChat = (presetText?: string) => {
    const query = presetText || chatInput.trim();
    if (!query) return;

    const newMsgs = [...chatMessages, { role: "user" as const, text: query }];
    setChatMessages(newMsgs);
    setChatInput("");

    setTimeout(() => {
      let reply = "I understand. I have verified your account telemetry. How else may I assist you?";
      if (query.toLowerCase().includes("extension") || query.toLowerCase().includes("grace")) {
        setExtensionGranted(true);
        reply = "✓ Grace Period Approved: I have extended your payment window by 72 hours. Your enterprise services will remain fully active with zero interruption.";
      } else if (query.toLowerCase().includes("discount") || query.toLowerCase().includes("offer")) {
        setAppliedDiscount(0.05);
        reply = "✓ Recovery Incentive Applied: I have authorized a 5% discount (AURUM-RECOVER-5) on your invoice. Your new total has been updated below!";
      } else if (query.toLowerCase().includes("receipt") || query.toLowerCase().includes("tax")) {
        reply = "A GST-compliant tax invoice will be generated and emailed to your billing contact immediately upon completion.";
      }
      setChatMessages((prev) => [...prev, { role: "ai", text: reply }]);
    }, 600);
  };

  const handleDownloadInvoice = () => {
    const text = `================================================================================
AURUM ENTERPRISE REVENUE SETTLEMENT RECEIPT
================================================================================
Invoice Number:      ${caseData.invoiceId}
Transaction ID:      rzp_settle_${Math.random().toString(36).substring(2, 9)}
Case Reference:      ${caseData.caseId}
Customer Name:       ${caseData.customerName}
Plan Description:    ${caseData.plan}
Base Amount:         INR ${((caseData.amountMinor) / 100).toFixed(2)}
Discount Applied:    ${appliedDiscount > 0 ? "5% (AURUM-RECOVER-5)" : "None"}
Net Settled:         INR ${payableRupees.toFixed(2)}
Payment Status:      COMPLETED & VERIFIED
Settlement Method:   ${paymentMethod.toUpperCase()} (Razorpay 256-bit Encrypted)
Date & Timestamp:    ${new Date().toLocaleString()}

Thank you for choosing Aurum Enterprise. Your account is in good standing.
================================================================================`;

    const blob = new Blob([text], { type: "text/plain;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Invoice_${caseData.invoiceId}_Receipt.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-[#120e0a] text-[#ebe1d6] font-sans selection:bg-[#fbc162]/30 selection:text-[#fbc162]">
      {/* Top Header */}
      <header className="border-b border-[#342D24] bg-[#17130c]/90 backdrop-blur px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Logo size="sm" />
          <div className="h-4 w-px bg-[#342D24]" />
          <span className="font-mono text-xs text-[#a79f93] tracking-widest uppercase">
            SECURE CHECKOUT &amp; RESOLUTION PORTAL
          </span>
        </div>
        <div className="flex items-center gap-3 font-mono text-[11px] text-[#a79f93]">
          <span className="flex items-center gap-1 text-emerald-400">
            <span className="material-symbols-outlined text-sm">lock</span>
            256-Bit SSL Encrypted
          </span>
          <span className="hidden sm:inline">·</span>
          <span className="hidden sm:inline">RBI e-Mandate Compliant</span>
        </div>
      </header>

      {/* Main Payment Container */}
      <main className="max-w-4xl mx-auto py-10 px-4 sm:px-6 space-y-8 font-mono">
        {/* Settlement Completed State */}
        {isPaid ? (
          <div className="bg-[#1f1812] border-2 border-emerald-500/60 rounded-2xl p-8 text-center space-y-6 shadow-2xl animate-fade-in">
            <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto">
              <span className="material-symbols-outlined text-4xl">verified</span>
            </div>
            <div>
              <span className="text-[10px] text-emerald-400 uppercase font-bold tracking-widest block mb-1">
                TRANSACTION CONFIRMED &amp; SETTLED
              </span>
              <h2 className="text-3xl font-extrabold text-white">Payment Received: ₹{payableRupees.toLocaleString("en-IN")}</h2>
              <p className="text-xs text-[#a79f93] mt-2 max-w-md mx-auto">
                Your subscription has been renewed successfully. Services for <strong className="text-white">{caseData.customerName}</strong> are active with zero disruption.
              </p>
            </div>

            <div className="bg-[#17130c] p-4 rounded-lg border border-[#342D24] max-w-md mx-auto text-left text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-[#a79f93]">Invoice Number:</span>
                <span className="text-white font-bold">{caseData.invoiceId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#a79f93]">Case Reference:</span>
                <span className="text-white font-bold">{caseData.caseId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#a79f93]">Gateway Auth Code:</span>
                <span className="text-emerald-400 font-bold">RZP-AUTH-OK-{Date.now().toString().slice(-6)}</span>
              </div>
            </div>

            <div className="flex justify-center gap-3 pt-2">
              <button
                onClick={handleDownloadInvoice}
                className="px-5 py-2.5 rounded bg-[#fbc162] text-[#17130c] font-bold text-xs uppercase hover:bg-[#dda64a] cursor-pointer flex items-center gap-1.5 shadow"
              >
                <span className="material-symbols-outlined text-sm">download</span>
                Download Tax Invoice
              </button>
              <Link
                href="/dashboard"
                className="px-5 py-2.5 rounded border border-[#342D24] text-[#d4c4b1] hover:border-[#fbc162] text-xs font-bold uppercase flex items-center gap-1.5"
              >
                Return to Dashboard
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
            {/* Left Column: Invoice Details & AI Chat */}
            <div className="md:col-span-5 space-y-6">
              {/* Invoice Summary */}
              <div className="bg-[#1f1812] border border-[#342D24] rounded-xl p-5 space-y-4">
                <div className="flex justify-between items-start border-b border-[#342D24] pb-3">
                  <div>
                    <span className="text-[10px] text-[#fbc162] uppercase font-bold tracking-wider block">INVOICE SUMMARY</span>
                    <h3 className="text-base font-bold text-white mt-0.5">{caseData.invoiceId}</h3>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-rose-950/60 text-rose-400 border border-rose-500/30 text-[10px] font-bold">
                    RENEWAL DUE
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-[#a79f93]">Customer Name:</span>
                    <span className="text-white font-bold">{caseData.customerName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#a79f93]">Plan Tier:</span>
                    <span className="text-white">{caseData.plan}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#a79f93]">Case Reference:</span>
                    <span className="text-[#fbc162]">{caseData.caseId}</span>
                  </div>
                  {appliedDiscount > 0 && (
                    <div className="flex justify-between text-emerald-400">
                      <span>Early Recovery Incentive (5%):</span>
                      <span>-₹{((caseData.amountMinor * 0.05) / 100).toFixed(2)}</span>
                    </div>
                  )}
                  {extensionGranted && (
                    <div className="flex justify-between text-cyan-300">
                      <span>Grace Period Status:</span>
                      <span>+72h Extension Active</span>
                    </div>
                  )}
                  <div className="border-t border-[#342D24] pt-2 flex justify-between text-sm">
                    <span className="text-[#a79f93]">Total Amount:</span>
                    <span className="text-xl font-extrabold text-[#fbc162]">₹{payableRupees.toLocaleString("en-IN")}</span>
                  </div>
                </div>

                {/* Friendly Context Message */}
                <div className="p-3 bg-[#17130c] rounded border border-[#342D24] text-[11px] text-[#a79f93] space-y-1">
                  <span className="text-[#fbc162] font-bold block flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">info</span>
                    Notice: Temporary Bank Delay
                  </span>
                  <p>
                    Your recent automated card debit encountered a routine bank switch timeout. Complete settlement now to ensure uninterrupted workspace continuity.
                  </p>
                </div>
              </div>

              {/* Embedded AI Billing Concierge */}
              <div className="bg-[#1f1812] border border-[#342D24] rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-xs text-white font-bold">Aurum AI Billing Concierge</span>
                </div>

                {/* Chat Stream */}
                <div className="bg-[#17130c] p-3 rounded border border-[#342D24] space-y-2 max-h-40 overflow-y-auto text-[11px]">
                  {chatMessages.map((m, i) => (
                    <div
                      key={i}
                      className={`p-2 rounded ${
                        m.role === "ai"
                          ? "bg-[#241f18] text-[#d4c4b1] border border-[#342D24]"
                          : "bg-[#fbc162]/15 text-[#fbc162] text-right ml-4"
                      }`}
                    >
                      {m.text}
                    </div>
                  ))}
                </div>

                {/* Quick Prompts */}
                <div className="flex flex-wrap gap-1.5">
                  <button
                    onClick={() => handleSendChat("Request 3-day grace period extension")}
                    className="px-2 py-1 bg-[#241f18] hover:bg-[#342D24] text-[#a79f93] hover:text-white rounded text-[10px] cursor-pointer"
                  >
                    +3 Days Grace
                  </button>
                  <button
                    onClick={() => handleSendChat("Apply 5% recovery discount")}
                    className="px-2 py-1 bg-[#241f18] hover:bg-[#342D24] text-[#fbc162] rounded text-[10px] cursor-pointer"
                  >
                    Claim 5% Discount
                  </button>
                </div>
              </div>
            </div>

            {/* Right Column: Interactive Payment Tabs & Form */}
            <div className="md:col-span-7 bg-[#1f1812] border border-[#342D24] rounded-xl p-6 space-y-6">
              {/* Payment Methods Tabs */}
              <div className="flex border-b border-[#342D24]">
                {(["upi", "card", "netbanking"] as const).map((method) => (
                  <button
                    key={method}
                    onClick={() => setPaymentMethod(method)}
                    className={`flex-1 py-3 text-xs font-bold uppercase transition-colors cursor-pointer border-b-2 flex items-center justify-center gap-1.5 ${
                      paymentMethod === method
                        ? "text-[#fbc162] border-[#fbc162] bg-[#fbc162]/5"
                        : "text-[#a79f93] border-transparent hover:text-white"
                    }`}
                  >
                    <span className="material-symbols-outlined text-sm">
                      {method === "upi" ? "qr_code_scanner" : method === "card" ? "credit_card" : "account_balance"}
                    </span>
                    {method === "upi" ? "Instant UPI QR" : method === "card" ? "Card / Debit" : "NetBanking"}
                  </button>
                ))}
              </div>

              {/* TAB 1: UPI Dynamic QR Code */}
              {paymentMethod === "upi" && (
                <div className="space-y-5 text-center">
                  <div className="p-5 bg-[#17130c] rounded-xl border border-[#342D24] max-w-xs mx-auto space-y-3">
                    {/* Simulated High-Res Golden QR Code SVG */}
                    <div className="bg-white p-4 rounded-lg inline-block shadow-lg">
                      <svg width="160" height="160" viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect width="160" height="160" fill="white" />
                        {/* QR Corners */}
                        <rect x="10" y="10" width="40" height="40" rx="4" fill="black" />
                        <rect x="16" y="16" width="28" height="28" fill="white" />
                        <rect x="22" y="22" width="16" height="16" fill="black" />

                        <rect x="110" y="10" width="40" height="40" rx="4" fill="black" />
                        <rect x="116" y="16" width="28" height="28" fill="white" />
                        <rect x="122" y="22" width="16" height="16" fill="black" />

                        <rect x="10" y="110" width="40" height="40" rx="4" fill="black" />
                        <rect x="16" y="116" width="28" height="28" fill="white" />
                        <rect x="22" y="122" width="16" height="16" fill="black" />

                        {/* QR Data Grid Pattern */}
                        <rect x="60" y="15" width="10" height="10" fill="black" />
                        <rect x="75" y="15" width="10" height="10" fill="black" />
                        <rect x="60" y="30" width="15" height="15" fill="black" />
                        <rect x="85" y="30" width="10" height="20" fill="black" />

                        <rect x="15" y="60" width="15" height="15" fill="black" />
                        <rect x="35" y="65" width="10" height="20" fill="black" />
                        <rect x="55" y="55" width="20" height="20" fill="#120e0a" />
                        <rect x="85" y="60" width="25" height="15" fill="black" />
                        <rect x="120" y="60" width="15" height="15" fill="black" />
                        <rect x="140" y="70" width="10" height="10" fill="black" />

                        <rect x="20" y="90" width="20" height="10" fill="black" />
                        <rect x="55" y="85" width="15" height="20" fill="black" />
                        <rect x="80" y="85" width="15" height="15" fill="black" />
                        <rect x="110" y="90" width="20" height="15" fill="black" />
                        <rect x="135" y="85" width="15" height="15" fill="black" />

                        <rect x="60" y="115" width="15" height="15" fill="black" />
                        <rect x="85" y="115" width="10" height="10" fill="black" />
                        <rect x="105" y="115" width="20" height="15" fill="black" />
                        <rect x="60" y="135" width="25" height="15" fill="black" />
                        <rect x="95" y="135" width="15" height="15" fill="black" />
                        <rect x="120" y="135" width="20" height="15" fill="black" />

                        {/* Center Brand Shield Badge */}
                        <circle cx="80" cy="80" r="16" fill="#1f1812" />
                        <circle cx="80" cy="80" r="13" fill="#fbc162" />
                        <text x="75" y="84" fill="#120e0a" fontSize="11" fontWeight="bold" fontFamily="monospace">₹</text>
                      </svg>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] text-[#a79f93] block">Scan with any UPI App (GPay, PhonePe, Paytm)</span>
                      <span className="text-xs text-white font-bold block">aurum.recovery@hdfcbank</span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleCompletePayment("UPI Dynamic QR")}
                    disabled={isProcessing}
                    className="w-full py-3.5 rounded bg-emerald-500 hover:bg-emerald-400 text-black font-mono font-bold text-xs uppercase cursor-pointer flex items-center justify-center gap-2 shadow-lg transition-all"
                  >
                    <span className="material-symbols-outlined text-base">
                      {isProcessing ? "sync" : "mobile_friendly"}
                    </span>
                    {isProcessing ? "Verifying UPI Settlement..." : `Simulate UPI Scan & Pay ₹${payableRupees.toLocaleString("en-IN")}`}
                  </button>
                </div>
              )}

              {/* TAB 2: Card / Debit Form */}
              {paymentMethod === "card" && (
                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] text-[#a79f93] uppercase">Cardholder Name</label>
                    <input
                      type="text"
                      value={cardHolder}
                      onChange={(e) => setCardHolder(e.target.value)}
                      className="w-full bg-[#17130c] border border-[#342D24] focus:border-[#fbc162] rounded px-3 py-2 text-xs text-white outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-[#a79f93] uppercase">Card Number (16 Digits)</label>
                    <input
                      type="text"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      className="w-full bg-[#17130c] border border-[#342D24] focus:border-[#fbc162] rounded px-3 py-2 text-xs text-white outline-none font-mono"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] text-[#a79f93] uppercase">Expiry MM/YY</label>
                      <input
                        type="text"
                        value={cardExpiry}
                        onChange={(e) => setCardExpiry(e.target.value)}
                        className="w-full bg-[#17130c] border border-[#342D24] focus:border-[#fbc162] rounded px-3 py-2 text-xs text-white outline-none font-mono"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-[#a79f93] uppercase">CVV</label>
                      <input
                        type="password"
                        maxLength={4}
                        value={cardCvv}
                        onChange={(e) => setCardCvv(e.target.value)}
                        className="w-full bg-[#17130c] border border-[#342D24] focus:border-[#fbc162] rounded px-3 py-2 text-xs text-white outline-none font-mono"
                      />
                    </div>
                  </div>

                  <button
                    onClick={() => handleCompletePayment("Credit/Debit Card")}
                    disabled={isProcessing}
                    className="w-full py-3.5 mt-2 rounded bg-[#fbc162] hover:bg-[#dda64a] text-[#17130c] font-mono font-bold text-xs uppercase cursor-pointer flex items-center justify-center gap-2 shadow transition-all"
                  >
                    <span className="material-symbols-outlined text-base">
                      {isProcessing ? "sync" : "lock"}
                    </span>
                    {isProcessing ? "Authorizing 3DS..." : `Pay ₹${payableRupees.toLocaleString("en-IN")} via Razorpay`}
                  </button>
                </div>
              )}

              {/* TAB 3: NetBanking */}
              {paymentMethod === "netbanking" && (
                <div className="space-y-4">
                  <span className="text-[10px] text-[#a79f93] uppercase block">Select Issuing Bank:</span>
                  <div className="grid grid-cols-2 gap-3">
                    {["HDFC Bank", "ICICI Bank", "State Bank of India", "Axis Bank", "Kotak Mahindra"].map((bank) => (
                      <button
                        key={bank}
                        onClick={() => handleCompletePayment(`NetBanking (${bank})`)}
                        disabled={isProcessing}
                        className="p-3 rounded bg-[#17130c] hover:bg-[#241f18] border border-[#342D24] hover:border-[#fbc162] text-xs font-bold text-white cursor-pointer text-left transition-colors"
                      >
                        {bank}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Trust Badges Footer */}
              <div className="pt-2 border-t border-[#342D24] flex items-center justify-between text-[10px] text-[#a79f93]">
                <span>Secured by Razorpay Gateway</span>
                <span>PCI-DSS Level 1 Compliant</span>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
