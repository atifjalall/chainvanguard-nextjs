"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronRightIcon,
  CheckIcon,
  WalletIcon,
  ShieldCheckIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/outline";
import { toast } from "sonner";

// Mock Cart Data
const CART_ITEMS = [
  {
    id: 1,
    name: "Premium Cotton T-Shirt",
    price: 29.99,
    size: "M",
    color: "Black",
    quantity: 2,
    image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=200",
  },
  {
    id: 2,
    name: "Classic Denim Jacket",
    price: 89.99,
    size: "L",
    color: "Blue",
    quantity: 1,
    image: "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=200",
  },
];

// Mock Wallet Info
const WALLET_INFO = {
  address: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb2",
  balance: 500.75,
  network: "Ethereum",
};

export default function CheckoutPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);

  // Form States
  const [shippingInfo, setShippingInfo] = useState({
    fullName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    country: "Pakistan",
  });

  const [shippingMethod, setShippingMethod] = useState("standard");
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  // Calculate totals
  const subtotal = CART_ITEMS.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const shippingCost = shippingMethod === "express" ? 15.99 : 5.99;
  const total = subtotal + shippingCost;

  const handleShippingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !shippingInfo.fullName ||
      !shippingInfo.email ||
      !shippingInfo.phone ||
      !shippingInfo.address ||
      !shippingInfo.city ||
      !shippingInfo.zipCode
    ) {
      toast.error("Please fill in all required fields");
      return;
    }
    setCurrentStep(2);
  };

  const handlePayment = async () => {
    if (!agreedToTerms) {
      toast.error("Please agree to terms and conditions");
      return;
    }

    if (WALLET_INFO.balance < total) {
      toast.error("Insufficient wallet balance");
      return;
    }

    setIsProcessing(true);

    // Simulate blockchain transaction
    setTimeout(() => {
      setIsProcessing(false);
      toast.success("Payment successful! Order placed.");
      router.push("/customer/orders");
    }, 3000);
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      {/* Breadcrumb */}
      <div className="">
        <div className="max-w-[1600px] mx-auto px-12 lg:px-16 py-6">
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push("/customer")}
              className="text-[10px] uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              Home
            </button>
            <ChevronRightIcon className="h-3 w-3 text-gray-400 dark:text-gray-600" />
            <button
              onClick={() => router.push("/customer/cart")}
              className="text-[10px] uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              Cart
            </button>
            <ChevronRightIcon className="h-3 w-3 text-gray-400 dark:text-gray-600" />
            <span className="text-[10px] uppercase tracking-[0.2em] text-gray-900 dark:text-white">
              Checkout
            </span>
          </div>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-[1600px] mx-auto px-12 lg:px-16 py-8">
          <div className="flex items-center justify-center gap-8 md:gap-16">
            {/* Step 1 */}
            <div className="flex items-center gap-3">
              <div
                className={`w-8 h-8 flex items-center justify-center text-xs font-medium transition-colors ${
                  currentStep >= 1
                    ? "bg-black dark:bg-white text-white dark:text-black"
                    : "border border-gray-200 dark:border-gray-800 text-gray-400 dark:text-gray-600"
                }`}
              >
                {currentStep > 1 ? <CheckIcon className="h-4 w-4" /> : "1"}
              </div>
              <span
                className={`text-[10px] uppercase tracking-[0.2em] hidden md:block ${
                  currentStep >= 1
                    ? "text-gray-900 dark:text-white"
                    : "text-gray-400 dark:text-gray-600"
                }`}
              >
                Shipping
              </span>
            </div>

            <div className="h-px w-12 md:w-24 bg-gray-200 dark:bg-gray-800" />

            {/* Step 2 */}
            <div className="flex items-center gap-3">
              <div
                className={`w-8 h-8 flex items-center justify-center text-xs font-medium transition-colors ${
                  currentStep >= 2
                    ? "bg-black dark:bg-white text-white dark:text-black"
                    : "border border-gray-200 dark:border-gray-800 text-gray-400 dark:text-gray-600"
                }`}
              >
                2
              </div>
              <span
                className={`text-[10px] uppercase tracking-[0.2em] hidden md:block ${
                  currentStep >= 2
                    ? "text-gray-900 dark:text-white"
                    : "text-gray-400 dark:text-gray-600"
                }`}
              >
                Payment
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <section className="py-16">
        <div className="max-w-[1600px] mx-auto px-12 lg:px-16">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_450px] gap-16">
            {/* Left Column - Forms */}
            <div className="space-y-12">
              {/* Step 1: Shipping Information */}
              {currentStep === 1 && (
                <div className="space-y-8">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="h-px w-16 bg-gray-300 dark:bg-gray-700" />
                      <p className="text-[10px] uppercase tracking-[0.3em] text-gray-500 dark:text-gray-400">
                        Step 1 of 2
                      </p>
                    </div>
                    <h1 className="text-4xl font-extralight text-gray-900 dark:text-white tracking-tight">
                      Shipping Information
                    </h1>
                  </div>

                  <form onSubmit={handleShippingSubmit} className="space-y-8">
                    {/* Full Name */}
                    <div className="space-y-3">
                      <label className="text-[10px] uppercase tracking-[0.2em] text-gray-900 dark:text-white font-medium">
                        Full Name *
                      </label>
                      <div className="border-b border-gray-900 dark:border-white pb-px">
                        <input
                          type="text"
                          value={shippingInfo.fullName}
                          onChange={(e) =>
                            setShippingInfo({
                              ...shippingInfo,
                              fullName: e.target.value,
                            })
                          }
                          className="w-full h-12 px-0 bg-transparent text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none"
                          placeholder="Enter your full name"
                        />
                      </div>
                    </div>

                    {/* Email & Phone */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-3">
                        <label className="text-[10px] uppercase tracking-[0.2em] text-gray-900 dark:text-white font-medium">
                          Email *
                        </label>
                        <div className="border-b border-gray-900 dark:border-white pb-px">
                          <input
                            type="email"
                            value={shippingInfo.email}
                            onChange={(e) =>
                              setShippingInfo({
                                ...shippingInfo,
                                email: e.target.value,
                              })
                            }
                            className="w-full h-12 px-0 bg-transparent text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none"
                            placeholder="your@email.com"
                          />
                        </div>
                      </div>
                      <div className="space-y-3">
                        <label className="text-[10px] uppercase tracking-[0.2em] text-gray-900 dark:text-white font-medium">
                          Phone *
                        </label>
                        <div className="border-b border-gray-900 dark:border-white pb-px">
                          <input
                            type="tel"
                            value={shippingInfo.phone}
                            onChange={(e) =>
                              setShippingInfo({
                                ...shippingInfo,
                                phone: e.target.value,
                              })
                            }
                            className="w-full h-12 px-0 bg-transparent text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none"
                            placeholder="+92 300 1234567"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Address */}
                    <div className="space-y-3">
                      <label className="text-[10px] uppercase tracking-[0.2em] text-gray-900 dark:text-white font-medium">
                        Street Address *
                      </label>
                      <div className="border-b border-gray-900 dark:border-white pb-px">
                        <input
                          type="text"
                          value={shippingInfo.address}
                          onChange={(e) =>
                            setShippingInfo({
                              ...shippingInfo,
                              address: e.target.value,
                            })
                          }
                          className="w-full h-12 px-0 bg-transparent text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none"
                          placeholder="Street address"
                        />
                      </div>
                    </div>

                    {/* City, State, Zip */}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
                      <div className="space-y-3">
                        <label className="text-[10px] uppercase tracking-[0.2em] text-gray-900 dark:text-white font-medium">
                          City *
                        </label>
                        <div className="border-b border-gray-900 dark:border-white pb-px">
                          <input
                            type="text"
                            value={shippingInfo.city}
                            onChange={(e) =>
                              setShippingInfo({
                                ...shippingInfo,
                                city: e.target.value,
                              })
                            }
                            className="w-full h-12 px-0 bg-transparent text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none"
                            placeholder="City"
                          />
                        </div>
                      </div>
                      <div className="space-y-3">
                        <label className="text-[10px] uppercase tracking-[0.2em] text-gray-900 dark:text-white font-medium">
                          State
                        </label>
                        <div className="border-b border-gray-900 dark:border-white pb-px">
                          <input
                            type="text"
                            value={shippingInfo.state}
                            onChange={(e) =>
                              setShippingInfo({
                                ...shippingInfo,
                                state: e.target.value,
                              })
                            }
                            className="w-full h-12 px-0 bg-transparent text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none"
                            placeholder="State"
                          />
                        </div>
                      </div>
                      <div className="space-y-3">
                        <label className="text-[10px] uppercase tracking-[0.2em] text-gray-900 dark:text-white font-medium">
                          Zip Code *
                        </label>
                        <div className="border-b border-gray-900 dark:border-white pb-px">
                          <input
                            type="text"
                            value={shippingInfo.zipCode}
                            onChange={(e) =>
                              setShippingInfo({
                                ...shippingInfo,
                                zipCode: e.target.value,
                              })
                            }
                            className="w-full h-12 px-0 bg-transparent text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none"
                            placeholder="12345"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Shipping Method */}
                    <div className="space-y-4 pt-4">
                      <label className="text-[10px] uppercase tracking-[0.2em] text-gray-900 dark:text-white font-medium">
                        Shipping Method
                      </label>
                      <div className="space-y-3">
                        <button
                          type="button"
                          onClick={() => setShippingMethod("standard")}
                          className={`w-full p-4 border text-left transition-colors ${
                            shippingMethod === "standard"
                              ? "border-black dark:border-white bg-gray-50 dark:bg-gray-900"
                              : "border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="space-y-1">
                              <p className="text-sm font-medium text-gray-900 dark:text-white">
                                Standard Shipping
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                5-7 business days
                              </p>
                            </div>
                            <span className="text-sm text-gray-900 dark:text-white">
                              Rs 5.99
                            </span>
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={() => setShippingMethod("express")}
                          className={`w-full p-4 border text-left transition-colors ${
                            shippingMethod === "express"
                              ? "border-black dark:border-white bg-gray-50 dark:bg-gray-900"
                              : "border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="space-y-1">
                              <p className="text-sm font-medium text-gray-900 dark:text-white">
                                Express Shipping
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                2-3 business days
                              </p>
                            </div>
                            <span className="text-sm text-gray-900 dark:text-white">
                              Rs 15.99
                            </span>
                          </div>
                        </button>
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-black dark:bg-white text-white dark:text-black h-12 uppercase tracking-[0.2em] text-[10px] font-medium hover:bg-gray-900 dark:hover:bg-gray-100 transition-colors mt-8"
                    >
                      Continue to Payment
                    </button>
                  </form>
                </div>
              )}

              {/* Step 2: Payment */}
              {currentStep === 2 && (
                <div className="space-y-8">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="h-px w-16 bg-gray-300 dark:bg-gray-700" />
                      <p className="text-[10px] uppercase tracking-[0.3em] text-gray-500 dark:text-gray-400">
                        Step 2 of 2
                      </p>
                    </div>
                    <h1 className="text-4xl font-extralight text-gray-900 dark:text-white tracking-tight">
                      Payment
                    </h1>
                  </div>

                  {/* Wallet Info */}
                  <div className="border border-gray-200 dark:border-gray-800 p-8 space-y-6">
                    <div className="flex items-center gap-3">
                      <WalletIcon className="h-6 w-6 text-gray-900 dark:text-white" />
                      <h2 className="text-sm font-medium text-gray-900 dark:text-white uppercase tracking-wider">
                        Connected Wallet
                      </h2>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between pb-4 border-b border-gray-200 dark:border-gray-800">
                        <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Network
                        </span>
                        <span className="text-sm text-gray-900 dark:text-white">
                          {WALLET_INFO.network}
                        </span>
                      </div>

                      <div className="flex items-center justify-between pb-4 border-b border-gray-200 dark:border-gray-800">
                        <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Wallet Address
                        </span>
                        <span className="text-xs font-mono text-gray-900 dark:text-white">
                          {WALLET_INFO.address.slice(0, 6)}...
                          {WALLET_INFO.address.slice(-4)}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Available Balance
                        </span>
                        <span className="text-lg font-light text-gray-900 dark:text-white">
                          Rs {WALLET_INFO.balance.toFixed(2)}
                        </span>
                      </div>
                    </div>

                    {/* Insufficient Balance Warning */}
                    {WALLET_INFO.balance < total && (
                      <div className="flex items-start gap-3 p-4 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
                        <InformationCircleIcon className="h-5 w-5 text-gray-900 dark:text-white flex-shrink-0 mt-0.5" />
                        <div className="space-y-1">
                          <p className="text-xs font-medium text-gray-900 dark:text-white">
                            Insufficient Balance
                          </p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            You need Rs{" "}
                            {(total - WALLET_INFO.balance).toFixed(2)} more to
                            complete this purchase.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Security Info */}
                  <div className="flex items-start gap-3 p-6 border border-gray-200 dark:border-gray-800">
                    <ShieldCheckIcon className="h-5 w-5 text-gray-900 dark:text-white flex-shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-gray-900 dark:text-white uppercase tracking-wider">
                        Secure Transaction
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                        Your payment will be processed securely through the
                        blockchain. Transaction details will be recorded on the{" "}
                        {WALLET_INFO.network} network.
                      </p>
                    </div>
                  </div>

                  {/* Terms & Conditions */}
                  <div className="space-y-4">
                    <label className="flex items-start gap-3 cursor-pointer group">
                      <div
                        className={`w-5 h-5 border-2 flex items-center justify-center transition-colors mt-0.5 ${
                          agreedToTerms
                            ? "bg-black dark:bg-white border-black dark:border-white"
                            : "border-gray-300 dark:border-gray-700 group-hover:border-gray-400 dark:group-hover:border-gray-600"
                        }`}
                        onClick={() => setAgreedToTerms(!agreedToTerms)}
                      >
                        {agreedToTerms && (
                          <CheckIcon className="h-3 w-3 text-white dark:text-black" />
                        )}
                      </div>
                      <span className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                        I agree to the{" "}
                        <button className="text-gray-900 dark:text-white hover:underline">
                          terms and conditions
                        </button>{" "}
                        and{" "}
                        <button className="text-gray-900 dark:text-white hover:underline">
                          privacy policy
                        </button>
                      </span>
                    </label>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-4">
                    <button
                      onClick={() => setCurrentStep(1)}
                      className="flex-1 border border-black dark:border-white text-black dark:text-white h-12 uppercase tracking-[0.2em] text-[10px] font-medium hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
                      disabled={isProcessing}
                    >
                      Back to Shipping
                    </button>
                    <button
                      onClick={handlePayment}
                      disabled={isProcessing || WALLET_INFO.balance < total}
                      className="flex-1 bg-black dark:bg-white text-white dark:text-black h-12 uppercase tracking-[0.2em] text-[10px] font-medium hover:bg-gray-900 dark:hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isProcessing ? "Processing..." : "Place Order"}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column - Order Summary */}
            <div className="lg:sticky lg:top-24 h-fit">
              <div className="p-8 space-y-8">
                <h2 className="text-lg font-light text-gray-900 dark:text-white uppercase tracking-wider">
                  Order Summary
                </h2>

                {/* Cart Items */}
                <div className="space-y-4">
                  {CART_ITEMS.map((item) => (
                    <div key={item.id} className="flex gap-4">
                      <div className="relative w-20 aspect-[3/4] bg-gray-100 dark:bg-gray-900 flex-shrink-0">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute -top-2 -right-2 w-6 h-6 bg-black dark:bg-white text-white dark:text-black flex items-center justify-center text-xs font-medium">
                          {item.quantity}
                        </div>
                      </div>
                      <div className="flex-1 space-y-1">
                        <p className="text-xs font-normal text-gray-900 dark:text-white uppercase tracking-wide">
                          {item.name}
                        </p>
                        <div className="flex items-center gap-3 text-[10px] text-gray-500 dark:text-gray-400">
                          <span>{item.color}</span>
                          <span>•</span>
                          <span>{item.size}</span>
                        </div>
                        <p className="text-sm text-gray-900 dark:text-white">
                          Rs {(item.price * item.quantity).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Totals */}
                <div className="space-y-4 pt-6 border-t border-gray-200 dark:border-gray-800">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">
                      Subtotal
                    </span>
                    <span className="text-gray-900 dark:text-white">
                      Rs {subtotal.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">
                      Shipping
                    </span>
                    <span className="text-gray-900 dark:text-white">
                      Rs {shippingCost.toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-6 border-t border-gray-200 dark:border-gray-800">
                  <span className="text-sm font-medium text-gray-900 dark:text-white uppercase tracking-wider">
                    Total
                  </span>
                  <span className="text-2xl font-light text-gray-900 dark:text-white">
                    Rs {total.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
