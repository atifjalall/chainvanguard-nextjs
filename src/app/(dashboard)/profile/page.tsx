/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect, useRef } from "react";
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
const HOVER_BORDER_CLASS = "hover:border-black dark:hover:border-white";

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
  // store one digit per index for the 6 inputs
  const [otpDigits, setOtpDigits] = useState<string[]>(Array(6).fill(""));
  // refs for each input
  const otpInputsRef = useRef<HTMLInputElement[]>([]);
  const lastOtpAttemptRef = useRef<string>("");
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

  // Maximum OTP attempts
  const MAX_OTP_ATTEMPTS = 5;
  const [attemptsLeft, setAttemptsLeft] = useState<number>(MAX_OTP_ATTEMPTS);

  useEffect(() => {
    setIsVisible(true);
    if (user) {
      setFormData({
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
        address: user.address || "",
        province: (user.state || "").trim(),
        city: (user.city || "").trim(),
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
  // Improved: don't clear city if province has no mapping (so DB values still show).
  useEffect(() => {
    const prov = (formData.province || "").trim();
    const city = (formData.city || "").trim();

    if (!prov) {
      // Keep city if province not selected - don't force-clear
      return;
    }

    const validCities = provinceCityMap[prov] || [];

    // Only clear if mapping exists and city is not in that mapping
    if (validCities.length > 0 && city && !validCities.includes(city)) {
      setFormData((prev) => ({ ...prev, city: "" }));
    }
  }, [formData.province, formData.city]);

  const handleInputChange = (field: string, value: string) => {
    // normalize the value
    const trimmedValue = value.trim();

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

    // Province change: trim and only clear city if new province mapping doesn't include existing city
    if (field === "province") {
      const newProvince = trimmedValue;
      setFormData((prev) => {
        const prevCity = prev.city?.trim() || "";
        const validCities = provinceCityMap[newProvince] || [];
        const cityToKeep =
          prevCity && validCities.length > 0 && validCities.includes(prevCity)
            ? prevCity
            : "";
        // apply trimmed province and the determined cityToKeep
        return { ...prev, province: newProvince, city: cityToKeep };
      });
      if (errors[field]) {
        setErrors((prev) => ({ ...prev, [field]: "" }));
      }
      if (errors.city) {
        setErrors((prev) => ({ ...prev, city: "" }));
      }
      return;
    }

    // City change: just trim user input
    if (field === "city") {
      value = trimmedValue;
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
        // reset attempts when a new code is sent
        setAttemptsLeft(MAX_OTP_ATTEMPTS);
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
      toast.info("Verifying email...");
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
          toast.error(sendResp.error || "Failed to send OTP");
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
    const otpValue = otpDigits.join("");
    // local validation
    if (otpValue.trim().length !== 6) {
      setOtpError("Please enter the 6 digit code");
      return;
    }

    if (!pendingSaveData || !pendingEmail) {
      setOtpError("No pending changes found");
      return;
    }

    // if user used all attempts already
    if (attemptsLeft <= 0) {
      toast.error("Maximum attempts reached. Please request a new code.");
      return;
    }

    setIsOtpLoading(true);
    setOtpError("");
    // prevent duplicate auto-submits
    lastOtpAttemptRef.current = otpValue;
    try {
      const verifyResp = await verifyEmailOtp(pendingEmail, otpValue.trim());
      if (!verifyResp.success) {
        // decrement attempts
        const newAttempts = Math.max(0, attemptsLeft - 1);
        setAttemptsLeft(newAttempts);
        // clear inputs immediately so previous filled values are removed
        clearOtpAndFocus();
        // show toast with attempts remaining (as requested)
        if (newAttempts > 0) {
          toast.error(`${verifyResp.error || "Invalid OTP"}`);
        } else {
          toast.error(
            verifyResp.error || "Invalid OTP. Maximum attempts reached"
          );
        }
        setIsOtpLoading(false);
        return;
      }

      // Verified — apply pending save data with email verification flag
      // clear last attempt on success
      lastOtpAttemptRef.current = "";
      // reset attempts on success
      setAttemptsLeft(MAX_OTP_ATTEMPTS);

      // Pass true as second parameter to indicate email is verified
      const result = await updateProfile(pendingSaveData, true);

      if (result.success && result.user) {
        updateAuthProfile(result.user);
        setOriginalEmail(result.user.email || pendingEmail);
        toast.success("Profile updated successfully");
        setIsEditing(false);
        // clear pending
        setPendingSaveData(null);
        setPendingEmail("");
        setOtpDigits(Array(6).fill(""));
        setIsOtpModalOpen(false);
      } else {
        toast.error(
          result.error || "Failed to update profile after verification"
        );
      }
    } catch (error: any) {
      console.error("OTP verification or update failed:", error);
      // clear the inputs immediately when an unexpected error happens
      clearOtpAndFocus();
      setOtpError("Failed to verify OTP or update profile");
      toast.error("Verification failed");
    } finally {
      setIsOtpLoading(false);
      setIsLoading(false);
    }
  };

  // Auto-submit when all 6 OTP digits are filled
  useEffect(() => {
    // only when OTP modal is open, not currently verifying, attempts left > 0 and all digits filled
    if (!isOtpModalOpen || isOtpLoading || attemptsLeft <= 0) return;
    const code = otpDigits.join("");
    if (otpDigits.every((d) => d !== "") && code.length === 6) {
      // avoid retrying if we already attempted this exact code
      if (lastOtpAttemptRef.current === code) return;
      // delay slightly to ensure inputs update visually before verification
      setTimeout(() => {
        void handleVerifyOtp();
      }, 0);
    }
  }, [otpDigits, isOtpModalOpen, isOtpLoading, attemptsLeft]);

  const handleResendOtp = async () => {
    if (resendTimer > 0) return;
    if (!pendingEmail) return;
    setIsOtpLoading(true);
    try {
      const resp = await sendOtpToEmail(pendingEmail);
      if (resp.success) {
        toast.success("OTP resent");
        // reset input boxes on resend
        setOtpDigits(Array(6).fill(""));
        // reset attempts after resend
        setAttemptsLeft(MAX_OTP_ATTEMPTS);
        // focus first input on resend
        setTimeout(() => {
          otpInputsRef.current[0]?.focus();
        }, 0);
      } else {
        toast.error(resp.error || "Failed to resend OTP");
      }
    } catch (error) {
      toast.error("Failed to resend OTP");
    } finally {
      setIsOtpLoading(false);
    }
  };

  // helper: clear the OTP inputs and focus the first
  const clearOtpAndFocus = () => {
    setOtpDigits(Array(6).fill(""));
    setTimeout(() => {
      otpInputsRef.current[0]?.focus();
    }, 0);
  };

  // handlers for the six separate OTP inputs
  const focusInput = (index: number) => {
    const el = otpInputsRef.current[index];
    if (el) el.focus();
  };

  const handleOtpChange = (value: string, index: number) => {
    // keep digits only
    const digitsOnly = value.replace(/\D/g, "");
    if (!digitsOnly) return;

    // prepare new array base on existing
    setOtpDigits((prev) => {
      const next = [...prev];
      // If user pasted more than 1 character, handle like a paste from current index
      if (digitsOnly.length > 1) {
        let i = index;
        for (const ch of digitsOnly) {
          if (i >= 6) break;
          next[i++] = ch;
        }
      } else {
        next[index] = digitsOnly[0];
      }
      return next;
    });

    // clear previous errors when user types
    if (otpError) setOtpError("");
    // reset last attempt ref so auto-submit can re-attempt with new digits
    lastOtpAttemptRef.current = "";
    // If user starts typing again after failure, ensure attempts left remains until resend
    // move focus to the next input only after state update
    setTimeout(() => {
      const nextIndex = Math.min(index + digitsOnly.length, 5);
      focusInput(nextIndex);
    }, 0);
  };

  const handleOtpKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    index: number
  ) => {
    const key = e.key;
    if (key === "Backspace") {
      e.preventDefault();
      setOtpDigits((prev) => {
        const next = [...prev];
        if (next[index]) {
          // clear current box
          next[index] = "";
          return next;
        }
        // if current empty, move to previous and clear it
        if (index > 0) {
          next[index - 1] = "";
        }
        return next;
      });
      // reset last attempt ref to allow reattempt
      lastOtpAttemptRef.current = "";
      if (index > 0) focusInput(index - 1);
    } else if (/^[0-9]$/.test(key)) {
      // allow numeric keys - handle fill on keydown not default to avoid race conditions
      e.preventDefault();
      handleOtpChange(key, index);
    } else if (key === "ArrowLeft" && index > 0) {
      e.preventDefault();
      focusInput(index - 1);
    } else if (key === "ArrowRight" && index < 5) {
      e.preventDefault();
      focusInput(index + 1);
    }
  };

  const handleOtpPaste = (
    e: React.ClipboardEvent<HTMLInputElement>,
    index: number
  ) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "");
    if (!pasted) return;
    setOtpDigits((prev) => {
      const next = [...prev];
      let i = index;
      for (const ch of pasted) {
        if (i >= 6) break;
        next[i++] = ch;
      }
      return next;
    });
    // clear previous errors when user pastes
    if (otpError) setOtpError("");
    // reset last attempt ref so auto-submit can attempt this new paste
    lastOtpAttemptRef.current = "";
    setTimeout(() => {
      const nextIndex = Math.min(index + pasted.length, 5);
      focusInput(nextIndex);
    }, 0);
  };

  // Build the available cities array, but always include current city (if any) even if it's not in mapping
  const availableCities = formData.province
    ? (() => {
        const provKey = (formData.province || "").trim();
        const mapped = provinceCityMap[provKey] || [];
        const cityFromForm = (formData.city || "").trim();
        const merged = mapped.slice();
        if (cityFromForm && !merged.includes(cityFromForm)) {
          merged.push(cityFromForm);
        }
        return merged;
      })()
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
                        className={`rounded-none h-10 ${errors.name ? "border-red-500" : ""} ${HOVER_BORDER_CLASS}`}
                        placeholder="Enter your full name"
                      />
                    ) : (
                      <div className="h-10 flex items-center px-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-none">
                        <p
                          className={`text-sm text-gray-900 dark:text-gray-100 ${HOVER_BORDER_CLASS}`}
                        >
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
                            } ${HOVER_BORDER_CLASS}`}
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
                          <p
                            className={`text-sm text-gray-900 dark:text-gray-100 ${HOVER_BORDER_CLASS}`}
                          >
                            {formData.email}
                          </p>
                        </div>
                      )}
                      {/* Reserve a fixed space for email errors/success message to avoid layout shift */}
                      <div className="min-h-[1.25rem] mt-1">
                        {errors.email ? (
                          <p className="text-xs text-red-500 flex items-center gap-1">
                            <ExclamationTriangleIcon className="h-3 w-3" />
                            {errors.email}
                          </p>
                        ) : isEditing &&
                          formData.email &&
                          !isCheckingEmail &&
                          !emailExists &&
                          !errors.email &&
                          formData.email !== originalEmail &&
                          /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email) ? (
                          <p className="text-xs text-green-500 flex items-center gap-1">
                            <CheckIcon className="h-3 w-3" />
                            Email is available
                          </p>
                        ) : (
                          <div className="h-2" />
                        )}
                      </div>
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
                          className={`rounded-none h-10 ${errors.phone ? "border-red-500" : ""} ${HOVER_BORDER_CLASS}`}
                          placeholder="300 1234567"
                        />
                      ) : (
                        <div className="h-10 flex items-center px-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-none">
                          <p
                            className={`text-sm text-gray-900 dark:text-gray-100 ${HOVER_BORDER_CLASS}`}
                          >
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
                        className={`rounded-none min-h-[80px] ${errors.address ? "border-red-500" : ""} ${HOVER_BORDER_CLASS} focus:outline-none focus-visible:outline-none focus:ring-0 focus-visible:ring-0 focus:shadow-none focus-visible:shadow-none !outline-none !ring-0 !shadow-none`}
                        placeholder="Enter your complete address"
                      />
                    ) : (
                      <div
                        className={`min-h-[80px] flex items-center px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-none ${HOVER_BORDER_CLASS}`}
                      >
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
                            className={`rounded-none h-10 w-full ${errors.province ? "border-red-500" : ""} ${HOVER_BORDER_CLASS}`}
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
                          <p
                            className={`text-sm text-gray-900 dark:text-gray-100 ${HOVER_BORDER_CLASS}`}
                          >
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
                            className={`rounded-none h-10 w-full ${errors.city ? "border-red-500" : ""} ${HOVER_BORDER_CLASS}`}
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
                          <p
                            className={`text-sm text-gray-900 dark:text-gray-100 ${HOVER_BORDER_CLASS}`}
                          >
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
                          className={`rounded-none h-10 ${errors.postalCode ? "border-red-500" : ""} ${HOVER_BORDER_CLASS}`}
                          placeholder="54000"
                        />
                      ) : (
                        <div className="h-10 flex items-center px-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-none">
                          <p
                            className={`text-sm text-gray-900 dark:text-gray-100 ${HOVER_BORDER_CLASS}`}
                          >
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
                            className={`rounded-none h-10 ${errors.companyName ? "border-red-500" : ""} ${HOVER_BORDER_CLASS}`}
                            placeholder="Your company name"
                          />
                        ) : (
                          <div className="h-10 flex items-center px-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-none">
                            <p
                              className={`text-sm text-gray-900 dark:text-gray-100 ${HOVER_BORDER_CLASS}`}
                            >
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
                            className={`rounded-none min-h-[80px] ${errors.businessAddress ? "border-red-500" : ""} ${HOVER_BORDER_CLASS} focus:outline-none focus:ring-0`}
                            placeholder="Enter your business address"
                          />
                        ) : (
                          <div
                            className={`min-h-[80px] flex items-center px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-none ${HOVER_BORDER_CLASS}`}
                          >
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
                                className={`rounded-none h-10 w-full ${errors.businessType ? "border-red-500" : ""} ${HOVER_BORDER_CLASS}`}
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
                              <p
                                className={`text-sm text-gray-900 dark:text-gray-100 ${HOVER_BORDER_CLASS}`}
                              >
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
                              className={`rounded-none h-10 ${HOVER_BORDER_CLASS}`}
                              placeholder="REG-123456"
                            />
                          ) : (
                            <div className="h-10 flex items-center px-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-none">
                              <p
                                className={`text-sm text-gray-900 dark:text-gray-100 ${HOVER_BORDER_CLASS}`}
                              >
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
                        <>Save Changes</>
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
          style={{ width: "520px", maxWidth: "520px" }}
          className={`w-[520px] max-w-[520px] ${colors.backgrounds.modal} ${colors.borders.primary} rounded-none p-0 !shadow-none hover:!shadow-none`}
        >
          <div className="p-6 space-y-6">
            {/* Header Section */}
            <div className="space-y-2">
              <DialogTitle
                className={`text-2xl font-bold tracking-tight ${colors.texts.primary}`}
              >
                Verify Email Address
              </DialogTitle>
              <DialogDescription
                className={`text-sm ${colors.texts.secondary}`}
              >
                Code sent to{" "}
                <span className="font-semibold text-gray-900 dark:text-white">
                  {pendingEmail}
                </span>
              </DialogDescription>
            </div>

            {/* OTP Input Section */}
            <div className="space-y-6">
              {/* Screen-reader-only label for the OTP input group */}
              <label className="sr-only" id="otp-group-label">
                Verification code input
              </label>

              <div
                className="flex gap-3 justify-center"
                aria-labelledby="otp-group-label"
                role="group"
              >
                {Array.from({ length: 6 }).map((_, idx) => (
                  <input
                    key={idx}
                    id={`otp-digit-${idx}`}
                    name={`otp-digit-${idx}`}
                    title={`Enter verification code digit ${idx + 1}`}
                    placeholder={""}
                    aria-label={`OTP digit ${idx + 1}`}
                    ref={(el) => {
                      if (el) otpInputsRef.current[idx] = el;
                    }}
                    inputMode="numeric"
                    maxLength={1}
                    value={otpDigits[idx] || ""}
                    onChange={(e) => {
                      handleOtpChange(e.target.value, idx);
                      if (otpError) setOtpError("");
                    }}
                    onKeyDown={(e) => handleOtpKeyDown(e, idx)}
                    onPaste={(e) => handleOtpPaste(e, idx)}
                    // reduced size and removed bold
                    className={`rounded-none text-lg font-normal w-10 h-10 text-center border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:border-black dark:focus:border-white focus:bg-white dark:focus:bg-gray-900 transition-all ${HOVER_BORDER_CLASS}`}
                  />
                ))}
              </div>
              {/* Keep in-modal errors only for local validation like missing 6 digits; errors from verification are shown as toast messages */}
              {otpError && (
                <div className="flex items-center justify-center gap-2 text-sm text-red-500">
                  <ExclamationTriangleIcon className="h-4 w-4" />
                  <span>{otpError}</span>
                </div>
              )}
            </div>

            {/* Resend Section */}
            <div className="text-center space-y-2">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Didn&apos;t receive the code?
              </p>
              {resendTimer > 0 ? (
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  Resend code in{" "}
                  <span className="tabular-nums">{resendTimer}</span> seconds
                </p>
              ) : (
                <Button
                  variant="ghost"
                  onClick={handleResendOtp}
                  disabled={isOtpLoading}
                  className="rounded-none text-sm font-semibold h-auto p-0 hover:bg-transparent text-gray-900 dark:text-white hover:text-gray-700 dark:hover:text-gray-300 cursor-pointer underline underline-offset-2"
                >
                  Resend Code
                </Button>
              )}
            </div>

            {/* Replace Verify Button with concise status message (we auto submit on 6 digits) */}
            <div className="text-center mt-2">
              {isOtpLoading ? (
                <p className="text-sm text-gray-700">Verifying…</p>
              ) : attemptsLeft <= 0 ? (
                <p className="text-sm text-red-500">
                  Max attempts reached. Resend code.
                </p>
              ) : (
                <p className="text-sm text-gray-700">
                  Auto-submit when 6 digits entered
                </p>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
