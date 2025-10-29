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
import { ThemeToggle } from "@/components/common/theme-toggle";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RolePreservation } from "@/utils/role-preservation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Package,
  Wallet,
  Eye,
  EyeOff,
  Shield,
  Copy,
  Check,
  AlertTriangle,
  Download,
  RefreshCw,
  Users,
  User,
  Mail,
  Phone,
  Building,
  MapPin,
  ChevronLeft,
  ChevronRight,
  Lock,
  Zap,
  CheckCircle2,
  FileText,
  Crown,
  Store,
  Factory,
  KeyRound,
  BadgeCheck,
} from "lucide-react";
import { UserRole, WalletData } from "@/types/web3";
import { AnimatePresence, motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { authAPI, RegisterPayload } from "@/lib/api/auth.api";
import { AuthRouteGuard } from "@/components/guards/auth-route-guard";

// ============================================
// PROVINCE-CITY MAPPING
// ============================================
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
    "Gojra",
    "Chakwal",
    "Sahiwal",
    "Jhelum",
    "Sheikhupura",
  ],
  Sindh: [
    "Karachi",
    "Hyderabad",
    "Sukkur",
    "Larkana",
    "Mirpurkhas",
    "Nawabshah",
    "Jacobabad",
    "Shikarpur",
  ],
  "Khyber Pakhtunkhwa": [
    "Peshawar",
    "Abbottabad",
    "Mardan",
    "Mingora",
    "Kohat",
    "Dera Ismail Khan",
    "Swabi",
    "Charsadda",
  ],
  Balochistan: [
    "Quetta",
    "Turbat",
    "Khuzdar",
    "Hub",
    "Chaman",
    "Gwadar",
    "Sibi",
    "Loralai",
  ],
  "Islamabad Capital Territory": ["Islamabad"],
  "Gilgit-Baltistan": [
    "Gilgit",
    "Skardu",
    "Hunza",
    "Ghanche",
    "Diamir",
    "Astore",
  ],
  "Azad Jammu and Kashmir": [
    "Muzaffarabad",
    "Mirpur",
    "Rawalakot",
    "Kotli",
    "Bhimber",
    "Bagh",
  ],
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
  const getInitialState = () => {
    if (typeof window === "undefined") return null;

    const savedDraft = localStorage.getItem("chainvanguard_signup_draft");
    if (!savedDraft) return null;

    try {
      const formData = JSON.parse(savedDraft);
      const draftAge =
        new Date().getTime() - new Date(formData.timestamp).getTime();
      const maxAge = 24 * 60 * 60 * 1000; // 24 hours

      if (draftAge < maxAge) {
        console.log("[SIGNUP] Restoring draft on initial load...");
        return formData;
      } else {
        console.log("[SIGNUP] Draft expired");
        localStorage.removeItem("chainvanguard_signup_draft");
        return null;
      }
    } catch (error) {
      console.error("[SIGNUP] Error reading draft:", error);
      localStorage.removeItem("chainvanguard_signup_draft");
      return null;
    }
  };

  const savedData = getInitialState();

  // ============================================
  // STATE INITIALIZATION WITH SAVED DATA
  // ============================================
  const [currentStep, setCurrentStep] = useState(savedData?.currentStep || 1);
  const totalSteps = 6;

  // Animation states
  const [isVisible, setIsVisible] = useState(false);
  const [slideDirection, setSlideDirection] = useState("right");

  // Basic Form State - INITIALIZE FROM SAVED DATA
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

  // Address Step State - INITIALIZE FROM SAVED DATA
  const [address, setAddress] = useState(savedData?.address || "");
  const [province, setProvince] = useState(savedData?.province || "");
  const [city, setCity] = useState(savedData?.city || "");
  const [postalCode, setPostalCode] = useState(savedData?.postalCode || "");

  // Business Details - INITIALIZE FROM SAVED DATA
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

  // Recovery phrase state
  const [isLoading, setIsLoading] = useState(false);
  const [recoveryPhrase, setRecoveryPhrase] = useState("");
  const [backupConfirmed, setBackupConfirmed] = useState(false);
  const [createdWalletId, setCreatedWalletId] = useState("");

  // Form validation - SEPARATE STATE FOR EACH ERROR
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

  // Email validation state
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const [emailExists, setEmailExists] = useState(false);

  const { login, setUserRole, updateProfile } = useAuth();
  const { createWallet, generateRecoveryPhrase, connectWallet } = useWallet();
  const router = useRouter();

  // Password strength checks
  const [passwordChecks, setPasswordChecks] = useState({
    length: false,
    uppercase: false,
    special: false,
  });
  const [passwordFocused, setPasswordFocused] = useState(false);

  // ============================================
  // PASSWORD VALIDATION
  // ============================================
  useEffect(() => {
    setPasswordChecks({
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      special: /[^A-Za-z0-9]/.test(password),
    });
  }, [password]);

  // ============================================
  // SHOW TOAST IF DATA WAS RESTORED
  // ============================================
  useEffect(() => {
    setIsVisible(true);

    if (savedData) {
      console.log(`[SIGNUP] Data restored to Step ${savedData.currentStep}`);
      toast.success(`Welcome back! Restored to Step ${savedData.currentStep}`, {
        duration: 3000,
      });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ============================================
  // AUTO-SAVE FORM DATA TO LOCALSTORAGE
  // ============================================
  useEffect(() => {
    // Don't save on step 0 (initial) or step 6 (recovery phrase shown)
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
    console.log(`[SIGNUP] 💾 Auto-saved Step ${currentStep}`);
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

  // ============================================
  // EMAIL VALIDATION LOGIC
  // ============================================
  useEffect(() => {
    const checkEmailExists = async () => {
      if (!email.trim() || !email.includes("@")) {
        setEmailExists(false);
        return;
      }

      setIsCheckingEmail(true);
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api"}/auth/check-email?email=${encodeURIComponent(email)}`
        );

        if (!response.ok) {
          throw new Error("Failed to check email");
        }

        const data = await response.json();

        console.log("[EMAIL CHECK] Response:", data);

        if (data.exists) {
          setEmailExists(true);
          setEmailError("This email is already registered");
        } else {
          setEmailExists(false);
          setEmailError("");
        }
      } catch (error) {
        console.error("[EMAIL CHECK] Error:", error);
        setEmailExists(false);
        setEmailError("");
      } finally {
        setIsCheckingEmail(false);
      }
    };

    const timeoutId = setTimeout(checkEmailExists, 500);
    return () => clearTimeout(timeoutId);
  }, [email]);

  // ============================================
  // RESET CITY WHEN PROVINCE CHANGES
  // ============================================
  useEffect(() => {
    setCity("");
  }, [province]);

  // Get available cities based on selected province
  const availableCities = province ? provinceCityMap[province] || [] : [];

  // Handle step transitions with animation
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

  // ============================================
  // NEXT BUTTON HANDLER - LOGIN PAGE APPROACH
  // ============================================
  const handleNext = () => {
    // Clear all errors first
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

    // Validate current step
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
          setConfirmPasswordError("Passwords do not match, please check");
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
          // BLOCK IF EMAIL ALREADY EXISTS
          setEmailError("This email is already registered");
          toast.error("This email is already registered.", {
            duration: 5000,
          });
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
          // EXACTLY 5 DIGITS REQUIRED
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
            // ADD MINIMUM LENGTH CHECK
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
      // Optional: Show success toast for completing a step
      if (currentStep === 1) {
        toast.success("Step 1 completed!");
      } else if (currentStep === 2) {
        toast.success("Personal information saved!");
      } else if (currentStep === 3) {
        toast.success("Address information saved!");
      } else if (currentStep === 4) {
        toast.success("Role selection completed!");
      }
      nextStep();
    }
  };

  const handleSubmit = async () => {
    // Validate terms
    if (!acceptedTerms) {
      setAcceptedTermsError("Please accept the terms");
      return;
    }
    setAcceptedTermsError("");

    setIsLoading(true);

    try {
      console.log("[REGISTER] Starting registration process...");

      // ============================================
      // VALIDATION
      // ============================================
      if (!walletName.trim()) throw new Error("Please enter your wallet name");
      if (!name.trim()) throw new Error("Please enter your name");
      if (!selectedRole) throw new Error("Please select your role");
      if (password.length < 8)
        throw new Error("Please enter at least 8 characters");
      if (password !== confirmPassword)
        throw new Error("Passwords do not match, please check");
      if (!acceptedTerms) throw new Error("Please accept the terms");
      if (!email.trim()) throw new Error("Please enter your email");
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
        throw new Error("Please enter a valid email address");
      if (emailExists) throw new Error("This email is already registered");
      if (phone.trim() && phone.length < 10)
        throw new Error("Please enter a valid phone number");

      // Address validation
      if (!address.trim()) throw new Error("Please enter your address");
      if (address.trim().length < 10)
        throw new Error("Address must be at least 10 characters");

      if (!province.trim()) throw new Error("Please select your province");
      if (!city.trim()) throw new Error("Please select your city");

      if (!postalCode.trim()) throw new Error("Please enter postal code");
      if (postalCode.length !== 5)
        throw new Error("Postal code must be exactly 5 digits");

      // Business info validation
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

      // ============================================
      // BUILD REGISTRATION PAYLOAD
      // ============================================

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

      console.log("[REGISTER] 🚀 Calling backend API...");
      console.log(
        "[REGISTER] API URL:",
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api"
      );

      // ============================================
      // CALL BACKEND REGISTRATION API
      // ============================================

      const response = await authAPI.register(registerPayload);

      console.log("[REGISTER] Backend registration successful!");
      console.log("[REGISTER] User created:", response.data.user.name);
      console.log("[REGISTER] Email:", response.data.user.email);
      console.log("[REGISTER] Wallet Address:", response.data.wallet.address);
      console.log(
        "[REGISTER] Mnemonic (12 words):",
        response.data.wallet.mnemonic.split(" ").length,
        "words"
      );

      // ============================================
      // SAVE USER DATA TO LOCALSTORAGE IMMEDIATELY
      // ============================================

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
      console.log("[REGISTER] User data saved to localStorage");

      // ============================================
      // SAVE BACKEND WALLET TO LOCALSTORAGE
      // ============================================

      const savedWallet = saveWalletToLocalStorage({
        address: response.data.wallet.address,
        mnemonic: response.data.wallet.mnemonic,
        name: walletName.trim(),
        password: password,
      });

      console.log("[REGISTER] Wallet saved to localStorage");

      // ============================================
      // SET RECOVERY PHRASE FROM BACKEND
      // ============================================

      setRecoveryPhrase(response.data.wallet.mnemonic);
      setCreatedWalletId(savedWallet.id);

      console.log("[REGISTER] Recovery phrase set from backend");

      // ============================================
      // SAVE WALLET METADATA
      // ============================================

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

      console.log("[REGISTER] Wallet metadata saved");

      toast.success(response.message || "Account created successfully!");

      if (response.warning) {
        toast.warning(response.warning, { duration: 5000 });
      }

      setIsLoading(false);
      nextStep();

      console.log("[REGISTER] Moving to recovery phrase step");
    } catch (error: any) {
      console.error("[REGISTER] ❌ Registration error:", error);
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
    if (!backupConfirmed) {
      toast.error("Please confirm you have backed up your recovery phrase");
      return;
    }

    try {
      console.log("[REGISTER] Completing setup...");

      const backendUserData = localStorage.getItem("chainvanguard_auth_user");

      if (!backendUserData) {
        throw new Error(
          "Registration data not found. Please try registering again."
        );
      }

      const userData = JSON.parse(backendUserData);

      console.log("[REGISTER] 🔐 Logging in to backend...");

      const loginResponse = await authAPI.login({
        walletAddress: userData.walletAddress,
        password: password,
      });

      console.log("[REGISTER] Backend login successful!");

      await login(userData.walletAddress, password);

      document.cookie = `chainvanguard_auth=${createdWalletId}; path=/; max-age=${7 * 24 * 60 * 60}`;

      // CLEAR SIGNUP DRAFT ON SUCCESS
      localStorage.removeItem("chainvanguard_signup_draft");
      console.log("[REGISTER] Signup draft cleared");

      toast.success("Account setup completed successfully!");

      console.log("[REGISTER] Setup complete! Redirecting to dashboard...");

      setTimeout(() => {
        window.location.href = `/${userData.role}`;
      }, 1000);
    } catch (error: any) {
      console.error("[REGISTER] Setup error:", error);

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
        console.error("[REGISTER] Error parsing user data:", error);
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
      `Address: ${address}`,
      `City: ${city}`,
      `State: ${province}`,
      `Postal Code: ${postalCode}`,
      `Role: ${selectedRole}`,
      `Created: ${new Date().toLocaleString()}`,
      "",
      "Network Details:",
      `• Network: Hyperledger Fabric`,
      `• Organization: ${
        selectedRole === "supplier"
          ? "SupplierMSP"
          : selectedRole === "vendor"
            ? "VendorMSP"
            : selectedRole === "customer"
              ? "CustomerMSP"
              : "AdminMSP"
      }`,
      `• Channel: supply-chain-channel`,
      "",
      "Recovery Phrase (12 words):",
      "===========================",
      recoveryPhrase,
      "",
      "⚠️ CRITICAL SECURITY WARNINGS:",
      "• Keep this phrase secure and private",
      "• Never share it with anyone",
      "• This is the ONLY way to recover your wallet",
      "• Store multiple copies in secure locations",
      "• If someone has this phrase, they can access your wallet",
      "",
      ...(requiresBusinessInfo
        ? [
            "Business Information:",
            `• Company: ${companyName}`,
            `• Address: ${businessAddress}`,
            `• Type: ${businessType}`,
            `• Registration: ${registrationNumber || "Not provided"}`,
            "",
          ]
        : []),
      "Support: ChainVanguard Supply Chain Management",
    ].join("\n");

    const element = document.createElement("a");
    const file = new Blob([content], { type: "text/plain" });
    element.href = URL.createObjectURL(file);
    element.download = `chainvanguard-${walletName.replace(/\s+/g, "-")}-recovery-${selectedRole}.txt`;
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
      icon: Factory,
      features: [
        "Full Access",
        "Inventory Control",
        "Vendor Management",
        "Compliance",
      ],
      color: "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400",
    },
    {
      value: "vendor",
      title: "Vendor",
      description: "Product management, customer sales",
      icon: Store,
      features: [
        "Product Management",
        "Customer Sales",
        "Analytics",
        "Transactions",
      ],
      color:
        "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400",
    },
    {
      value: "customer",
      title: "Customer",
      description: "Browse products, make purchases",
      icon: Users,
      features: [
        "Product Browsing",
        "Order Tracking",
        "Purchase History",
        "Reviews",
      ],
      color:
        "bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400",
    },
    {
      value: "expert",
      title: "Blockchain Expert",
      description: "System administration, security",
      icon: Crown,
      features: [
        "Admin Access",
        "System Health",
        "Security Management",
        "Network Control",
      ],
      color:
        "bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400",
    },
  ];

  // Signup skeleton loader component
  function SignupSkeleton() {
    return (
      <Card className="relative overflow-hidden border-0 shadow-2xl bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl animate-pulse">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-cyan-500/5" />
        <CardHeader className="relative z-10 text-center pb-6">
          <Skeleton className="mx-auto h-8 w-2/3 mb-2" />
          <Skeleton className="mx-auto h-4 w-1/2" />
        </CardHeader>
        <CardContent className="relative z-10">
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <Skeleton className="h-24 w-full rounded-lg" />
              <Skeleton className="h-24 w-full rounded-lg" />
            </div>
            <Skeleton className="h-20 w-full rounded-lg" />
            <Skeleton className="h-20 w-full rounded-lg" />
            <Skeleton className="h-12 w-1/2 mx-auto rounded-lg" />
          </div>
          <div className="flex items-center justify-between pt-6 mt-6 border-t border-gray-200 dark:border-gray-700">
            <Skeleton className="h-10 w-32 rounded-md" />
            <Skeleton className="h-10 w-40 rounded-md" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <AuthRouteGuard>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 dark:from-slate-950 dark:via-blue-950 dark:to-cyan-950 flex flex-col">
        {/* Header */}
        <div className="w-full p-4 sm:p-6">
          <div className="flex items-center justify-between max-w-6xl mx-auto">
            <Link
              href="/"
              className="flex items-center space-x-3 group cursor-pointer"
            >
              <div className="h-8 w-8 rounded-xl bg-blue-600 flex items-center justify-center">
                <Package className="h-5 w-5 text-white" />
              </div>
              <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                ChainVanguard
              </span>
            </Link>

            <div className="flex items-center space-x-4">
              <ThemeToggle />
              <Link href="/login" className="hidden sm:block">
                <Button
                  variant="ghost"
                  className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-white/50 dark:hover:bg-gray-800/50 cursor-pointer"
                >
                  Already have an account?
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="w-full max-w-2xl">
            {/* Progress Bar */}
            <div className="mb-8">
              <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
                <span>
                  Step {currentStep} of {totalSteps}
                </span>
                <span>{Math.round(progress)}% Complete</span>
              </div>
              <div className="relative">
                <div className="h-2 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-600 rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Form Card or Skeleton */}
            {isLoading && currentStep === 5 ? (
              <SignupSkeleton />
            ) : (
              <Card className="relative overflow-hidden border-0 shadow-2xl bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-cyan-500/5" />

                <CardHeader className="relative z-10 text-center pb-6">
                  <div
                    className={`transform transition-all duration-500 ${isVisible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"}`}
                  >
                    <CardTitle className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                      {currentStep === 1 && "Create Your Wallet"}
                      {currentStep === 2 && "Personal Information"}
                      {currentStep === 3 && "Address Details"}
                      {currentStep === 4 && "Select Your Role"}
                      {currentStep === 5 && "Review & Confirm"}
                      {currentStep === 6 && "Secure Your Recovery Phrase"}
                    </CardTitle>
                    <CardDescription className="text-base text-gray-600 dark:text-gray-400">
                      {currentStep === 1 &&
                        "Set up your secure Hyperledger Fabric wallet"}
                      {currentStep === 2 && "Tell us about yourself"}
                      {currentStep === 3 && "Provide your address information"}
                      {currentStep === 4 &&
                        "Choose your role in the supply chain"}
                      {currentStep === 5 &&
                        "Review your information and create account"}
                      {currentStep === 6 &&
                        "Save your 12-word recovery phrase immediately"}
                    </CardDescription>
                  </div>
                </CardHeader>

                <CardContent className="relative z-10">
                  <div
                    className={`transform transition-all duration-500 ${
                      isVisible
                        ? "translate-x-0 opacity-100"
                        : slideDirection === "left"
                          ? "-translate-x-8 opacity-0"
                          : "translate-x-8 opacity-0"
                    }`}
                  >
                    {/* Step 1: Wallet Setup */}
                    {currentStep === 1 && (
                      <div className="space-y-6">
                        <div className="text-center mb-6">
                          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-600 text-white mb-4">
                            <Wallet className="h-8 w-8" />
                          </div>
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                            Secure Wallet Creation
                          </h3>
                        </div>

                        <div className="space-y-4">
                          <div>
                            <Label
                              htmlFor="wallet-name"
                              className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300"
                            >
                              <Lock className="h-4 w-4" />
                              Wallet Name
                            </Label>
                            <Input
                              id="wallet-name"
                              placeholder="e.g., My Supply Chain Wallet"
                              value={walletName}
                              onChange={(e) => {
                                setWalletName(e.target.value);
                                if (walletNameError) setWalletNameError("");
                              }}
                              className={`mt-1 !h-10 border ${
                                walletNameError
                                  ? "border-red-500 dark:border-red-500"
                                  : "border-gray-200 dark:border-gray-700"
                              } hover:border-blue-300 focus:border-blue-500 transition-all bg-white/50 dark:bg-gray-800/50 cursor-text text-sm placeholder:text-sm`}
                            />
                            {walletNameError && (
                              <p className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1 mt-1">
                                <AlertTriangle className="h-3 w-3" />
                                {walletNameError}
                              </p>
                            )}
                          </div>

                          <div className="grid gap-4 sm:grid-cols-2">
                            <div>
                              <Label
                                htmlFor="password"
                                className="text-sm font-medium text-gray-700 dark:text-gray-300"
                              >
                                Password
                              </Label>
                              <div className="relative mt-1">
                                <Input
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
                                  className={`!h-10 pr-10 border ${
                                    passwordError
                                      ? "border-red-500 dark:border-red-500"
                                      : "border-gray-200 dark:border-gray-700"
                                  } hover:border-blue-300 focus:border-blue-500 transition-all bg-white/50 dark:bg-gray-800/50 cursor-text text-sm placeholder:text-sm`}
                                />
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="absolute right-0 top-0 h-10 w-10 cursor-pointer"
                                  onClick={() => setShowPassword(!showPassword)}
                                >
                                  {showPassword ? (
                                    <EyeOff className="h-4 w-4" />
                                  ) : (
                                    <Eye className="h-4 w-4" />
                                  )}
                                </Button>
                              </div>
                              {/* Animated password requirements */}
                              <motion.div
                                initial={false}
                                animate={
                                  passwordFocused || password.length > 0
                                    ? {
                                        height: "auto",
                                        opacity: 1,
                                        marginTop: 16,
                                      }
                                    : { height: 0, opacity: 0, marginTop: 0 }
                                }
                                transition={{
                                  duration: 0.35,
                                  ease: "easeInOut",
                                }}
                                className="overflow-hidden"
                              >
                                <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900/80 shadow-sm px-4 py-3 space-y-2">
                                  <div className="flex items-center gap-1.5 text-xs">
                                    <motion.span
                                      animate={{
                                        scale: passwordChecks.length ? 1.2 : 1,
                                        color: passwordChecks.length
                                          ? "#22c55e"
                                          : "#ef4444",
                                      }}
                                      transition={{
                                        type: "spring",
                                        stiffness: 300,
                                      }}
                                    >
                                      <Check
                                        className={`h-4 w-4 ${passwordChecks.length ? "text-green-500" : "text-red-500"}`}
                                      />
                                    </motion.span>
                                    <span className="text-sm font-medium">
                                      At least 8 characters
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1.5 text-xs">
                                    <motion.span
                                      animate={{
                                        scale: passwordChecks.uppercase
                                          ? 1.2
                                          : 1,
                                        color: passwordChecks.uppercase
                                          ? "#22c55e"
                                          : "#ef4444",
                                      }}
                                      transition={{
                                        type: "spring",
                                        stiffness: 300,
                                      }}
                                    >
                                      <Check
                                        className={`h-4 w-4 ${passwordChecks.uppercase ? "text-green-500" : "text-red-500"}`}
                                      />
                                    </motion.span>
                                    <span className="text-sm font-medium">
                                      One uppercase letter
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1.5 text-xs">
                                    <motion.span
                                      animate={{
                                        scale: passwordChecks.special ? 1.2 : 1,
                                        color: passwordChecks.special
                                          ? "#22c55e"
                                          : "#ef4444",
                                      }}
                                      transition={{
                                        type: "spring",
                                        stiffness: 300,
                                      }}
                                    >
                                      <Check
                                        className={`h-4 w-4 ${passwordChecks.special ? "text-green-500" : "text-red-500"}`}
                                      />
                                    </motion.span>
                                    <span className="text-sm font-medium">
                                      One special character
                                    </span>
                                  </div>
                                </div>
                              </motion.div>
                              {passwordError && (
                                <p className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1 mt-1">
                                  <AlertTriangle className="h-3 w-3" />
                                  {passwordError}
                                </p>
                              )}
                            </div>

                            <div>
                              <Label
                                htmlFor="confirm-password"
                                className="text-sm font-medium text-gray-700 dark:text-gray-300"
                              >
                                Confirm Password
                              </Label>
                              <div className="relative mt-1">
                                <Input
                                  id="confirm-password"
                                  type={
                                    showConfirmPassword ? "text" : "password"
                                  }
                                  placeholder="Re-enter password"
                                  value={confirmPassword}
                                  onChange={(e) =>
                                    setConfirmPassword(e.target.value)
                                  }
                                  className={`!h-10 pr-10 border ${
                                    confirmPasswordError
                                      ? "border-red-500 dark:border-red-500"
                                      : "border-gray-200 dark:border-gray-700"
                                  } hover:border-blue-300 focus:border-blue-500 transition-all bg-white/50 dark:bg-gray-800/50 cursor-text text-sm placeholder:text-sm`}
                                />
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="absolute right-0 top-0 h-10 w-10 cursor-pointer"
                                  onClick={() =>
                                    setShowConfirmPassword(!showConfirmPassword)
                                  }
                                >
                                  {showConfirmPassword ? (
                                    <EyeOff className="h-4 w-4" />
                                  ) : (
                                    <Eye className="h-4 w-4" />
                                  )}
                                </Button>
                              </div>
                              {confirmPasswordError && (
                                <p className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1 mt-1">
                                  <AlertTriangle className="h-3 w-3" />
                                  {confirmPasswordError}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Step 2: Personal Info */}
                    {currentStep === 2 && (
                      <div className="space-y-6">
                        <div className="text-center mb-6">
                          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-600 text-white mb-4">
                            <User className="h-8 w-8" />
                          </div>
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                            Tell Us About You
                          </h3>
                        </div>

                        <div className="space-y-4">
                          <div>
                            <Label
                              htmlFor="name"
                              className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300"
                            >
                              <User className="h-4 w-4" />
                              Full Name
                            </Label>
                            <Input
                              id="name"
                              placeholder="Enter your full name"
                              value={name}
                              onChange={(e) => {
                                setName(e.target.value);
                                if (nameError) setNameError("");
                              }}
                              className={`mt-1 !h-10 border ${
                                nameError
                                  ? "border-red-500 dark:border-red-500"
                                  : "border-gray-200 dark:border-gray-700"
                              } hover:border-blue-300 focus:border-blue-500 transition-all bg-white/50 dark:bg-gray-800/50 cursor-text text-sm placeholder:text-sm`}
                            />
                            {nameError && (
                              <p className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1 mt-1">
                                <AlertTriangle className="h-3 w-3" />
                                {nameError}
                              </p>
                            )}
                          </div>

                          <div className="grid gap-4 sm:grid-cols-2">
                            <div>
                              <Label
                                htmlFor="email"
                                className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300"
                              >
                                <Mail className="h-4 w-4" />
                                Email Address
                              </Label>
                              <div className="relative">
                                <Input
                                  id="email"
                                  type="email"
                                  placeholder="your@email.com"
                                  value={email}
                                  onChange={(e) => {
                                    setEmail(e.target.value);
                                    if (emailError) setEmailError("");
                                  }}
                                  className={`mt-1 !h-10 border ${
                                    emailError || emailExists
                                      ? "border-red-500 dark:border-red-500"
                                      : email &&
                                          !isCheckingEmail &&
                                          !emailExists
                                        ? "border-green-500 dark:border-green-500" // GREEN when valid
                                        : "border-gray-200 dark:border-gray-700"
                                  } hover:border-blue-300 focus:border-blue-500 transition-all bg-white/50 dark:bg-gray-800/50 cursor-text text-sm placeholder:text-sm pr-10`}
                                />
                                {/* SHOW STATUS ICON */}
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 mt-0.5">
                                  {isCheckingEmail ? (
                                    <RefreshCw className="h-4 w-4 animate-spin text-blue-500" />
                                  ) : email && emailExists ? (
                                    <AlertTriangle className="h-4 w-4 text-red-500" />
                                  ) : email &&
                                    !emailExists &&
                                    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? (
                                    <Check className="h-4 w-4 text-green-500" />
                                  ) : null}
                                </div>
                              </div>
                              {/* SHOW STATUS MESSAGE */}
                              {emailError && (
                                <p className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1 mt-1">
                                  <AlertTriangle className="h-3 w-3" />
                                  {emailError}
                                </p>
                              )}
                              {email &&
                                !isCheckingEmail &&
                                !emailExists &&
                                !emailError &&
                                /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && (
                                  <p className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1 mt-1">
                                    <Check className="h-3 w-3" />
                                    Email is available
                                  </p>
                                )}
                            </div>

                            <div>
                              <Label
                                htmlFor="phone"
                                className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300"
                              >
                                <Phone className="h-4 w-4" />
                                Phone
                              </Label>
                              <Input
                                id="phone"
                                type="tel"
                                required
                                maxLength={15}
                                minLength={15}
                                pattern="\+92\s\d{3}\s\d{7}"
                                value={
                                  phone.startsWith("+92 ") ? phone : "+92 "
                                }
                                onChange={(e) => {
                                  let val = e.target.value;
                                  if (!val.startsWith("+92 ")) {
                                    val = "+92 ";
                                  }
                                  let rest = val
                                    .slice(4)
                                    .replace(/[^0-9 ]/g, "");
                                  rest = rest.replace(/ {2,}/g, " ");
                                  rest = rest
                                    .replace(/^(\d{3})\s?(\d{0,7})/, "$1 $2")
                                    .trimEnd();
                                  rest = rest.slice(0, 11);
                                  setPhone("+92 " + rest);

                                  // CLEAR ERROR ON TYPE
                                  if (phoneError) setPhoneError("");
                                }}
                                className={`mt-1 !h-10 border ${
                                  phoneError
                                    ? "border-red-500 dark:border-red-500"
                                    : "border-gray-200 dark:border-gray-700"
                                } hover:border-blue-300 focus:border-blue-500 transition-all bg-white/50 dark:bg-gray-800/50 cursor-text text-sm placeholder:text-sm`}
                                placeholder="300 1234567"
                              />
                              {phoneError && (
                                <p className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1 mt-1">
                                  <AlertTriangle className="h-3 w-3" />
                                  {phoneError}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Step 3: Address Details - STATE FIRST, THEN CITY */}
                    {currentStep === 3 && (
                      <div className="space-y-6">
                        <div className="text-center mb-6">
                          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-indigo-600 text-white mb-4">
                            <MapPin className="h-8 w-8" />
                          </div>
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                            Address Details
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                            Provide your address so we can display
                            location-based data.
                          </p>
                        </div>

                        <div className="space-y-4">
                          <div>
                            <Label
                              htmlFor="address"
                              className="text-sm font-medium text-gray-700 dark:text-gray-300"
                            >
                              Full Address
                            </Label>
                            <Input
                              id="address"
                              placeholder="Street address, building, etc. (min 10 characters)"
                              value={address}
                              minLength={10}
                              onChange={(e) => {
                                setAddress(e.target.value);

                                // CLEAR ERROR ON TYPE
                                if (addressError) setAddressError("");
                              }}
                              className={`mt-1 !h-10 border ${
                                addressError
                                  ? "border-red-500 dark:border-red-500"
                                  : "border-gray-200 dark:border-gray-700"
                              } hover:border-blue-300 focus:border-blue-500 transition-all bg-white/50 dark:bg-gray-800/50 cursor-text text-sm placeholder:text-sm`}
                            />
                            {addressError && (
                              <p className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1 mt-1">
                                <AlertTriangle className="h-3 w-3" />
                                {addressError}
                              </p>
                            )}
                          </div>

                          {/* STATE/PROVINCE FIRST - THEN CITY */}
                          <div className="grid gap-4 sm:grid-cols-2">
                            <div>
                              <Label
                                htmlFor="province"
                                className="text-sm font-medium text-gray-700 dark:text-gray-300"
                              >
                                State / Province
                              </Label>
                              <Select
                                value={province}
                                onValueChange={(val) => {
                                  setProvinceError("");
                                  setProvince(val);
                                }}
                              >
                                <SelectTrigger
                                  size="sm"
                                  className={`mt-1 !h-10 w-full flex items-center gap-2 px-2.5 py-0 text-sm leading-none border ${
                                    provinceError
                                      ? "border-red-500 dark:border-red-500"
                                      : "border-gray-200 dark:border-gray-700"
                                  } rounded-md hover:border-blue-300 focus:border-blue-500 transition-all bg-white/50 dark:bg-gray-800/50`}
                                >
                                  <SelectValue
                                    placeholder="Select province"
                                    className="w-full flex items-center h-10 text-sm"
                                  />
                                </SelectTrigger>
                                <SelectContent className="w-full">
                                  {provinceOptions.map((p) => (
                                    <SelectItem
                                      key={p}
                                      value={p}
                                      className="cursor-pointer py-2 px-2.5 text-sm"
                                    >
                                      {p}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              {provinceError && (
                                <p className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1 mt-1">
                                  <AlertTriangle className="h-3 w-3" />
                                  {provinceError}
                                </p>
                              )}
                            </div>

                            <div>
                              <Label
                                htmlFor="city"
                                className="text-sm font-medium text-gray-700 dark:text-gray-300"
                              >
                                City
                              </Label>
                              <Select
                                value={city}
                                onValueChange={(val) => {
                                  setCityError("");
                                  setCity(val);
                                }}
                                disabled={!province}
                              >
                                <SelectTrigger
                                  size="sm"
                                  className={`mt-1 !h-10 w-full flex items-center gap-2 px-3 py-0 text-sm leading-none border ${
                                    cityError
                                      ? "border-red-500 dark:border-red-500"
                                      : "border-gray-200 dark:border-gray-700"
                                  } rounded-md hover:border-blue-300 focus:border-blue-500 transition-all bg-white/50 dark:bg-gray-800/50 ${
                                    !province
                                      ? "opacity-50 cursor-not-allowed"
                                      : ""
                                  }`}
                                >
                                  <SelectValue
                                    placeholder={
                                      province
                                        ? "Select city"
                                        : "Select province first"
                                    }
                                    className="w-full flex items-center h-10 text-sm"
                                  />
                                </SelectTrigger>
                                <SelectContent className="w-full">
                                  {availableCities.map((c) => (
                                    <SelectItem
                                      key={c}
                                      value={c}
                                      className="cursor-pointer py-2 px-2.5 text-sm"
                                    >
                                      {c}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              {cityError && (
                                <p className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1 mt-1">
                                  <AlertTriangle className="h-3 w-3" />
                                  {cityError}
                                </p>
                              )}
                            </div>
                          </div>

                          <div>
                            <Label
                              htmlFor="postal-code"
                              className="text-sm font-medium text-gray-700 dark:text-gray-300"
                            >
                              Postal Code
                            </Label>
                            <Input
                              id="postal-code"
                              inputMode="numeric"
                              placeholder="e.g., 54000"
                              value={postalCode}
                              maxLength={5}
                              minLength={5}
                              onChange={(e) => {
                                const digits = e.target.value
                                  .replace(/\D/g, "")
                                  .slice(0, 5);
                                setPostalCode(digits);

                                // CLEAR ERROR ON TYPE
                                if (postalCodeError) setPostalCodeError("");
                              }}
                              className={`mt-1 !h-10 border ${
                                postalCodeError
                                  ? "border-red-500 dark:border-red-500"
                                  : "border-gray-200 dark:border-gray-700"
                              } hover:border-blue-300 focus:border-blue-500 transition-all bg-white/50 dark:bg-gray-800/50 cursor-text text-sm placeholder:text-sm`}
                            />
                            {postalCodeError && (
                              <p className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1 mt-1">
                                <AlertTriangle className="h-3 w-3" />
                                {postalCodeError}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Step 4: Role Selection */}
                    {currentStep === 4 && (
                      <div className="space-y-6">
                        <div className="text-center mb-6">
                          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-purple-600 text-white mb-4">
                            <Shield className="h-8 w-8" />
                          </div>
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                            Choose Your Role
                          </h3>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                          {roleOptions.map((role) => {
                            const Icon = role.icon;
                            const isSelected = selectedRole === role.value;

                            return (
                              <Card
                                key={role.value}
                                className={`cursor-pointer transition-all duration-300 hover:shadow-lg ${
                                  isSelected
                                    ? "ring-2 ring-blue-500 shadow-lg bg-blue-50 dark:bg-blue-950/20"
                                    : "hover:shadow-md bg-white/50 dark:bg-gray-800/50"
                                }`}
                                onClick={() =>
                                  setSelectedRole(role.value as UserRole)
                                }
                              >
                                <CardHeader className="pb-3">
                                  <div className="flex items-center gap-3">
                                    <div
                                      className={`p-2 rounded-lg ${role.color}`}
                                    >
                                      <Icon className="h-5 w-5" />
                                    </div>
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2">
                                        <CardTitle className="text-base text-gray-900 dark:text-gray-100">
                                          {role.title}
                                        </CardTitle>
                                        {isSelected && (
                                          <Check className="h-4 w-4 text-blue-500" />
                                        )}
                                      </div>
                                      <CardDescription className="text-sm text-gray-600 dark:text-gray-400">
                                        {role.description}
                                      </CardDescription>
                                    </div>
                                  </div>
                                </CardHeader>
                                <CardContent className="pt-0">
                                  <div className="flex flex-wrap gap-1">
                                    {role.features.map((feature, idx) => (
                                      <Badge
                                        key={idx}
                                        variant="secondary"
                                        className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-blue-400"
                                      >
                                        {feature}
                                      </Badge>
                                    ))}
                                  </div>
                                </CardContent>
                              </Card>
                            );
                          })}
                        </div>

                        {selectedRoleError && (
                          <p className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1 mt-1">
                            <AlertTriangle className="h-3 w-3" />
                            {selectedRoleError}
                          </p>
                        )}

                        {/* Business Information */}
                        {requiresBusinessInfo && (
                          <div className="space-y-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
                            <h4 className="font-medium flex items-center gap-2 text-gray-900 dark:text-gray-100">
                              <Building className="h-4 w-4" />
                              Business Information
                            </h4>

                            <div className="grid gap-4 sm:grid-cols-2">
                              <div>
                                <Label
                                  htmlFor="company-name"
                                  className="text-sm font-medium text-gray-700 dark:text-gray-300"
                                >
                                  Company Name
                                </Label>
                                <Input
                                  id="company-name"
                                  placeholder="Your company name"
                                  value={companyName}
                                  onChange={(e) => {
                                    setCompanyName(e.target.value);
                                    if (companyNameError)
                                      setCompanyNameError("");
                                  }}
                                  className={`mt-1 !h-10 border ${
                                    companyNameError
                                      ? "border-red-500 dark:border-red-500"
                                      : "border-gray-200 dark:border-gray-700"
                                  } hover:border-blue-300 focus:border-blue-500 transition-all bg-white/50 dark:bg-gray-800/50 cursor-text text-sm placeholder:text-sm`}
                                />
                                {companyNameError && (
                                  <p className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1 mt-1">
                                    <AlertTriangle className="h-3 w-3" />
                                    {companyNameError}
                                  </p>
                                )}
                              </div>

                              <div>
                                <Label
                                  htmlFor="business-type"
                                  className="text-sm font-medium text-gray-700 dark:text-gray-300"
                                >
                                  Business Type
                                </Label>
                                <Select
                                  value={businessType}
                                  onValueChange={(val) => {
                                    setBusinessTypeError("");
                                    setBusinessType(val);
                                  }}
                                >
                                  <SelectTrigger
                                    size="sm"
                                    className={`mt-1 !h-10 w-full flex items-center gap-2 px-3 py-0 text-sm leading-none border ${
                                      businessTypeError
                                        ? "border-red-500 dark:border-red-500"
                                        : "border-gray-200 dark:border-gray-700"
                                    } rounded-md hover:border-blue-300 focus:border-blue-500 transition-all bg-white/50 dark:bg-gray-800/50`}
                                  >
                                    <SelectValue
                                      placeholder="Select type"
                                      className="cursor-pointer w-full flex items-center h-10 text-sm"
                                    />
                                  </SelectTrigger>
                                  <SelectContent className="w-full">
                                    {selectedRole === "supplier" ? (
                                      <>
                                        <SelectItem
                                          value="manufacturer"
                                          className="cursor-pointer py-2 px-2.5 text-sm"
                                        >
                                          Manufacturer
                                        </SelectItem>
                                        <SelectItem
                                          value="distributor"
                                          className="cursor-pointer py-2 px-2.5 text-sm"
                                        >
                                          Distributor
                                        </SelectItem>
                                        <SelectItem
                                          value="ministry"
                                          className="cursor-pointer py-2 px-2.5 text-sm"
                                        >
                                          Government Ministry
                                        </SelectItem>
                                      </>
                                    ) : (
                                      <>
                                        <SelectItem
                                          value="retailer"
                                          className="cursor-pointer py-2 px-2.5 text-sm"
                                        >
                                          Retailer
                                        </SelectItem>
                                        <SelectItem
                                          value="wholesaler"
                                          className="cursor-pointer py-2 px-2.5 text-sm"
                                        >
                                          Wholesaler
                                        </SelectItem>
                                        <SelectItem
                                          value="marketplace"
                                          className="cursor-pointer py-2 px-2.5 text-sm"
                                        >
                                          Marketplace
                                        </SelectItem>
                                      </>
                                    )}
                                  </SelectContent>
                                </Select>
                                {businessTypeError && (
                                  <p className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1 mt-1">
                                    <AlertTriangle className="h-3 w-3" />
                                    {businessTypeError}
                                  </p>
                                )}
                              </div>
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                              <div>
                                <Label
                                  htmlFor="business-address"
                                  className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300"
                                >
                                  <MapPin className="h-4 w-4" />
                                  Business Address
                                </Label>
                                <Input
                                  id="business-address"
                                  placeholder="123 Business St, City, State (min 10 chars)"
                                  value={businessAddress}
                                  minLength={10}
                                  onChange={(e) => {
                                    setBusinessAddress(e.target.value);

                                    if (businessAddressError)
                                      setBusinessAddressError("");
                                  }}
                                  className={`mt-1 !h-10 border ${
                                    businessAddressError
                                      ? "border-red-500 dark:border-red-500"
                                      : "border-gray-200 dark:border-gray-700"
                                  } hover:border-blue-300 focus:border-blue-500 transition-all bg-white/50 dark:bg-gray-800/50 cursor-text text-sm placeholder:text-sm`}
                                />
                                {businessAddressError && (
                                  <p className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1 mt-1">
                                    <AlertTriangle className="h-3 w-3" />
                                    {businessAddressError}
                                  </p>
                                )}
                              </div>

                              <div>
                                <Label
                                  htmlFor="registration-number"
                                  className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300"
                                >
                                  <FileText className="h-4 w-4" />
                                  Registration Number (Optional)
                                </Label>
                                <Input
                                  id="registration-number"
                                  placeholder="Business registration #"
                                  value={registrationNumber}
                                  onChange={(e) =>
                                    setRegistrationNumber(e.target.value)
                                  }
                                  className="mt-1 !h-10 border border-gray-200 dark:border-gray-700 hover:border-blue-300 focus:border-blue-500 transition-all bg-white/50 dark:bg-gray-800/50 cursor-text text-sm placeholder:text-sm"
                                />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Step 5: Review & Terms */}
                    {currentStep === 5 && (
                      <div className="space-y-6">
                        <div className="text-center mb-6">
                          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-orange-600 text-white mb-4">
                            <CheckCircle2 className="h-8 w-8" />
                          </div>
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                            Review Your Information
                          </h3>
                        </div>

                        {/* Review Summary */}
                        <div className="space-y-4">
                          <div className="grid gap-4 sm:grid-cols-2">
                            <Card className="p-4 bg-white/50 dark:bg-gray-800/50">
                              <h4 className="font-medium text-sm text-gray-600 dark:text-gray-400 mb-2">
                                Wallet Details
                              </h4>
                              <div className="space-y-2">
                                <div className="flex justify-between">
                                  <span className="text-sm text-gray-700 dark:text-gray-300">
                                    Name:
                                  </span>
                                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                    {walletName}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-sm text-gray-700 dark:text-gray-300">
                                    Network:
                                  </span>
                                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                    Hyperledger Fabric
                                  </span>
                                </div>
                              </div>
                            </Card>

                            <Card className="p-4 bg-white/50 dark:bg-gray-800/50">
                              <h4 className="font-medium text-sm text-gray-600 dark:text-gray-400 mb-2">
                                Personal Info
                              </h4>
                              <div className="space-y-2">
                                <div className="flex justify-between">
                                  <span className="text-sm text-gray-700 dark:text-gray-300">
                                    Name:
                                  </span>
                                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                    {name}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-sm text-gray-700 dark:text-gray-300">
                                    Email:
                                  </span>
                                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                    {email || "Not provided"}
                                  </span>
                                </div>
                              </div>
                            </Card>
                          </div>

                          {/* Address Summary */}
                          <Card className="p-4 bg-white/50 dark:bg-gray-800/50">
                            <h4 className="font-medium text-sm text-gray-600 dark:text-gray-400 mb-2">
                              Address
                            </h4>
                            <div className="grid gap-2 sm:grid-cols-2">
                              <div className="flex justify-between">
                                <span className="text-sm text-gray-700 dark:text-gray-300">
                                  Address:
                                </span>
                                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                  {address}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-sm text-gray-700 dark:text-gray-300">
                                  State:
                                </span>
                                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                  {province}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-sm text-gray-700 dark:text-gray-300">
                                  City:
                                </span>
                                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                  {city}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-sm text-gray-700 dark:text-gray-300">
                                  Postal:
                                </span>
                                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                  {postalCode || "N/A"}
                                </span>
                              </div>
                            </div>
                          </Card>

                          <Card className="p-4 bg-white/50 dark:bg-gray-800/50">
                            <h4 className="font-medium text-sm text-gray-600 dark:text-gray-400 mb-2">
                              Role & Access
                            </h4>
                            <div className="flex items-center gap-3 mb-3">
                              {(() => {
                                const roleOption = roleOptions.find(
                                  (r) => r.value === selectedRole
                                );
                                if (!roleOption) return null;
                                const Icon = roleOption.icon;
                                return (
                                  <>
                                    <div
                                      className={`p-2 rounded-lg ${roleOption.color}`}
                                    >
                                      <Icon className="h-4 w-4" />
                                    </div>
                                    <div>
                                      <div className="font-medium text-gray-900 dark:text-gray-100">
                                        {roleOption.title}
                                      </div>
                                      <div className="text-sm text-gray-600 dark:text-gray-400">
                                        {roleOption.description}
                                      </div>
                                    </div>
                                  </>
                                );
                              })()}
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              Organization:{" "}
                              {selectedRole === "supplier"
                                ? "SupplierMSP"
                                : selectedRole === "vendor"
                                  ? "VendorMSP"
                                  : selectedRole === "customer"
                                    ? "CustomerMSP"
                                    : "AdminMSP"}
                            </div>
                          </Card>

                          {requiresBusinessInfo && (
                            <Card className="p-4 bg-white/50 dark:bg-gray-800/50">
                              <h4 className="font-medium text-sm text-gray-600 dark:text-gray-400 mb-2">
                                Business Information
                              </h4>
                              <div className="grid gap-2 sm:grid-cols-2">
                                <div className="flex justify-between">
                                  <span className="text-sm text-gray-700 dark:text-gray-300">
                                    Company:
                                  </span>
                                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                    {companyName}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-sm text-gray-700 dark:text-gray-300">
                                    Type:
                                  </span>
                                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                    {businessType}
                                  </span>
                                </div>
                                <div className="flex justify-between sm:col-span-2">
                                  <span className="text-sm text-gray-700 dark:text-gray-300">
                                    Address:
                                  </span>
                                  <span className="text-sm font-medium text-right text-gray-900 dark:text-gray-100">
                                    {businessAddress}
                                  </span>
                                </div>
                              </div>
                            </Card>
                          )}
                        </div>

                        {/* Terms and Conditions */}
                        <div className="space-y-4">
                          <Alert className="border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/20">
                            <Shield className="h-4 w-4 text-blue-600" />
                            <AlertDescription className="text-blue-800 dark:text-blue-200">
                              Your wallet will be secured with Hyperledger
                              Fabric encryption. You will receive a 12-word
                              recovery phrase - this is the ONLY way to recover
                              your wallet if you forget your password.
                            </AlertDescription>
                          </Alert>

                          <div className="flex items-start space-x-2">
                            <Checkbox
                              id="terms"
                              checked={acceptedTerms}
                              onCheckedChange={(checked) =>
                                setAcceptedTerms(checked as boolean)
                              }
                              className="mt-1 cursor-pointer"
                            />
                            <div className="grid gap-1.5 leading-none">
                              <label
                                htmlFor="terms"
                                className="text-sm font-medium cursor-pointer text-gray-900 dark:text-gray-100"
                              >
                                I accept the terms and conditions
                              </label>
                              <p className="text-xs text-gray-600 dark:text-gray-400">
                                By creating an account, you agree to our{" "}
                                <Link
                                  href="/terms"
                                  className="text-blue-600 hover:underline cursor-pointer"
                                >
                                  Terms of Service
                                </Link>{" "}
                                and{" "}
                                <Link
                                  href="/privacy"
                                  className="text-blue-600 hover:underline cursor-pointer"
                                >
                                  Privacy Policy
                                </Link>
                              </p>
                            </div>
                          </div>

                          {acceptedTermsError && (
                            <p className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1 mt-1">
                              <AlertTriangle className="h-3 w-3" />
                              {acceptedTermsError}
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Step 6: Recovery Phrase */}
                    {currentStep === 6 && (
                      <div className="space-y-6">
                        <div className="text-center mb-6">
                          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-600 text-white mb-4">
                            <KeyRound className="h-8 w-8" />
                          </div>
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                            Your Recovery Phrase
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                            This is your wallet master key. Keep it safe and
                            never share it.
                          </p>
                        </div>

                        <Alert className="border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20">
                          <AlertTriangle className="h-4 w-4 text-amber-600" />
                          <AlertDescription className="text-amber-800 dark:text-amber-200">
                            <strong>CRITICAL:</strong> Write down these 12 words
                            in exact order. Anyone with this phrase can access
                            your wallet and all assets.
                          </AlertDescription>
                        </Alert>

                        {/* Recovery Phrase Display */}
                        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-6 border-2 border-dashed border-gray-300 dark:border-gray-600">
                          <div className="grid grid-cols-3 gap-3 mb-4">
                            {recoveryPhrase.split(" ").map((word, index) => (
                              <div
                                key={index}
                                className="flex items-center justify-center p-3 bg-white dark:bg-gray-700 rounded-lg border-2 border-gray-200 dark:border-gray-600 shadow-sm hover:shadow-md transition-shadow"
                              >
                                <span className="text-xs text-gray-500 dark:text-gray-400 mr-2">
                                  {index + 1}.
                                </span>
                                <span className="font-mono font-medium text-sm text-gray-900 dark:text-gray-100">
                                  {word}
                                </span>
                              </div>
                            ))}
                          </div>

                          <div className="flex gap-2 justify-center">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => copyToClipboard(recoveryPhrase)}
                              className="flex items-center gap-2 cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-950/20 border-gray-200 dark:border-gray-700"
                            >
                              <Copy className="h-4 w-4" />
                              Copy Phrase
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={downloadRecoveryPhrase}
                              className="flex items-center gap-2 cursor-pointer hover:bg-green-50 dark:hover:bg-green-950/20 border-gray-200 dark:border-gray-700"
                            >
                              <Download className="h-4 w-4" />
                              Download Backup
                            </Button>
                          </div>
                        </div>

                        {/* Security Tips */}
                        <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                          <div className="flex items-start gap-3">
                            <BadgeCheck className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                            <div>
                              <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                                Security Best Practices
                              </h4>
                              <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                                <li>
                                  • Write the phrase on paper and store in a
                                  safe place
                                </li>
                                <li>
                                  • Never store it digitally or take screenshots
                                </li>
                                <li>
                                  • Consider using a hardware wallet for large
                                  amounts
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

                        {/* Confirmation Checkbox */}
                        <div className="flex items-start space-x-2">
                          <Checkbox
                            id="backup-confirmed"
                            checked={backupConfirmed}
                            onCheckedChange={(checked) =>
                              setBackupConfirmed(checked as boolean)
                            }
                            className="mt-1 cursor-pointer"
                          />
                          <div className="grid gap-1.5 leading-none">
                            <label
                              htmlFor="backup-confirmed"
                              className="text-sm font-medium cursor-pointer text-gray-900 dark:text-gray-100"
                            >
                              I have safely backed up my recovery phrase
                            </label>
                            <p className="text-xs text-gray-600 dark:text-gray-400">
                              Confirm that you have written down or securely
                              stored your 12-word recovery phrase. Without it,
                              you cannot recover your wallet if you lose access.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Navigation Buttons */}
                  <div className="flex items-center justify-between pt-6 mt-6 border-t border-gray-200 dark:border-gray-700">
                    <Button
                      type="button"
                      onClick={prevStep}
                      disabled={currentStep === 1}
                      variant="outline"
                      className={`flex items-center gap-2 px-4 py-2 text-sm font-medium ${currentStep === 1 ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"}`}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>
                    {currentStep < totalSteps - 1 ? (
                      <Button
                        type="button"
                        onClick={handleNext}
                        disabled={
                          currentStep === 2 && (isCheckingEmail || emailExists)
                        } // DISABLE ON STEP 2
                        className={`flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-sm text-white font-medium transition-colors cursor-pointer ${
                          currentStep === 2 && (isCheckingEmail || emailExists)
                            ? "opacity-50 cursor-not-allowed"
                            : ""
                        }`}
                      >
                        {currentStep === 2 && isCheckingEmail ? (
                          <>
                            <RefreshCw className="h-4 w-4 animate-spin" />
                            Verifying Email...
                          </>
                        ) : (
                          <>
                            Next Step
                            <ChevronRight className="h-4 w-4" />
                          </>
                        )}
                      </Button>
                    ) : currentStep === totalSteps - 1 ? (
                      <Button
                        type="button"
                        onClick={handleSubmit}
                        disabled={isLoading || !acceptedTerms}
                        className={`flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-sm text-white font-medium transition-colors cursor-pointer ${isLoading || !acceptedTerms ? "opacity-50 cursor-not-allowed" : ""}`}
                      >
                        {isLoading ? (
                          <>
                            <RefreshCw className="h-4 w-4 animate-spin" />
                            Creating Wallet...
                          </>
                        ) : (
                          <>
                            <Wallet className="h-4 w-4" />
                            Create Wallet
                          </>
                        )}
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        onClick={handleComplete}
                        disabled={!backupConfirmed}
                        className={`flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-sm text-white font-medium transition-colors cursor-pointer ${!backupConfirmed ? "opacity-50 cursor-not-allowed" : ""}`}
                      >
                        <Zap className="h-4 w-4" />
                        Complete Setup
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Login Link */}
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Already have a wallet?{" "}
                <Link
                  href="/login"
                  className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium hover:underline transition-colors cursor-pointer"
                >
                  Sign In
                </Link>
              </p>
            </div>

            {/* Mobile Login Button */}
            <div className="text-center mt-4 sm:hidden">
              <Link href="/login">
                <Button
                  variant="ghost"
                  className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 cursor-pointer"
                >
                  Already have an account? Sign in
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Network Status */}
        <div className="fixed bottom-4 right-4 hidden sm:block">
          <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-full px-4 py-2 shadow-lg hover:shadow-xl transition-all duration-200 cursor-pointer">
            <div className="flex items-center gap-1.5 text-xs">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
              <span className="text-gray-600 dark:text-gray-400">
                Hyperledger Network Online
              </span>
            </div>
          </div>
        </div>

        {/* Background Decorations */}
        <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl animate-pulse delay-1000" />
          <div className="absolute top-3/4 left-3/4 w-32 h-32 bg-purple-500/5 rounded-full blur-2xl animate-pulse delay-2000" />
        </div>
      </div>
    </AuthRouteGuard>
  );
}
