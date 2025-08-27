"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/auth-provider";
import { useWallet } from "@/components/providers/wallet-provider";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Package,
  Users,
  ShoppingCart,
  Shield,
  ArrowRight,
  LogOut,
  Copy,
  CheckCircle,
  Wallet,
  User,
  Mail,
} from "lucide-react";
import { toast } from "sonner";
import { UserRole } from "@/types/web3";

export default function RoleSelectionPage() {
  const { user, isAuthenticated, logout, setUserRole, updateProfile } =
    useAuth();
  const { currentWallet, disconnectWallet } = useWallet();
  const router = useRouter();

  // Form state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState<"profile" | "role">("profile");

  useEffect(() => {
    if (!isAuthenticated || !currentWallet) {
      router.push("/login");
      return;
    }

    // If user already has a role, redirect to dashboard
    if (user?.role) {
      const dashboardPath = `/${user.role === "blockchain-expert" ? "blockchain-expert" : user.role}`;
      router.push(dashboardPath);
      return;
    }

    // Pre-fill if user already has data
    if (user?.name) setName(user.name);
    if (user?.email) setEmail(user.email);
  }, [isAuthenticated, currentWallet, user, router]);

  const handleProfileSubmit = () => {
    if (!name.trim()) {
      toast.error("Please enter your name");
      return;
    }

    // Email validation only if provided
    if (email.trim() && !email.includes("@")) {
      toast.error("Please enter a valid email or leave it empty");
      return;
    }

    // Update user profile
    updateProfile({
      name: name.trim(),
      email: email.trim() || undefined, // Don't store empty email
    });
    setStep("role");
    toast.success("Profile updated successfully!");
  };

  const handleRoleSelection = async (role: UserRole) => {
    setIsSubmitting(true);

    try {
      // Set the user role
      setUserRole(role);

      // Navigate to appropriate dashboard
      const dashboardPath = `/${role === "blockchain-expert" ? "blockchain-expert" : role}`;
      router.push(dashboardPath);

      toast.success(`Welcome to your ${role} dashboard!`);
    } catch (error) {
      toast.error("Failed to set role");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = () => {
    disconnectWallet();
    logout();
    toast.success("Logged out successfully");
    router.push("/login");
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        toast.success(`${label} copied to clipboard!`);
      })
      .catch(() => {
        toast.error("Failed to copy to clipboard");
      });
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  if (!user || !currentWallet) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const roleCards = [
    {
      role: "supplier" as UserRole,
      title: "Supplier/Ministry",
      description:
        "Manage inventory, buy from vendors, sell to vendors, view full product history",
      icon: Package,
      permissions: "Read & Write",
      features: [
        "Inventory Management",
        "Vendor Relations",
        "Product History",
        "Regulatory Oversight",
      ],
      color:
        "border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/20",
      iconColor: "text-blue-600",
    },
    {
      role: "vendor" as UserRole,
      title: "Vendor",
      description:
        "Add products, sell to customers, view transaction history and analytics",
      icon: Users,
      permissions: "Write Access",
      features: [
        "Product Management",
        "Customer Sales",
        "Transaction History",
        "Analytics Dashboard",
      ],
      color:
        "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/20",
      iconColor: "text-green-600",
    },
    {
      role: "customer" as UserRole,
      title: "Customer",
      description: "Browse products, add to cart, purchase items, track orders",
      icon: ShoppingCart,
      permissions: "Read Only",
      features: [
        "Product Browsing",
        "Shopping Cart",
        "Order Tracking",
        "Purchase History",
      ],
      color:
        "border-purple-200 bg-purple-50 dark:border-purple-800 dark:bg-purple-950/20",
      iconColor: "text-purple-600",
    },
    {
      role: "blockchain-expert" as UserRole,
      title: "Blockchain Expert",
      description:
        "View all transactions, manage consensus, security settings, fault tolerance",
      icon: Shield,
      permissions: "Admin Access",
      features: [
        "Transaction Monitoring",
        "Consensus Management",
        "Security Settings",
        "System Health",
      ],
      color:
        "border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950/20",
      iconColor: "text-orange-600",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 p-4">
      <div className="container max-w-6xl mx-auto py-12">
        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div className="text-center flex-1">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <Package className="h-8 w-8 text-primary" />
              <span className="text-2xl font-bold">ChainVanguard</span>
            </div>
            <h1 className="text-4xl font-bold mb-4">
              {step === "profile"
                ? "Complete Your Profile"
                : "Select Your Role"}
            </h1>
            <p className="text-muted-foreground text-lg">
              {step === "profile"
                ? "Please provide your details to continue"
                : "Choose your role to access the appropriate dashboard"}
            </p>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleLogout}
            className="flex items-center gap-2"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </div>

        {/* Wallet Info Card */}
        <div className="mb-8">
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wallet className="h-5 w-5" />
                Wallet Information
              </CardTitle>
              <CardDescription>Your connected wallet details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-3">
                    <Wallet className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Wallet Name</p>
                      <p className="text-sm text-muted-foreground">
                        {currentWallet.name}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      copyToClipboard(currentWallet.name, "Wallet name")
                    }
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>

                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-3">
                    <Shield className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Wallet Address</p>
                      <p className="text-xs font-mono text-muted-foreground">
                        {currentWallet.address}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Shortened: {formatAddress(currentWallet.address)}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      copyToClipboard(currentWallet.address, "Wallet address")
                    }
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Profile Step */}
        {step === "profile" && (
          <div className="max-w-md mx-auto">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Personal Information
                </CardTitle>
                <CardDescription>
                  This information will be associated with your wallet
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="name"
                      type="text"
                      placeholder="Enter your full name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address (Optional)</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email (optional for notifications)"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Email is optional - your wallet address is your primary
                    identity
                  </p>
                </div>

                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    Your wallet address (0x...) is your primary identity on the
                    blockchain. Email is only for optional notifications and
                    convenience.
                  </AlertDescription>
                </Alert>

                <Button
                  onClick={handleProfileSubmit}
                  className="w-full"
                  disabled={!name.trim()}
                >
                  Continue to Role Selection
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Role Selection Step */}
        {step === "role" && (
          <>
            {/* User Info Summary */}
            <div className="mb-8">
              <Card className="max-w-md mx-auto">
                <CardHeader className="text-center">
                  <CardTitle className="text-lg">Account Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Name:</span>
                    <span className="font-medium">{name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Email:</span>
                    <span className="font-medium">
                      {email || "Not provided"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Wallet:</span>
                    <span className="font-mono text-xs">
                      {formatAddress(currentWallet.address)}
                    </span>
                  </div>
                  {selectedRole && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Current Role:
                      </span>
                      <Badge variant="outline">
                        {roleCards.find((r) => r.role === selectedRole)?.title}
                      </Badge>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Role Selection Cards */}
            <div className="grid md:grid-cols-2 lg:grid-cols-2 gap-6 max-w-4xl mx-auto">
              {roleCards.map((card) => {
                const Icon = card.icon;
                const isSelected = selectedRole === card.role;

                return (
                  <Card
                    key={card.role}
                    className={`hover:shadow-lg transition-all duration-200 cursor-pointer ${
                      isSelected
                        ? `${card.color} border-2 ring-2 ring-primary/20`
                        : "hover:border-primary/50"
                    }`}
                    onClick={() => setSelectedRole(card.role)}
                  >
                    <CardHeader>
                      <div className="flex items-center justify-between mb-2">
                        <Icon
                          className={`h-8 w-8 ${isSelected ? card.iconColor : "text-muted-foreground"}`}
                        />
                        <Badge variant={isSelected ? "default" : "outline"}>
                          {card.permissions}
                        </Badge>
                      </div>
                      <CardTitle className="text-xl">{card.title}</CardTitle>
                      <CardDescription className="text-sm">
                        {card.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div>
                          <p className="text-sm font-medium mb-2">
                            Key Features:
                          </p>
                          <ul className="space-y-1">
                            {card.features.map((feature, index) => (
                              <li
                                key={index}
                                className="text-sm text-muted-foreground flex items-center"
                              >
                                <div
                                  className={`w-1.5 h-1.5 rounded-full mr-2 ${
                                    isSelected
                                      ? "bg-primary"
                                      : "bg-muted-foreground"
                                  }`}
                                />
                                {feature}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Continue Button */}
            {selectedRole && (
              <div className="text-center mt-8">
                <Button
                  size="lg"
                  onClick={() => handleRoleSelection(selectedRole)}
                  disabled={isSubmitting}
                  className="min-w-[200px]"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Setting up...
                    </>
                  ) : (
                    <>
                      Access Dashboard
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            )}
          </>
        )}

        {/* Help Section */}
        <div className="text-center mt-12 space-y-4">
          <div className="bg-muted/50 rounded-lg p-6 max-w-2xl mx-auto">
            <h3 className="font-semibold mb-2">Web3 & Blockchain Identity</h3>
            <p className="text-sm text-muted-foreground mb-4">
              In Web3, your wallet address is your identity. No personal data is
              required - everything is decentralized and secured by blockchain
              technology. Email is purely optional for convenience.
            </p>
            <div className="flex flex-wrap justify-center gap-2 text-xs">
              <Badge
                variant="outline"
                className="bg-blue-50 text-blue-700 border-blue-200"
              >
                Supplier: Full inventory control
              </Badge>
              <Badge
                variant="outline"
                className="bg-green-50 text-green-700 border-green-200"
              >
                Vendor: Product management
              </Badge>
              <Badge
                variant="outline"
                className="bg-purple-50 text-purple-700 border-purple-200"
              >
                Customer: Shopping & tracking
              </Badge>
              <Badge
                variant="outline"
                className="bg-orange-50 text-orange-700 border-orange-200"
              >
                Expert: System administration
              </Badge>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
