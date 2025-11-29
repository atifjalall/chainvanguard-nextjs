"use client";

import Link from "next/link";
import { usePageTitle } from "@/hooks/use-page-title";
import { ChevronRightIcon } from "@heroicons/react/24/outline";

export default function PrivacyPage() {
  usePageTitle("Privacy Policy");

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">

      {/* Main Content */}
      <section className="py-16">
        <div className="max-w-[1200px] mx-auto px-8 lg:px-12">
          {/* Header */}
          <div className="space-y-6 mb-12">
            <h1 className="text-5xl font-extralight text-gray-900 dark:text-white tracking-tight">
              Privacy Policy
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
                  At ChainVanguard, we are committed to protecting your privacy
                  and ensuring the security of your personal information. This
                  Privacy Policy explains how we collect, use, store, and
                  protect your data when you use our blockchain-powered supply
                  chain management platform.
                </p>
                <p>
                  By using ChainVanguard, you consent to the data practices
                  described in this Privacy Policy. If you do not agree with
                  this policy, please do not use our platform.
                </p>
              </div>
            </section>

            {/* Section 2 */}
            <section className="space-y-4">
              <h2 className="text-2xl font-light text-gray-900 dark:text-white">
                2. Information We Collect
              </h2>
              <div className="space-y-3 text-sm leading-relaxed">
                <p>
                  <strong>2.1 Personal Information:</strong> When you create an
                  account, we collect personal information including:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Full name</li>
                  <li>Email address</li>
                  <li>Phone number</li>
                  <li>Physical address (street, city, state, postal code)</li>
                  <li>Country of residence</li>
                </ul>
                <p>
                  <strong>2.2 Business Information:</strong> For vendors,
                  suppliers, and blockchain experts, we additionally collect:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Company name</li>
                  <li>Business address</li>
                  <li>Business type</li>
                  <li>Registration number</li>
                  <li>Tax identification number (if provided)</li>
                </ul>
                <p>
                  <strong>2.3 Blockchain Wallet Information:</strong> We collect
                  and store:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Wallet name</li>
                  <li>Wallet address (public blockchain identifier)</li>
                  <li>
                    Encrypted wallet credentials (stored securely on
                    Hyperledger Fabric)
                  </li>
                  <li>Transaction history</li>
                </ul>
                <p className="text-xs bg-gray-100 dark:bg-gray-900 p-3 border-l-2 border-gray-400 dark:border-gray-600">
                  <strong>Important:</strong> Your 12-word recovery phrase is
                  NOT stored on our servers. You are solely responsible for
                  securing your recovery phrase.
                </p>
                <p>
                  <strong>2.4 Transaction Data:</strong> All transactions on the
                  platform are recorded on the Hyperledger Fabric blockchain,
                  including:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Order details (products, quantities, prices)</li>
                  <li>Payment information (wallet addresses, amounts)</li>
                  <li>Shipping addresses</li>
                  <li>Order status and tracking information</li>
                  <li>Return and refund requests</li>
                </ul>
                <p>
                  <strong>2.5 Technical Information:</strong> We automatically
                  collect:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>IP address</li>
                  <li>Browser type and version</li>
                  <li>Device information</li>
                  <li>Operating system</li>
                  <li>Access times and dates</li>
                  <li>Pages viewed and navigation patterns</li>
                </ul>
              </div>
            </section>

            {/* Section 3 */}
            <section className="space-y-4">
              <h2 className="text-2xl font-light text-gray-900 dark:text-white">
                3. How We Use Your Information
              </h2>
              <div className="space-y-3 text-sm leading-relaxed">
                <p>We use your information for the following purposes:</p>
                <p>
                  <strong>3.1 Platform Operations:</strong>
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Create and manage your user account</li>
                  <li>Process transactions and payments</li>
                  <li>Fulfill orders and manage shipments</li>
                  <li>Provide customer support</li>
                  <li>Verify your identity and prevent fraud</li>
                </ul>
                <p>
                  <strong>3.2 Blockchain Operations:</strong>
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Record transactions on the Hyperledger Fabric network</li>
                  <li>Maintain wallet balances and transaction history</li>
                  <li>Track product authenticity and supply chain movement</li>
                  <li>Generate QR codes for product verification</li>
                </ul>
                <p>
                  <strong>3.3 Communications:</strong>
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Send order confirmations and shipping notifications</li>
                  <li>Provide transaction receipts and invoices</li>
                  <li>Send email verification and OTP codes</li>
                  <li>Notify you of platform updates and changes</li>
                  <li>Respond to your inquiries and support requests</li>
                </ul>
                <p>
                  <strong>3.4 Platform Improvement:</strong>
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Analyze platform usage and performance</li>
                  <li>Improve user experience and features</li>
                  <li>Detect and prevent technical issues</li>
                  <li>Conduct security monitoring and audits</li>
                </ul>
                <p>
                  <strong>3.5 Legal Compliance:</strong>
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Comply with legal obligations and regulations</li>
                  <li>Enforce our Terms and Conditions</li>
                  <li>Protect our rights and property</li>
                  <li>Investigate and prevent fraudulent activities</li>
                </ul>
              </div>
            </section>

            {/* Section 4 */}
            <section className="space-y-4">
              <h2 className="text-2xl font-light text-gray-900 dark:text-white">
                4. Data Storage and Security
              </h2>
              <div className="space-y-3 text-sm leading-relaxed">
                <p>
                  <strong>4.1 Storage Location:</strong> Your personal
                  information is stored in secure databases in Pakistan. Your
                  blockchain data is distributed across the Hyperledger Fabric
                  network nodes.
                </p>
                <p>
                  <strong>4.2 Blockchain Immutability:</strong> Transaction data
                  recorded on the blockchain is immutable and cannot be altered
                  or deleted. This ensures transparency and prevents tampering
                  but also means blockchain data is permanent.
                </p>
                <p>
                  <strong>4.3 Security Measures:</strong> We implement
                  industry-standard security measures including:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Encryption of sensitive data in transit and at rest</li>
                  <li>Secure authentication and authorization protocols</li>
                  <li>Regular security audits and vulnerability assessments</li>
                  <li>Access controls and user permission management</li>
                  <li>Blockchain-level security through Hyperledger Fabric</li>
                </ul>
                <p>
                  <strong>4.4 Data Retention:</strong> We retain your personal
                  information for as long as your account is active or as needed
                  to provide services. Blockchain transaction data is retained
                  permanently due to the immutable nature of blockchain
                  technology.
                </p>
              </div>
            </section>

            {/* Section 5 */}
            <section className="space-y-4">
              <h2 className="text-2xl font-light text-gray-900 dark:text-white">
                5. Information Sharing and Disclosure
              </h2>
              <div className="space-y-3 text-sm leading-relaxed">
                <p>
                  <strong>5.1 With Other Users:</strong> Certain information is
                  shared with other platform users as necessary for
                  transactions:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>
                    Vendors receive customer shipping addresses for order
                    fulfillment
                  </li>
                  <li>
                    Customers can view vendor business names and product
                    information
                  </li>
                  <li>
                    Public blockchain data (wallet addresses, transaction
                    amounts) is visible to authorized network participants
                  </li>
                </ul>
                <p>
                  <strong>5.2 Service Providers:</strong> We may share
                  information with third-party service providers who assist in:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Email delivery and communications</li>
                  <li>Payment processing</li>
                  <li>Cloud storage and hosting</li>
                  <li>Analytics and platform monitoring</li>
                  <li>Customer support services</li>
                </ul>
                <p>
                  <strong>5.3 Legal Requirements:</strong> We may disclose your
                  information if required by law or in response to:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Court orders or legal processes</li>
                  <li>Government or regulatory requests</li>
                  <li>Enforcement of our Terms and Conditions</li>
                  <li>Protection of our rights, property, or safety</li>
                  <li>Investigation of fraud or illegal activities</li>
                </ul>
                <p>
                  <strong>5.4 Business Transfers:</strong> In the event of a
                  merger, acquisition, or sale of assets, your information may
                  be transferred to the acquiring entity.
                </p>
                <p>
                  <strong>5.5 No Selling of Data:</strong> We do NOT sell your
                  personal information to third parties for marketing purposes.
                </p>
              </div>
            </section>

            {/* Section 6 */}
            <section className="space-y-4">
              <h2 className="text-2xl font-light text-gray-900 dark:text-white">
                6. Cookies and Tracking Technologies
              </h2>
              <div className="space-y-3 text-sm leading-relaxed">
                <p>
                  <strong>6.1 Cookies:</strong> We use cookies and similar
                  tracking technologies to:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Remember your preferences and settings</li>
                  <li>Authenticate your login sessions</li>
                  <li>Analyze platform usage and performance</li>
                  <li>Provide personalized user experience</li>
                </ul>
                <p>
                  <strong>6.2 Managing Cookies:</strong> You can control cookies
                  through your browser settings. However, disabling cookies may
                  limit your ability to use certain platform features.
                </p>
                <p>
                  <strong>6.3 Analytics:</strong> We use analytics tools to
                  understand how users interact with our platform and improve
                  our services.
                </p>
              </div>
            </section>

            {/* Section 7 */}
            <section className="space-y-4">
              <h2 className="text-2xl font-light text-gray-900 dark:text-white">
                7. Your Rights and Choices
              </h2>
              <div className="space-y-3 text-sm leading-relaxed">
                <p>You have the following rights regarding your data:</p>
                <p>
                  <strong>7.1 Access:</strong> You can access and view your
                  personal information through your account settings.
                </p>
                <p>
                  <strong>7.2 Correction:</strong> You can update or correct
                  your personal information at any time through your account
                  settings.
                </p>
                <p>
                  <strong>7.3 Deletion:</strong> You can request deletion of
                  your account and personal information. However, blockchain
                  transaction data cannot be deleted due to its immutable
                  nature.
                </p>
                <p>
                  <strong>7.4 Data Export:</strong> You can request a copy of
                  your personal information in a portable format.
                </p>
                <p>
                  <strong>7.5 Communication Preferences:</strong> You can opt
                  out of non-essential communications while continuing to
                  receive transaction-related notifications.
                </p>
                <p>
                  <strong>7.6 Objection:</strong> You have the right to object
                  to certain processing of your personal information.
                </p>
                <p>
                  To exercise any of these rights, please contact us at
                  chainvainguard@gmail.com.
                </p>
              </div>
            </section>

            {/* Section 8 */}
            <section className="space-y-4">
              <h2 className="text-2xl font-light text-gray-900 dark:text-white">
                8. Children&apos;s Privacy
              </h2>
              <div className="space-y-3 text-sm leading-relaxed">
                <p>
                  ChainVanguard is not intended for use by individuals under the
                  age of 18. We do not knowingly collect personal information
                  from children. If we become aware that we have collected data
                  from a child, we will take steps to delete such information.
                </p>
              </div>
            </section>

            {/* Section 9 */}
            <section className="space-y-4">
              <h2 className="text-2xl font-light text-gray-900 dark:text-white">
                9. Third-Party Links and Services
              </h2>
              <div className="space-y-3 text-sm leading-relaxed">
                <p>
                  Our platform may contain links to third-party websites or
                  services. We are not responsible for the privacy practices of
                  these third parties. We encourage you to review their privacy
                  policies before providing any personal information.
                </p>
              </div>
            </section>

            {/* Section 10 */}
            <section className="space-y-4">
              <h2 className="text-2xl font-light text-gray-900 dark:text-white">
                10. International Data Transfers
              </h2>
              <div className="space-y-3 text-sm leading-relaxed">
                <p>
                  Your information may be transferred to and processed in
                  countries other than your country of residence. We ensure
                  appropriate safeguards are in place to protect your data in
                  accordance with this Privacy Policy.
                </p>
              </div>
            </section>

            {/* Section 11 */}
            <section className="space-y-4">
              <h2 className="text-2xl font-light text-gray-900 dark:text-white">
                11. Data Breach Notification
              </h2>
              <div className="space-y-3 text-sm leading-relaxed">
                <p>
                  In the event of a data breach that may compromise your
                  personal information, we will notify affected users within 72
                  hours and take immediate steps to mitigate the impact and
                  prevent future breaches.
                </p>
              </div>
            </section>

            {/* Section 12 */}
            <section className="space-y-4">
              <h2 className="text-2xl font-light text-gray-900 dark:text-white">
                12. Updates to This Privacy Policy
              </h2>
              <div className="space-y-3 text-sm leading-relaxed">
                <p>
                  We may update this Privacy Policy from time to time to reflect
                  changes in our practices or legal requirements. We will notify
                  you of significant changes via email or platform notification.
                  The &quot;Last updated&quot; date at the top of this policy indicates
                  when it was last revised.
                </p>
                <p>
                  Continued use of ChainVanguard after changes to this Privacy
                  Policy constitutes your acceptance of the updated policy.
                </p>
              </div>
            </section>

            {/* Section 13 */}
            <section className="space-y-4">
              <h2 className="text-2xl font-light text-gray-900 dark:text-white">
                13. Contact Information
              </h2>
              <div className="space-y-3 text-sm leading-relaxed">
                <p>
                  If you have any questions, concerns, or requests regarding
                  this Privacy Policy or our data practices, please contact us
                  at:
                </p>
                <div className="pl-4">
                  <p>Support: chainvainguard@gmail.com</p>
                </div>
              </div>
            </section>

            {/* Section 14 */}
            <section className="space-y-4">
              <h2 className="text-2xl font-light text-gray-900 dark:text-white">
                14. Blockchain-Specific Privacy Considerations
              </h2>
              <div className="space-y-3 text-sm leading-relaxed">
                <p className="text-xs bg-gray-100 dark:bg-gray-900 p-4 border-l-2 border-gray-400 dark:border-gray-600">
                  <strong>Important Notice:</strong> Due to the nature of
                  blockchain technology, certain data recorded on the
                  Hyperledger Fabric network (including transaction records,
                  wallet addresses, and timestamps) is permanent and cannot be
                  deleted or modified. While we maintain privacy through
                  permissioned access and encryption, you should be aware that
                  blockchain data persistence differs from traditional database
                  systems.
                </p>
                <p>
                  We are committed to balancing the transparency benefits of
                  blockchain with your privacy rights. Personal information
                  stored off-chain can be modified or deleted upon request, but
                  on-chain transaction data remains immutable.
                </p>
              </div>
            </section>
          </div>

          {/* Footer Navigation */}
          <div className="mt-16 pt-8 border-t border-gray-200 dark:border-gray-800">
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
              <Link
                href="/terms"
                className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                Read our Terms & Conditions →
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
