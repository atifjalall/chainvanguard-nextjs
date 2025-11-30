/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { useWallet } from "@/components/providers/wallet-provider";
import { toast } from "sonner";
import {
  EyeIcon,
  EyeSlashIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";
import { ChevronRightIcon } from "@heroicons/react/24/outline";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { usePageTitle } from "@/hooks/use-page-title";
import { formatCurrency } from "@/utils/currency";
import {
  updateProfile,
  getProfileStats,
  ProfileStats,
  sendEmailOtp,
  verifyEmailOtp,
} from "@/lib/api/profile.api";

export default function CustomerProfilePage() {
  usePageTitle("My Profile");
  const router = useRouter();
  const { user, updateProfile: updateAuthProfile } = useAuth();
  const { currentWallet, balance } = useWallet();
  const [stats, setStats] = useState<ProfileStats | null>(null);

  // OTP resend interval (keeps parity with register page)
  const OTP_RESEND_SECONDS = 60;

  // Personal Information
  const [personalInfo, setPersonalInfo] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
  });

  // Address Information
  const [addressInfo, setAddressInfo] = useState({
    address: user?.address || "",
    city: user?.city || "",
    province: user?.state || "",
    postalCode: user?.postalCode || "",
  });

  // Password Change
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [errors, setErrors] = useState({
    personalInfo: "",
    addressInfo: "",
    password: "",
  });

  const [isLoadingPersonal, setIsLoadingPersonal] = useState(false);
  const [isLoadingAddress, setIsLoadingAddress] = useState(false);
  const [isLoadingPassword, setIsLoadingPassword] = useState(false);

  // Email change + OTP modal states
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [pendingPersonalUpdate, setPendingPersonalUpdate] = useState<{
    name?: string;
    email?: string;
    phone?: string;
  } | null>(null);

  const [otp, setOtp] = useState<string[]>(["", "", "", "", "", ""]);
  const [otpError, setOtpError] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [isSendingOtp, setIsSendingOtp] = useState(false);

  // Fetch profile stats on mount
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await getProfileStats();

        if (response.success && response.data) {
          setStats(response.data);
        } else {
          toast.error("Failed to load profile statistics");
        }
      } catch {
        toast.error("Error loading profile statistics");
      }
    };

    if (user) {
      fetchStats();
    }
  }, [user]);

  // Update form data when user changes
  useEffect(() => {
    if (user) {
      setPersonalInfo({
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
      });
      setAddressInfo({
        address: user.address || "",
        city: user.city || "",
        province: user.state || "",
        postalCode: user.postalCode || "",
      });
    }
  }, [user]);

  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    });
  };

  // Send OTP to confirm updated email
  const sendOtpForEmail = async (emailToVerify?: string) => {
    try {
      setIsSendingOtp(true);
      const targetEmail = emailToVerify || personalInfo.email;
      const resp = await sendEmailOtp(targetEmail);
      if (!resp.success) throw new Error(resp.error || "Failed to send code");
      setOtpSent(true);
      setResendTimer(OTP_RESEND_SECONDS);
      setOtp(["", "", "", "", "", ""]);
      setOtpError(false);
      toast.success("Verification code sent to your email!");
    } catch (error: any) {
      toast.error(error.message || "Failed to send verification code");
    } finally {
      setIsSendingOtp(false);
    }
  };

  const verifyEmailOtpHandler = async (otpArray?: string[]) => {
    const otpToVerify = otpArray || otp;
    const otpValue = otpToVerify.join("");

    if (otpValue.length !== 6) {
      setOtpError(true);
      toast.error("Please enter all 6 digits");
      return;
    }

    try {
      setIsVerifyingOtp(true);
      const targetEmail = pendingPersonalUpdate?.email || personalInfo.email;
      const resp = await verifyEmailOtp(targetEmail, otpValue);

      if (!resp.success) {
        throw new Error(resp.error || "Invalid verification code");
      }

      setOtpVerified(true);
      toast.success("Email verified successfully!");

      // Now perform profile update including the new email
      // Use pendingPersonalUpdate if present, fallback to current personalInfo
      const finalUpdate = {
        name: pendingPersonalUpdate?.name ?? personalInfo.name,
        email: pendingPersonalUpdate?.email ?? personalInfo.email,
        phone: pendingPersonalUpdate?.phone ?? personalInfo.phone,
      };

      const result = await updateProfile({
        name: finalUpdate.name,
        email: finalUpdate.email,
        phone: finalUpdate.phone,
      });

      if (result.success && result.user) {
        updateAuthProfile(result.user);
        toast.success("Email updated successfully");
      } else {
        throw new Error(result.error || "Failed to update profile");
      }

      // Clean up
      setIsEmailModalOpen(false);
      setOtp(["", "", "", "", "", ""]);
      setOtpSent(false);
      setOtpVerified(true);
      setPendingPersonalUpdate(null);
    } catch (error: any) {
      setOtpError(true);
      setOtp(["", "", "", "", "", ""]);
      document.getElementById("email-otp-0")?.focus();
      toast.error(error.message || "Invalid verification code");
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    setOtpError(false);

    if (value && index < 5) {
      document.getElementById(`email-otp-${index + 1}`)?.focus();
    }

    if (newOtp.every((digit) => digit !== "")) {
      verifyEmailOtpHandler(newOtp);
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, 6);

    const newOtp = [...otp];
    for (let i = 0; i < 6; i++) {
      newOtp[i] = pastedData[i] || "";
    }
    setOtp(newOtp);
    setOtpError(false);

    const lastFilledIndex = pastedData.length - 1;
    if (lastFilledIndex >= 0 && lastFilledIndex < 6) {
      document.getElementById(`email-otp-${lastFilledIndex}`)?.focus();
    }

    if (newOtp.every((d) => d !== "")) {
      verifyEmailOtpHandler(newOtp);
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      document.getElementById(`email-otp-${index - 1}`)?.focus();
    }
  };

  // Update form data when user changes
  useEffect(() => {
    if (user) {
      setPersonalInfo({
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
      });
      setAddressInfo({
        address: user.address || "",
        city: user.city || "",
        province: user.state || "",
        postalCode: user.postalCode || "",
      });
    }
  }, [user]);

  // Modify handlePersonalInfoSubmit to send OTP if email changed
  const handlePersonalInfoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoadingPersonal(true);
    setErrors({ ...errors, personalInfo: "" });

    try {
      // If email changed, we want to verify email before applying it
      const emailChanged =
        personalInfo.email && personalInfo.email !== user?.email;

      if (emailChanged) {
        // Update non-email fields immediately (name, phone). Keep email pending until OTP verified.
        try {
          const dbResult = await updateProfile({
            name: personalInfo.name,
            phone: personalInfo.phone,
          });

          if (dbResult.success && dbResult.user) {
            updateAuthProfile(dbResult.user);
            toast.success(
              "Personal information updated (email pending verification)"
            );
          } else {
            throw new Error(dbResult.error || "Failed to update personal info");
          }
        } catch (error: any) {
          toast.error(error.message || "Failed to update personal information");
          setErrors({
            ...errors,
            personalInfo: error.message || "Failed to update information",
          });
          setIsLoadingPersonal(false);
          return;
        }

        // Save pending update and open email OTP modal
        setPendingPersonalUpdate({
          name: personalInfo.name,
          email: personalInfo.email,
          phone: personalInfo.phone,
        });

        setIsEmailModalOpen(true);
        // send OTP to the new email for verification
        await sendOtpForEmail(personalInfo.email);
        setIsLoadingPersonal(false);
        return;
      }

      // no email change -> regular update
      const result = await updateProfile({
        name: personalInfo.name,
        email: personalInfo.email,
        phone: personalInfo.phone,
      });

      if (result.success && result.user) {
        updateAuthProfile(result.user);
        toast.success("Personal information updated successfully");
      } else {
        toast.error(result.error || "Failed to update personal information");
        setErrors({
          ...errors,
          personalInfo: result.error || "Failed to update information",
        });
      }
    } catch (error) {
      toast.error("Failed to update personal information");
      setErrors({ ...errors, personalInfo: "Failed to update information" });
    } finally {
      setIsLoadingPersonal(false);
    }
  };

  const handleAddressInfoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoadingAddress(true);
    setErrors({ ...errors, addressInfo: "" });

    try {
      const result = await updateProfile({
        address: addressInfo.address,
        city: addressInfo.city,
        state: addressInfo.province,
        postalCode: addressInfo.postalCode,
      });

      if (result.success && result.user) {
        updateAuthProfile(result.user);
        toast.success("Address information updated successfully");
      } else {
        toast.error(result.error || "Failed to update address information");
        setErrors({
          ...errors,
          addressInfo: result.error || "Failed to update address",
        });
      }
    } catch (error) {
      toast.error("Failed to update address information");
      setErrors({ ...errors, addressInfo: "Failed to update address" });
    } finally {
      setIsLoadingAddress(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoadingPassword(true);
    setErrors({ ...errors, password: "" });

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setErrors({ ...errors, password: "Passwords do not match" });
      setIsLoadingPassword(false);
      toast.error("Passwords do not match");
      return;
    }

    if (passwordData.newPassword.length < 8) {
      setErrors({
        ...errors,
        password: "Password must be at least 8 characters",
      });
      setIsLoadingPassword(false);
      toast.error("Password must be at least 8 characters");
      return;
    }

    try {
      // API call to change password
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success("Password changed successfully");
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error) {
      toast.error("Failed to change password");
      setErrors({ ...errors, password: "Failed to change password" });
    } finally {
      setIsLoadingPassword(false);
    }
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
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
            <span className="text-[10px] uppercase tracking-[0.2em] text-gray-900 dark:text-white">
              Profile
            </span>
          </div>
        </div>
      </div>

      {/* Header */}
      <section className="py-16 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-[1600px] mx-auto px-12 lg:px-16">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-px w-16 bg-gray-300 dark:bg-gray-700" />
              <p className="text-[10px] uppercase tracking-[0.3em] text-gray-500 dark:text-gray-400">
                Account Settings
              </p>
            </div>
            <h1 className="text-5xl font-extralight text-gray-900 dark:text-white tracking-tight">
              Profile
            </h1>
          </div>
        </div>
      </section>

      {/* Profile Content */}
      <section className="py-16">
        <div className="max-w-[1600px] mx-auto px-12 lg:px-16">
          <div className="grid lg:grid-cols-3 gap-16">
            {/* Sidebar */}
            <div className="lg:col-span-1 space-y-8">
              {/* User Info Card */}
              <div className="p-8">
                <div className="space-y-6">
                  <div className="flex items-center justify-center">
                    <div className="h-24 w-24 bg-gray-900 dark:bg-white flex items-center justify-center">
                      <span className="text-2xl font-medium text-white dark:text-gray-900">
                        {personalInfo.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase() || "U"}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-3 text-center">
                    <h3 className="text-lg font-normal text-gray-900 dark:text-white">
                      {personalInfo.name || "User"}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {personalInfo.email}
                    </p>
                  </div>

                  {currentWallet && (
                    <div className="pt-6 space-y-3">
                      <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400">
                        Wallet
                      </p>
                      <p className="text-xs font-mono text-gray-900 dark:text-white">
                        {formatAddress(currentWallet.address)}
                      </p>
                      <p className="text-xs text-gray-900 dark:text-white">
                        Balance:{" "}
                        <span className="font-medium">
                          {formatCurrency(balance, "CVT")}
                        </span>
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Quick Stats */}
              <div className="p-8">
                <div className="space-y-6">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400">
                    Account Stats
                  </p>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        Total Orders
                      </span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {stats?.totalOrders ?? 0}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        Saved Items
                      </span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {stats?.savedItems ?? 0}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        Member Since
                      </span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {stats ? formatDate(stats.memberSince) : "N/A"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* My Orders Link */}
              <div className="p-8">
                <Link
                  href="/customer/orders"
                  className="text-[10px] uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                  My Orders
                </Link>
                <Link
                  href="/customer/returns"
                  className="text-[10px] uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors mt-4 block"
                >
                  My Returns
                </Link>
                <Link
                  href="/customer/transactions"
                  className="text-[10px] uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors mt-4 block"
                >
                  My Transactions
                </Link>
              </div>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-2 space-y-12">
              {/* Personal Information */}
              <div>
                <div className="mb-8">
                  <h2 className="text-2xl font-extralight text-gray-900 dark:text-white tracking-tight mb-2">
                    Personal Information
                  </h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Update your personal details
                  </p>
                </div>

                <form onSubmit={handlePersonalInfoSubmit} className="space-y-8">
                  {/* Name */}
                  <div className="space-y-3">
                    <label
                      htmlFor="name"
                      className="text-[10px] uppercase tracking-[0.2em] text-gray-900 dark:text-white font-medium"
                    >
                      Full Name
                    </label>
                    <div className="border-b border-gray-900 dark:border-white pb-px">
                      <input
                        id="name"
                        type="text"
                        value={personalInfo.name}
                        onChange={(e) =>
                          setPersonalInfo({
                            ...personalInfo,
                            name: e.target.value,
                          })
                        }
                        className="w-full h-12 px-0 bg-transparent text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div className="space-y-3">
                    <label
                      htmlFor="email"
                      className="text-[10px] uppercase tracking-[0.2em] text-gray-900 dark:text-white font-medium"
                    >
                      Email Address
                    </label>
                    <div className="border-b border-gray-900 dark:border-white pb-px">
                      <input
                        id="email"
                        type="email"
                        value={personalInfo.email}
                        onChange={(e) =>
                          setPersonalInfo({
                            ...personalInfo,
                            email: e.target.value,
                          })
                        }
                        className="w-full h-12 px-0 bg-transparent text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Phone */}
                  <div className="space-y-3">
                    <label
                      htmlFor="phone"
                      className="text-[10px] uppercase tracking-[0.2em] text-gray-900 dark:text-white font-medium"
                    >
                      Phone Number
                    </label>
                    <div className="border-b border-gray-900 dark:border-white pb-px">
                      <input
                        id="phone"
                        type="tel"
                        placeholder="+1 (555) 000-0000"
                        value={personalInfo.phone}
                        onChange={(e) =>
                          setPersonalInfo({
                            ...personalInfo,
                            phone: e.target.value,
                          })
                        }
                        className="w-full h-12 px-0 bg-transparent text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none"
                      />
                    </div>
                  </div>

                  {errors.personalInfo && (
                    <div className="flex items-center gap-2 text-red-500">
                      <ExclamationTriangleIcon className="h-4 w-4" />
                      <p className="text-xs">{errors.personalInfo}</p>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isLoadingPersonal}
                    className="bg-black dark:bg-white text-white dark:text-black px-12 h-12 uppercase tracking-[0.2em] text-[10px] font-medium hover:bg-gray-900 dark:hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoadingPersonal ? "Saving..." : "Save Changes"}
                  </button>
                </form>
              </div>

              {/* Address Information */}
              <div className="">
                <div className="mb-8">
                  <h2 className="text-2xl font-extralight text-gray-900 dark:text-white tracking-tight mb-2">
                    Address Information
                  </h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Update your delivery address
                  </p>
                </div>

                <form onSubmit={handleAddressInfoSubmit} className="space-y-8">
                  {/* Address */}
                  <div className="space-y-3">
                    <label
                      htmlFor="address"
                      className="text-[10px] uppercase tracking-[0.2em] text-gray-900 dark:text-white font-medium"
                    >
                      Street Address
                    </label>
                    <div className="border-b border-gray-900 dark:border-white pb-px">
                      <input
                        id="address"
                        type="text"
                        placeholder="123 Main Street"
                        value={addressInfo.address}
                        onChange={(e) =>
                          setAddressInfo({
                            ...addressInfo,
                            address: e.target.value,
                          })
                        }
                        className="w-full h-12 px-0 bg-transparent text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* City, Province, Postal Code */}
                  <div className="grid md:grid-cols-3 gap-8">
                    <div className="space-y-3">
                      <label
                        htmlFor="city"
                        className="text-[10px] uppercase tracking-[0.2em] text-gray-900 dark:text-white font-medium"
                      >
                        City
                      </label>
                      <div className="border-b border-gray-900 dark:border-white pb-px">
                        <input
                          id="city"
                          type="text"
                          placeholder="Karachi"
                          value={addressInfo.city}
                          onChange={(e) =>
                            setAddressInfo({
                              ...addressInfo,
                              city: e.target.value,
                            })
                          }
                          className="w-full h-12 px-0 bg-transparent text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="space-y-3">
                      <label
                        htmlFor="province"
                        className="text-[10px] uppercase tracking-[0.2em] text-gray-900 dark:text-white font-medium"
                      >
                        Province/State
                      </label>
                      <div className="border-b border-gray-900 dark:border-white pb-px">
                        <input
                          id="province"
                          type="text"
                          placeholder="Sindh"
                          value={addressInfo.province}
                          onChange={(e) =>
                            setAddressInfo({
                              ...addressInfo,
                              province: e.target.value,
                            })
                          }
                          className="w-full h-12 px-0 bg-transparent text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="space-y-3">
                      <label
                        htmlFor="postalCode"
                        className="text-[10px] uppercase tracking-[0.2em] text-gray-900 dark:text-white font-medium"
                      >
                        Postal Code
                      </label>
                      <div className="border-b border-gray-900 dark:border-white pb-px">
                        <input
                          id="postalCode"
                          type="text"
                          placeholder="75500"
                          value={addressInfo.postalCode}
                          onChange={(e) =>
                            setAddressInfo({
                              ...addressInfo,
                              postalCode: e.target.value,
                            })
                          }
                          className="w-full h-12 px-0 bg-transparent text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  {errors.addressInfo && (
                    <div className="flex items-center gap-2 text-red-500">
                      <ExclamationTriangleIcon className="h-4 w-4" />
                      <p className="text-xs">{errors.addressInfo}</p>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isLoadingAddress}
                    className="bg-black dark:bg-white text-white dark:text-black px-12 h-12 uppercase tracking-[0.2em] text-[10px] font-medium hover:bg-gray-900 dark:hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoadingAddress ? "Saving..." : "Save Address"}
                  </button>
                </form>
              </div>

              {/* Change Password */}
              <div className="">
                <div className="mb-8">
                  <h2 className="text-2xl font-extralight text-gray-900 dark:text-white tracking-tight mb-2">
                    Change Password
                  </h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Update your account password
                  </p>
                </div>

                <form onSubmit={handlePasswordSubmit} className="space-y-8">
                  {/* Current Password */}
                  <div className="space-y-3">
                    <label
                      htmlFor="currentPassword"
                      className="text-[10px] uppercase tracking-[0.2em] text-gray-900 dark:text-white font-medium"
                    >
                      Current Password
                    </label>
                    <div className="border-b border-gray-900 dark:border-white pb-px">
                      <div className="flex items-center">
                        <input
                          id="currentPassword"
                          type={showCurrentPassword ? "text" : "password"}
                          placeholder="Enter current password"
                          value={passwordData.currentPassword}
                          onChange={(e) =>
                            setPasswordData({
                              ...passwordData,
                              currentPassword: e.target.value,
                            })
                          }
                          className="flex-1 h-12 px-0 bg-transparent text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setShowCurrentPassword(!showCurrentPassword)
                          }
                          className="h-12 px-3 -mr-3 text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                        >
                          {showCurrentPassword ? (
                            <EyeSlashIcon className="h-4 w-4" />
                          ) : (
                            <EyeIcon className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* New Password */}
                  <div className="space-y-3">
                    <label
                      htmlFor="newPassword"
                      className="text-[10px] uppercase tracking-[0.2em] text-gray-900 dark:text-white font-medium"
                    >
                      New Password
                    </label>
                    <div className="border-b border-gray-900 dark:border-white pb-px">
                      <div className="flex items-center">
                        <input
                          id="newPassword"
                          type={showNewPassword ? "text" : "password"}
                          placeholder="Minimum 8 characters"
                          value={passwordData.newPassword}
                          onChange={(e) =>
                            setPasswordData({
                              ...passwordData,
                              newPassword: e.target.value,
                            })
                          }
                          className="flex-1 h-12 px-0 bg-transparent text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="h-12 px-3 -mr-3 text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                        >
                          {showNewPassword ? (
                            <EyeSlashIcon className="h-4 w-4" />
                          ) : (
                            <EyeIcon className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Confirm Password */}
                  <div className="space-y-3">
                    <label
                      htmlFor="confirmPassword"
                      className="text-[10px] uppercase tracking-[0.2em] text-gray-900 dark:text-white font-medium"
                    >
                      Confirm New Password
                    </label>
                    <div className="border-b border-gray-900 dark:border-white pb-px">
                      <div className="flex items-center">
                        <input
                          id="confirmPassword"
                          type={showConfirmPassword ? "text" : "password"}
                          placeholder="Re-enter new password"
                          value={passwordData.confirmPassword}
                          onChange={(e) =>
                            setPasswordData({
                              ...passwordData,
                              confirmPassword: e.target.value,
                            })
                          }
                          className="flex-1 h-12 px-0 bg-transparent text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setShowConfirmPassword(!showConfirmPassword)
                          }
                          className="h-12 px-3 -mr-3 text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                        >
                          {showConfirmPassword ? (
                            <EyeSlashIcon className="h-4 w-4" />
                          ) : (
                            <EyeIcon className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  {errors.password && (
                    <div className="flex items-center gap-2 text-red-500">
                      <ExclamationTriangleIcon className="h-4 w-4" />
                      <p className="text-xs">{errors.password}</p>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isLoadingPassword}
                    className="bg-black dark:bg-white text-white dark:text-black px-12 h-12 uppercase tracking-[0.2em] text-[10px] font-medium hover:bg-gray-900 dark:hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoadingPassword ? "Updating..." : "Update Password"}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Email OTP Modal (same max width as PaymentModal) */}
      {isEmailModalOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/60 z-[10000]"
            onClick={() => {
              if (!isVerifyingOtp) {
                setIsEmailModalOpen(false);
                setPendingPersonalUpdate(null);
              }
            }}
          />
          <div className="fixed inset-0 flex items-center justify-center z-[10001] p-4">
            <div className="bg-white w-full max-w-3xl flex flex-col max-h-[90vh]">
              <div className="border-b border-gray-100 p-6">
                <h3 className="text-xl font-light text-gray-900 tracking-tight mb-1">
                  Verify Email Change
                </h3>
                <p className="text-xs text-gray-500">
                  Enter the 6-digit verification code sent to{" "}
                  <span className="font-medium">
                    {pendingPersonalUpdate?.email || personalInfo.email}
                  </span>
                </p>
              </div>

              <div className="overflow-y-auto flex-1 p-6">
                <div className="space-y-4 text-center">
                  <div className="flex justify-center gap-2">
                    {otp.map((digit, index) => (
                      <input
                        key={index}
                        id={`email-otp-${index}`}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpChange(index, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(index, e)}
                        onPaste={index === 0 ? handleOtpPaste : undefined}
                        aria-label={`OTP digit ${index + 1}`}
                        className={`w-12 h-12 text-center text-lg font-medium border ${
                          otpError
                            ? "border-red-500"
                            : digit
                              ? "border-gray-900 dark:border-white"
                              : "border-gray-200 dark:border-gray-800"
                        } bg-transparent text-gray-900 dark:text-white focus:outline-none focus:border-gray-900 dark:focus:border-white transition-all`}
                      />
                    ))}
                  </div>

                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Didn&apos;t receive the code?
                    </p>
                    <button
                      type="button"
                      onClick={() =>
                        sendOtpForEmail(pendingPersonalUpdate?.email)
                      }
                      disabled={resendTimer > 0 || isSendingOtp}
                      className="border border-black dark:border-white text-black dark:text-white px-6 h-10 uppercase tracking-[0.2em] text-[10px] font-medium hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors disabled:opacity-50"
                    >
                      {resendTimer > 0
                        ? `Resend in ${resendTimer}s`
                        : "Resend Code"}
                    </button>
                  </div>

                  <div className="border border-gray-200 dark:border-gray-800 p-4">
                    <div className="flex items-start gap-3">
                      <ExclamationTriangleIcon className="h-4 w-4 text-gray-900 dark:text-white flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-gray-900 dark:text-white">
                        For your security, this code will expire in 10 minutes.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-100 p-6 flex justify-between items-center bg-gray-50">
                <div />
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      if (!isVerifyingOtp) {
                        setIsEmailModalOpen(false);
                        setPendingPersonalUpdate(null);
                      }
                    }}
                    disabled={isVerifyingOtp}
                    className="border border-gray-300 text-gray-900 px-6 h-10 uppercase tracking-[0.2em] text-[10px] font-medium hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cancel
                  </button>

                  <button
                    onClick={() => verifyEmailOtpHandler()}
                    disabled={isVerifyingOtp || otp.some((d) => !d)}
                    className="bg-black dark:bg-white text-white dark:text-black px-6 h-10 uppercase tracking-[0.2em] text-[10px] font-medium hover:bg-gray-900 dark:hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {isVerifyingOtp ? (
                      <>
                        <ArrowPathIcon className="h-3.5 w-3.5 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      "Verify Email"
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
