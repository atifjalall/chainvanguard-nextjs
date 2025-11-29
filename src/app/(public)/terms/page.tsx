"use client";

import Link from "next/link";
import { usePageTitle } from "@/hooks/use-page-title";
import { ChevronRightIcon } from "@heroicons/react/24/outline";

export default function TermsPage() {
  usePageTitle("Terms & Conditions");

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">

      {/* Main Content */}
      <section className="py-16">
        <div className="max-w-[1200px] mx-auto px-8 lg:px-12">
          {/* Header */}
          <div className="space-y-6 mb-12">
            <h1 className="text-5xl font-extralight text-gray-900 dark:text-white tracking-tight">
              Terms & Conditions
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Last updated: {new Date().toLocaleDateString()}
            </p>
          </div>

          {/* Content */}
          <div className="space-y-12 text-gray-700 dark:text-gray-300">
            {/* Section 1 */}
            <section className="space-y-4">
              <h2 className="text-2xl font-light text-gray-900 dark:text-white">
                1. Introduction
              </h2>
              <div className="space-y-3 text-sm leading-relaxed">
                <p>
                  Welcome to ChainVanguard, a blockchain-powered supply chain
                  management platform built on Hyperledger Fabric. These Terms
                  and Conditions govern your use of our platform and services.
                </p>
                <p>
                  By accessing or using ChainVanguard, you agree to be bound by
                  these Terms and Conditions. If you do not agree to these
                  terms, please do not use our platform.
                </p>
              </div>
            </section>

            {/* Section 2 */}
            <section className="space-y-4">
              <h2 className="text-2xl font-light text-gray-900 dark:text-white">
                2. User Accounts and Wallets
              </h2>
              <div className="space-y-3 text-sm leading-relaxed">
                <p>
                  <strong>2.1 Account Creation:</strong> To use ChainVanguard,
                  you must create an account and a blockchain wallet. You are
                  responsible for maintaining the confidentiality of your
                  account credentials and wallet recovery phrase.
                </p>
                <p>
                  <strong>2.2 Wallet Security:</strong> Your wallet is secured
                  on the Hyperledger Fabric network. You will receive a 12-word
                  recovery phrase during registration. This recovery phrase is
                  the ONLY way to restore access to your wallet if you forget
                  your password.
                </p>
                <p>
                  <strong>2.3 Recovery Phrase Responsibility:</strong> We
                  cannot recover your wallet or recovery phrase. You must store
                  it securely offline. Loss of your recovery phrase may result
                  in permanent loss of access to your wallet and funds.
                </p>
                <p>
                  <strong>2.4 Account Accuracy:</strong> You agree to provide
                  accurate, current, and complete information during
                  registration and to update such information as necessary.
                </p>
              </div>
            </section>

            {/* Section 3 */}
            <section className="space-y-4">
              <h2 className="text-2xl font-light text-gray-900 dark:text-white">
                3. User Roles
              </h2>
              <div className="space-y-3 text-sm leading-relaxed">
                <p>
                  ChainVanguard supports multiple user roles, each with
                  different permissions and responsibilities:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>
                    <strong>Customer:</strong> Browse and purchase products,
                    track orders, and manage returns
                  </li>
                  <li>
                    <strong>Vendor:</strong> List products, manage inventory,
                    fulfill orders, and handle customer requests
                  </li>
                  <li>
                    <strong>Supplier:</strong> Provide products to vendors,
                    manage supplier inventory, and track distribution
                  </li>
                  <li>
                    <strong>Blockchain Expert:</strong> System administration,
                    security oversight, and network management
                  </li>
                </ul>
                <p>
                  You must select the appropriate role during registration based
                  on your intended use of the platform.
                </p>
              </div>
            </section>

            {/* Section 4 */}
            <section className="space-y-4">
              <h2 className="text-2xl font-light text-gray-900 dark:text-white">
                4. Platform Token (CVT)
              </h2>
              <div className="space-y-3 text-sm leading-relaxed">
                <p>
                  <strong>4.1 ChainVanguard Token:</strong> The platform uses
                  CVT (ChainVanguard Token) as its native currency for all
                  transactions on the blockchain network.
                </p>
                <p>
                  <strong>4.2 Token Usage:</strong> CVT tokens are used for
                  purchasing products, paying transaction fees, and settling
                  payments within the supply chain ecosystem.
                </p>
                <p>
                  <strong>4.3 Token Transactions:</strong> All token
                  transactions are recorded on the Hyperledger Fabric blockchain
                  and are immutable once confirmed.
                </p>
                <p>
                  <strong>4.4 Wallet Balance:</strong> You are responsible for
                  maintaining sufficient wallet balance for your transactions.
                  Insufficient balance will result in transaction failure.
                </p>
              </div>
            </section>

            {/* Section 5 */}
            <section className="space-y-4">
              <h2 className="text-2xl font-light text-gray-900 dark:text-white">
                5. Transactions and Orders
              </h2>
              <div className="space-y-3 text-sm leading-relaxed">
                <p>
                  <strong>5.1 Order Placement:</strong> When you place an order,
                  you enter into a binding contract with the vendor. All orders
                  are processed through blockchain smart contracts.
                </p>
                <p>
                  <strong>5.2 Payment Processing:</strong> Payments are
                  processed via your wallet using CVT tokens. Once a payment is
                  confirmed on the blockchain, it cannot be reversed.
                </p>
                <p>
                  <strong>5.3 Order Fulfillment:</strong> Vendors are
                  responsible for fulfilling orders accurately and within the
                  specified timeframe. Customers can track order status through
                  the blockchain.
                </p>
                <p>
                  <strong>5.4 Returns and Refunds:</strong> Return and refund
                  policies are determined by individual vendors. All return
                  requests are tracked on the blockchain for transparency.
                </p>
              </div>
            </section>

            {/* Section 6 */}
            <section className="space-y-4">
              <h2 className="text-2xl font-light text-gray-900 dark:text-white">
                6. Product Listings and Authenticity
              </h2>
              <div className="space-y-3 text-sm leading-relaxed">
                <p>
                  <strong>6.1 Vendor Responsibility:</strong> Vendors are solely
                  responsible for the accuracy of their product listings,
                  including descriptions, images, pricing, and inventory levels.
                </p>
                <p>
                  <strong>6.2 Blockchain Tracking:</strong> All products are
                  tracked on the blockchain with unique identifiers and QR codes
                  to ensure authenticity and prevent counterfeiting.
                </p>
                <p>
                  <strong>6.3 Prohibited Items:</strong> Vendors must not list
                  illegal, counterfeit, or prohibited items on the platform.
                  Violation may result in account suspension.
                </p>
              </div>
            </section>

            {/* Section 7 */}
            <section className="space-y-4">
              <h2 className="text-2xl font-light text-gray-900 dark:text-white">
                7. Intellectual Property
              </h2>
              <div className="space-y-3 text-sm leading-relaxed">
                <p>
                  <strong>7.1 Platform Content:</strong> All content on
                  ChainVanguard, including but not limited to text, graphics,
                  logos, and software, is the property of ChainVanguard and is
                  protected by intellectual property laws.
                </p>
                <p>
                  <strong>7.2 User Content:</strong> You retain ownership of
                  content you upload to the platform (product images,
                  descriptions, etc.) but grant ChainVanguard a license to use
                  such content for platform operations.
                </p>
              </div>
            </section>

            {/* Section 8 */}
            <section className="space-y-4">
              <h2 className="text-2xl font-light text-gray-900 dark:text-white">
                8. Privacy and Data Protection
              </h2>
              <div className="space-y-3 text-sm leading-relaxed">
                <p>
                  Your privacy is important to us. Please review our{" "}
                  <Link
                    href="/privacy"
                    className="text-gray-900 dark:text-white hover:underline"
                  >
                    Privacy Policy
                  </Link>{" "}
                  to understand how we collect, use, and protect your personal
                  information.
                </p>
              </div>
            </section>

            {/* Section 9 */}
            <section className="space-y-4">
              <h2 className="text-2xl font-light text-gray-900 dark:text-white">
                9. Blockchain Technology
              </h2>
              <div className="space-y-3 text-sm leading-relaxed">
                <p>
                  <strong>9.1 Hyperledger Fabric:</strong> ChainVanguard is
                  built on Hyperledger Fabric, a permissioned blockchain
                  network. You acknowledge and accept the inherent
                  characteristics of blockchain technology.
                </p>
                <p>
                  <strong>9.2 Immutability:</strong> Transactions recorded on
                  the blockchain are immutable and cannot be altered or deleted.
                </p>
                <p>
                  <strong>9.3 Network Maintenance:</strong> We may perform
                  scheduled maintenance on the blockchain network. We will
                  provide advance notice when possible.
                </p>
              </div>
            </section>

            {/* Section 10 */}
            <section className="space-y-4">
              <h2 className="text-2xl font-light text-gray-900 dark:text-white">
                10. Prohibited Activities
              </h2>
              <div className="space-y-3 text-sm leading-relaxed">
                <p>You agree not to:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>
                    Use the platform for any illegal or unauthorized purpose
                  </li>
                  <li>
                    Attempt to gain unauthorized access to the platform or
                    blockchain network
                  </li>
                  <li>
                    Interfere with or disrupt the platform&apos;s operation or
                    security
                  </li>
                  <li>
                    Upload malicious code, viruses, or any harmful software
                  </li>
                  <li>
                    Impersonate another person or entity
                  </li>
                  <li>
                    Manipulate prices, product listings, or transaction records
                  </li>
                  <li>
                    Engage in fraudulent activities or money laundering
                  </li>
                </ul>
              </div>
            </section>

            {/* Section 11 */}
            <section className="space-y-4">
              <h2 className="text-2xl font-light text-gray-900 dark:text-white">
                11. Limitation of Liability
              </h2>
              <div className="space-y-3 text-sm leading-relaxed">
                <p>
                  <strong>11.1 Service Availability:</strong> We strive to
                  maintain platform availability but do not guarantee
                  uninterrupted service. We are not liable for any downtime or
                  service interruptions.
                </p>
                <p>
                  <strong>11.2 User Transactions:</strong> We are not a party to
                  transactions between users. We are not responsible for the
                  quality, safety, or legality of products listed on the
                  platform.
                </p>
                <p>
                  <strong>11.3 Wallet Security:</strong> We are not responsible
                  for loss of access to your wallet due to forgotten passwords
                  or lost recovery phrases.
                </p>
              </div>
            </section>

            {/* Section 12 */}
            <section className="space-y-4">
              <h2 className="text-2xl font-light text-gray-900 dark:text-white">
                12. Dispute Resolution
              </h2>
              <div className="space-y-3 text-sm leading-relaxed">
                <p>
                  <strong>12.1 User Disputes:</strong> ChainVanguard provides
                  tools for dispute resolution between users. We encourage users
                  to resolve disputes amicably through our platform&apos;s dispute
                  resolution system.
                </p>
                <p>
                  <strong>12.2 Arbitration:</strong> Any disputes with
                  ChainVanguard will be resolved through binding arbitration in
                  accordance with the laws of Pakistan.
                </p>
              </div>
            </section>

            {/* Section 13 */}
            <section className="space-y-4">
              <h2 className="text-2xl font-light text-gray-900 dark:text-white">
                13. Termination
              </h2>
              <div className="space-y-3 text-sm leading-relaxed">
                <p>
                  <strong>13.1 Account Termination:</strong> We reserve the
                  right to suspend or terminate your account if you violate
                  these Terms and Conditions or engage in prohibited activities.
                </p>
                <p>
                  <strong>13.2 User Termination:</strong> You may terminate your
                  account at any time. However, blockchain transactions already
                  recorded cannot be reversed.
                </p>
              </div>
            </section>

            {/* Section 14 */}
            <section className="space-y-4">
              <h2 className="text-2xl font-light text-gray-900 dark:text-white">
                14. Changes to Terms
              </h2>
              <div className="space-y-3 text-sm leading-relaxed">
                <p>
                  We reserve the right to modify these Terms and Conditions at
                  any time. We will notify users of significant changes via
                  email or platform notifications. Continued use of the platform
                  after changes constitutes acceptance of the modified terms.
                </p>
              </div>
            </section>

            {/* Section 15 */}
            <section className="space-y-4">
              <h2 className="text-2xl font-light text-gray-900 dark:text-white">
                15. Governing Law
              </h2>
              <div className="space-y-3 text-sm leading-relaxed">
                <p>
                  These Terms and Conditions are governed by the laws of
                  Pakistan. Any legal action or proceeding related to your use
                  of ChainVanguard shall be brought exclusively in the courts of
                  Pakistan.
                </p>
              </div>
            </section>

            {/* Section 16 */}
            <section className="space-y-4">
              <h2 className="text-2xl font-light text-gray-900 dark:text-white">
                16. Contact Information
              </h2>
              <div className="space-y-3 text-sm leading-relaxed">
                <p>
                  If you have any questions about these Terms and Conditions,
                  please contact us at:
                </p>
                <div className="pl-4">
                  <p>Support: chainvainguard@gmail.com</p>
                </div>
              </div>
            </section>
          </div>

          {/* Footer Navigation */}
          <div className="mt-16 pt-8 border-t border-gray-200 dark:border-gray-800">
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
              <Link
                href="/privacy"
                className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                Read our Privacy Policy →
              </Link>
              <Link
                href="/"
                className="border border-black dark:border-white text-black dark:text-white px-8 h-11 flex items-center uppercase tracking-[0.2em] text-[10px] font-medium hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
              >
                Back to Home
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
