/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
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
import { Separator } from "@/components/ui/separator";
import {
  UserIcon,
  MapPinIcon,
  BuildingOfficeIcon,
  ShieldCheckIcon,
  CheckIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  EnvelopeIcon,
  PhoneIcon,
  IdentificationIcon,
} from "@heroicons/react/24/outline";
import { useAuth } from "@/components/providers/auth-provider";
import { toast } from "sonner";
import { usePageTitle } from "@/hooks/use-page-title";
import { badgeColors, colors } from "@/lib/colorConstants";
import {
  updateProfile,
  getProfileStats,
  ProfileStats,
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
import { FadeUp } from "@/components/animations/fade-up";

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

const FORM_SPACING = "space-y-6";
const SECTION_MARGIN = "mb-6";
const CONTAINER_PADDING = "p-4 md:p-6";
const FIELD_GAP = "gap-6";

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

  // Email checking states
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const [emailExists, setEmailExists] = useState(false);
  const [originalEmail, setOriginalEmail] = useState("");

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
      setOriginalEmail(user.email || "");

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

  // Email checking effect
  useEffect(() => {
    const checkEmailExists = async () => {
      // Skip if email hasn't changed or is invalid
      if (!formData.email.trim() || !formData.email.includes("@")) {
        setEmailExists(false);
        return;
      }

      // Skip if email is the same as original
      if (formData.email === originalEmail) {
        setEmailExists(false);
        return;
      }

      setIsCheckingEmail(true);
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api"}/auth/check-email?email=${encodeURIComponent(formData.email)}`
        );

        if (!response.ok) throw new Error("Failed to check email");
        const data = await response.json();

        if (data.exists) {
          setEmailExists(true);
          setErrors((prev) => ({
            ...prev,
            email: "This email is already registered",
          }));
        } else {
          setEmailExists(false);
          setErrors((prev) => {
            const newErrors = { ...prev };
            if (newErrors.email === "This email is already registered") {
              delete newErrors.email;
            }
            return newErrors;
          });
        }
      } catch (error) {
        setEmailExists(false);
      } finally {
        setIsCheckingEmail(false);
      }
    };

    const timeoutId = setTimeout(checkEmailExists, 500);
    return () => clearTimeout(timeoutId);
  }, [formData.email, originalEmail]);

  // Clear city when province changes, but only if city is not valid for the new province
  useEffect(() => {
    if (formData.province && formData.city) {
      const validCities = provinceCityMap[formData.province] || [];
      // Only clear city if it's not valid for the current province
      if (!validCities.includes(formData.city)) {
        setFormData((prev) => ({ ...prev, city: "" }));
      }
    } else if (!formData.province) {
      // Clear city if no province is selected
      setFormData((prev) => ({ ...prev, city: "" }));
    }
  }, [formData.province, formData.city]);

  const handleInputChange = (field: string, value: string) => {
    // Add character limit for name field
    if (field === "name" && value.length > 30) {
      return;
    }

    // Phone formatting
    if (field === "phone") {
      let val = value;
      if (!val.startsWith("+92 ")) val = "+92 ";
      let rest = val.slice(4).replace(/[^0-9 ]/g, "");
      rest = rest.replace(/ {2,}/g, " ");
      rest = rest.replace(/^(\d{3})\s?(\d{0,7})/, "$1 $2").trimEnd();
      rest = rest.slice(0, 11);
      value = "+92 " + rest;
    }

    // Postal code formatting
    if (field === "postalCode") {
      value = value.replace(/\D/g, "").slice(0, 5);
    }

    // Clear city when province changes
    if (field === "province") {
      setFormData((prev) => ({ ...prev, province: value, city: "" }));
      if (errors[field]) {
        setErrors((prev) => ({ ...prev, [field]: "" }));
      }
      if (errors.city) {
        setErrors((prev) => ({ ...prev, city: "" }));
      }
      return;
    }

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
    if (emailExists && formData.email !== originalEmail)
      newErrors.email = "This email is already registered";
    if (!formData.phone.trim()) newErrors.phone = "Phone is required";
    if (
      !formData.phone.trim() ||
      formData.phone.length !== 15 ||
      !/^\+92 \d{3} \d{7}$/.test(formData.phone)
    )
      newErrors.phone = "Invalid phone format";
    if (!formData.address.trim()) newErrors.address = "Address is required";
    if (formData.address.trim().length < 10)
      newErrors.address = "Address must be at least 10 characters";
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
      if (formData.businessAddress.trim().length < 10)
        newErrors.businessAddress =
          "Business address must be at least 10 characters";
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
        setResendTimer(60);
        return { success: true, message: resp.message };
      }
      return { success: false, error: resp.error || "Failed to send OTP" };
    } catch (error: any) {
      return { success: false, error: error.message || "Failed to send OTP" };
    }
  };

  const handleSave = async () => {
    // Check if email is being checked
    if (isCheckingEmail) {
      toast.info("Please wait while we verify your email...");
      return;
    }

    if (!validateForm()) {
      toast.error("Please fix the errors before saving");
      return;
    }

    // If the email address is being changed, start OTP flow instead of saving immediately
    const emailChanged = originalEmail && formData.email !== originalEmail;

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
        setOriginalEmail(result.user.email || formData.email);
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
        setOriginalEmail(result.user.email || pendingEmail);
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

  const availableCities = formData.province
    ? provinceCityMap[formData.province] || []
    : [];
  const requiresBusinessInfo = ["supplier", "vendor"].includes(formData.role);

  if (!user) return <div>Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className={`relative z-10 ${CONTAINER_PADDING}`}>
        {/* Breadcrumb */}
        <FadeUp delay={0}>
          <Breadcrumb className={SECTION_MARGIN}>
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
        </FadeUp>

        {/* Header */}
        <FadeUp delay={0.1}>
          <div
            className={`${SECTION_MARGIN} flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4`}
          >
            <div className="space-y-2">
              <h1 className="text-lg md:text-2xl font-bold text-gray-900 dark:text-white">
                Profile Settings
              </h1>
              <p className="text-sm md:text-base text-gray-600 dark:text-gray-400">
                Manage your account information and preferences
              </p>
              <div className="flex items-center gap-3 mt-2">
                <Badge
                  className={`${badgeColors.blue.bg} ${badgeColors.blue.border} ${badgeColors.blue.text} text-xs rounded-none`}
                >
                  <UserIcon
                    className={`h-3 w-3 mr-1 ${badgeColors.blue.icon}`}
                  />
                  {formData.role}
                </Badge>
                {stats && (
                  <Badge
                    className={`${badgeColors.grey.bg} ${badgeColors.grey.border} ${badgeColors.grey.text} text-xs rounded-none`}
                  >
                    Member since {new Date(stats.memberSince).getFullYear()}
                  </Badge>
                )}
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
          </div>
        </FadeUp>

        {/* Main Content */}
        <FadeUp delay={0.2}>
          <Card className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-none shadow-none">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-gray-900 dark:text-white flex items-center gap-2">
                    <IdentificationIcon className="h-5 w-5 text-gray-700 dark:text-gray-300" />
                    Account Information
                  </CardTitle>
                  <CardDescription className="text-gray-600 dark:text-gray-400 mt-1">
                    {isEditing
                      ? "Update your account details below"
                      : "Your personal and business information"}
                  </CardDescription>
                </div>
                {!isEditing && (
                  <Button
                    onClick={() => setIsEditing(true)}
                    variant="outline"
                    className="rounded-none text-sm hover:border-black dark:hover:border-white cursor-pointer"
                  >
                    Edit Profile
                  </Button>
                )}
              </div>
            </CardHeader>

            <CardContent className={FORM_SPACING}>
              {/* Personal Information Section */}
              <div className={FORM_SPACING}>
                <div className="flex items-center gap-2 mb-4">
                  <UserIcon className="h-5 w-5 text-gray-700 dark:text-gray-300" />
                  <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                    Personal Details
                  </h3>
                </div>

                <div className={`grid grid-cols-1 ${FIELD_GAP}`}>
                  {/* Full Name - Full Row */}
                  <div>
                    <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Full Name <span className="text-red-500">*</span>
                    </Label>
                    {isEditing ? (
                      <Input
                        value={formData.name}
                        onChange={(e) =>
                          handleInputChange("name", e.target.value)
                        }
                        maxLength={30}
                        className={`rounded-none h-10 ${errors.name ? "border-red-500" : ""}`}
                        placeholder="Enter your full name"
                      />
                    ) : (
                      <div className="h-10 flex items-center px-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-none">
                        <p className="text-sm text-gray-900 dark:text-gray-100">
                          {formData.name}
                        </p>
                      </div>
                    )}
                    {errors.name && (
                      <p className="text-xs text-red-500 flex items-center gap-1 mt-1">
                        <ExclamationTriangleIcon className="h-3 w-3" />
                        {errors.name}
                      </p>
                    )}
                  </div>

                  {/* Email and Phone - Second Row */}
                  <div
                    className={`grid grid-cols-1 md:grid-cols-2 ${FIELD_GAP}`}
                  >
                    <div>
                      <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Email Address <span className="text-red-500">*</span>
                      </Label>
                      {isEditing ? (
                        <div className="relative">
                          <Input
                            type="email"
                            value={formData.email}
                            onChange={(e) =>
                              handleInputChange("email", e.target.value)
                            }
                            className={`rounded-none h-10 pr-10 ${
                              errors.email || emailExists
                                ? "border-red-500"
                                : formData.email &&
                                    !isCheckingEmail &&
                                    !emailExists &&
                                    formData.email !== originalEmail &&
                                    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
                                      formData.email
                                    )
                                  ? "border-green-500"
                                  : ""
                            }`}
                            placeholder="your@email.com"
                          />
                          <div className="absolute right-3 top-1/2 -translate-y-1/2">
                            {isCheckingEmail ? (
                              <ArrowPathIcon className="h-4 w-4 animate-spin text-blue-500" />
                            ) : formData.email && emailExists ? (
                              <ExclamationTriangleIcon className="h-4 w-4 text-red-500" />
                            ) : formData.email &&
                              !emailExists &&
                              formData.email !== originalEmail &&
                              /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
                                formData.email
                              ) ? (
                              <CheckIcon className="h-4 w-4 text-green-500" />
                            ) : null}
                          </div>
                        </div>
                      ) : (
                        <div className="h-10 flex items-center px-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-none">
                          <p className="text-sm text-gray-900 dark:text-gray-100">
                            {formData.email}
                          </p>
                        </div>
                      )}
                      {errors.email && (
                        <p className="text-xs text-red-500 flex items-center gap-1 mt-1">
                          <ExclamationTriangleIcon className="h-3 w-3" />
                          {errors.email}
                        </p>
                      )}
                      {isEditing &&
                        formData.email &&
                        !isCheckingEmail &&
                        !emailExists &&
                        !errors.email &&
                        formData.email !== originalEmail &&
                        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email) && (
                          <p className="text-xs text-green-500 flex items-center gap-1 mt-1">
                            <CheckIcon className="h-3 w-3" />
                            Email is available
                          </p>
                        )}
                    </div>

                    <div>
                      <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Phone Number <span className="text-red-500">*</span>
                      </Label>
                      {isEditing ? (
                        <Input
                          type="tel"
                          maxLength={15}
                          value={
                            formData.phone.startsWith("+92 ")
                              ? formData.phone
                              : "+92 "
                          }
                          onChange={(e) =>
                            handleInputChange("phone", e.target.value)
                          }
                          className={`rounded-none h-10 ${errors.phone ? "border-red-500" : ""}`}
                          placeholder="300 1234567"
                        />
                      ) : (
                        <div className="h-10 flex items-center px-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-none">
                          <p className="text-sm text-gray-900 dark:text-gray-100">
                            {formData.phone}
                          </p>
                        </div>
                      )}
                      {errors.phone && (
                        <p className="text-xs text-red-500 flex items-center gap-1 mt-1">
                          <ExclamationTriangleIcon className="h-3 w-3" />
                          {errors.phone}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Address Information Section */}
              <div className={FORM_SPACING}>
                <div className="flex items-center gap-2 mb-4">
                  <MapPinIcon className="h-5 w-5 text-gray-700 dark:text-gray-300" />
                  <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                    Address Information
                  </h3>
                </div>

                <div className={FORM_SPACING}>
                  <div>
                    <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Street Address <span className="text-red-500">*</span>
                    </Label>
                    {isEditing ? (
                      <Textarea
                        value={formData.address}
                        onChange={(e) =>
                          handleInputChange("address", e.target.value)
                        }
                        className={`rounded-none min-h-[80px] ${errors.address ? "border-red-500" : ""}`}
                        placeholder="Enter your complete address"
                      />
                    ) : (
                      <div className="min-h-[80px] flex items-center px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-none">
                        <p className="text-sm text-gray-900 dark:text-gray-100">
                          {formData.address}
                        </p>
                      </div>
                    )}
                    {errors.address && (
                      <p className="text-xs text-red-500 flex items-center gap-1 mt-1">
                        <ExclamationTriangleIcon className="h-3 w-3" />
                        {errors.address}
                      </p>
                    )}
                  </div>

                  <div
                    className={`grid grid-cols-1 md:grid-cols-3 ${FIELD_GAP}`}
                  >
                    <div>
                      <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Province <span className="text-red-500">*</span>
                      </Label>
                      {isEditing ? (
                        <Select
                          value={formData.province}
                          onValueChange={(value) =>
                            handleInputChange("province", value)
                          }
                        >
                          <SelectTrigger
                            className={`rounded-none h-10 w-full ${errors.province ? "border-red-500" : ""}`}
                          >
                            <SelectValue placeholder="Select province" />
                          </SelectTrigger>
                          <SelectContent className="w-full">
                            {provinceOptions.map((province) => (
                              <SelectItem key={province} value={province}>
                                {province}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <div className="h-10 flex items-center px-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-none">
                          <p className="text-sm text-gray-900 dark:text-gray-100">
                            {formData.province}
                          </p>
                        </div>
                      )}
                      {errors.province && (
                        <p className="text-xs text-red-500 flex items-center gap-1 mt-1">
                          <ExclamationTriangleIcon className="h-3 w-3" />
                          {errors.province}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        City <span className="text-red-500">*</span>
                      </Label>
                      {isEditing ? (
                        <Select
                          value={formData.city || ""}
                          onValueChange={(value) =>
                            handleInputChange("city", value)
                          }
                          disabled={!formData.province}
                        >
                          <SelectTrigger
                            className={`rounded-none h-10 w-full ${errors.city ? "border-red-500" : ""}`}
                          >
                            <SelectValue
                              placeholder={
                                formData.province
                                  ? "Select city"
                                  : "Select province first"
                              }
                            />
                          </SelectTrigger>
                          <SelectContent className="w-full">
                            {availableCities.map((city) => (
                              <SelectItem key={city} value={city}>
                                {city}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <div className="h-10 flex items-center px-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-none">
                          <p className="text-sm text-gray-900 dark:text-gray-100">
                            {formData.city}
                          </p>
                        </div>
                      )}
                      {errors.city && (
                        <p className="text-xs text-red-500 flex items-center gap-1 mt-1">
                          <ExclamationTriangleIcon className="h-3 w-3" />
                          {errors.city}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Postal Code <span className="text-red-500">*</span>
                      </Label>
                      {isEditing ? (
                        <Input
                          value={formData.postalCode}
                          onChange={(e) =>
                            handleInputChange("postalCode", e.target.value)
                          }
                          className={`rounded-none h-10 ${errors.postalCode ? "border-red-500" : ""}`}
                          placeholder="54000"
                        />
                      ) : (
                        <div className="h-10 flex items-center px-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-none">
                          <p className="text-sm text-gray-900 dark:text-gray-100">
                            {formData.postalCode}
                          </p>
                        </div>
                      )}
                      {errors.postalCode && (
                        <p className="text-xs text-red-500 flex items-center gap-1 mt-1">
                          <ExclamationTriangleIcon className="h-3 w-3" />
                          {errors.postalCode}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Business Information (Conditional) */}
              {requiresBusinessInfo && (
                <>
                  <Separator />
                  <div className={FORM_SPACING}>
                    <div className="flex items-center gap-2 mb-4">
                      <BuildingOfficeIcon className="h-5 w-5 text-gray-700 dark:text-gray-300" />
                      <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                        Business Information
                      </h3>
                    </div>

                    <div className={FORM_SPACING}>
                      <div>
                        <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Company Name <span className="text-red-500">*</span>
                        </Label>
                        {isEditing ? (
                          <Input
                            value={formData.companyName}
                            onChange={(e) =>
                              handleInputChange("companyName", e.target.value)
                            }
                            className={`rounded-none h-10 ${errors.companyName ? "border-red-500" : ""}`}
                            placeholder="Your company name"
                          />
                        ) : (
                          <div className="h-10 flex items-center px-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-none">
                            <p className="text-sm text-gray-900 dark:text-gray-100">
                              {formData.companyName}
                            </p>
                          </div>
                        )}
                        {errors.companyName && (
                          <p className="text-xs text-red-500 flex items-center gap-1 mt-1">
                            <ExclamationTriangleIcon className="h-3 w-3" />
                            {errors.companyName}
                          </p>
                        )}
                      </div>

                      <div>
                        <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Business Address{" "}
                          <span className="text-red-500">*</span>
                        </Label>
                        {isEditing ? (
                          <Textarea
                            value={formData.businessAddress}
                            onChange={(e) =>
                              handleInputChange(
                                "businessAddress",
                                e.target.value
                              )
                            }
                            className={`rounded-none min-h-[80px] ${errors.businessAddress ? "border-red-500" : ""}`}
                            placeholder="Enter your business address"
                          />
                        ) : (
                          <div className="min-h-[80px] flex items-center px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-none">
                            <p className="text-sm text-gray-900 dark:text-gray-100">
                              {formData.businessAddress}
                            </p>
                          </div>
                        )}
                        {errors.businessAddress && (
                          <p className="text-xs text-red-500 flex items-center gap-1 mt-1">
                            <ExclamationTriangleIcon className="h-3 w-3" />
                            {errors.businessAddress}
                          </p>
                        )}
                      </div>

                      <div
                        className={`grid grid-cols-1 md:grid-cols-2 ${FIELD_GAP}`}
                      >
                        <div>
                          <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Business Type{" "}
                            <span className="text-red-500">*</span>
                          </Label>
                          {isEditing ? (
                            <Select
                              value={formData.businessType}
                              onValueChange={(value) =>
                                handleInputChange("businessType", value)
                              }
                            >
                              <SelectTrigger
                                className={`rounded-none h-10 w-full ${errors.businessType ? "border-red-500" : ""}`}
                              >
                                <SelectValue placeholder="Select type" />
                              </SelectTrigger>
                              <SelectContent className="w-full">
                                {businessTypes.map((type) => (
                                  <SelectItem key={type} value={type}>
                                    {type}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            <div className="h-10 flex items-center px-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-none">
                              <p className="text-sm text-gray-900 dark:text-gray-100">
                                {formData.businessType}
                              </p>
                            </div>
                          )}
                          {errors.businessType && (
                            <p className="text-xs text-red-500 flex items-center gap-1 mt-1">
                              <ExclamationTriangleIcon className="h-3 w-3" />
                              {errors.businessType}
                            </p>
                          )}
                        </div>

                        <div>
                          <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
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
                              className="rounded-none h-10"
                              placeholder="REG-123456"
                            />
                          ) : (
                            <div className="h-10 flex items-center px-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-none">
                              <p className="text-sm text-gray-900 dark:text-gray-100">
                                {formData.registrationNumber || "Not provided"}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Action Buttons */}
              {isEditing && (
                <>
                  <Separator />
                  <div className="flex justify-end gap-4">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsEditing(false);
                        setErrors({});
                        setEmailExists(false);
                        // Reset form to original values
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
                        }
                      }}
                      disabled={isLoading}
                      className="rounded-none text-sm hover:border-black dark:hover:border-white cursor-pointer"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSave}
                      disabled={
                        isLoading ||
                        isCheckingEmail ||
                        (emailExists && formData.email !== originalEmail)
                      }
                      className={`${colors.buttons.primary} rounded-none text-sm cursor-pointer ${
                        isLoading ||
                        isCheckingEmail ||
                        (emailExists && formData.email !== originalEmail)
                          ? "opacity-50 cursor-not-allowed"
                          : ""
                      }`}
                    >
                      {isLoading ? (
                        <>
                          <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : isCheckingEmail ? (
                        <>
                          <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
                          Verifying...
                        </>
                      ) : (
                        <>
                          <CheckIcon className="h-4 w-4 mr-2" />
                          Save Changes
                        </>
                      )}
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </FadeUp>
      </div>

      {/* OTP Modal */}
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
                    className="rounded-none text-xs cursor-pointer"
                  >
                    {resendTimer > 0
                      ? `Resend in ${resendTimer}s`
                      : "Resend Code"}
                  </Button>
                  <Button
                    onClick={handleVerifyOtp}
                    disabled={isOtpLoading}
                    className={`${colors.buttons.primary} rounded-none text-xs cursor-pointer`}
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
