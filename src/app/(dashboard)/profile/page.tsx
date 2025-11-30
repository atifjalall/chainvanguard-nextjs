/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  UserIcon,
  MapPinIcon,
  BuildingOfficeIcon,
  ShieldCheckIcon,
  PencilIcon,
  CheckIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import { useAuth } from "@/components/providers/auth-provider";
import { toast } from "sonner";
import { usePageTitle } from "@/hooks/use-page-title";
import { badgeColors, colors } from "@/lib/colorConstants";
import {
  updateProfile,
  getProfileStats,
  ProfileStats,
  // Added OTP helpers & types
  sendEmailOtp,
  verifyEmailOtp,
  UpdateProfileData,
} from "@/lib/api/profile.api";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useWallet } from "@/components/providers/wallet-provider";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";

// Province-City mapping (reuse from register page)
const provinceCityMap: Record<string, string[]> = {
  Punjab: [
    "Lahore",
    "Faisalabad",
    "Rawalpindi",
    "Multan",
    "Gujranwala",
    "Sialkot",
    "Bahawalpur",
    "Sargodha",
    "Kasur",
    "Okara",
  ],
  Sindh: [
    "Karachi",
    "Hyderabad",
    "Sukkur",
    "Larkana",
    "Mirpurkhas",
    "Nawabshah",
  ],
  "Khyber Pakhtunkhwa": [
    "Peshawar",
    "Abbottabad",
    "Mardan",
    "Mingora",
    "Kohat",
  ],
  Balochistan: ["Quetta", "Turbat", "Khuzdar", "Hub", "Chaman", "Gwadar"],
  "Islamabad Capital Territory": ["Islamabad"],
  "Gilgit-Baltistan": ["Gilgit", "Skardu", "Hunza", "Ghanche"],
  "Azad Jammu and Kashmir": ["Muzaffarabad", "Mirpur", "Rawalakot", "Kotli"],
};

const provinceOptions = [
  "Punjab",
  "Sindh",
  "Khyber Pakhtunkhwa",
  "Balochistan",
  "Islamabad Capital Territory",
  "Gilgit-Baltistan",
  "Azad Jammu and Kashmir",
];

const businessTypes = [
  "Manufacturing",
  "Trading",
  "Retail",
  "Wholesale",
  "Service",
  "Other",
];

