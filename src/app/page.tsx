"use client";

import Link from "next/link";
import Image from "next/image";
import {
  ShieldCheckIcon,
  BoltIcon,
  CircleStackIcon,
  UsersIcon,
  ChartBarIcon,
  CpuChipIcon,
  BuildingStorefrontIcon,
  CubeIcon,
  EyeIcon,
  TruckIcon,
  LockClosedIcon,
  InboxStackIcon,
  WalletIcon,
  ChartPieIcon,
  BuildingOffice2Icon,
  BriefcaseIcon,
} from "@heroicons/react/24/outline";
import { motion } from "framer-motion";
import { ChartBar } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      {/* Header */}
      <header className="fixed top-0 w-full z-50 bg-white/80 dark:bg-gray-950/80 backdrop-blur-sm">
        <div className="max-w-[1600px] mx-auto px-12 lg:px-16 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <span className="text-lg font-light text-gray-900 dark:text-white tracking-wide">
              ChainVanguard
            </span>
          </Link>

          {/* Navigation */}
          <nav className="flex items-center gap-4" aria-label="Main navigation">
            {/* Buttons removed from navbar — Login and Get Started are present in the page sections */}
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <motion.section
        className="relative min-h-screen flex items-center justify-center pt-16"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
      >
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-b from-white via-white to-gray-50 dark:from-gray-950 dark:via-gray-950 dark:to-gray-900" />
        </div>

        <div className="relative z-10 max-w-[1600px] mx-auto px-12 lg:px-16 text-center">
          <div className="space-y-12">
            {/* Badge */}
            <div className="inline-block">
              <div className="h-px w-16 bg-gray-300 dark:bg-gray-700 mb-4 mx-auto" />
              <p className="text-[10px] uppercase tracking-[0.3em] text-gray-500 dark:text-gray-400">
                Powered by Hyperledger Fabric
              </p>
            </div>

            {/* Main Headline */}
            <h1 className="text-7xl lg:text-8xl font-extralight text-gray-900 dark:text-white leading-[0.95] tracking-tight">
              Supply Chain
              <span className="block font-light mt-4">Reimagined</span>
            </h1>

            {/* Subheadline */}
            <p className="text-sm text-gray-600 dark:text-gray-400 max-w-2xl mx-auto font-light leading-relaxed">
              Transparent, secure, and efficient supply chain management powered
              by blockchain technology. Track products from origin to consumer
              with complete transparency.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row justify-center gap-4 pt-8">
              <Link href="/register">
                <button
                  type="button"
                  className="bg-black dark:bg-white text-white dark:text-black px-12 h-12 uppercase tracking-[0.2em] text-[10px] font-medium hover:bg-gray-900 dark:hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  Start Your Journey
                </button>
              </Link>
              <Link href="/login">
                <button
                  type="button"
                  className="border border-black dark:border-white text-black dark:text-white px-12 h-12 uppercase tracking-[0.2em] text-[10px] font-medium hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors cursor-pointer"
                >
                  Login
                </button>
              </Link>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3">
          <p className="text-[10px] uppercase tracking-[0.3em] text-gray-400 dark:text-gray-600">
            Scroll
          </p>
          <div className="w-px h-16 bg-gradient-to-b from-gray-300 to-transparent dark:from-gray-700 dark:to-transparent" />
        </div>
      </motion.section>

      {/* Features Section */}
      <motion.section
        className="py-32 border-t border-gray-200 dark:border-gray-800"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
      >
        <div className="max-w-[1600px] mx-auto px-12 lg:px-16">
          <div className="mb-20 space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-px w-16 bg-gray-300 dark:bg-gray-700" />
              <p className="text-[10px] uppercase tracking-[0.3em] text-gray-500 dark:text-gray-400">
                Platform Features
              </p>
            </div>
            <h2 className="text-5xl font-extralight text-gray-900 dark:text-white tracking-tight">
              Powerful Features
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-px bg-gray-200 dark:bg-gray-800">
            {[
              {
                icon: ShieldCheckIcon,
                title: "Blockchain-Verified Authenticity",
                desc: "Every product and transaction recorded on Hyperledger Fabric with cryptographic proof and QR code verification.",
              },
              {
                icon: InboxStackIcon,
                title: "Smart Vendor Request System",
                desc: "Automated vendor purchase requests with approval workflows, payment tracking, and order fulfillment updates.",
              },
              {
                icon: CircleStackIcon,
                title: "IPFS Decentralized Storage",
                desc: "Product images and documents stored on IPFS with Cloudinary backup for permanent, tamper-proof storage.",
              },
              {
                icon: WalletIcon,
                title: "Multi-Role Wallet System",
                desc: "Dedicated blockchain wallets for suppliers, vendors, customers, and experts with role-based access controls.",
              },
              {
                icon: ChartBarIcon,
                title: "Real-Time Inventory Tracking",
                desc: "Track raw materials and finished products with batch management, quality checks, and complete movement history.",
              },
              {
                icon: ChartPieIcon,
                title: "Comprehensive Analytics",
                desc: "Industry dashboards, business analytics, order tracking, and blockchain audit trails for all stakeholders.",
              },
            ].map((feature, i) => (
              <div
                key={i}
                className="bg-white dark:bg-gray-950 p-12 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors group"
              >
                <feature.icon
                  className="h-7 w-7 text-gray-900 dark:text-white opacity-70 group-hover:opacity-100 transition-opacity mb-8"
                  strokeWidth={1.2}
                />
                <h3 className="text-sm font-normal text-gray-900 dark:text-white mb-3 tracking-wide">
                  {feature.title}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 font-light leading-relaxed">
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Roles Section */}
      <motion.section
        className="py-32 bg-gray-50 dark:bg-gray-900"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
      >
        <div className="max-w-[1600px] mx-auto px-12 lg:px-16">
          <div className="mb-20 space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-px w-16 bg-gray-300 dark:bg-gray-700" />
              <p className="text-[10px] uppercase tracking-[0.3em] text-gray-500 dark:text-gray-400">
                For Everyone
              </p>
            </div>
            <h2 className="text-5xl font-extralight text-gray-900 dark:text-white tracking-tight">
              Choose Your Role
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                title: "Supplier/Ministry",
                desc: "Manage raw material inventory, create vendor purchase requests, monitor industry metrics, and oversee vendor performance.",
                icon: BuildingOffice2Icon,
              },
              {
                title: "Vendor",
                desc: "List finished products, manage inventory, process customer orders, handle returns and track business analytics.",
                icon: BuildingStorefrontIcon,
              },
              {
                title: "Customer",
                desc: "Browse products, manage cart and wishlist, place orders, track deliveries, and submit reviews.",
                icon: UsersIcon,
              },
              {
                title: "Blockchain Expert",
                desc: "Monitor blockchain transactions, view immutable records, audit system integrity, and analyze ledger data.",
                icon: CpuChipIcon,
              },
            ].map((role, i) => (
              <div
                key={i}
                className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 p-8 hover:border-black dark:hover:border-white transition-all group"
              >
                <role.icon
                  className="h-7 w-7 text-gray-900 dark:text-white mb-8 opacity-70 group-hover:opacity-100 transition-opacity"
                  strokeWidth={1.2}
                />
                <h3 className="text-sm font-normal text-gray-900 dark:text-white mb-3 tracking-wide">
                  {role.title}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 font-light leading-relaxed">
                  {role.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Why Choose Us */}
      <motion.section
        className="py-32 border-y border-gray-200 dark:border-gray-800"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
      >
        <div className="max-w-[1600px] mx-auto px-12 lg:px-16">
          <div className="grid lg:grid-cols-2 gap-24 items-center">
            <div>
              <div className="mb-12">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-px w-16 bg-gray-300 dark:bg-gray-700" />
                  <p className="text-[10px] uppercase tracking-[0.3em] text-gray-500 dark:text-gray-400">
                    Why Choose Us
                  </p>
                </div>
                <h2 className="text-4xl font-extralight text-gray-900 dark:text-white tracking-tight">
                  Built for the Future
                </h2>
              </div>

              <div className="space-y-8">
                {[
                  {
                    icon: CubeIcon,
                    title: "QR Code Verification",
                    desc: "Scan and verify product authenticity with blockchain-backed QR codes on every item",
                  },
                  {
                    icon: CircleStackIcon,
                    title: "IPFS + Cloudinary Storage",
                    desc: "Decentralized storage for images and documents with automatic cloud backup",
                  },
                  {
                    icon: TruckIcon,
                    title: "Vendor Request Workflow",
                    desc: "Streamlined purchase requests between suppliers and vendors with approval tracking",
                  },
                  {
                    icon: LockClosedIcon,
                    title: "Role-Based Wallets",
                    desc: "Secure blockchain wallets for each role with cryptographic authentication",
                  },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-6">
                    <item.icon
                      className="h-6 w-6 text-gray-900 dark:text-white flex-shrink-0 mt-1 opacity-70"
                      strokeWidth={1.2}
                    />
                    <div>
                      <h3 className="text-sm font-normal text-gray-900 dark:text-white mb-2 tracking-wide">
                        {item.title}
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 font-light leading-relaxed">
                        {item.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* constrained gif size */}
            <div className="relative w-full max-w-[620px] mx-auto aspect-square">
              <div className="absolute inset-8 bg-gray-100 dark:bg-gray-900 flex items-center justify-center overflow-hidden">
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
        className="py-32 bg-gray-50 dark:bg-gray-900"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
      >
        <div className="max-w-3xl mx-auto px-12 lg:px-16 text-center">
          <div className="space-y-12">
            <div className="space-y-6">
              <h2 className="text-5xl font-extralight text-gray-900 dark:text-white tracking-tight leading-tight">
                Ready to Transform Your Supply Chain?
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 font-light leading-relaxed max-w-2xl mx-auto">
                Join thousands of businesses using ChainVanguard to create
                transparent, secure, and efficient supply chain operations
              </p>
            </div>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link href="/register">
                <button
                  type="button"
                  className="bg-black dark:bg-white text-white dark:text-black px-12 h-12 uppercase tracking-[0.2em] text-[10px] font-medium hover:bg-gray-900 dark:hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  Get Started Now
                </button>
              </Link>
              <Link href="/login">
                <button
                  type="button"
                  className="border border-black dark:border-white text-black dark:text-white px-12 h-12 uppercase tracking-[0.2em] text-[10px] font-medium hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors cursor-pointer"
                >
                  Login
                </button>
              </Link>
            </div>
          </div>
        </div>
      </motion.section>

      {/* Footer */}
      <footer className="border-t border-gray-200 dark:border-gray-800 py-16">
        <div className="max-w-[1600px] mx-auto px-12 lg:px-16">
          <div className="flex flex-col items-center space-y-8">
            <Link href="/" className="flex items-center gap-3 group">
              <span className="text-lg font-light text-gray-900 dark:text-white tracking-wide">
                ChainVanguard
              </span>
            </Link>
            <p className="text-xs text-gray-500 dark:text-gray-400 text-center max-w-md font-light leading-relaxed">
              Revolutionizing supply chain management through blockchain
              technology, ensuring transparency and efficiency for all
              stakeholders
            </p>
            <div className="flex gap-4">
              {["Next.js", "TypeScript", "Hyperledger Fabric"].map((tech) => (
                <span
                  key={tech}
                  className="text-[10px] uppercase tracking-[0.2em] text-gray-400 dark:text-gray-600"
                >
                  {tech}
                </span>
              ))}
            </div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-gray-400 dark:text-gray-600 pt-8 border-t border-gray-200 dark:border-gray-800 w-full text-center">
              © {new Date().getFullYear()} ChainVanguard. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
