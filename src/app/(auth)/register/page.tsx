"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/components/providers/auth-provider";
import { useWallet } from "@/components/providers/wallet-provider";
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
  CheckCircle,
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
import { UserRole } from "@/types/web3";

export default function RegisterPage() {
  // Current step in the multi-step form
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 5;

  // Animation states
  const [isVisible, setIsVisible] = useState(false);
  const [slideDirection, setSlideDirection] = useState("right");

  // Basic Form State
  const [walletName, setWalletName] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [selectedRole, setSelectedRole] = useState<UserRole | "">("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  // Business Details
  const [companyName, setCompanyName] = useState("");
  const [businessAddress, setBusinessAddress] = useState("");
  const [businessType, setBusinessType] = useState("");
  const [registrationNumber, setRegistrationNumber] = useState("");

  // Recovery phrase state
  const [isLoading, setIsLoading] = useState(false);
  const [recoveryPhrase, setRecoveryPhrase] = useState("");
  const [backupConfirmed, setBackupConfirmed] = useState(false);
  const [createdWalletId, setCreatedWalletId] = useState("");

  // Form validation
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { login, setUserRole, updateProfile } = useAuth();
  const { createWallet, generateRecoveryPhrase, connectWallet } = useWallet();
  const router = useRouter();

  // Initialize visibility animation
  useEffect(() => {
    setIsVisible(true);
  }, []);

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

  const validateStep = (step: number) => {
    const newErrors: Record<string, string> = {};

    switch (step) {
      case 1:
        if (!walletName.trim())
          newErrors.walletName = "Wallet name is required";
        if (!password || password.length < 8)
          newErrors.password = "Password must be at least 8 characters";
        if (password !== confirmPassword)
          newErrors.confirmPassword = "Passwords do not match";
        break;
      case 2:
        if (!name.trim()) newErrors.name = "Full name is required";
        if (email.trim() && !email.includes("@"))
          newErrors.email = "Please enter a valid email";
        if (phone.trim() && phone.length < 10)
          newErrors.phone = "Please enter a valid phone number";
        break;
      case 3:
        if (!selectedRole) newErrors.selectedRole = "Please select your role";
        if (requiresBusinessInfo) {
          if (!companyName.trim())
            newErrors.companyName = "Company name is required";
          if (!businessAddress.trim())
            newErrors.businessAddress = "Business address is required";
          if (!businessType.trim())
            newErrors.businessType = "Business type is required";
        }
        break;
      case 4:
        if (!acceptedTerms)
          newErrors.acceptedTerms = "Please accept the terms and conditions";
        break;
      case 5:
        // Recovery phrase step validation (if needed)
        break;
    }

    return Object.keys(newErrors).length === 0;
  };

  const isStepValid = (step: number) => {
    return validateStep(step);
  };

  const handleNext = () => {
    const currentStepErrors: Record<string, string> = {};

    // Validate current step
    switch (currentStep) {
      case 1:
        if (!walletName.trim())
          currentStepErrors.walletName = "Wallet name is required";
        if (!password || password.length < 8)
          currentStepErrors.password = "Password must be at least 8 characters";
        if (password !== confirmPassword)
          currentStepErrors.confirmPassword = "Passwords do not match";
        break;
      case 2:
        if (!name.trim()) currentStepErrors.name = "Full name is required";
        if (email.trim() && !email.includes("@"))
          currentStepErrors.email = "Please enter a valid email";
        if (phone.trim() && phone.length < 10)
          currentStepErrors.phone = "Please enter a valid phone number";
        break;
      case 3:
        if (!selectedRole)
          currentStepErrors.selectedRole = "Please select your role";
        if (requiresBusinessInfo) {
          if (!companyName.trim())
            currentStepErrors.companyName = "Company name is required";
          if (!businessAddress.trim())
            currentStepErrors.businessAddress = "Business address is required";
          if (!businessType.trim())
            currentStepErrors.businessType = "Business type is required";
        }
        break;
    }

    setErrors(currentStepErrors);

    if (Object.keys(currentStepErrors).length === 0) {
      nextStep();
    }
  };

  const handleSubmit = async () => {
    if (!validateStep(4)) return;

    setIsLoading(true);

    try {
      // Basic validation
      if (!walletName.trim()) throw new Error("Wallet name is required");
      if (!name.trim()) throw new Error("Your name is required");
      if (!selectedRole) throw new Error("Please select your role");
      if (password.length < 8)
        throw new Error("Password must be at least 8 characters");
      if (password !== confirmPassword)
        throw new Error("Passwords do not match");
      if (!acceptedTerms)
        throw new Error("Please accept the terms and conditions");

      // Email validation
      if (email.trim() && !email.includes("@"))
        throw new Error("Please enter a valid email");

      // Phone validation (basic)
      if (phone.trim() && phone.length < 10)
        throw new Error("Please enter a valid phone number");

      // Business validation for suppliers/vendors
      if (requiresBusinessInfo) {
        if (!companyName.trim())
          throw new Error("Company name is required for your role");
        if (!businessAddress.trim())
          throw new Error("Business address is required");
        if (!businessType.trim())
          throw new Error("Please select business type");
      }

      // Create Hyperledger Fabric wallet
      const newWallet = await createWallet(walletName.trim(), password);

      // Generate 12-word recovery phrase
      const phrase = generateRecoveryPhrase();
      localStorage.setItem(`wallet_${newWallet.id}_recovery`, phrase);

      // Store additional wallet metadata
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
        `wallet_${newWallet.id}_metadata`,
        JSON.stringify(walletMetadata)
      );

      setRecoveryPhrase(phrase);
      setCreatedWalletId(newWallet.id);
      setIsLoading(false);

      toast.success("Hyperledger Fabric wallet created successfully!");

      // Move to step 5 (recovery phrase)
      nextStep();
    } catch (error) {
      setIsLoading(false);
      toast.error(
        error instanceof Error ? error.message : "Failed to create wallet"
      );
    }
  };

  const handleComplete = async () => {
    if (!backupConfirmed) {
      toast.error("Please confirm you have backed up your recovery phrase");
      return;
    }

    try {
      // Get the created wallet
      const wallets = JSON.parse(
        localStorage.getItem("chainvanguard_wallets") || "[]"
      );
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const wallet = wallets.find((w: any) => w.id === createdWalletId);

      if (!wallet) throw new Error("Wallet not found");

      // Create complete user data object
      const userData = {
        id: wallet.id,
        name: name.trim(),
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        walletName: walletName.trim(),
        walletAddress: wallet.address,
        role: selectedRole as UserRole,
        ...(requiresBusinessInfo && {
          companyName: companyName.trim(),
          businessAddress: businessAddress.trim(),
          businessType: businessType.trim(),
          registrationNumber: registrationNumber.trim() || undefined,
        }),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        networkType: "hyperledger-fabric",
        organizationMSP:
          selectedRole === "supplier"
            ? "SupplierMSP"
            : selectedRole === "vendor"
              ? "VendorMSP"
              : selectedRole === "customer"
                ? "CustomerMSP"
                : "AdminMSP",
        isAuthenticated: true,
        loginAt: new Date().toISOString(),
      };

      // Save with role preservation system
      RolePreservation.saveRole(
        wallet.address,
        selectedRole as UserRole,
        userData
      );

      console.log(
        "[REGISTER] User data saved with role preservation:",
        userData.role
      );

      // Set authentication cookie
      document.cookie = `chainvanguard_auth=${createdWalletId}; path=/; max-age=${7 * 24 * 60 * 60}`;

      // Connect wallet
      await connectWallet(createdWalletId, password);

      // Update auth provider with complete data
      updateProfile(userData);
      setUserRole(selectedRole as UserRole);

      // Login with the preserved data
      await login(wallet.address, password);

      toast.success("Account setup completed successfully!");

      console.log("[REGISTER] Navigating directly to dashboard:", selectedRole);

      // Navigate directly to dashboard
      router.push(`/${selectedRole}`);
    } catch (error) {
      console.error("[REGISTER] Setup error:", error);
      toast.error("Failed to complete setup");
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
    const content = [
      "ChainVanguard Hyperledger Fabric Wallet Recovery",
      "================================================",
      "",
      `Wallet Name: ${walletName}`,
      `Owner: ${name}`,
      `Email: ${email}`,
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
      value: "blockchain-expert",
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

  return (
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

          {/* Form Card */}
          <Card className="relative overflow-hidden border-0 shadow-2xl bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-cyan-500/5" />

            <CardHeader className="relative z-10 text-center pb-6">
              <div
                className={`transform transition-all duration-500 ${isVisible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"}`}
              >
                <CardTitle className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                  {currentStep === 1 && "Create Your Wallet"}
                  {currentStep === 2 && "Personal Information"}
                  {currentStep === 3 && "Select Your Role"}
                  {currentStep === 4 && "Review & Confirm"}
                  {currentStep === 5 && "Secure Your Recovery Phrase"}
                </CardTitle>
                <CardDescription className="text-base text-gray-600 dark:text-gray-400">
                  {currentStep === 1 &&
                    "Set up your secure Hyperledger Fabric wallet"}
                  {currentStep === 2 && "Tell us about yourself"}
                  {currentStep === 3 && "Choose your role in the supply chain"}
                  {currentStep === 4 &&
                    "Review your information and create account"}
                  {currentStep === 5 &&
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
                          className="flex items-center gap-2 text-gray-700 dark:text-gray-300"
                        >
                          <Lock className="h-4 w-4" />
                          Wallet Name
                        </Label>
                        <Input
                          id="wallet-name"
                          placeholder="e.g., My Supply Chain Wallet"
                          value={walletName}
                          onChange={(e) => setWalletName(e.target.value)}
                          className="mt-1 h-12 border-2 border-gray-200 dark:border-gray-700 hover:border-blue-300 focus:border-blue-500 transition-colors bg-white/50 dark:bg-gray-800/50 cursor-text"
                        />
                        {errors.walletName && (
                          <p className="text-sm text-red-500 mt-1">
                            {errors.walletName}
                          </p>
                        )}
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                          <Label
                            htmlFor="password"
                            className="text-gray-700 dark:text-gray-300"
                          >
                            Password
                          </Label>
                          <div className="relative mt-1">
                            <Input
                              id="password"
                              type={showPassword ? "text" : "password"}
                              placeholder="Min 8 characters"
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              className="h-12 pr-12 border-2 border-gray-200 dark:border-gray-700 hover:border-blue-300 focus:border-blue-500 transition-colors bg-white/50 dark:bg-gray-800/50 cursor-text"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute right-0 top-0 h-12 w-12 cursor-pointer"
                              onClick={() => setShowPassword(!showPassword)}
                            >
                              {showPassword ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                          {errors.password && (
                            <p className="text-sm text-red-500 mt-1">
                              {errors.password}
                            </p>
                          )}
                        </div>

                        <div>
                          <Label
                            htmlFor="confirm-password"
                            className="text-gray-700 dark:text-gray-300"
                          >
                            Confirm Password
                          </Label>
                          <div className="relative mt-1">
                            <Input
                              id="confirm-password"
                              type={showConfirmPassword ? "text" : "password"}
                              placeholder="Re-enter password"
                              value={confirmPassword}
                              onChange={(e) =>
                                setConfirmPassword(e.target.value)
                              }
                              className="h-12 pr-12 border-2 border-gray-200 dark:border-gray-700 hover:border-blue-300 focus:border-blue-500 transition-colors bg-white/50 dark:bg-gray-800/50 cursor-text"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute right-0 top-0 h-12 w-12 cursor-pointer"
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
                          {errors.confirmPassword && (
                            <p className="text-sm text-red-500 mt-1">
                              {errors.confirmPassword}
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
                          className="flex items-center gap-2 text-gray-700 dark:text-gray-300"
                        >
                          <User className="h-4 w-4" />
                          Full Name
                        </Label>
                        <Input
                          id="name"
                          placeholder="Enter your full name"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="mt-1 h-12 border-2 border-gray-200 dark:border-gray-700 hover:border-blue-300 focus:border-blue-500 transition-colors bg-white/50 dark:bg-gray-800/50 cursor-text"
                        />
                        {errors.name && (
                          <p className="text-sm text-red-500 mt-1">
                            {errors.name}
                          </p>
                        )}
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                          <Label
                            htmlFor="email"
                            className="flex items-center gap-2 text-gray-700 dark:text-gray-300"
                          >
                            <Mail className="h-4 w-4" />
                            Email Address
                          </Label>
                          <Input
                            id="email"
                            type="email"
                            placeholder="your@email.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="mt-1 h-12 border-2 border-gray-200 dark:border-gray-700 hover:border-blue-300 focus:border-blue-500 transition-colors bg-white/50 dark:bg-gray-800/50 cursor-text"
                          />
                          {errors.email && (
                            <p className="text-sm text-red-500 mt-1">
                              {errors.email}
                            </p>
                          )}
                        </div>

                        <div>
                          <Label
                            htmlFor="phone"
                            className="flex items-center gap-2 text-gray-700 dark:text-gray-300"
                          >
                            <Phone className="h-4 w-4" />
                            Phone (Optional)
                          </Label>
                          <Input
                            id="phone"
                            type="tel"
                            placeholder="+1 (555) 123-4567"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            className="mt-1 h-12 border-2 border-gray-200 dark:border-gray-700 hover:border-blue-300 focus:border-blue-500 transition-colors bg-white/50 dark:bg-gray-800/50 cursor-text"
                          />
                          {errors.phone && (
                            <p className="text-sm text-red-500 mt-1">
                              {errors.phone}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 3: Role Selection */}
                {currentStep === 3 && (
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
                                <div className={`p-2 rounded-lg ${role.color}`}>
                                  <Icon className="h-5 w-5" />
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <CardTitle className="text-base text-gray-900 dark:text-gray-100">
                                      {role.title}
                                    </CardTitle>
                                    {isSelected && (
                                      <CheckCircle className="h-4 w-4 text-blue-500" />
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
                                    className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
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

                    {errors.selectedRole && (
                      <p className="text-sm text-red-500 text-center">
                        {errors.selectedRole}
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
                              className="text-gray-700 dark:text-gray-300"
                            >
                              Company Name
                            </Label>
                            <Input
                              id="company-name"
                              placeholder="Your company name"
                              value={companyName}
                              onChange={(e) => setCompanyName(e.target.value)}
                              className="mt-1 border-2 border-gray-200 dark:border-gray-700 hover:border-blue-300 focus:border-blue-500 transition-colors bg-white/50 dark:bg-gray-800/50 cursor-text"
                            />
                            {errors.companyName && (
                              <p className="text-sm text-red-500 mt-1">
                                {errors.companyName}
                              </p>
                            )}
                          </div>

                          <div>
                            <Label
                              htmlFor="business-type"
                              className="text-gray-700 dark:text-gray-300"
                            >
                              Business Type
                            </Label>
                            <Select
                              value={businessType}
                              onValueChange={setBusinessType}
                            >
                              <SelectTrigger className="mt-1 border-2 border-gray-200 dark:border-gray-700 hover:border-blue-300 focus:border-blue-500 transition-colors cursor-pointer bg-white/50 dark:bg-gray-800/50">
                                <SelectValue
                                  placeholder="Select type"
                                  className="cursor-pointer"
                                />
                              </SelectTrigger>
                              <SelectContent>
                                {selectedRole === "supplier" ? (
                                  <>
                                    <SelectItem
                                      value="manufacturer"
                                      className="cursor-pointer"
                                    >
                                      Manufacturer
                                    </SelectItem>
                                    <SelectItem
                                      value="distributor"
                                      className="cursor-pointer"
                                    >
                                      Distributor
                                    </SelectItem>
                                    <SelectItem
                                      value="ministry"
                                      className="cursor-pointer"
                                    >
                                      Government Ministry
                                    </SelectItem>
                                  </>
                                ) : (
                                  <>
                                    <SelectItem
                                      value="retailer"
                                      className="cursor-pointer"
                                    >
                                      Retailer
                                    </SelectItem>
                                    <SelectItem
                                      value="wholesaler"
                                      className="cursor-pointer"
                                    >
                                      Wholesaler
                                    </SelectItem>
                                    <SelectItem
                                      value="marketplace"
                                      className="cursor-pointer"
                                    >
                                      Marketplace
                                    </SelectItem>
                                  </>
                                )}
                              </SelectContent>
                            </Select>
                            {errors.businessType && (
                              <p className="text-sm text-red-500 mt-1">
                                {errors.businessType}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                          <div>
                            <Label
                              htmlFor="business-address"
                              className="flex items-center gap-2 text-gray-700 dark:text-gray-300"
                            >
                              <MapPin className="h-4 w-4" />
                              Business Address
                            </Label>
                            <Input
                              id="business-address"
                              placeholder="123 Business St, City, State"
                              value={businessAddress}
                              onChange={(e) =>
                                setBusinessAddress(e.target.value)
                              }
                              className="mt-1 border-2 border-gray-200 dark:border-gray-700 hover:border-blue-300 focus:border-blue-500 transition-colors bg-white/50 dark:bg-gray-800/50 cursor-text"
                            />
                            {errors.businessAddress && (
                              <p className="text-sm text-red-500 mt-1">
                                {errors.businessAddress}
                              </p>
                            )}
                          </div>

                          <div>
                            <Label
                              htmlFor="registration-number"
                              className="flex items-center gap-2 text-gray-700 dark:text-gray-300"
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
                              className="mt-1 border-2 border-gray-200 dark:border-gray-700 hover:border-blue-300 focus:border-blue-500 transition-colors bg-white/50 dark:bg-gray-800/50 cursor-text"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Step 4: Review & Terms */}
                {currentStep === 4 && (
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
                          Your wallet will be secured with Hyperledger Fabric
                          encryption. You will receive a 12-word recovery phrase
                          - this is the ONLY way to recover your wallet if you
                          forget your password.
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

                      {errors.acceptedTerms && (
                        <p className="text-sm text-red-500">
                          {errors.acceptedTerms}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Step 5: Recovery Phrase */}
                {currentStep === 5 && (
                  <div className="space-y-6">
                    <div className="text-center mb-6">
                      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-600 text-white mb-4">
                        <KeyRound className="h-8 w-8" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                        Your Recovery Phrase
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                        This is your wallet master key. Keep it safe and never
                        share it.
                      </p>
                    </div>

                    <Alert className="border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20">
                      <AlertTriangle className="h-4 w-4 text-amber-600" />
                      <AlertDescription className="text-amber-800 dark:text-amber-200">
                        <strong>CRITICAL:</strong> Write down these 12 words in
                        exact order. Anyone with this phrase can access your
                        wallet and all assets.
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
                              • Write the phrase on paper and store in a safe
                              place
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
                          Confirm that you have written down or securely stored
                          your 12-word recovery phrase. Without it, you cannot
                          recover your wallet if you lose access.
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
                  variant="outline"
                  onClick={prevStep}
                  disabled={currentStep === 1}
                  className={`flex items-center gap-2 cursor-pointer border-gray-200 dark:border-gray-700 ${currentStep === 1 ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-50 dark:hover:bg-gray-800"}`}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>

                {currentStep < 4 ? (
                  <Button
                    type="button"
                    onClick={handleNext}
                    disabled={!isStepValid(currentStep)}
                    className={`flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white cursor-pointer ${!isStepValid(currentStep) ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    Next Step
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                ) : currentStep === 4 ? (
                  <Button
                    type="button"
                    onClick={handleSubmit}
                    disabled={!isStepValid(4) || isLoading}
                    className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white cursor-pointer"
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
                    className={`flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white cursor-pointer ${!backupConfirmed ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    <Zap className="h-4 w-4" />
                    Complete Setup
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

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
          <div className="flex items-center gap-2 text-xs">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
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
  );
}
