"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/_ui/button";
import {
  CubeIcon,
  ShieldCheckIcon,
  BoltIcon,
  EyeIcon,
  CircleStackIcon,
  UsersIcon,
  CheckCircleIcon,
  ChartBarIcon,
  CpuChipIcon,
  BuildingStorefrontIcon,
  ArrowRightIcon,
} from "@heroicons/react/24/outline";
import { motion } from "framer-motion";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      {/* Header */}
      <header className="fixed top-0 w-full z-50 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950">
        <div className="w-full px-6 h-16 flex items-center">
          {/* Logo on the far left */}
          <Link
            href="/"
            className="flex items-center space-x-3 group cursor-pointer"
          >
            <span className="text-xl font-light text-gray-900 dark:text-white">
              ChainVanguard
            </span>
          </Link>

          {/* Push navbar to the right */}
          <nav className="flex items-center gap-2 ml-auto">
            <Link href="/login">
              <Button
                variant="outline"
                size="sm"
                className="border-gray-900 dark:border-white text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-900 rounded-none cursor-pointer text-xs h-9 px-4"
              >
                Login
              </Button>
            </Link>
            <Link href="/register">
              <Button
                size="sm"
                className="bg-gray-900 hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-100 text-white dark:text-gray-900 rounded-none cursor-pointer text-xs h-9 px-4"
              >
                Get Started
              </Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <motion.section
        className="relative min-h-screen flex items-center justify-center pt-16"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true }}
      >
        <div className="max-w-5xl mx-auto px-6 text-center">
          <div className="space-y-8">
            {/* Badge */}
            <div className="inline-block">
              <div className="h-6 px-3 border border-gray-400 dark:border-gray-400 bg-transparent text-gray-600 dark:text-gray-600 flex items-center text-xs">
                Powered by Hyperledger Fabric & IPFS
              </div>
            </div>

            {/* Main Headline */}
            <h1 className="text-5xl md:text-6xl font-light text-gray-900 dark:text-white leading-none">
              Supply Chain
              <span className="block mt-2 font-normal">Reimagined</span>
            </h1>

            {/* Subheadline */}
            <p className="text-sm text-gray-600 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed">
              Transparent, secure, and efficient supply chain management powered
              by cutting-edge blockchain technology. Track products from origin
              to consumer with complete transparency and immutable records.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row justify-center gap-3 pt-8">
              <Link href="/register">
                <Button
                  size="lg"
                  className="bg-gray-900 hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-100 text-white dark:text-gray-900 h-9 px-8 rounded-none group text-xs cursor-pointer"
                >
                  Start Your Journey
                  <ArrowRightIcon className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/login">
                <Button
                  variant="outline"
                  size="lg"
                  className="h-9 px-8 border-gray-900 dark:border-white text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-900 rounded-none text-xs cursor-pointer"
                >
                  Login
                </Button>
              </Link>
            </div>

            {/* Stats */}
            <div className="pt-20 grid grid-cols-3 gap-8 max-w-2xl mx-auto border-t border-gray-200 dark:border-gray-800 mt-20">
              {[
                { value: "10M+", label: "Products Tracked" },
                { value: "500+", label: "Enterprise Clients" },
                { value: "99.99%", label: "System Uptime" },
              ].map((stat, i) => (
                <div key={i} className="text-center">
                  <div className="text-2xl font-light text-gray-900 dark:text-white mb-1">
                    {stat.value}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.section>

      {/* Features Section */}
      <motion.section
        className="py-24 border-t border-gray-200 dark:border-gray-800"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        viewport={{ once: true }}
      >
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-2xl font-light text-gray-900 dark:text-white mb-2">
              Powerful Features
            </h2>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Everything you need for modern, secure supply chain management
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-px bg-gray-200 dark:bg-gray-800 border border-gray-200 dark:border-gray-800">
            {[
              {
                icon: ShieldCheckIcon,
                title: "Military-Grade Security",
                desc: "End-to-end encryption with immutable blockchain records. Zero-trust architecture ensures complete data integrity and protection against tampering.",
                metric: "99.99% Security Rating",
              },
              {
                icon: BoltIcon,
                title: "Real-Time Intelligence",
                desc: "AI-powered analytics with instant tracking across global supply chains. Machine learning algorithms predict and prevent disruptions before they occur.",
                metric: "<100ms Response Time",
              },
              {
                icon: CircleStackIcon,
                title: "Distributed Architecture",
                desc: "IPFS-powered decentralized storage with automatic redundancy. Your data is distributed across multiple nodes for maximum availability and resilience.",
                metric: "99.9% Uptime SLA",
              },
              {
                icon: UsersIcon,
                title: "Multi-Stakeholder Platform",
                desc: "Unified ecosystem supporting suppliers, manufacturers, distributors, retailers, and consumers with role-based access controls and custom workflows.",
                metric: "Unlimited Users",
              },
              {
                icon: CpuChipIcon,
                title: "Smart Contract Automation",
                desc: "Hyperledger Fabric smart contracts automate compliance, payments, and quality assurance. Reduce manual processes by up to 90%.",
                metric: "90% Process Automation",
              },
              {
                icon: ChartBarIcon,
                title: "Advanced Analytics Suite",
                desc: "Comprehensive dashboards with predictive analytics, compliance reporting, and performance optimization insights for data-driven decisions.",
                metric: "Real-Time Insights",
              },
            ].map((feature, i) => (
              <div
                key={i}
                className="bg-white dark:bg-gray-950 p-8 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors cursor-pointer"
              >
                <feature.icon className="h-6 w-6 text-gray-900 dark:text-white mb-4" />
                <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed mb-3">
                  {feature.desc}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500">
                  {feature.metric}
                </p>
              </div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Statistics */}
      <motion.section
        className="py-24 border-y border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        viewport={{ once: true }}
      >
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-12">
            {[
              {
                icon: CubeIcon,
                value: "10M+",
                label: "Products Tracked",
                desc: "Across global supply chains",
              },
              {
                icon: UsersIcon,
                value: "500+",
                label: "Enterprise Clients",
                desc: "Fortune 500 companies",
              },
              {
                icon: CheckCircleIcon,
                value: "99.99%",
                label: "System Uptime",
                desc: "Enterprise SLA guarantee",
              },
              {
                icon: ShieldCheckIcon,
                value: "24/7",
                label: "Expert Support",
                desc: "Global support coverage",
              },
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <stat.icon className="h-8 w-8 text-gray-900 dark:text-white mx-auto mb-4" />
                <div className="text-2xl font-light text-gray-900 dark:text-white mb-1">
                  {stat.value}
                </div>
                <div className="text-xs font-medium text-gray-900 dark:text-white mb-1">
                  {stat.label}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  {stat.desc}
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Roles Section */}
      <motion.section
        className="py-24"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        viewport={{ once: true }}
      >
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-2xl font-light text-gray-900 dark:text-white mb-2">
              Choose Your Role
            </h2>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Tailored interfaces for different stakeholders in the supply chain
              ecosystem
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                title: "Supplier/Ministry",
                desc: "Manage inventory, buy from vendors, sell to vendors, view full product history and compliance",
                access: "Read & Write",
                icon: BuildingStorefrontIcon,
              },
              {
                title: "Vendor",
                desc: "Add products, sell to customers, view transaction history and comprehensive analytics",
                access: "Write Access",
                icon: CubeIcon,
              },
              {
                title: "Customer",
                desc: "Browse products, add to cart, purchase items, track orders with real-time updates",
                access: "Read Only",
                icon: EyeIcon,
              },
              {
                title: "Blockchain Expert",
                desc: "View all transactions, manage consensus, security settings, and fault tolerance systems",
                access: "Admin Access",
                icon: ChartBarIcon,
              },
            ].map((role, i) => (
              <div
                key={i}
                className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 p-6 hover:border-gray-900 dark:hover:border-white transition-colors cursor-pointer"
              >
                <div className="w-10 h-10 flex items-center justify-center">
                  <role.icon className="h-6 w-6 text-gray-900 dark:text-white" />
                </div>
                <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                  {role.title}
                </h3>
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-4 leading-relaxed">
                  {role.desc}
                </p>
                <div className="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-800 pt-3">
                  {role.access}
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Why Choose Us */}
      <motion.section
        className="py-32"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        viewport={{ once: true }}
      >
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-24 items-center">
            <div>
              <h2 className="text-3xl font-light text-gray-900 dark:text-white mb-8">
                Why ChainVanguard?
              </h2>
              <div className="space-y-6">
                {[
                  {
                    title: "Immutable Records",
                    desc: "Blockchain ensures data integrity and prevents tampering",
                  },
                  {
                    title: "Real-Time Tracking",
                    desc: "Monitor every step of your supply chain instantly",
                  },
                  {
                    title: "Enterprise Security",
                    desc: "Zero-trust architecture with role-based access controls",
                  },
                  {
                    title: "Seamless Integration",
                    desc: "Works with your existing systems and workflows",
                  },
                  {
                    title: "Expert Support",
                    desc: "24/7 dedicated account management and technical assistance",
                  },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-4">
                    <CheckCircleIcon className="h-6 w-6 text-gray-900 dark:text-white flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                        {item.title}
                      </h3>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        {item.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative w-3/4 aspect-square mx-auto">
              <div className="absolute inset-0 border border-gray-200 dark:border-gray-800" />
              <div className="absolute inset-4 bg-gray-100 dark:bg-gray-900 flex items-center justify-center overflow-hidden">
                <Image
                  src="/box.gif"
                  alt="ChainVanguard Animation"
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      {/* CTA Section */}
      <motion.section
        className="py-24 border-t border-gray-200 dark:border-gray-800"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        viewport={{ once: true }}
      >
        <div className="max-w-3xl mx-auto px-6 text-center">
          <div className="space-y-6">
            <h2 className="text-3xl font-light text-gray-900 dark:text-white">
              Ready to Transform Your Supply Chain?
            </h2>
            <p className="text-xs text-gray-600 dark:text-gray-400 max-w-lg mx-auto">
              Join thousands of businesses already using ChainVanguard to create
              transparent, secure, and efficient supply chain operations.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-3 pt-4">
              <Link href="/register">
                <Button
                  size="lg"
                  className="bg-gray-900 hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-100 text-white dark:text-gray-900 h-9 px-8 rounded-none group text-xs cursor-pointer"
                >
                  Get Started Now
                  <ArrowRightIcon className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/login">
                <Button
                  variant="outline"
                  size="lg"
                  className="h-9 px-8 border-gray-900 dark:border-white text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-900 rounded-none text-xs cursor-pointer"
                >
                  View Demo
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </motion.section>

      {/* Footer */}
      <footer className="border-t border-gray-200 dark:border-gray-800 py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col items-center space-y-4">
            <Link
              href="/"
              className="flex items-center space-x-3 group cursor-pointer"
            >
              <CubeIcon className="h-6 w-6 text-gray-900 dark:text-white" />
              <span className="text-xl font-light text-gray-900 dark:text-white">
                ChainVanguard
              </span>
            </Link>
            <p className="text-xs text-gray-500 dark:text-gray-400 text-center max-w-md">
              Revolutionizing supply chain management through blockchain
              technology, ensuring transparency, security, and efficiency for
              all stakeholders.
            </p>
            <div className="flex gap-4">
              <span className="h-6 px-3 border border-gray-400 dark:border-gray-400 bg-transparent text-gray-600 dark:text-gray-600 flex items-center text-xs">
                Next.js
              </span>
              <span className="h-6 px-3 border border-gray-400 dark:border-gray-400 bg-transparent text-gray-600 dark:text-gray-600 flex items-center text-xs">
                TypeScript
              </span>
              <span className="h-6 px-3 border border-gray-400 dark:border-gray-400 bg-transparent text-gray-600 dark:text-gray-600 flex items-center text-xs">
                Hyperledger Fabric
              </span>
            </div>
            <p className="text-xs text-gray-400 dark:text-gray-600">
              © {new Date().getFullYear()} ChainVanguard. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
