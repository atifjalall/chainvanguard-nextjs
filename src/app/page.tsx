"use client";

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
  Users,
  Package,
  TrendingUp,
  CheckCircle,
  Star,
  Eye,
  BarChart3,
  Warehouse,
  Clock,
  Award,
  Lock,
  Cpu,
  Database,
  Network,
} from "lucide-react";
import { ThemeToggle } from "@/components/common/theme-toggle";
import PixelBlast from "@/components/PixelBlast";

export default function LandingPage() {
  return (
    <div className="relative min-h-screen w-full">
      {/* Animated PixelBlast background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <PixelBlast
          variant="circle"
          pixelSize={16}
          color="#2563eb"
          patternScale={2.2}
          patternDensity={0.5}
          pixelSizeJitter={0.08}
          enableRipples
          rippleSpeed={0.18}
          rippleThickness={0.09}
          rippleIntensityScale={0.7}
          liquid
          liquidStrength={0.07}
          liquidRadius={1.1}
          liquidWobbleSpeed={2.2}
          speed={0.22}
          edgeFade={0.22}
          transparent
        />
      </div>
      {/* Main content overlays the animation */}
      <div className="relative z-10">
        {/* ...existing code... */}
        <div className="min-h-screen bg-gradient-to-br from-slate-50/80 via-blue-50/80 to-cyan-50/80 dark:from-slate-950/80 dark:via-blue-950/80 dark:to-cyan-950/80 relative overflow-hidden">
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {/* Floating geometric shapes */}
            <div
              className="absolute top-32 left-16 w-8 h-8 border border-blue-300/20 dark:border-blue-600/20 rotate-45 animate-spin"
              style={{ animationDuration: "20s" }}
            ></div>
            <div
              className="absolute top-96 right-32 w-6 h-6 border border-cyan-300/30 dark:border-cyan-600/30 rotate-12 animate-pulse"
              style={{ animationDelay: "2s" }}
            ></div>
            <div
              className="absolute bottom-64 left-24 w-4 h-8 bg-gradient-to-t from-blue-400/10 to-transparent animate-bounce"
              style={{ animationDelay: "1s", animationDuration: "3s" }}
            ></div>

            {/* Animated lines and connections */}
            <svg
              className="absolute inset-0 w-full h-full"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <linearGradient
                  id="lineGradient"
                  x1="0%"
                  y1="0%"
                  x2="100%"
                  y2="100%"
                >
                  <stop
                    offset="0%"
                    stopColor="rgb(59, 130, 246)"
                    stopOpacity="0.1"
                  />
                  <stop
                    offset="100%"
                    stopColor="rgb(6, 182, 212)"
                    stopOpacity="0.05"
                  />
                </linearGradient>
              </defs>
              <line
                x1="10%"
                y1="20%"
                x2="30%"
                y2="40%"
                stroke="url(#lineGradient)"
                strokeWidth="1"
                className="animate-pulse"
              />
              <line
                x1="70%"
                y1="10%"
                x2="90%"
                y2="30%"
                stroke="url(#lineGradient)"
                strokeWidth="1"
                className="animate-pulse"
                style={{ animationDelay: "1s" }}
              />
              <line
                x1="20%"
                y1="80%"
                x2="40%"
                y2="60%"
                stroke="url(#lineGradient)"
                strokeWidth="1"
                className="animate-pulse"
                style={{ animationDelay: "2s" }}
              />
              <circle
                cx="15%"
                cy="30%"
                r="2"
                fill="rgb(59, 130, 246)"
                fillOpacity="0.1"
                className="animate-ping"
                style={{ animationDelay: "0.5s" }}
              />
              <circle
                cx="85%"
                cy="20%"
                r="1.5"
                fill="rgb(6, 182, 212)"
                fillOpacity="0.15"
                className="animate-ping"
                style={{ animationDelay: "1.5s" }}
              />
              <circle
                cx="25%"
                cy="70%"
                r="1"
                fill="rgb(59, 130, 246)"
                fillOpacity="0.2"
                className="animate-ping"
                style={{ animationDelay: "2.5s" }}
              />
            </svg>

            {/* Morphing abstract shapes */}
            <div className="absolute top-1/4 right-1/4 w-32 h-32 opacity-5 dark:opacity-10">
              <div
                className="w-full h-full bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full animate-pulse transform rotate-12"
                style={{ animationDuration: "4s" }}
              ></div>
            </div>
            <div className="absolute bottom-1/3 left-1/5 w-24 h-24 opacity-5 dark:opacity-10">
              <div
                className="w-full h-full bg-gradient-to-tr from-cyan-500 to-blue-500 transform rotate-45 animate-spin"
                style={{ animationDuration: "15s" }}
              ></div>
            </div>

            {/* Hexagonal pattern */}
            <div className="absolute top-1/2 left-1/3 transform -translate-x-1/2 -translate-y-1/2">
              <div className="relative">
                <div
                  className="w-16 h-16 border border-blue-200/10 dark:border-blue-700/20 transform rotate-30 animate-spin"
                  style={{
                    clipPath:
                      "polygon(30% 0%, 70% 0%, 100% 50%, 70% 100%, 30% 100%, 0% 50%)",
                    animationDuration: "25s",
                  }}
                ></div>
                <div
                  className="absolute inset-2 w-12 h-12 border border-cyan-200/15 dark:border-cyan-700/25 transform -rotate-30 animate-spin"
                  style={{
                    clipPath:
                      "polygon(30% 0%, 70% 0%, 100% 50%, 70% 100%, 30% 100%, 0% 50%)",
                    animationDuration: "20s",
                  }}
                ></div>
              </div>
            </div>

            {/* Floating triangular elements */}
            <div
              className="absolute top-20 right-1/4 w-0 h-0 border-l-4 border-r-4 border-b-8 border-l-transparent border-r-transparent border-b-blue-300/20 dark:border-b-blue-600/30 animate-bounce"
              style={{ animationDelay: "3s", animationDuration: "4s" }}
            ></div>
            <div
              className="absolute bottom-32 right-16 w-0 h-0 border-l-3 border-r-3 border-b-6 border-l-transparent border-r-transparent border-b-cyan-300/25 dark:border-b-cyan-600/35 animate-pulse"
              style={{ animationDelay: "1s" }}
            ></div>

            {/* Network nodes animation */}
            <div className="absolute top-1/3 left-1/2 transform -translate-x-1/2">
              <div className="relative">
                <div className="w-2 h-2 bg-blue-400/30 rounded-full animate-ping"></div>
                <div
                  className="absolute top-8 left-6 w-1 h-1 bg-cyan-400/40 rounded-full animate-ping"
                  style={{ animationDelay: "0.5s" }}
                ></div>
                <div
                  className="absolute -top-4 -left-8 w-1.5 h-1.5 bg-blue-500/35 rounded-full animate-ping"
                  style={{ animationDelay: "1s" }}
                ></div>
                <svg
                  className="absolute -inset-8 w-16 h-16"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <line
                    x1="8"
                    y1="8"
                    x2="14"
                    y2="16"
                    stroke="rgb(59, 130, 246)"
                    strokeOpacity="0.1"
                    strokeWidth="0.5"
                    className="animate-pulse"
                  />
                  <line
                    x1="8"
                    y1="8"
                    x2="0"
                    y2="4"
                    stroke="rgb(6, 182, 212)"
                    strokeOpacity="0.1"
                    strokeWidth="0.5"
                    className="animate-pulse"
                    style={{ animationDelay: "0.5s" }}
                  />
                </svg>
              </div>
            </div>

            {/* Enhanced gradient orbs with movement */}
            <div
              className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/10 to-cyan-400/10 rounded-full blur-3xl animate-pulse transform translate-x-4 translate-y-4"
              style={{ animation: "float 6s ease-in-out infinite" }}
            ></div>
            <div
              className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-tr from-cyan-400/10 to-blue-400/10 rounded-full blur-3xl animate-pulse transform -translate-x-4 -translate-y-4"
              style={{
                animation: "float 8s ease-in-out infinite reverse",
                animationDelay: "2s",
              }}
            ></div>
            <div
              className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-r from-blue-300/5 to-cyan-300/5 rounded-full blur-2xl animate-pulse"
              style={{
                animation: "float 10s ease-in-out infinite",
                animationDelay: "1s",
              }}
            ></div>

            {/* Existing floating particles enhanced */}
            <div className="absolute top-20 left-10 w-2 h-2 bg-blue-400/30 rounded-full animate-pulse"></div>
            <div
              className="absolute top-40 right-20 w-3 h-3 bg-cyan-400/20 rounded-full animate-bounce"
              style={{ animationDelay: "1s" }}
            ></div>
            <div
              className="absolute top-60 left-1/4 w-1 h-1 bg-blue-500/40 rounded-full animate-ping"
              style={{ animationDelay: "2s" }}
            ></div>
            <div
              className="absolute bottom-40 right-1/3 w-2 h-2 bg-cyan-300/30 rounded-full animate-pulse"
              style={{ animationDelay: "3s" }}
            ></div>
            <div
              className="absolute bottom-20 left-1/2 w-1 h-1 bg-blue-400/50 rounded-full animate-bounce"
              style={{ animationDelay: "4s" }}
            ></div>
          </div>

          <style jsx>{`
            @keyframes float {
              0%,
              100% {
                transform: translateY(0px) translateX(0px);
              }
              25% {
                transform: translateY(-10px) translateX(5px);
              }
              50% {
                transform: translateY(-5px) translateX(-5px);
              }
              75% {
                transform: translateY(-15px) translateX(3px);
              }
            }
          `}</style>

          {/* Header */}
          <header className="bg-white/90 dark:bg-gray-950/90 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-700/50 sticky top-0 z-50 shadow-lg">
            <div className="container mx-auto px-6 flex h-16 items-center justify-between">
              <div className="flex items-center space-x-3 cursor-pointer group">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-600 to-cyan-600 flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-110">
                  <Package className="h-5 w-5 text-white" />
                </div>
                <span className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-gray-100 dark:to-gray-300 bg-clip-text text-transparent">
                  ChainVanguard
                </span>
              </div>
              <nav className="flex items-center space-x-4">
                <ThemeToggle />
                <Link href="/login">
                  <Button
                    variant="ghost"
                    className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-white/50 dark:hover:bg-gray-800/50 cursor-pointer transition-all duration-300 backdrop-blur-md"
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
          <section className="py-24 text-center relative">
            <div className="container mx-auto px-6">
              <div className="transform transition-all duration-700 animate-fadeIn">
                <div className="mt-40" />
                <Badge
                  variant="secondary"
                  className="mb-6 bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-700 dark:from-blue-900/30 dark:to-cyan-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-700 shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  <Zap className="h-3 w-3 mr-1" />
                  Powered by Hyperledger Fabric & IPFS
                </Badge>

                <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight leading-tight bg-gradient-to-r from-gray-900 to-gray-700 dark:from-gray-100 dark:to-gray-300 bg-clip-text text-transparent mb-6">
                  Blockchain Supply Chain{" "}
                  <span className="text-blue-600 dark:text-blue-400">
                    Management
                  </span>
                </h1>

                <p className="text-lg text-gray-600 dark:text-gray-400 max-w-3xl mx-auto leading-relaxed mb-10">
                  Transparent, secure, and efficient supply chain management
                  powered by cutting-edge blockchain technology. Track products
                  from origin to consumer with complete transparency and
                  immutable records.
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
          <section className="py-24 relative">
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
                    title: "Military-Grade Security",
                    desc: "End-to-end encryption with immutable blockchain records. Zero-trust architecture ensures complete data integrity and protection against tampering.",
                    color:
                      "bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 text-green-600 dark:text-green-400",
                    metrics: "99.99% Security Rating",
                    badge: "SOC 2 Type II",
                  },
                  {
                    icon: Zap,
                    title: "Real-Time Intelligence",
                    desc: "AI-powered analytics with instant tracking across global supply chains. Machine learning algorithms predict and prevent disruptions before they occur.",
                    color:
                      "bg-gradient-to-br from-yellow-100 to-orange-100 dark:from-yellow-900/30 dark:to-orange-900/30 text-yellow-600 dark:text-yellow-400",
                    metrics: "<100ms Response Time",
                    badge: "AI-Powered",
                  },
                  {
                    icon: Database,
                    title: "Distributed Architecture",
                    desc: "IPFS-powered decentralized storage with automatic redundancy. Your data is distributed across multiple nodes for maximum availability and resilience.",
                    color:
                      "bg-gradient-to-br from-purple-100 to-violet-100 dark:from-purple-900/30 dark:to-violet-900/30 text-purple-600 dark:text-purple-400",
                    metrics: "99.9% Uptime SLA",
                    badge: "Decentralized",
                  },
                  {
                    icon: Users,
                    title: "Multi-Stakeholder Platform",
                    desc: "Unified ecosystem supporting suppliers, manufacturers, distributors, retailers, and consumers with role-based access controls and custom workflows.",
                    color:
                      "bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-900/30 dark:to-cyan-900/30 text-blue-600 dark:text-blue-400",
                    metrics: "Unlimited Users",
                    badge: "Enterprise Ready",
                  },
                  {
                    icon: Cpu,
                    title: "Smart Contract Automation",
                    desc: "Hyperledger Fabric smart contracts automate compliance, payments, and quality assurance. Reduce manual processes by up to 90%.",
                    color:
                      "bg-gradient-to-br from-orange-100 to-red-100 dark:from-orange-900/30 dark:to-red-900/30 text-orange-600 dark:text-orange-400",
                    metrics: "90% Process Automation",
                    badge: "Smart Contracts",
                  },
                  {
                    icon: BarChart3,
                    title: "Advanced Analytics Suite",
                    desc: "Comprehensive dashboards with predictive analytics, compliance reporting, and performance optimization insights for data-driven decisions.",
                    color:
                      "bg-gradient-to-br from-pink-100 to-rose-100 dark:from-pink-900/30 dark:to-rose-900/30 text-pink-600 dark:text-pink-400",
                    metrics: "Real-Time Insights",
                    badge: "Business Intelligence",
                  },
                ].map((feature, idx) => (
                  <Card
                    key={idx}
                    className="group border border-white/30 dark:border-gray-700/40 shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:scale-[1.02] bg-white/40 dark:bg-gray-900/40 backdrop-blur-xl cursor-pointer relative overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                    <CardHeader className="pb-4 relative z-10">
                      <div className="flex items-center justify-between mb-4">
                        <div
                          className={`h-16 w-16 rounded-2xl ${feature.color} flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg`}
                        >
                          <feature.icon className="h-8 w-8" />
                        </div>
                        <Badge
                          variant="secondary"
                          className="text-xs font-medium bg-gray-100 dark:bg-gray-800"
                        >
                          {feature.badge}
                        </Badge>
                      </div>
                      <CardTitle className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-3 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300">
                        {feature.title}
                      </CardTitle>
                      <CardDescription className="text-gray-600 dark:text-gray-400 leading-relaxed text-sm mb-4">
                        {feature.desc}
                      </CardDescription>
                      <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 dark:text-blue-400">
                        <TrendingUp className="h-3 w-3" />
                        {feature.metrics}
                      </div>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            </div>
          </section>

          {/* Statistics Section */}
          <section className="py-24 relative">
            <div className="container mx-auto px-6">
              <div className="grid md:grid-cols-4 gap-8">
                {[
                  {
                    number: "10M+",
                    label: "Products Tracked",
                    icon: Package,
                    desc: "Across global supply chains",
                  },
                  {
                    number: "500+",
                    label: "Enterprise Clients",
                    icon: Users,
                    desc: "Fortune 500 companies",
                  },
                  {
                    number: "99.99%",
                    label: "System Uptime",
                    icon: CheckCircle,
                    desc: "Enterprise SLA guarantee",
                  },
                  {
                    number: "24/7",
                    label: "Expert Support",
                    icon: Shield,
                    desc: "Global support coverage",
                  },
                ].map((stat, idx) => (
                  <Card
                    key={idx}
                    className="text-center border border-white/30 dark:border-gray-700/40 shadow-xl bg-white/40 dark:bg-gray-900/40 backdrop-blur-xl transform transition-all duration-500 hover:scale-[1.02] group cursor-pointer"
                  >
                    <CardContent className="p-8">
                      <div className="h-16 w-16 bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-900/30 dark:to-cyan-900/30 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                        <stat.icon className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-gray-100 dark:to-gray-300 bg-clip-text text-transparent mb-2">
                        {stat.number}
                      </div>
                      <div className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                        {stat.label}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {stat.desc}
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
                  Tailored interfaces for different stakeholders in the supply
                  chain ecosystem
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
                    className="group text-center border border-white/30 dark:border-gray-700/40 shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:scale-[1.02] bg-white/40 dark:bg-gray-900/40 backdrop-blur-xl cursor-pointer"
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
          <section className="py-24 relative">
            <div className="container mx-auto px-6">
              <Card className="border border-white/30 dark:border-gray-700/40 shadow-2xl bg-white/40 dark:bg-gray-900/40 backdrop-blur-xl relative overflow-hidden transition-all duration-500 transform hover:scale-[1.02]">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-cyan-500/10 to-blue-500/10 animate-pulse"></div>

                <CardContent className="p-16 text-center relative z-10">
                  <div className="h-20 w-20 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-2xl">
                    <Star className="h-10 w-10 text-white" />
                  </div>
                  <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-6">
                    <p className="text-balance">
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
                  technology, ensuring transparency, security, and efficiency
                  for all stakeholders.
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
                  © {new Date().getFullYear()} ChainVanguard. All rights
                  reserved.
                </p>
              </div>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}
