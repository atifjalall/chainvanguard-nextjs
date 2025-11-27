/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/components/providers/auth-provider";
import {
  saveWalletToLocalStorage,
  useWallet,
} from "@/components/providers/wallet-provider";
import { toast } from "sonner";
import {
  WalletIcon,
  EyeIcon,
  EyeSlashIcon,
  ShieldCheckIcon,
  ClipboardDocumentIcon,
  CheckIcon,
  ExclamationTriangleIcon,
  ArrowDownTrayIcon,
  ArrowPathIcon,
  UsersIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  BoltIcon,
  CpuChipIcon,
  BuildingStorefrontIcon,
  BuildingOffice2Icon,
  CheckBadgeIcon,
  ChevronDownIcon,
} from "@heroicons/react/24/outline";
import { UserRole } from "@/types/web3";
import { AnimatePresence, motion } from "framer-motion";
import { authAPI, RegisterPayload } from "@/lib/api/auth.api";
import { AuthRouteGuard } from "@/components/guards/auth-route-guard";
import { usePageTitle } from "@/hooks/use-page-title";

// Province-City mapping
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

export default function RegisterPage() {
  usePageTitle("Register");
  // Load saved data only once on mount using useState initializer
  const [savedData] = useState(() => {
    if (typeof window === "undefined") return null;
    const savedDraft = localStorage.getItem("chainvanguard_signup_draft");
    if (!savedDraft) return null;

    try {
      const formData = JSON.parse(savedDraft);
      const draftAge =
        new Date().getTime() - new Date(formData.timestamp).getTime();
      const maxAge = 5 * 60 * 1000; // 5 minutes

      if (draftAge < maxAge) {
        return formData;
      } else {
        localStorage.removeItem("chainvanguard_signup_draft");
        return null;
      }
    } catch (error) {
      localStorage.removeItem("chainvanguard_signup_draft");
      return null;
    }
  });

  // Always start at step 1, even if data is restored
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 7;
  const [isVisible, setIsVisible] = useState(false);
  const [slideDirection, setSlideDirection] = useState("right");

  const [walletName, setWalletName] = useState(savedData?.walletName || "");
  const [name, setName] = useState(savedData?.name || "");
  const [email, setEmail] = useState(savedData?.email || "");
  const [phone, setPhone] = useState(savedData?.phone || "");
  const [selectedRole, setSelectedRole] = useState<UserRole | "">(
    savedData?.selectedRole || ""
  );
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const [address, setAddress] = useState(savedData?.address || "");
  const [province, setProvince] = useState(savedData?.province || "");
  const [city, setCity] = useState(savedData?.city || "");
  const [postalCode, setPostalCode] = useState(savedData?.postalCode || "");

  const [companyName, setCompanyName] = useState(savedData?.companyName || "");
  const [businessAddress, setBusinessAddress] = useState(
    savedData?.businessAddress || ""
  );
  const [businessType, setBusinessType] = useState(
    savedData?.businessType || ""
  );
  const [registrationNumber, setRegistrationNumber] = useState(
    savedData?.registrationNumber || ""
  );

  const [isLoading, setIsLoading] = useState(false);
  const [recoveryPhrase, setRecoveryPhrase] = useState("");
  const [backupConfirmed, setBackupConfirmed] = useState(false);
  const [createdWalletId, setCreatedWalletId] = useState("");

  const [walletNameError, setWalletNameError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");
  const [nameError, setNameError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [addressError, setAddressError] = useState("");
  const [provinceError, setProvinceError] = useState("");
  const [cityError, setCityError] = useState("");
  const [postalCodeError, setPostalCodeError] = useState("");
  const [selectedRoleError, setSelectedRoleError] = useState("");
  const [companyNameError, setCompanyNameError] = useState("");
  const [businessTypeError, setBusinessTypeError] = useState("");
  const [businessAddressError, setBusinessAddressError] = useState("");
  const [acceptedTermsError, setAcceptedTermsError] = useState("");

  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const [emailExists, setEmailExists] = useState(false);

  const { login } = useAuth();
  const { createWallet, generateRecoveryPhrase, connectWallet } = useWallet();
  const router = useRouter();

  const [passwordChecks, setPasswordChecks] = useState({
    length: false,
    uppercase: false,
    special: false,
  });
  const [passwordFocused, setPasswordFocused] = useState(false);

  const [otp, setOtp] = useState<string[]>(["", "", "", "", "", ""]);
  const [otpError, setOtpError] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  // Dropdown states
  const [showProvinceDropdown, setShowProvinceDropdown] = useState(false);
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const [showBusinessTypeDropdown, setShowBusinessTypeDropdown] = useState(false);

  useEffect(() => {
    setPasswordChecks({
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      special: /[^A-Za-z0-9]/.test(password),
    });
  }, [password]);

  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  useEffect(() => {
    setIsVisible(true);
    if (savedData) {
      toast.success("Welcome back! Your form data has been restored.", {
        duration: 3000,
      });
    }
  }, [savedData]);

  useEffect(() => {
    if (currentStep === 0 || currentStep === 6) return;

    const formData = {
      currentStep,
      walletName,
      name,
      email,
      phone,
      address,
      province,
      city,
      postalCode,
      selectedRole,
      companyName,
      businessAddress,
      businessType,
      registrationNumber,
      timestamp: new Date().toISOString(),
    };

    localStorage.setItem(
      "chainvanguard_signup_draft",
      JSON.stringify(formData)
    );
  }, [
    currentStep,
    walletName,
    name,
    email,
    phone,
    address,
    province,
    city,
    postalCode,
    selectedRole,
    companyName,
    businessAddress,
    businessType,
    registrationNumber,
  ]);

  useEffect(() => {
    const checkEmailExists = async () => {
      if (!email.trim() || !email.includes("@")) {
        setEmailExists(false);
        return;
      }

      setIsCheckingEmail(true);
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api"}/auth/check-email?email=${encodeURIComponent(email)}`
        );

        if (!response.ok) throw new Error("Failed to check email");
        const data = await response.json();

        if (data.exists) {
          setEmailExists(true);
          setEmailError("This email is already registered");
        } else {
          setEmailExists(false);
          setEmailError("");
        }
      } catch (error) {
        setEmailExists(false);
        setEmailError("");
      } finally {
        setIsCheckingEmail(false);
      }
    };

    const timeoutId = setTimeout(checkEmailExists, 500);
    return () => clearTimeout(timeoutId);
  }, [email]);

  // Clear city when province changes, but only if city is not valid for the new province
  useEffect(() => {
    if (province && city) {
      const validCities = provinceCityMap[province] || [];
      // Only clear city if it's not valid for the current province
      if (!validCities.includes(city)) {
        setCity("");
      }
    } else if (!province) {
      // Clear city if no province is selected
      setCity("");
    }
  }, [province, city]);

  const availableCities = province ? provinceCityMap[province] || [] : [];

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setSlideDirection("left");
      setIsVisible(false);
      setTimeout(() => {
        setCurrentStep(currentStep + 1);
        setIsVisible(true);
      }, 200);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setSlideDirection("right");
      setIsVisible(false);
      setTimeout(() => {
        setCurrentStep(currentStep - 1);
        setIsVisible(true);
      }, 200);
    }
  };

  const progress = (currentStep / totalSteps) * 100;
  const requiresBusinessInfo =
    selectedRole === "supplier" || selectedRole === "vendor";

  const sendOtpEmail = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api"}/auth/send-otp`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        }
      );

      if (!response.ok) throw new Error("Failed to send OTP");

      setOtpSent(true);
      setResendTimer(60);
      toast.success("Verification code sent to your email!");
    } catch (error) {
      toast.error("Failed to send verification code. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const verifyOtp = async (otpArray?: string[]) => {
    // Use provided OTP array or fallback to state
    const otpToVerify = otpArray || otp;
    const otpValue = otpToVerify.join("");

    if (otpValue.length !== 6) {
      setOtpError(true);
      toast.error("Please enter all 6 digits");
      return;
    }

    try {
      setIsVerifyingOtp(true);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api"}/auth/verify-otp`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, otp: otpValue }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Invalid verification code");
      }

      toast.success("Email verified successfully!");
      setOtpVerified(true);

      // Send welcome email with wallet details
      const userData = localStorage.getItem("chainvanguard_auth_user");
      if (userData && recoveryPhrase) {
        try {
          const user = JSON.parse(userData);
          await fetch(
            `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api"}/auth/send-welcome-email`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                email: user.email,
                name: user.name,
                walletAddress: user.walletAddress,
                walletName: walletName,
                mnemonic: recoveryPhrase,
                role: user.role,
                city: user.city,
                state: user.state,
                country: user.country,
              }),
            }
          );
          console.log("✅ Welcome email sent");
          toast.success("Welcome email sent! Check your inbox for wallet details.");
        } catch (emailError) {
          console.error("Failed to send welcome email:", emailError);
          // Don't block the flow if email fails
        }
      }

      nextStep();
    } catch (error: any) {
      setOtpError(true);
      setOtp(["", "", "", "", "", ""]);
      setOtpError(false);
      document.getElementById("otp-0")?.focus();
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
      document.getElementById(`otp-${index + 1}`)?.focus();
    }

    // Auto-verify when all 6 digits are entered
    if (newOtp.every((digit) => digit !== "")) {
      // Pass the new OTP array directly to avoid state race condition
      verifyOtp(newOtp);
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
      document.getElementById(`otp-${lastFilledIndex}`)?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      document.getElementById(`otp-${index - 1}`)?.focus();
    }
  };

  const handleNext = () => {
    setWalletNameError("");
    setPasswordError("");
    setConfirmPasswordError("");
    setNameError("");
    setEmailError("");
    setPhoneError("");
    setAddressError("");
    setProvinceError("");
    setCityError("");
    setPostalCodeError("");
    setSelectedRoleError("");
    setCompanyNameError("");
    setBusinessTypeError("");
    setBusinessAddressError("");

    let hasErrors = false;

    switch (currentStep) {
      case 1:
        if (!walletName.trim()) {
          setWalletNameError("Please enter your wallet name");
          toast.error("Please enter your wallet name");
          hasErrors = true;
        }
        if (!password) {
          setPasswordError("Password is required");
          toast.error("Password is required");
          hasErrors = true;
        } else if (password.length < 8) {
          setPasswordError("Please enter at least 8 characters");
          toast.error("Password must be at least 8 characters");
          hasErrors = true;
        } else if (!passwordChecks.uppercase) {
          setPasswordError("Please include an uppercase letter");
          toast.error("Password must include an uppercase letter");
          hasErrors = true;
        } else if (!passwordChecks.special) {
          setPasswordError("Please include a special character");
          toast.error("Password must include a special character");
          hasErrors = true;
        }
        if (password !== confirmPassword) {
          setConfirmPasswordError("Passwords do not match");
          toast.error("Passwords do not match");
          hasErrors = true;
        }
        break;

      case 2:
        if (isCheckingEmail) {
          toast.info("Please wait while we verify your email...");
          hasErrors = true;
          break;
        }
        if (!name.trim()) {
          setNameError("Please enter your name");
          toast.error("Please enter your name");
          hasErrors = true;
        }
        if (!email.trim()) {
          setEmailError("Please enter your email");
          toast.error("Please enter your email");
          hasErrors = true;
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          setEmailError("Please enter a valid email address");
          toast.error("Please enter a valid email address");
          hasErrors = true;
        } else if (emailExists) {
          setEmailError("This email is already registered");
          toast.error("This email is already registered", { duration: 5000 });
          hasErrors = true;
        }
        if (
          !phone.trim() ||
          phone.length !== 15 ||
          !/^\+92 \d{3} \d{7}$/.test(phone)
        ) {
          setPhoneError("Please enter a valid phone number");
          toast.error("Please enter a valid phone number");
          hasErrors = true;
        }
        break;

      case 3:
        if (!address.trim()) {
          setAddressError("Please enter your address");
          toast.error("Please enter your address");
          hasErrors = true;
        } else if (address.trim().length < 10) {
          setAddressError("Address must be at least 10 characters");
          toast.error("Address must be at least 10 characters");
          hasErrors = true;
        }
        if (!province.trim()) {
          setProvinceError("Please select your province");
          toast.error("Please select your province");
          hasErrors = true;
        }
        if (!city.trim()) {
          setCityError("Please select your city");
          toast.error("Please select your city");
          hasErrors = true;
        }
        if (!postalCode.trim()) {
          setPostalCodeError("Please enter postal code");
          toast.error("Please enter postal code");
          hasErrors = true;
        } else if (postalCode.length !== 5) {
          setPostalCodeError("Postal code must be exactly 5 digits");
          toast.error("Postal code must be exactly 5 digits");
          hasErrors = true;
        }
        break;

      case 4:
        if (!selectedRole) {
          setSelectedRoleError("Please select your role");
          toast.error("Please select your role");
          hasErrors = true;
        }
        if (requiresBusinessInfo) {
          if (!companyName.trim()) {
            setCompanyNameError("Please enter your company name");
            toast.error("Please enter your company name");
            hasErrors = true;
          }
          if (!businessAddress.trim()) {
            setBusinessAddressError("Please enter your business address");
            toast.error("Please enter your business address");
            hasErrors = true;
          } else if (businessAddress.trim().length < 10) {
            setBusinessAddressError(
              "Business address must be at least 10 characters"
            );
            toast.error("Business address must be at least 10 characters");
            hasErrors = true;
          }
          if (!businessType.trim()) {
            setBusinessTypeError("Please select your business type");
            toast.error("Please select your business type");
            hasErrors = true;
          }
        }
        break;
    }

    if (!hasErrors) {
      if (currentStep === 1) toast.success("Step 1 completed!");
      else if (currentStep === 2) toast.success("Personal information saved!");
      else if (currentStep === 3) toast.success("Address information saved!");
      else if (currentStep === 4) toast.success("Role selection completed!");
      else if (currentStep === 5) toast.success("Review completed!");
      nextStep();
    }
  };

  const handleSubmit = async () => {
    if (!acceptedTerms) {
      setAcceptedTermsError("Please accept the terms");
      return;
    }
    setAcceptedTermsError("");

    setIsLoading(true);

    try {
      if (!walletName.trim()) throw new Error("Please enter your wallet name");
      if (!name.trim()) throw new Error("Please enter your name");
      if (!selectedRole) throw new Error("Please select your role");
      if (password.length < 8)
        throw new Error("Please enter at least 8 characters");
      if (password !== confirmPassword)
        throw new Error("Passwords do not match");
      if (!acceptedTerms) throw new Error("Please accept the terms");
      if (!email.trim()) throw new Error("Please enter your email");
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
        throw new Error("Please enter a valid email address");
      if (emailExists) throw new Error("This email is already registered");
      if (!address.trim()) throw new Error("Please enter your address");
      if (address.trim().length < 10)
        throw new Error("Address must be at least 10 characters");
      if (!province.trim()) throw new Error("Please select your province");
      if (!city.trim()) throw new Error("Please select your city");
      if (!postalCode.trim()) throw new Error("Please enter postal code");
      if (postalCode.length !== 5)
        throw new Error("Postal code must be exactly 5 digits");

      if (requiresBusinessInfo) {
        if (!companyName.trim())
          throw new Error("Please enter your company name");
        if (!businessAddress.trim())
          throw new Error("Please enter your business address");
        if (businessAddress.trim().length < 10)
          throw new Error("Business address must be at least 10 characters");
        if (!businessType.trim())
          throw new Error("Please select your business type");
      }

      const registerPayload: RegisterPayload = {
        walletName: walletName.trim(),
        password: password,
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        role: selectedRole as UserRole,
        address: address.trim(),
        city: city.trim(),
        state: province.trim(),
        country: "Pakistan",
        postalCode: postalCode.trim(),
        companyName: requiresBusinessInfo ? companyName.trim() : undefined,
        businessType: requiresBusinessInfo ? businessType.trim() : undefined,
        businessAddress: requiresBusinessInfo
          ? businessAddress.trim()
          : undefined,
        registrationNumber: requiresBusinessInfo
          ? registrationNumber.trim()
          : undefined,
        taxId: undefined,
        acceptedTerms: true,
      };

      const response = await authAPI.register(registerPayload);

      const userData = {
        id: response.data.user._id || response.data.user.id,
        _id: response.data.user._id,
        name: response.data.user.name,
        email: response.data.user.email,
        phone: response.data.user.phone,
        role: response.data.user.role,
        walletAddress: response.data.wallet.address,
        walletName: walletName.trim(),
        address: response.data.user.address,
        city: response.data.user.city,
        state: response.data.user.state,
        country: response.data.user.country || "Pakistan",
        postalCode: response.data.user.postalCode,
        companyName: response.data.user.companyName,
        businessType: response.data.user.businessType,
        businessAddress: response.data.user.businessAddress,
        registrationNumber: response.data.user.registrationNumber,
        networkType: "hyperledger-fabric" as const,
        organizationMSP: response.data.user.organizationMSP,
        isAuthenticated: false,
        createdAt: response.data.user.createdAt || new Date().toISOString(),
        updatedAt: response.data.user.updatedAt || new Date().toISOString(),
      };

      localStorage.setItem("chainvanguard_auth_user", JSON.stringify(userData));

      const savedWallet = saveWalletToLocalStorage({
        address: response.data.wallet.address,
        mnemonic: response.data.wallet.mnemonic,
        name: walletName.trim(),
        password: password,
      });

      setRecoveryPhrase(response.data.wallet.mnemonic);
      setCreatedWalletId(savedWallet.id);

      const walletMetadata = {
        createdAt: new Date().toISOString(),
        networkType: "hyperledger-fabric",
        organizationMSP:
          selectedRole === "supplier"
            ? "SupplierMSP"
            : selectedRole === "vendor"
              ? "VendorMSP"
              : selectedRole === "customer"
                ? "CustomerMSP"
                : "AdminMSP",
        channelName: "supply-chain-channel",
      };
      localStorage.setItem(
        `wallet_${savedWallet.id}_metadata`,
        JSON.stringify(walletMetadata)
      );

      toast.success(response.message || "Account created successfully!");

      if (response.warning) {
        toast.warning(response.warning, { duration: 5000 });
      }

      setIsLoading(false);
      await sendOtpEmail();
      nextStep();
    } catch (error: any) {
      setIsLoading(false);
      const errorMessage =
        error.response?.data?.error ||
        error.message ||
        "Registration failed. Please try again.";
      toast.error(errorMessage);
      localStorage.removeItem("chainvanguard_auth_user");
    }
  };

  const handleComplete = async () => {
    if (!otpVerified) {
      toast.error("Please verify your email first");
      return;
    }

    if (!backupConfirmed) {
      toast.error("Please confirm you have backed up your recovery phrase");
      return;
    }

    try {
      const backendUserData = localStorage.getItem("chainvanguard_auth_user");

      if (!backendUserData) {
        throw new Error(
          "Registration data not found. Please try registering again."
        );
      }

      const userData = JSON.parse(backendUserData);

      const loginResponse = await authAPI.login({
        walletAddress: userData.walletAddress,
        password: password,
      });

      await login(userData.walletAddress, password);

      document.cookie = `chainvanguard_auth=${createdWalletId}; path=/; max-age=${7 * 24 * 60 * 60}`;

      localStorage.removeItem("chainvanguard_signup_draft");

      toast.success("Account setup completed successfully!");

      setTimeout(() => {
        window.location.href = `/${userData.role}`;
      }, 1000);
    } catch (error: any) {
      toast.error(
        error.response?.data?.error ||
          error.message ||
          "Failed to complete setup. Please try logging in manually."
      );

      setTimeout(() => {
        router.push("/login");
      }, 2000);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        toast.success("Copied to clipboard!");
      })
      .catch(() => {
        toast.error("Failed to copy");
      });
  };

  const downloadRecoveryPhrase = () => {
    const userData = localStorage.getItem("chainvanguard_auth_user");
    let walletAddress = "Not available";

    if (userData) {
      try {
        const user = JSON.parse(userData);
        walletAddress = user.walletAddress || "Not available";
      } catch (error) {
        console.error("Error parsing user data:", error);
      }
    }

    const content = [
      "ChainVanguard Hyperledger Fabric Wallet Recovery",
      "================================================",
      "",
      `Wallet Name: ${walletName}`,
      `Owner: ${name}`,
      `Email: ${email}`,
      `Wallet Address: ${walletAddress}`,
      `Created: ${new Date().toLocaleString()}`,
      "",
      "Recovery Phrase (12 words):",
      "===========================",
      recoveryPhrase,
      "",
      "⚠️ CRITICAL SECURITY WARNINGS:",
      "• Keep this phrase secure and private",
      "• Never share it with anyone",
      "• This is the ONLY way to recover your wallet",
      "",
    ].join("\n");

    const element = document.createElement("a");
    const file = new Blob([content], { type: "text/plain" });
    element.href = URL.createObjectURL(file);
    element.download = `chainvanguard-${walletName.replace(/\s+/g, "-")}-recovery.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    toast.success("Recovery file downloaded!");
  };

  const roleOptions = [
    {
      value: "supplier",
      title: "Supplier/Ministry",
      description: "Manage inventory, regulatory oversight",
      icon: BuildingOffice2Icon,
    },
    {
      value: "vendor",
      title: "Vendor",
      description: "Product management, customer sales",
      icon: BuildingStorefrontIcon,
    },
    {
      value: "customer",
      title: "Customer",
      description: "Browse products, make purchases",
      icon: UsersIcon,
    },
    {
      value: "expert",
      title: "Blockchain Expert",
      description: "System administration, security",
      icon: CpuChipIcon,
    },
  ];

  return (
    <AuthRouteGuard>
      <div className="min-h-screen bg-white dark:bg-gray-950">
        {/* Header */}
        <header className=" border-gray-200 dark:border-gray-800">
          <div className="max-w-[1600px] mx-auto px-12 lg:px-16 h-16 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3">
              <span className="text-lg font-light text-gray-900 dark:text-white tracking-wide">
                ChainVanguard
              </span>
            </Link>

            <Link href="/login">
              <button className="border border-black dark:border-white text-black dark:text-white px-8 h-11 uppercase tracking-[0.2em] text-[10px] font-medium hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors">
                Login
              </button>
            </Link>
          </div>
        </header>

        {/* Main Content */}
        <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] py-16">
          <div className="w-full max-w-3xl mx-auto px-12 lg:px-16">
            {/* Progress Bar */}
            <div className="mb-8">
              <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400 mb-3">
                <span>
                  Step {currentStep} of {totalSteps}
                </span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div className="relative h-px bg-gray-200 dark:border-gray-800 overflow-hidden">
                <div
                  className="h-full bg-gray-900 dark:bg-white transition-all duration-500 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {/* Form */}
            <div className="space-y-12">
              {/* Header */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStep}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="text-center space-y-4"
                >
                  <h1 className="text-4xl font-extralight text-gray-900 dark:text-white tracking-tight">
                    {currentStep === 1 && "Create Your Wallet"}
                    {currentStep === 2 && "Personal Information"}
                    {currentStep === 3 && "Address Details"}
                    {currentStep === 4 && "Select Your Role"}
                    {currentStep === 5 && "Review & Confirm"}
                    {currentStep === 6 && "Verify Your Email"}
                    {currentStep === 7 && "Secure Your Recovery Phrase"}
                  </h1>
                  <p className="text-sm text-gray-500 dark:text-gray-400 font-light">
                    {currentStep === 1 &&
                      "Set up your secure Hyperledger Fabric wallet"}
                    {currentStep === 2 && "Tell us about yourself"}
                    {currentStep === 3 && "Provide your address information"}
                    {currentStep === 4 &&
                      "Choose your role in the supply chain"}
                    {currentStep === 5 &&
                      "Review your information and create account"}
                    {currentStep === 6 &&
                      "Enter the 6-digit code sent to your email"}
                    {currentStep === 7 &&
                      "Save your 12-word recovery phrase immediately"}
                  </p>
                </motion.div>
              </AnimatePresence>

              {/* Form Content */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={`${currentStep}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-4"
                >
                  {/* Step 1: Wallet Setup */}
                  {currentStep === 1 && (
                    <div className="space-y-4">
                      <div>
                        <div className="space-y-3">
                          <label
                            className="text-[10px] uppercase tracking-[0.2em] text-gray-900 dark:text-white font-medium"
                            htmlFor="wallet-name"
                          >
                            Wallet Name
                          </label>
                          <div
                            className={`border-b ${
                              walletNameError
                                ? "border-red-500 dark:border-red-500"
                                : "border-gray-900 dark:border-white"
                            } pb-px`}
                          >
                            <input
                              id="wallet-name"
                              placeholder="e.g., My Supply Chain Wallet"
                              value={walletName}
                              onChange={(e) => {
                                setWalletName(e.target.value);
                                if (walletNameError) setWalletNameError("");
                              }}
                              className="w-full h-12 px-0 bg-transparent text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none"
                            />
                          </div>
                        </div>
                        <div className="h-4 mt-1">
                          {walletNameError && (
                            <div className="flex items-center gap-2">
                              <ExclamationTriangleIcon className="h-4 w-4 text-red-500" />
                              <p className="text-xs text-red-500">
                                {walletNameError}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-6">
                        <div>
                          <div className="space-y-3">
                            <label
                              className="text-[10px] uppercase tracking-[0.2em] text-gray-900 dark:text-white font-medium"
                              htmlFor="password"
                            >
                              Password
                            </label>
                            <div className="relative">
                              <div
                                className={`border-b ${
                                  passwordError
                                    ? "border-red-500 dark:border-red-500"
                                    : "border-gray-900 dark:border-white"
                                } pb-px`}
                              >
                                <div className="flex items-center">
                                  <input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    placeholder="Min 8 characters"
                                    value={password}
                                    onChange={(e) => {
                                      setPassword(e.target.value);
                                      if (passwordError) setPasswordError("");
                                    }}
                                    onFocus={() => {
                                      setPasswordFocused(true);
                                      setPasswordError("");
                                    }}
                                    onBlur={() => setPasswordFocused(false)}
                                    className="flex-1 h-12 px-0 bg-transparent text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="h-12 px-3 -mr-3 text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                                  >
                                    {showPassword ? (
                                      <EyeSlashIcon className="h-4 w-4" />
                                    ) : (
                                      <EyeIcon className="h-4 w-4" />
                                    )}
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="h-4 mt-1">
                            {passwordError && (
                              <div className="flex items-center gap-2">
                                <ExclamationTriangleIcon className="h-4 w-4 text-red-500" />
                                <p className="text-xs text-red-500">
                                  {passwordError}
                                </p>
                              </div>
                            )}
                          </div>

                          <div className="space-y-3">
                            {/* Password Strength */}
                            <motion.div
                              initial={false}
                              animate={
                                passwordFocused || password.length > 0
                                  ? { height: "auto", opacity: 1 }
                                  : { height: 0, opacity: 0 }
                              }
                              transition={{ duration: 0.3 }}
                              className="overflow-hidden"
                            >
                              <div className="p-3 space-y-2">
                                <div className="flex items-center gap-2 text-xs">
                                  <CheckIcon
                                    className={`h-3.5 w-3.5 ${passwordChecks.length ? "text-black" : "text-gray-300"}`}
                                  />
                                  <span>At least 8 characters</span>
                                </div>

                                <div className="flex items-center gap-2 text-xs">
                                  <CheckIcon
                                    className={`h-3.5 w-3.5 ${passwordChecks.uppercase ? "text-black" : "text-gray-300"}`}
                                  />
                                  <span>One uppercase letter</span>
                                </div>

                                <div className="flex items-center gap-2 text-xs">
                                  <CheckIcon
                                    className={`h-3.5 w-3.5 ${passwordChecks.special ? "text-black" : "text-gray-300"}`}
                                  />
                                  <span>One special character</span>
                                </div>
                              </div>
                            </motion.div>
                          </div>
                        </div>

                        <div>
                          <div className="space-y-3">
                            <label
                              className="text-[10px] uppercase tracking-[0.2em] text-gray-900 dark:text-white font-medium"
                              htmlFor="confirm-password"
                            >
                              Confirm Password
                            </label>
                            <div className="relative">
                              <div
                                className={`border-b ${
                                  confirmPasswordError
                                    ? "border-red-500 dark:border-red-500"
                                    : "border-gray-900 dark:border-white"
                                } pb-px`}
                              >
                                <div className="flex items-center">
                                  <input
                                    id="confirm-password"
                                    type={
                                      showConfirmPassword ? "text" : "password"
                                    }
                                    placeholder="Re-enter password"
                                    value={confirmPassword}
                                    onChange={(e) =>
                                      setConfirmPassword(e.target.value)
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
                          </div>
                          <div className="h-4 mt-1">
                            {confirmPasswordError && (
                              <div className="flex items-center gap-2">
                                <ExclamationTriangleIcon className="h-4 w-4 text-red-500" />
                                <p className="text-xs text-red-500">
                                  {confirmPasswordError}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Step 2: Personal Info */}
                  {currentStep === 2 && (
                    <div className="space-y-4">
                      <div>
                        <div className="space-y-3">
                          <label
                            className="text-[10px] uppercase tracking-[0.2em] text-gray-900 dark:text-white font-medium"
                            htmlFor="full-name"
                          >
                            Full Name
                          </label>
                          <div
                            className={`border-b ${
                              nameError
                                ? "border-red-500 dark:border-red-500"
                                : "border-gray-900 dark:border-white"
                            } pb-px`}
                          >
                            <input
                              id="full-name"
                              placeholder="Enter your full name"
                              value={name}
                              onChange={(e) => {
                                setName(e.target.value);
                                if (nameError) setNameError("");
                              }}
                              className="w-full h-12 px-0 bg-transparent text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none"
                            />
                          </div>
                        </div>
                        <div className="h-4 mt-1">
                          {nameError && (
                            <div className="flex items-center gap-2">
                              <ExclamationTriangleIcon className="h-4 w-4 text-red-500" />
                              <p className="text-xs text-red-500">{nameError}</p>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-6">
                        <div>
                          <div className="space-y-3">
                            <label
                              className="text-[10px] uppercase tracking-[0.2em] text-gray-900 dark:text-white font-medium"
                              htmlFor="email"
                            >
                              Email Address
                            </label>
                            <div className="relative">
                              <div
                                className={`border-b ${
                                  emailError || emailExists
                                    ? "border-red-500 dark:border-red-500"
                                    : email && !isCheckingEmail && !emailExists
                                      ? "border-green-500 dark:border-green-500"
                                      : "border-gray-900 dark:border-white"
                                } pb-px`}
                              >
                                <div className="flex items-center">
                                  <input
                                    id="email"
                                    type="email"
                                    placeholder="your@email.com"
                                    value={email}
                                    onChange={(e) => {
                                      setEmail(e.target.value);
                                      if (emailError) setEmailError("");
                                    }}
                                    className="flex-1 h-12 px-0 bg-transparent text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none"
                                  />
                                  <div className="h-12 flex items-center px-3 -mr-3">
                                    {isCheckingEmail ? (
                                      <ArrowPathIcon className="h-3.5 w-3.5 animate-spin text-blue-500" />
                                    ) : email && emailExists ? (
                                      <ExclamationTriangleIcon className="h-3.5 w-3.5 text-red-500" />
                                    ) : email &&
                                      !emailExists &&
                                      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? (
                                      <CheckIcon className="h-3.5 w-3.5 text-green-500" />
                                    ) : null}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="h-4 mt-1">
                            {emailError && (
                              <div className="flex items-center gap-2">
                                <ExclamationTriangleIcon className="h-4 w-4 text-red-500" />
                                <p className="text-xs text-red-500">
                                  {emailError}
                                </p>
                              </div>
                            )}
                            {email &&
                              !isCheckingEmail &&
                              !emailExists &&
                              !emailError &&
                              /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && (
                                <div className="flex items-center gap-2">
                                  <CheckIcon className="h-3.5 w-3.5 text-green-500" />
                                  <p className="text-xs text-green-500">
                                    Email is available
                                  </p>
                                </div>
                              )}
                          </div>
                        </div>

                        <div>
                          <div className="space-y-3">
                            <label
                              className="text-[10px] uppercase tracking-[0.2em] text-gray-900 dark:text-white font-medium"
                              htmlFor="phone"
                            >
                              Phone
                            </label>
                            <div
                              className={`border-b ${
                                phoneError
                                  ? "border-red-500 dark:border-red-500"
                                  : "border-gray-900 dark:border-white"
                              } pb-px`}
                            >
                              <input
                                id="phone"
                                type="tel"
                                maxLength={15}
                                minLength={15}
                                value={phone.startsWith("+92 ") ? phone : "+92 "}
                                onChange={(e) => {
                                  let val = e.target.value;
                                  if (!val.startsWith("+92 ")) val = "+92 ";
                                  let rest = val.slice(4).replace(/[^0-9 ]/g, "");
                                  rest = rest.replace(/ {2,}/g, " ");
                                  rest = rest
                                    .replace(/^(\d{3})\s?(\d{0,7})/, "$1 $2")
                                    .trimEnd();
                                  rest = rest.slice(0, 11);
                                  setPhone("+92 " + rest);
                                  if (phoneError) setPhoneError("");
                                }}
                                placeholder="300 1234567"
                                className="w-full h-12 px-0 bg-transparent text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none"
                              />
                            </div>
                          </div>
                          <div className="h-4 mt-1">
                            {phoneError && (
                              <div className="flex items-center gap-2">
                                <ExclamationTriangleIcon className="h-4 w-4 text-red-500" />
                                <p className="text-xs text-red-500">
                                  {phoneError}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Step 3: Address */}
                  {currentStep === 3 && (
                    <div className="space-y-4">
                      <div>
                        <div className="space-y-3">
                          <label
                            className="text-[10px] uppercase tracking-[0.2em] text-gray-900 dark:text-white font-medium"
                            htmlFor="address"
                          >
                            Full Address
                          </label>
                          <div
                            className={`border-b ${
                              addressError
                                ? "border-red-500 dark:border-red-500"
                                : "border-gray-900 dark:border-white"
                            } pb-px`}
                          >
                            <input
                              id="address"
                              placeholder="Street address, building, etc."
                              value={address}
                              onChange={(e) => {
                                setAddress(e.target.value);
                                if (addressError) setAddressError("");
                              }}
                              className="w-full h-12 px-0 bg-transparent text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none"
                            />
                          </div>
                        </div>
                        <div className="h-4 mt-1">
                          {addressError && (
                            <div className="flex items-center gap-2">
                              <ExclamationTriangleIcon className="h-4 w-4 text-red-500" />
                              <p className="text-xs text-red-500">
                                {addressError}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-6">
                        <div>
                          <div className="space-y-3">
                            <label
                              className="text-[10px] uppercase tracking-[0.2em] text-gray-900 dark:text-white font-medium"
                              htmlFor="province-select"
                            >
                              Province
                            </label>
                            <div className="relative">
                              <button
                                type="button"
                                onClick={() =>
                                  setShowProvinceDropdown(!showProvinceDropdown)
                                }
                                className={`w-full flex items-center justify-between border-b ${
                                  provinceError
                                    ? "border-red-500 dark:border-red-500"
                                    : "border-gray-900 dark:border-white"
                                } pb-px`}
                              >
                                <span className="h-12 flex items-center text-sm text-gray-900 dark:text-white">
                                  {province || "Select province"}
                                </span>
                                <ChevronDownIcon
                                  className={`h-4 w-4 text-gray-400 transition-transform ${
                                    showProvinceDropdown ? "rotate-180" : ""
                                  }`}
                                />
                              </button>

                              {showProvinceDropdown && (
                                <>
                                  <div
                                    className="fixed inset-0 z-10"
                                    onClick={() => setShowProvinceDropdown(false)}
                                  />
                                  <div className="absolute z-20 w-full mt-2 bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 max-h-64 overflow-y-auto">
                                    {provinceOptions.map((p) => (
                                      <button
                                        key={p}
                                        type="button"
                                        onClick={() => {
                                          setProvince(p);
                                          setProvinceError("");
                                          setShowProvinceDropdown(false);
                                        }}
                                        className="w-full p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors border-b border-gray-200 dark:border-gray-800 last:border-0"
                                      >
                                        <p className="text-sm text-gray-900 dark:text-white">
                                          {p}
                                        </p>
                                      </button>
                                    ))}
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                          <div className="h-4 mt-1">
                            {provinceError && (
                              <div className="flex items-center gap-2">
                                <ExclamationTriangleIcon className="h-4 w-4 text-red-500" />
                                <p className="text-xs text-red-500">
                                  {provinceError}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>

                        <div>
                          <div className="space-y-3">
                            <label
                              className="text-[10px] uppercase tracking-[0.2em] text-gray-900 dark:text-white font-medium"
                              htmlFor="city-select"
                            >
                              City
                            </label>
                            <div className="relative">
                              <button
                                type="button"
                                onClick={() =>
                                  province && setShowCityDropdown(!showCityDropdown)
                                }
                                disabled={!province}
                                className={`w-full flex items-center justify-between border-b ${
                                  cityError
                                    ? "border-red-500 dark:border-red-500"
                                    : "border-gray-900 dark:border-white"
                                } pb-px ${!province ? "opacity-50 cursor-not-allowed" : ""}`}
                              >
                                <span className="h-12 flex items-center text-sm text-gray-900 dark:text-white">
                                  {city || (province ? "Select city" : "Select province first")}
                                </span>
                                <ChevronDownIcon
                                  className={`h-4 w-4 text-gray-400 transition-transform ${
                                    showCityDropdown ? "rotate-180" : ""
                                  }`}
                                />
                              </button>

                              {showCityDropdown && province && (
                                <>
                                  <div
                                    className="fixed inset-0 z-10"
                                    onClick={() => setShowCityDropdown(false)}
                                  />
                                  <div className="absolute z-20 w-full mt-2 bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 max-h-64 overflow-y-auto">
                                    {availableCities.map((c) => (
                                      <button
                                        key={c}
                                        type="button"
                                        onClick={() => {
                                          setCity(c);
                                          setCityError("");
                                          setShowCityDropdown(false);
                                        }}
                                        className="w-full p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors border-b border-gray-200 dark:border-gray-800 last:border-0"
                                      >
                                        <p className="text-sm text-gray-900 dark:text-white">
                                          {c}
                                        </p>
                                      </button>
                                    ))}
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                          <div className="h-4 mt-1">
                            {cityError && (
                              <div className="flex items-center gap-2">
                                <ExclamationTriangleIcon className="h-4 w-4 text-red-500" />
                                <p className="text-xs text-red-500">
                                  {cityError}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div>
                        <div className="space-y-3">
                          <label
                            className="text-[10px] uppercase tracking-[0.2em] text-gray-900 dark:text-white font-medium"
                            htmlFor="postal-code"
                          >
                            Postal Code
                          </label>
                          <div
                            className={`border-b ${
                              postalCodeError
                                ? "border-red-500 dark:border-red-500"
                                : "border-gray-900 dark:border-white"
                            } pb-px`}
                          >
                            <input
                              id="postal-code"
                              placeholder="e.g., 54000"
                              value={postalCode}
                              maxLength={5}
                              onChange={(e) => {
                                const digits = e.target.value
                                  .replace(/\D/g, "")
                                  .slice(0, 5);
                                setPostalCode(digits);
                                if (postalCodeError) setPostalCodeError("");
                              }}
                              className="w-full h-12 px-0 bg-transparent text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none"
                            />
                          </div>
                        </div>
                        <div className="h-4 mt-1">
                          {postalCodeError && (
                            <div className="flex items-center gap-2">
                              <ExclamationTriangleIcon className="h-4 w-4 text-red-500" />
                              <p className="text-xs text-red-500">
                                {postalCodeError}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Step 4: Role Selection */}
                  {currentStep === 4 && (
                    <div className="space-y-4">
                      <div className="space-y-0">
                        {roleOptions.map((role) => {
                          const Icon = role.icon;
                          const isSelected = selectedRole === role.value;

                          return (
                            <button
                              key={role.value}
                              onClick={() =>
                                setSelectedRole(role.value as UserRole)
                              }
                              className={`w-full p-6 text-left border-t-0 border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors first:border-t ${
                                isSelected ? "bg-gray-50 dark:bg-gray-900" : ""
                              }`}
                            >
                              <div className="flex items-start gap-4">
                                <Icon className="h-5 w-5 text-gray-900 dark:text-white mt-0.5" />
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                                      {role.title}
                                    </h3>
                                    {isSelected && (
                                      <CheckIcon className="h-3.5 w-3.5 text-gray-900 dark:text-white" />
                                    )}
                                  </div>
                                  <p className="text-xs text-gray-500 dark:text-gray-400">
                                    {role.description}
                                  </p>
                                </div>
                                <ChevronRightIcon className="h-4 w-4 text-gray-400 mt-0.5" />
                              </div>
                            </button>
                          );
                        })}
                      </div>

                      <div className="h-4 mt-1">
                        {selectedRoleError && (
                          <div className="flex items-center gap-2">
                            <ExclamationTriangleIcon className="h-4 w-4 text-red-500" />
                            <p className="text-xs text-red-500">
                              {selectedRoleError}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Business Info */}
                      {requiresBusinessInfo && (
                        <div className="border border-gray-200 dark:border-gray-800 p-6 space-y-4">
                          <h4 className="text-xs font-medium text-gray-900 dark:text-white uppercase tracking-[0.1em]">
                            Business Information
                          </h4>

                          <div className="grid grid-cols-2 gap-6">
                            <div>
                              <div className="space-y-3">
                                <label className="text-[10px] uppercase tracking-[0.2em] text-gray-900 dark:text-white font-medium">
                                  Company Name
                                </label>
                                <div
                                  className={`border-b ${
                                    companyNameError
                                      ? "border-red-500 dark:border-red-500"
                                      : "border-gray-900 dark:border-white"
                                  } pb-px`}
                                >
                                  <input
                                    placeholder="Your company name"
                                    value={companyName}
                                    onChange={(e) => {
                                      setCompanyName(e.target.value);
                                      if (companyNameError)
                                        setCompanyNameError("");
                                    }}
                                    className="w-full h-12 px-0 bg-transparent text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none"
                                  />
                                </div>
                              </div>
                              <div className="h-4 mt-1">
                                {companyNameError && (
                                  <div className="flex items-center gap-2">
                                    <ExclamationTriangleIcon className="h-4 w-4 text-red-500" />
                                    <p className="text-xs text-red-500">
                                      {companyNameError}
                                    </p>
                                  </div>
                                )}
                              </div>
                            </div>

                            <div>
                              <div className="space-y-3">
                                <label
                                  className="text-[10px] uppercase tracking-[0.2em] text-gray-900 dark:text-white font-medium"
                                  htmlFor="business-type-select"
                                >
                                  Business Type
                                </label>
                                <div className="relative">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setShowBusinessTypeDropdown(!showBusinessTypeDropdown)
                                    }
                                    className={`w-full flex items-center justify-between border-b ${
                                      businessTypeError
                                        ? "border-red-500 dark:border-red-500"
                                        : "border-gray-900 dark:border-white"
                                    } pb-px`}
                                  >
                                    <span className="h-12 flex items-center text-sm text-gray-900 dark:text-white">
                                      {businessType ? businessType.charAt(0).toUpperCase() + businessType.slice(1).replace('-', ' ') : "Select type"}
                                    </span>
                                    <ChevronDownIcon
                                      className={`h-4 w-4 text-gray-400 transition-transform ${
                                        showBusinessTypeDropdown ? "rotate-180" : ""
                                      }`}
                                    />
                                  </button>

                                  {showBusinessTypeDropdown && (
                                    <>
                                      <div
                                        className="fixed inset-0 z-10"
                                        onClick={() => setShowBusinessTypeDropdown(false)}
                                      />
                                      <div className="absolute z-20 w-full mt-2 bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 max-h-64 overflow-y-auto">
                                        {selectedRole === "supplier" ? (
                                          <>
                                            <button
                                              type="button"
                                              onClick={() => {
                                                setBusinessType("manufacturer");
                                                setBusinessTypeError("");
                                                setShowBusinessTypeDropdown(false);
                                              }}
                                              className="w-full p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors border-b border-gray-200 dark:border-gray-800"
                                            >
                                              <p className="text-sm text-gray-900 dark:text-white">
                                                Manufacturer
                                              </p>
                                            </button>
                                            <button
                                              type="button"
                                              onClick={() => {
                                                setBusinessType("distributor");
                                                setBusinessTypeError("");
                                                setShowBusinessTypeDropdown(false);
                                              }}
                                              className="w-full p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors border-b border-gray-200 dark:border-gray-800"
                                            >
                                              <p className="text-sm text-gray-900 dark:text-white">
                                                Distributor
                                              </p>
                                            </button>
                                            <button
                                              type="button"
                                              onClick={() => {
                                                setBusinessType("ministry");
                                                setBusinessTypeError("");
                                                setShowBusinessTypeDropdown(false);
                                              }}
                                              className="w-full p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors last:border-0"
                                            >
                                              <p className="text-sm text-gray-900 dark:text-white">
                                                Government Ministry
                                              </p>
                                            </button>
                                          </>
                                        ) : (
                                          <>
                                            <button
                                              type="button"
                                              onClick={() => {
                                                setBusinessType("retailer");
                                                setBusinessTypeError("");
                                                setShowBusinessTypeDropdown(false);
                                              }}
                                              className="w-full p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors border-b border-gray-200 dark:border-gray-800"
                                            >
                                              <p className="text-sm text-gray-900 dark:text-white">
                                                Retailer
                                              </p>
                                            </button>
                                            <button
                                              type="button"
                                              onClick={() => {
                                                setBusinessType("wholesaler");
                                                setBusinessTypeError("");
                                                setShowBusinessTypeDropdown(false);
                                              }}
                                              className="w-full p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors border-b border-gray-200 dark:border-gray-800"
                                            >
                                              <p className="text-sm text-gray-900 dark:text-white">
                                                Wholesaler
                                              </p>
                                            </button>
                                            <button
                                              type="button"
                                              onClick={() => {
                                                setBusinessType("marketplace");
                                                setBusinessTypeError("");
                                                setShowBusinessTypeDropdown(false);
                                              }}
                                              className="w-full p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors last:border-0"
                                            >
                                              <p className="text-sm text-gray-900 dark:text-white">
                                                Marketplace
                                              </p>
                                            </button>
                                          </>
                                        )}
                                      </div>
                                    </>
                                  )}
                                </div>
                              </div>
                              <div className="h-4 mt-1">
                                {businessTypeError && (
                                  <div className="flex items-center gap-2">
                                    <ExclamationTriangleIcon className="h-4 w-4 text-red-500" />
                                    <p className="text-xs text-red-500">
                                      {businessTypeError}
                                    </p>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>

                          <div>
                            <div className="space-y-3">
                              <label
                                className="text-[10px] uppercase tracking-[0.2em] text-gray-900 dark:text-white font-medium"
                                htmlFor="business-address"
                              >
                                Business Address
                              </label>
                              <div
                                className={`border-b ${
                                  businessAddressError
                                    ? "border-red-500 dark:border-red-500"
                                    : "border-gray-900 dark:border-white"
                                } pb-px`}
                              >
                                <input
                                  id="business-address"
                                  placeholder="123 Business St, City, State"
                                  value={businessAddress}
                                  onChange={(e) => {
                                    setBusinessAddress(e.target.value);
                                    if (businessAddressError)
                                      setBusinessAddressError("");
                                  }}
                                  className="w-full h-12 px-0 bg-transparent text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none"
                                />
                              </div>
                            </div>
                            <div className="h-4 mt-1">
                              {businessAddressError && (
                                <div className="flex items-center gap-2">
                                  <ExclamationTriangleIcon className="h-4 w-4 text-red-500" />
                                  <p className="text-xs text-red-500">
                                    {businessAddressError}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="space-y-3">
                            <label
                              className="text-[10px] uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400 font-medium"
                              htmlFor="registration-number"
                            >
                              Registration Number (Optional)
                            </label>
                            <div className="border-b border-gray-200 dark:border-gray-800 pb-px">
                              <input
                                id="registration-number"
                                placeholder="Business registration #"
                                value={registrationNumber}
                                onChange={(e) =>
                                  setRegistrationNumber(e.target.value)
                                }
                                className="w-full h-12 px-0 bg-transparent text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none"
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Step 5: Review */}
                  {currentStep === 5 && (
                    <div className="space-y-4">
                      <div className="space-y-0 border border-gray-200 dark:border-gray-800">
                        <div className="p-6 border-b border-gray-200 dark:border-gray-800">
                          <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-3 uppercase tracking-[0.1em]">
                            Wallet Details
                          </h4>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-xs text-gray-600 dark:text-gray-400">
                                Name:
                              </span>
                              <span className="text-xs text-gray-900 dark:text-white">
                                {walletName}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-xs text-gray-600 dark:text-gray-400">
                                Network:
                              </span>
                              <span className="text-xs text-gray-900 dark:text-white">
                                Hyperledger Fabric
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="p-6 border-b border-gray-200 dark:border-gray-800">
                          <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-3 uppercase tracking-[0.1em]">
                            Personal Info
                          </h4>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-xs text-gray-600 dark:text-gray-400">
                                Name:
                              </span>
                              <span className="text-xs text-gray-900 dark:text-white">
                                {name}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-xs text-gray-600 dark:text-gray-400">
                                Email:
                              </span>
                              <span className="text-xs text-gray-900 dark:text-white">
                                {email}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-xs text-gray-600 dark:text-gray-400">
                                Phone:
                              </span>
                              <span className="text-xs text-gray-900 dark:text-white">
                                {phone}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="p-6 border-b border-gray-200 dark:border-gray-800">
                          <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-3 uppercase tracking-[0.1em]">
                            Address
                          </h4>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-xs text-gray-600 dark:text-gray-400">
                                Address:
                              </span>
                              <span className="text-xs text-gray-900 dark:text-white text-right">
                                {address}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-xs text-gray-600 dark:text-gray-400">
                                City:
                              </span>
                              <span className="text-xs text-gray-900 dark:text-white">
                                {city}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-xs text-gray-600 dark:text-gray-400">
                                Province:
                              </span>
                              <span className="text-xs text-gray-900 dark:text-white">
                                {province}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-xs text-gray-600 dark:text-gray-400">
                                Postal:
                              </span>
                              <span className="text-xs text-gray-900 dark:text-white">
                                {postalCode}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="p-6">
                          <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-3 uppercase tracking-[0.1em]">
                            Role
                          </h4>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-xs text-gray-600 dark:text-gray-400">
                                Selected:
                              </span>
                              <span className="text-xs text-gray-900 dark:text-white">
                                {
                                  roleOptions.find(
                                    (r) => r.value === selectedRole
                                  )?.title
                                }
                              </span>
                            </div>
                            {requiresBusinessInfo && (
                              <>
                                <div className="flex justify-between">
                                  <span className="text-xs text-gray-600 dark:text-gray-400">
                                    Company:
                                  </span>
                                  <span className="text-xs text-gray-900 dark:text-white">
                                    {companyName}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-xs text-gray-600 dark:text-gray-400">
                                    Type:
                                  </span>
                                  <span className="text-xs text-gray-900 dark:text-white">
                                    {businessType}
                                  </span>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Terms */}
                      <div className="border border-gray-200 dark:border-gray-800 p-4">
                        <div className="flex items-start gap-3">
                          <ShieldCheckIcon className="h-4 w-4 text-gray-900 dark:text-white flex-shrink-0 mt-0.5" />
                          <p className="text-xs text-gray-900 dark:text-white">
                            Your wallet will be secured with Hyperledger Fabric
                            encryption. You will receive a 12-word recovery
                            phrase - this is the ONLY way to recover your wallet
                            if you forget your password.
                          </p>
                        </div>
                      </div>

                      <div>
                        <div className="flex items-start gap-3">
                          <input
                            type="checkbox"
                            id="terms"
                            checked={acceptedTerms}
                            onChange={(e) => setAcceptedTerms(e.target.checked)}
                            className="mt-1 cursor-pointer"
                          />
                          <div>
                            <label
                              htmlFor="terms"
                              className="text-xs font-medium cursor-pointer text-gray-900 dark:text-white"
                            >
                              I accept the terms and conditions
                            </label>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              By creating an account, you agree to our{" "}
                              <Link
                                href="/terms"
                                className="text-gray-900 dark:text-white hover:underline"
                              >
                                Terms of Service
                              </Link>{" "}
                              and{" "}
                              <Link
                                href="/privacy"
                                className="text-gray-900 dark:text-white hover:underline"
                              >
                                Privacy Policy
                              </Link>
                            </p>
                          </div>
                        </div>

                        <div className="h-4 mt-1">
                          {acceptedTermsError && (
                            <div className="flex items-center gap-2">
                              <ExclamationTriangleIcon className="h-4 w-4 text-red-500" />
                              <p className="text-xs text-red-500">
                                {acceptedTermsError}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Step 6: OTP */}
                  {currentStep === 6 && (
                    <div className="space-y-4">
                      <div className="border border-gray-200 dark:border-gray-800 p-4">
                        <p className="text-xs text-gray-900 dark:text-white text-center">
                          We&apos;ve sent a 6-digit code to{" "}
                          <span className="font-medium">{email}</span>
                        </p>
                      </div>

                      <div className="flex justify-center gap-2">
                        {otp.map((digit, index) => (
                          <input
                            key={index}
                            id={`otp-${index}`}
                            type="text"
                            inputMode="numeric"
                            maxLength={1}
                            value={digit}
                            onChange={(e) =>
                              handleOtpChange(index, e.target.value)
                            }
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

                      <div className="text-center space-y-3">
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Didn&apos;t receive the code?
                        </p>
                        <button
                          type="button"
                          onClick={sendOtpEmail}
                          disabled={resendTimer > 0 || isLoading}
                          className="border border-black dark:border-white text-black dark:text-white px-6 h-10 uppercase tracking-[0.2em] text-[10px] font-medium hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors disabled:opacity-50"
                        >
                          {resendTimer > 0
                            ? `Resend in ${resendTimer}s`
                            : "Resend Code"}
                        </button>
                      </div>

                      <div className="border border-gray-200 dark:border-gray-800 p-4">
                        <div className="flex items-start gap-3">
                          <ShieldCheckIcon className="h-4 w-4 text-gray-900 dark:text-white flex-shrink-0 mt-0.5" />
                          <p className="text-xs text-gray-900 dark:text-white">
                            For your security, this code will expire in 10
                            minutes.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Step 7: Recovery Phrase */}
                  {currentStep === 7 && (
                    <div className="space-y-4">
                      <div className="border border-gray-200 dark:border-gray-800 p-4">
                        <div className="flex items-start gap-3">
                          <ExclamationTriangleIcon className="h-4 w-4 text-gray-900 dark:text-white flex-shrink-0 mt-0.5" />
                          <p className="text-xs text-gray-900 dark:text-white">
                            <strong>CRITICAL:</strong> Write down these 12 words
                            in exact order. Anyone with this phrase can access
                            your wallet and all assets.
                          </p>
                        </div>
                      </div>

                      <div className="border border-gray-200 dark:border-gray-800 p-6">
                        <div className="grid grid-cols-3 gap-3 mb-6">
                          {recoveryPhrase.split(" ").map((word, index) => (
                            <div
                              key={index}
                              className="flex items-center justify-center p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800"
                            >
                              <span className="text-xs text-gray-500 dark:text-gray-400 mr-2">
                                {index + 1}.
                              </span>
                              <span className="font-mono text-xs text-gray-900 dark:text-white">
                                {word}
                              </span>
                            </div>
                          ))}
                        </div>

                        <div className="flex gap-3 justify-center">
                          <button
                            type="button"
                            onClick={() => copyToClipboard(recoveryPhrase)}
                            className="border border-black dark:border-white text-black dark:text-white px-6 h-10 uppercase tracking-[0.2em] text-[10px] font-medium hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors flex items-center gap-2"
                          >
                            <ClipboardDocumentIcon className="h-3.5 w-3.5" />
                            Copy
                          </button>
                          <button
                            type="button"
                            onClick={downloadRecoveryPhrase}
                            className="border border-black dark:border-white text-black dark:text-white px-6 h-10 uppercase tracking-[0.2em] text-[10px] font-medium hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors flex items-center gap-2"
                          >
                            <ArrowDownTrayIcon className="h-3.5 w-3.5" />
                            Download
                          </button>
                        </div>
                      </div>

                      <div className="border border-gray-200 dark:border-gray-800 p-4">
                        <div className="flex items-start gap-3">
                          <CheckBadgeIcon className="h-4 w-4 text-gray-900 dark:text-white flex-shrink-0 mt-0.5" />
                          <div>
                            <h4 className="text-xs font-medium text-gray-900 dark:text-white mb-2 uppercase tracking-[0.1em]">
                              Security Best Practices
                            </h4>
                            <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                              <li>
                                • Write the phrase on paper and store in a safe
                                place
                              </li>
                              <li>
                                • Never store it digitally or take screenshots
                              </li>
                              <li>
                                • Keep multiple copies in different secure
                                locations
                              </li>
                              <li>
                                • Never share your recovery phrase with anyone
                              </li>
                            </ul>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          id="backup-confirmed"
                          checked={backupConfirmed}
                          onChange={(e) => setBackupConfirmed(e.target.checked)}
                          className="mt-1 cursor-pointer"
                        />
                        <div>
                          <label
                            htmlFor="backup-confirmed"
                            className="text-xs font-medium cursor-pointer text-gray-900 dark:text-white"
                          >
                            I have safely backed up my recovery phrase
                          </label>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            Confirm that you have written down or securely
                            stored your 12-word recovery phrase.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>

              {/* Navigation */}
              <div className="flex items-center justify-between pt-8 border-t border-gray-200 dark:border-gray-800">
                <button
                  type="button"
                  onClick={prevStep}
                  disabled={currentStep === 1}
                  className={`border border-black dark:border-white text-black dark:text-white px-6 h-12 uppercase tracking-[0.2em] text-[10px] font-medium hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors flex items-center gap-2 ${currentStep === 1 ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  <ChevronLeftIcon className="h-3.5 w-3.5" />
                  Previous
                </button>

                {currentStep < totalSteps - 2 ? (
                  <button
                    type="button"
                    onClick={handleNext}
                    disabled={
                      currentStep === 2 && (isCheckingEmail || emailExists)
                    }
                    className={`bg-black dark:bg-white text-white dark:text-black px-6 h-12 uppercase tracking-[0.2em] text-[10px] font-medium hover:bg-gray-900 dark:hover:bg-gray-100 transition-colors flex items-center gap-2 ${
                      currentStep === 2 && (isCheckingEmail || emailExists)
                        ? "opacity-50 cursor-not-allowed"
                        : ""
                    }`}
                  >
                    {currentStep === 2 && isCheckingEmail ? (
                      <>
                        <ArrowPathIcon className="h-3.5 w-3.5 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      <>
                        Next Step
                        <ChevronRightIcon className="h-3.5 w-3.5" />
                      </>
                    )}
                  </button>
                ) : currentStep === totalSteps - 2 ? (
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={isLoading || !acceptedTerms}
                    className={`bg-black dark:bg-white text-white dark:text-black px-6 h-12 uppercase tracking-[0.2em] text-[10px] font-medium hover:bg-gray-900 dark:hover:bg-gray-100 transition-colors flex items-center gap-2 ${
                      isLoading || !acceptedTerms
                        ? "opacity-50 cursor-not-allowed"
                        : ""
                    }`}
                  >
                    {isLoading ? (
                      <>
                        <ArrowPathIcon className="h-3.5 w-3.5 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <WalletIcon className="h-3.5 w-3.5" />
                        Create Wallet
                      </>
                    )}
                  </button>
                ) : currentStep === totalSteps - 1 ? (
                  <button
                    type="button"
                    onClick={() => verifyOtp()}
                    disabled={isVerifyingOtp || otp.some((d) => !d)}
                    className={`bg-black dark:bg-white text-white dark:text-black px-6 h-12 uppercase tracking-[0.2em] text-[10px] font-medium hover:bg-gray-900 dark:hover:bg-gray-100 transition-colors flex items-center gap-2 ${
                      isVerifyingOtp || otp.some((d) => !d)
                        ? "opacity-50 cursor-not-allowed"
                        : ""
                    }`}
                  >
                    {isVerifyingOtp ? (
                      <>
                        <ArrowPathIcon className="h-3.5 w-3.5 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      <>
                        Verify Email
                        <ChevronRightIcon className="h-3.5 w-3.5" />
                      </>
                    )}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleComplete}
                    disabled={!backupConfirmed || !otpVerified}
                    className={`bg-black dark:bg-white text-white dark:text-black px-6 h-12 uppercase tracking-[0.2em] text-[10px] font-medium hover:bg-gray-900 dark:hover:bg-gray-100 transition-colors flex items-center gap-2 ${!backupConfirmed || !otpVerified ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    <BoltIcon className="h-3.5 w-3.5" />
                    Complete Setup
                  </button>
                )}
              </div>
            </div>

            {/* Login Link */}
            <div className="mt-8 text-center pt-8 border-t border-gray-200 dark:border-gray-800">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Already have a wallet?{" "}
                <Link
                  href="/login"
                  className="text-gray-900 dark:text-white hover:underline transition-colors"
                >
                  Sign In
                </Link>
              </p>
            </div>
          </div>
        </div>

        {/* Network Status */}
        <div className="fixed bottom-4 right-4 hidden sm:block">
          <div className="bg-white dark:bg-gray-900 backdrop-blur-sm border border-gray-200 dark:border-gray-700 px-4 py-2 transition-all duration-200">
            <div className="flex items-center gap-1.5 text-xs">
              <div className="w-1.5 h-1.5 bg-green-500 animate-pulse" />
              <span className="text-gray-600 dark:text-gray-400">
                Hyperledger Network Online
              </span>
            </div>
          </div>
        </div>
      </div>
    </AuthRouteGuard>
  );
}
