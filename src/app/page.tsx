import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Highlighter } from "@/components/magicui/highlighter";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowRight,
  Shield,
  Zap,
  Globe,
  Users,
  Package,
  TrendingUp,
  CheckCircle,
  Star,
  Eye,
  BarChart3,
  Warehouse,
} from "lucide-react";
import { ThemeToggle } from "@/components/common/theme-toggle";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 dark:from-slate-950 dark:via-blue-950 dark:to-cyan-950">
      {/* Header */}
      <header className="bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-700/50 sticky top-0 z-50">
        <div className="container mx-auto px-6 flex h-16 items-center justify-between">
          <div className="flex items-center space-x-3 cursor-pointer">
            <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center">
              <Package className="h-5 w-5 text-white" />
            </div>
            <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              ChainVanguard
            </span>
          </div>
          <nav className="flex items-center space-x-4">
            <ThemeToggle />
            <Link href="/login">
              <Button
                variant="ghost"
                className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-white/50 dark:hover:bg-gray-800/50 cursor-pointer"
              >
                Login
              </Button>
            </Link>
            <Link href="/register">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer">
                Get Started
              </Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-24 text-center">
        <div className="container mx-auto px-6">
          <div className="transform transition-all duration-700 animate-fadeIn">
            <Badge
              variant="secondary"
              className="mb-6 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-700"
            >
              <Zap className="h-3 w-3 mr-1" />
              Powered by Hyperledger Fabric & IPFS
            </Badge>

            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-gray-900 to-gray-700 dark:from-gray-100 dark:to-gray-300 bg-clip-text text-transparent mb-6">
              Blockchain Supply Chain{" "}
              <span className="text-blue-600 dark:text-blue-400">
                Management
              </span>
            </h1>

            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-3xl mx-auto leading-relaxed mb-10">
              Transparent, secure, and efficient supply chain management powered
              by cutting-edge blockchain technology. Track products from origin
              to consumer with complete transparency and immutable records.
            </p>

            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link href="/register">
                <Button
                  size="lg"
                  className="bg-blue-600 hover:bg-blue-700 text-white h-12 px-8 font-semibold shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 cursor-pointer"
                >
                  Start Your Journey
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/login">
                <Button
                  variant="outline"
                  size="lg"
                  className="h-12 px-8 font-semibold border-gray-200 dark:border-gray-700 hover:bg-white/50 dark:hover:bg-gray-800/50 transition-all duration-300 transform hover:scale-105 cursor-pointer"
                >
                  Sign In
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              Powerful Features
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Everything you need for modern, secure supply chain management
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: Shield,
                title: "Secure & Transparent",
                desc: "Immutable blockchain records ensure complete transparency and security for all transactions",
                color:
                  "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400",
              },
              {
                icon: Zap,
                title: "Real-time Tracking",
                desc: "Track products in real-time from manufacturer to end consumer with instant updates",
                color:
                  "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400",
              },
              {
                icon: Globe,
                title: "Decentralized Storage",
                desc: "IPFS integration for distributed and secure file storage across the network",
                color:
                  "bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400",
              },
              {
                icon: Users,
                title: "Multi-Role System",
                desc: "Comprehensive support for suppliers, vendors, customers, and blockchain experts",
                color:
                  "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400",
              },
              {
                icon: Package,
                title: "Smart Contracts",
                desc: "Automated processes with Hyperledger Fabric smart contracts for seamless operations",
                color:
                  "bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400",
              },
              {
                icon: TrendingUp,
                title: "Analytics Dashboard",
                desc: "Comprehensive analytics and reporting tools for all stakeholders and decision makers",
                color:
                  "bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400",
              },
            ].map((feature, idx) => (
              <Card
                key={idx}
                className="group border-0 shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:scale-105 bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl cursor-pointer"
              >
                <CardHeader className="pb-4">
                  <div
                    className={`h-14 w-14 rounded-xl ${feature.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}
                  >
                    <feature.icon className="h-7 w-7" />
                  </div>
                  <CardTitle className="text-lg text-gray-900 dark:text-gray-100 mb-2">
                    {feature.title}
                  </CardTitle>
                  <CardDescription className="text-gray-600 dark:text-gray-400 leading-relaxed">
                    {feature.desc}
                  </CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Statistics Section */}
      <section className="py-24">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8">
            {[
              { number: "1000+", label: "Products Tracked", icon: Package },
              { number: "50+", label: "Active Vendors", icon: Users },
              { number: "99.9%", label: "Uptime", icon: CheckCircle },
              { number: "24/7", label: "Support", icon: Shield },
            ].map((stat, idx) => (
              <Card
                key={idx}
                className="text-center border-0 shadow-lg bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl transform transition-all duration-500 hover:scale-105"
              >
                <CardContent className="p-8">
                  <div className="h-12 w-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <stat.icon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                    {stat.number}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {stat.label}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* User Roles Section */}
      <section className="py-24">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              Choose Your Role
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Tailored interfaces for different stakeholders in the supply chain
              ecosystem
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                title: "Supplier/Ministry",
                desc: "Manage inventory, buy from vendors, sell to vendors, view full product history and compliance",
                badge: "Read & Write",
                icon: Warehouse,
                color: "bg-blue-500",
                badgeColor:
                  "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
              },
              {
                title: "Vendor",
                desc: "Add products, sell to customers, view transaction history and comprehensive analytics",
                badge: "Write Access",
                icon: Package,
                color: "bg-green-500",
                badgeColor:
                  "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
              },
              {
                title: "Customer",
                desc: "Browse products, add to cart, purchase items, track orders with real-time updates",
                badge: "Read Only",
                icon: Eye,
                color: "bg-purple-500",
                badgeColor:
                  "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
              },
              {
                title: "Blockchain Expert",
                desc: "View all transactions, manage consensus, security settings, and fault tolerance systems",
                badge: "Admin Access",
                icon: BarChart3,
                color: "bg-orange-500",
                badgeColor:
                  "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
              },
            ].map((role, idx) => (
              <Card
                key={idx}
                className="group text-center border-0 shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:scale-105 bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl cursor-pointer"
              >
                <CardHeader className="pb-4">
                  <div
                    className={`h-16 w-16 ${role.color} rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300`}
                  >
                    <role.icon className="h-8 w-8 text-white" />
                  </div>
                  <CardTitle className="text-lg text-gray-900 dark:text-gray-100 mb-2">
                    {role.title}
                  </CardTitle>
                  <CardDescription className="text-gray-600 dark:text-gray-400 leading-relaxed">
                    {role.desc}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Badge className={`${role.badgeColor} font-medium`}>
                    {role.badge}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="py-24">
        <div className="container mx-auto px-6">
          <Card className="border-0 shadow-2xl bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl">
            <CardContent className="p-16 text-center">
              <div className="h-16 w-16 bg-blue-600 rounded-xl flex items-center justify-center mx-auto mb-6">
                <Star className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                <p>
                  Ready to{" "}
                  <Highlighter action="underline" color="#FF9800">
                    Transform
                  </Highlighter>{" "}
                  Your{" "}
                  <Highlighter action="highlight" color="#87CEFA">
                    Supply Chain
                  </Highlighter>{" "}
                  ?
                </p>
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto mb-8">
                Join thousands of businesses already using ChainVanguard to
                create transparent, secure, and efficient supply chain
                operations.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <Link href="/register">
                  <Button
                    size="lg"
                    className="bg-blue-600 hover:bg-blue-700 text-white h-12 px-8 font-semibold shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 cursor-pointer"
                  >
                    Get Started Now
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link href="/login">
                  <Button
                    variant="outline"
                    size="lg"
                    className="h-12 px-8 font-semibold border-gray-200 dark:border-gray-700 hover:bg-white/50 dark:hover:bg-gray-800/50 transition-all duration-300 transform hover:scale-105 cursor-pointer"
                  >
                    View Demo
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200/50 dark:border-gray-700/50 py-16 bg-white/50 dark:bg-gray-950/50 backdrop-blur-xl">
        <div className="container mx-auto px-6">
          <div className="text-center space-y-6">
            <div className="flex items-center justify-center space-x-3 cursor-pointer">
              <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center">
                <Package className="h-5 w-5 text-white" />
              </div>
              <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                ChainVanguard
              </span>
            </div>
            <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Revolutionizing supply chain management through blockchain
              technology, ensuring transparency, security, and efficiency for
              all stakeholders.
            </p>
            <div className="flex justify-center space-x-6">
              <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                Next.js
              </Badge>
              <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                TypeScript
              </Badge>
              <Badge className="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                Hyperledger Fabric
              </Badge>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-500">
              © {new Date().getFullYear()} ChainVanguard. All rights reserved.
            </p>
            
          </div>
        </div>
      </footer>
    </div>
  );
}