export default function ProfilePage() {
  usePageTitle("Profile");
  const { user, updateProfile: updateAuthProfile } = useAuth();
  const { currentWallet } = useWallet();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [stats, setStats] = useState<ProfileStats | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    province: "",
    city: "",
    postalCode: "",
    role: "",
    companyName: "",
    businessAddress: "",
    businessType: "",
    registrationNumber: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // OTP related states
  const [isOtpModalOpen, setIsOtpModalOpen] = useState(false);
  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState("");
  const [isOtpLoading, setIsOtpLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [pendingSaveData, setPendingSaveData] =
    useState<UpdateProfileData | null>(null);
  const [pendingEmail, setPendingEmail] = useState<string>("");

  useEffect(() => {
    setIsVisible(true);
    if (user) {
      setFormData({
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
        address: user.address || "",
        province: user.state || "",
        city: user.city || "",
        postalCode: user.postalCode || "",
        role: user.role || "",
        companyName: user.companyName || "",
        businessAddress: user.businessAddress || "",
        businessType: user.businessType || "",
        registrationNumber: user.registrationNumber || "",
      });

      // Fetch profile stats
      const fetchStats = async () => {
        try {
          const response = await getProfileStats();
          if (response.success && response.data) {
            setStats(response.data);
          }
        } catch (error) {
          console.error("Failed to fetch profile stats:", error);
        }
      };

      fetchStats();
    }
  }, [user]);

  // Countdown for Resend button
  useEffect(() => {
    if (resendTimer <= 0) return;
    const interval = setInterval(() => {
      setResendTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [resendTimer]);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) newErrors.name = "Name is required";
    if (!formData.email.trim()) newErrors.email = "Email is required";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))
      newErrors.email = "Invalid email format";
    if (!formData.phone.trim()) newErrors.phone = "Phone is required";
    if (
      !formData.phone.trim() ||
      formData.phone.length !== 15 ||
      !/^\+92 \d{3} \d{7}$/.test(formData.phone)
    )
      newErrors.phone = "Invalid phone format";
    if (!formData.address.trim()) newErrors.address = "Address is required";
    if (!formData.province) newErrors.province = "Province is required";
    if (!formData.city) newErrors.city = "City is required";
    if (!formData.postalCode.trim())
      newErrors.postalCode = "Postal code is required";
    if (formData.postalCode.length !== 5)
      newErrors.postalCode = "Postal code must be 5 digits";

    const requiresBusinessInfo = ["supplier", "vendor"].includes(formData.role);
    if (requiresBusinessInfo) {
      if (!formData.companyName.trim())
        newErrors.companyName = "Company name is required";
      if (!formData.businessAddress.trim())
        newErrors.businessAddress = "Business address is required";
      if (!formData.businessType)
        newErrors.businessType = "Business type is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Send OTP (returns success)
   */
  const sendOtpToEmail = async (targetEmail: string) => {
    try {
      const resp = await sendEmailOtp(targetEmail);
      if (resp.success) {
        setResendTimer(30); // 30 second cooldown
        return { success: true, message: resp.message };
      }
      return { success: false, error: resp.error || "Failed to send OTP" };
    } catch (error: any) {
      return { success: false, error: error.message || "Failed to send OTP" };
    }
  };

  const handleSave = async () => {
    if (!validateForm()) {
      toast.error("Please fix the errors before saving");
      return;
    }

    // If the email address is being changed, start OTP flow instead of saving immediately
    const emailChanged = user?.email && formData.email !== user.email;

    if (emailChanged) {
      // Check wallet presence first
      if (!currentWallet) {
        toast.error("Please connect your wallet before changing your email");
        return;
      }

      // send OTP and open modal
      setIsLoading(true);
      try {
        const sendResp = await sendOtpToEmail(formData.email);
        if (!sendResp.success) {
          toast.error(sendResp.error || "Failed to send OTP to new email");
          return;
        }

        // keep the pending save data to use after OTP verification
        const saveData: UpdateProfileData = {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          address: formData.address,
          city: formData.city,
          state: formData.province,
          postalCode: formData.postalCode,
          companyName: formData.companyName,
          businessAddress: formData.businessAddress,
          businessType: formData.businessType,
          registrationNumber: formData.registrationNumber,
        };

        setPendingSaveData(saveData);
        setPendingEmail(formData.email);
        setIsOtpModalOpen(true);
        toast.success("Verification code sent to new email");
      } catch (error) {
        toast.error("Failed to send OTP");
      } finally {
        setIsLoading(false);
      }
      return;
    }

    setIsLoading(true);
    try {
      const result = await updateProfile({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        city: formData.city,
        state: formData.province,
        postalCode: formData.postalCode,
        companyName: formData.companyName,
        businessAddress: formData.businessAddress,
        businessType: formData.businessType,
        registrationNumber: formData.registrationNumber,
      });

      if (result.success && result.user) {
        // Update auth context with new user data
        updateAuthProfile(result.user);
        toast.success("Profile updated successfully");
        setIsEditing(false);
      } else {
        toast.error(result.error || "Failed to update profile");
      }
    } catch (error) {
      toast.error("Failed to update profile");
    } finally {
      setIsLoading(false);
    }
  };

  // OTP Modal verification handler
  const handleVerifyOtp = async () => {
    // local validation
    if (otp.trim().length !== 6) {
      setOtpError("Please enter the 6 digit code");
      return;
    }

    if (!pendingSaveData || !pendingEmail) {
      setOtpError("No pending changes found");
      return;
    }

    setIsOtpLoading(true);
    setOtpError("");
    try {
      const verifyResp = await verifyEmailOtp(pendingEmail, otp.trim());
      if (!verifyResp.success) {
        setOtpError(verifyResp.error || "Invalid or expired code");
        setIsOtpLoading(false);
        return;
      }

      // Verified — apply pending save data
      const result = await updateProfile(pendingSaveData);

      if (result.success && result.user) {
        updateAuthProfile(result.user);
        toast.success("Profile updated successfully");
        setIsEditing(false);
        // clear pending
        setPendingSaveData(null);
        setPendingEmail("");
        setOtp("");
        setIsOtpModalOpen(false);
      } else {
        toast.error(
          result.error || "Failed to update profile after verification"
        );
      }
    } catch (error: any) {
      console.error("OTP verification or update failed:", error);
      toast.error("Failed to verify OTP or update profile");
    } finally {
      setIsOtpLoading(false);
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendTimer > 0) return;
    if (!pendingEmail) return;
    setIsOtpLoading(true);
    try {
      const resp = await sendOtpToEmail(pendingEmail);
      if (resp.success) {
        toast.success("OTP resent");
      } else {
        toast.error(resp.error || "Failed to resend OTP");
      }
    } catch (error) {
      toast.error("Failed to resend OTP");
    } finally {
      setIsOtpLoading(false);
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    });
  };

  const availableCities = formData.province
    ? provinceCityMap[formData.province] || []
    : [];
  const requiresBusinessInfo = ["supplier", "vendor"].includes(formData.role);

  if (!user) return <div>Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="relative z-10 p-6 space-y-6">
        {/* Breadcrumb */}
        <Breadcrumb className="mb-6">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/expert">Dashboard</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Profile Settings</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        {/* Header */}
        <div
          className={`transform transition-all duration-700 ${
            isVisible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
          }`}
        >
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="space-y-2">
              <h1 className={`text-2xl font-bold ${colors.texts.primary}`}>
                Profile Settings
              </h1>
              <p className={`text-base ${colors.texts.secondary}`}>
                Manage your account information and preferences
              </p>
              <div className="flex items-center gap-3 mt-2">
                <Badge
                  className={`${badgeColors.blue.bg} ${badgeColors.blue.border} ${badgeColors.blue.text} text-xs rounded-none`}
                >
                  {formData.role}
                </Badge>
                <Badge
                  className={`${badgeColors.cyan.bg} ${badgeColors.cyan.border} ${badgeColors.cyan.text} flex items-center gap-1 text-xs rounded-none`}
                >
                  <ShieldCheckIcon
                    className={`h-3 w-3 ${badgeColors.cyan.icon}`}
                  />
                  Blockchain Verified
                </Badge>
              </div>
            </div>

            {/* Edit Button */}
            {!isEditing && (
              <Button
                onClick={() => setIsEditing(true)}
                className={`${colors.buttons.primary} text-sm cursor-pointer h-10 rounded-none`}
              >
                <PencilIcon className="h-4 w-4 mr-2" />
                Edit Profile
              </Button>
            )}
          </div>
        </div>

        {/* Profile Stats */}
        {stats && (
          <div
            className={`transform transition-all duration-700 delay-100 ${
              isVisible
                ? "translate-y-0 opacity-100"
                : "translate-y-4 opacity-0"
            }`}
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card
                className={`${colors.cards.base} transition-all duration-300 rounded-none !shadow-none hover:!shadow-none`}
              >
                <CardContent className="p-4">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                    Member Since
                  </p>
                  <p className={`text-sm font-medium ${colors.texts.primary}`}>
                    {formatDate(stats.memberSince)}
                  </p>
                </CardContent>
              </Card>

              <Card
                className={`${colors.cards.base} transition-all duration-300 rounded-none !shadow-none hover:!shadow-none`}
              >
                <CardContent className="p-4">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                    Total Orders
                  </p>
                  <p className={`text-sm font-medium ${colors.texts.primary}`}>
                    {stats.totalOrders}
                  </p>
                </CardContent>
              </Card>

              <Card
                className={`${colors.cards.base} transition-all duration-300 rounded-none !shadow-none hover:!shadow-none`}
              >
                <CardContent className="p-4">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                    Saved Items
                  </p>
                  <p className={`text-sm font-medium ${colors.texts.primary}`}>
                    {stats.savedItems}
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Profile Content */}
        <div
          className={`transform transition-all duration-700 delay-200 ${
            isVisible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
          }`}
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Personal Information */}
            <Card
              className={`${colors.cards.base} transition-all duration-300 rounded-none !shadow-none hover:!shadow-none`}
            >
              <CardHeader>
                <CardTitle
                  className={`flex items-center gap-3 text-base ${colors.texts.primary}`}
                >
                  <UserIcon className={`h-5 w-5 ${colors.icons.primary}`} />
                  Personal Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Full Name</Label>
                  {isEditing ? (
                    <Input
                      value={formData.name}
                      onChange={(e) =>
                        handleInputChange("name", e.target.value)
                      }
                      className={`rounded-none ${errors.name ? "border-red-500" : ""}`}
                    />
                  ) : (
                    <p className={`text-sm ${colors.texts.primary}`}>
                      {formData.name}
                    </p>
                  )}
                  {errors.name && (
                    <p className="text-xs text-red-500 flex items-center gap-1">
                      <ExclamationTriangleIcon className="h-3 w-3" />
                      {errors.name}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Email</Label>
                  {isEditing ? (
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        handleInputChange("email", e.target.value)
                      }
                      className={`rounded-none ${errors.email ? "border-red-500" : ""}`}
                    />
                  ) : (
                    <p className={`text-sm ${colors.texts.primary}`}>
                      {formData.email}
                    </p>
                  )}
                  {errors.email && (
                    <p className="text-xs text-red-500 flex items-center gap-1">
                      <ExclamationTriangleIcon className="h-3 w-3" />
                      {errors.email}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Phone</Label>
                  {isEditing ? (
                    <Input
                      value={formData.phone}
                      onChange={(e) =>
                        handleInputChange("phone", e.target.value)
                      }
                      className={`rounded-none ${errors.phone ? "border-red-500" : ""}`}
                    />
                  ) : (
                    <p className={`text-sm ${colors.texts.primary}`}>
                      {formData.phone}
                    </p>
                  )}
                  {errors.phone && (
                    <p className="text-xs text-red-500 flex items-center gap-1">
                      <ExclamationTriangleIcon className="h-3 w-3" />
                      {errors.phone}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Address Information */}
            <Card
              className={`${colors.cards.base} transition-all duration-300 rounded-none !shadow-none hover:!shadow-none`}
            >
              <CardHeader>
                <CardTitle
                  className={`flex items-center gap-3 text-base ${colors.texts.primary}`}
                >
                  <MapPinIcon className={`h-5 w-5 ${colors.icons.primary}`} />
                  Address Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Address</Label>
                  {isEditing ? (
                    <Textarea
                      value={formData.address}
                      onChange={(e) =>
                        handleInputChange("address", e.target.value)
                      }
                      className={`rounded-none h-24 ${errors.address ? "border-red-500" : ""}`}
                    />
                  ) : (
                    <p className={`text-sm ${colors.texts.primary}`}>
                      {formData.address}
                    </p>
                  )}
                  {errors.address && (
                    <p className="text-xs text-red-500 flex items-center gap-1">
                      <ExclamationTriangleIcon className="h-3 w-3" />
                      {errors.address}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Province</Label>
                    {isEditing ? (
                      <Select
                        value={formData.province}
                        onValueChange={(value) =>
                          handleInputChange("province", value)
                        }
                      >
                        <SelectTrigger
                          className={`rounded-none w-full ${errors.province ? "border-red-500" : ""}`}
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {provinceOptions.map((province) => (
                            <SelectItem key={province} value={province}>
                              {province}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <p className={`text-sm ${colors.texts.primary}`}>
                        {formData.province}
                      </p>
                    )}
                    {errors.province && (
                      <p className="text-xs text-red-500 flex items-center gap-1">
                        <ExclamationTriangleIcon className="h-3 w-3" />
                        {errors.province}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium">City</Label>
                    {isEditing ? (
                      <Select
                        value={formData.city}
                        onValueChange={(value) =>
                          handleInputChange("city", value)
                        }
                      >
                        <SelectTrigger
                          className={`rounded-none w-full ${errors.city ? "border-red-500" : ""}`}
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {availableCities.map((city) => (
                            <SelectItem key={city} value={city}>
                              {city}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <p className={`text-sm ${colors.texts.primary}`}>
                        {formData.city}
                      </p>
                    )}
                    {errors.city && (
                      <p className="text-xs text-red-500 flex items-center gap-1">
                        <ExclamationTriangleIcon className="h-3 w-3" />
                        {errors.city}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Postal Code</Label>
                  {isEditing ? (
                    <Input
                      value={formData.postalCode}
                      onChange={(e) =>
                        handleInputChange("postalCode", e.target.value)
                      }
                      className={`rounded-none ${errors.postalCode ? "border-red-500" : ""}`}
                    />
                  ) : (
                    <p className={`text-sm ${colors.texts.primary}`}>
                      {formData.postalCode}
                    </p>
                  )}
                  {errors.postalCode && (
                    <p className="text-xs text-red-500 flex items-center gap-1">
                      <ExclamationTriangleIcon className="h-3 w-3" />
                      {errors.postalCode}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Business Information (Conditional) */}
            {requiresBusinessInfo && (
              <Card
                className={`${colors.cards.base} transition-all duration-300 rounded-none !shadow-none hover:!shadow-none`}
              >
                <CardHeader>
                  <CardTitle
                    className={`flex items-center gap-3 text-base ${colors.texts.primary}`}
                  >
                    <BuildingOfficeIcon
                      className={`h-5 w-5 ${colors.icons.primary}`}
                    />
                    Business Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Company Name</Label>
                    {isEditing ? (
                      <Input
                        value={formData.companyName}
                        onChange={(e) =>
                          handleInputChange("companyName", e.target.value)
                        }
                        className={`rounded-none ${errors.companyName ? "border-red-500" : ""}`}
                      />
                    ) : (
                      <p className={`text-sm ${colors.texts.primary}`}>
                        {formData.companyName}
                      </p>
                    )}
                    {errors.companyName && (
                      <p className="text-xs text-red-500 flex items-center gap-1">
                        <ExclamationTriangleIcon className="h-3 w-3" />
                        {errors.companyName}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium">
                      Business Address
                    </Label>
                    {isEditing ? (
                      <Textarea
                        value={formData.businessAddress}
                        onChange={(e) =>
                          handleInputChange("businessAddress", e.target.value)
                        }
                        className={`rounded-none h-24 ${errors.businessAddress ? "border-red-500" : ""}`}
                      />
                    ) : (
                      <p className={`text-sm ${colors.texts.primary}`}>
                        {formData.businessAddress}
                      </p>
                    )}
                    {errors.businessAddress && (
                      <p className="text-xs text-red-500 flex items-center gap-1">
                        <ExclamationTriangleIcon className="h-3 w-3" />
                        {errors.businessAddress}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">
                        Business Type
                      </Label>
                      {isEditing ? (
                        <Select
                          value={formData.businessType}
                          onValueChange={(value) =>
                            handleInputChange("businessType", value)
                          }
                        >
                          <SelectTrigger
                            className={`rounded-none w-full ${errors.businessType ? "border-red-500" : ""}`}
                          >
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {businessTypes.map((type) => (
                              <SelectItem key={type} value={type}>
                                {type}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <p className={`text-sm ${colors.texts.primary}`}>
                          {formData.businessType}
                        </p>
                      )}
                      {errors.businessType && (
                        <p className="text-xs text-red-500 flex items-center gap-1">
                          <ExclamationTriangleIcon className="h-3 w-3" />
                          {errors.businessType}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium">
                        Registration Number
                      </Label>
                      {isEditing ? (
                        <Input
                          value={formData.registrationNumber}
                          onChange={(e) =>
                            handleInputChange(
                              "registrationNumber",
                              e.target.value
                            )
                          }
                          className="rounded-none"
                        />
                      ) : (
                        <p className={`text-sm ${colors.texts.primary}`}>
                          {formData.registrationNumber}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Save Button */}
          {isEditing && (
            <div className="gap-6 pt-6">
              <div className="flex justify-end gap-4">
                <Button
                  variant="outline"
                  onClick={() => setIsEditing(false)}
                  className="rounded-none"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={isLoading}
                  className={`${colors.buttons.primary} text-sm cursor-pointer h-10 rounded-none`}
                >
                  {isLoading ? (
                    "Saving..."
                  ) : (
                    <>
                      <CheckIcon className="h-4 w-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* OTP Verification Modal (same size as the wallet modal for consistent sizing) */}
      <Dialog
        open={isOtpModalOpen}
        onOpenChange={(open) => setIsOtpModalOpen(open)}
      >
        <DialogContent
          style={{ width: "100%", maxWidth: "900px" }}
          className={`w-full max-w-[900px] max-h-[90vh] overflow-y-auto ${colors.backgrounds.modal} ${colors.borders.primary} rounded-none p-0 !shadow-none hover:!shadow-none`}
        >
          <div className="p-6">
            <DialogHeader>
              <DialogTitle
                className={`flex items-center gap-3 text-xl font-bold ${colors.texts.primary}`}
              >
                Verify Your Email
              </DialogTitle>
              <DialogDescription
                className={`text-base ${colors.texts.secondary} mt-2`}
              >
                A 6-digit verification code has been sent to{" "}
                <span className="font-medium">{pendingEmail}</span>. Enter it
                below to confirm your email change.
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="p-6">
            <div className="space-y-4">
              <div>
                <Label className={`text-sm ${colors.texts.secondary}`}>
                  Verification Code
                </Label>
                <Input
                  maxLength={6}
                  value={otp}
                  onChange={(e) => {
                    const digitsOnly = e.target.value.replace(/\D/g, "");
                    setOtp(digitsOnly.slice(0, 6));
                    if (otpError) setOtpError("");
                  }}
                  placeholder="123456"
                  className="rounded-none text-sm w-full h-10"
                />
                {otpError && (
                  <p className="text-xs text-red-500 mt-2 flex items-center gap-1">
                    <ExclamationTriangleIcon className="h-3 w-3" />
                    {otpError}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between">
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Didn&apos;t receive the code?
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleResendOtp}
                    disabled={resendTimer > 0 || isOtpLoading}
                    className="rounded-none text-xs"
                  >
                    {resendTimer > 0
                      ? `Resend in ${resendTimer}s`
                      : "Resend Code"}
                  </Button>
                  <Button
                    onClick={handleVerifyOtp}
                    disabled={isOtpLoading}
                    className={`${colors.buttons.primary} rounded-none text-xs`}
                  >
                    {isOtpLoading ? "Verifying..." : "Verify & Update"}
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div
            className={`p-6 border-t ${colors.borders.primary} flex items-center justify-between`}
          >
            <div className={`text-xs ${colors.texts.secondary}`}>
              <p>Need help? Contact support@chainvanguard.com</p>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setIsOtpModalOpen(false);
                setPendingSaveData(null);
                setPendingEmail("");
                setOtp("");
                setOtpError("");
              }}
              disabled={isOtpLoading}
              className={`px-6 h-9 ${colors.buttons.outline} rounded-none text-xs font-medium disabled:opacity-50 transition-all hover:border-black dark:hover:border-white cursor-pointer`}
            >
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
