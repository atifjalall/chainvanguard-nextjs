"use client";

import React, { useState } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { useWallet } from "@/components/providers/wallet-provider";
import { toast } from "sonner";
import {
  UserIcon,
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  LockClosedIcon,
  EyeIcon,
  EyeSlashIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";
import { ChevronRightIcon } from "@heroicons/react/24/outline";
import { useRouter } from "next/navigation";

export default function CustomerProfilePage() {
  const router = useRouter();
  const { user } = useAuth();
  const { currentWallet, balance } = useWallet();

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
    province: user?.province || "",
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

  const handlePersonalInfoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoadingPersonal(true);
    setErrors({ ...errors, personalInfo: "" });

    try {
      // API call to update personal info
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success("Personal information updated successfully");
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
      // API call to update address info
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success("Address information updated successfully");
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
                        Balance: <span className="font-medium">${balance}</span>
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
                        12
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        Saved Items
                      </span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        5
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        Member Since
                      </span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        2024
                      </span>
                    </div>
                  </div>
                </div>
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
                    <label className="text-[10px] uppercase tracking-[0.2em] text-gray-900 dark:text-white font-medium">
                      Full Name
                    </label>
                    <div className="border-b border-gray-900 dark:border-white pb-px">
                      <input
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
                    <label className="text-[10px] uppercase tracking-[0.2em] text-gray-900 dark:text-white font-medium">
                      Email Address
                    </label>
                    <div className="border-b border-gray-900 dark:border-white pb-px">
                      <input
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
                    <label className="text-[10px] uppercase tracking-[0.2em] text-gray-900 dark:text-white font-medium">
                      Phone Number
                    </label>
                    <div className="border-b border-gray-900 dark:border-white pb-px">
                      <input
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
                    <label className="text-[10px] uppercase tracking-[0.2em] text-gray-900 dark:text-white font-medium">
                      Street Address
                    </label>
                    <div className="border-b border-gray-900 dark:border-white pb-px">
                      <input
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

                  {/* City & Province */}
                  <div className="grid md:grid-cols-2 gap-8">
                    <div className="space-y-3">
                      <label className="text-[10px] uppercase tracking-[0.2em] text-gray-900 dark:text-white font-medium">
                        City
                      </label>
                      <div className="border-b border-gray-900 dark:border-white pb-px">
                        <input
                          type="text"
                          placeholder="New York"
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
                      <label className="text-[10px] uppercase tracking-[0.2em] text-gray-900 dark:text-white font-medium">
                        Province/State
                      </label>
                      <div className="border-b border-gray-900 dark:border-white pb-px">
                        <input
                          type="text"
                          placeholder="NY"
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
                    <label className="text-[10px] uppercase tracking-[0.2em] text-gray-900 dark:text-white font-medium">
                      Current Password
                    </label>
                    <div className="border-b border-gray-900 dark:border-white pb-px">
                      <div className="flex items-center">
                        <input
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
                    <label className="text-[10px] uppercase tracking-[0.2em] text-gray-900 dark:text-white font-medium">
                      New Password
                    </label>
                    <div className="border-b border-gray-900 dark:border-white pb-px">
                      <div className="flex items-center">
                        <input
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
                    <label className="text-[10px] uppercase tracking-[0.2em] text-gray-900 dark:text-white font-medium">
                      Confirm New Password
                    </label>
                    <div className="border-b border-gray-900 dark:border-white pb-px">
                      <div className="flex items-center">
                        <input
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
    </div>
  );
}
