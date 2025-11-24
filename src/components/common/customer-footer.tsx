"use client";

import Link from "next/link";
import { EnvelopeIcon, MapPinIcon } from "@heroicons/react/24/outline";
import { useAuth } from "@/components/providers/auth-provider";

export default function Footer() {
  const { user } = useAuth();
  if (user?.role !== "customer") {
    return null;
  }

  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white dark:bg-gray-950 border-t border-gray-200 dark:border-gray-800">
      <div className="max-w-[1600px] mx-auto px-12 lg:px-16">
        {/* Main Footer Content */}
        <div className="py-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Company Info */}
          <div className="lg:col-span-1">
            <h3 className="text-2xl font-extralight text-gray-900 dark:text-white mb-4 tracking-tight">
              ChainVanguard
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed mb-6 font-light">
              Revolutionizing textile supply chain management through blockchain
              technology.
            </p>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                <MapPinIcon className="h-4 w-4 text-gray-400" />
                <span className="font-light">Karachi, Pakistan</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                <EnvelopeIcon className="h-4 w-4 text-gray-400" />
                <span className="font-light">chainvainguard@gmail.com</span>
              </div>
            </div>
          </div>

          {/* Shop */}
          <div>
            <h4 className="text-xs uppercase tracking-[0.2em] text-gray-900 dark:text-white font-medium mb-6">
              Shop
            </h4>
            <ul className="space-y-3">
              {[
                { name: "Browse Products", href: "/customer/browse" },
                { name: "Shopping Cart", href: "/customer/cart" },
                { name: "Checkout", href: "/customer/checkout" },
                { name: "Saved Items", href: "/customer/saved-items" },
              ].map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors font-light"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Account */}
          <div>
            <h4 className="text-xs uppercase tracking-[0.2em] text-gray-900 dark:text-white font-medium mb-6">
              Account
            </h4>
            <ul className="space-y-3">
              {[
                { name: "My Orders", href: "/customer/orders" },
                { name: "Returns", href: "/customer/returns" },
                { name: "Transactions", href: "/customer/transactions" },
                { name: "Wallet", href: "/customer/wallet" },
                { name: "Profile", href: "/customer/profile" },
                { name: "Notifications", href: "/customer/notifications" },
              ].map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors font-light"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company & Legal */}
          <div>
            <h4 className="text-xs uppercase tracking-[0.2em] text-gray-900 dark:text-white font-medium mb-6">
              Company
            </h4>
            <ul className="space-y-3 mb-8">
              {[
                { name: "About Us", href: "/about" },
                { name: "Contact", href: "/contact" },
                { name: "Careers", href: "/careers" },
                { name: "Blog", href: "/blog" },
              ].map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors font-light"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
            <h4 className="text-xs uppercase tracking-[0.2em] text-gray-900 dark:text-white font-medium mb-6">
              Legal
            </h4>
            <ul className="space-y-3">
              {[
                { name: "Privacy Policy", href: "/privacy" },
                { name: "Terms of Service", href: "/terms" },
                { name: "Cookie Policy", href: "/cookies" },
              ].map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors font-light"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="py-8 border-t border-gray-200 dark:border-gray-800">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">

            {/* Copyright */}
            <p className="text-xs text-gray-500 dark:text-gray-400 font-light">
              © {currentYear} ChainVanguard. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
