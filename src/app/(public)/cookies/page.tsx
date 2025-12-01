"use client";

import Link from "next/link";
import { ChevronRightIcon } from "@heroicons/react/24/outline";

export default function CookiesPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      {/* Main Content */}
      <section className="py-16">
        <div className="max-w-[1200px] mx-auto px-8 lg:px-12">
          {/* Header */}
          <div className="space-y-6 mb-12">
            <h1 className="text-5xl font-extralight text-gray-900 dark:text-white tracking-tight">
              Cookie Policy
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
                  This Cookie Policy explains how ChainVanguard uses cookies and
                  similar tracking technologies on our blockchain-powered supply
                  chain management platform. This policy should be read in
                  conjunction with our Privacy Policy and Terms & Conditions.
                </p>
                <p>
                  By using ChainVanguard, you consent to our use of cookies as
                  described in this policy. If you do not agree with our use of
                  cookies, you should adjust your browser settings or
                  discontinue use of our platform.
                </p>
              </div>
            </section>

            {/* Section 2 */}
            <section className="space-y-4">
              <h2 className="text-2xl font-light text-gray-900 dark:text-white">
                2. What Are Cookies?
              </h2>
              <div className="space-y-3 text-sm leading-relaxed">
                <p>
                  Cookies are small text files that are placed on your device
                  (computer, smartphone, or tablet) when you visit a website.
                  They are widely used to make websites work more efficiently
                  and provide information to website owners.
                </p>
                <p>
                  Cookies can be &quot;persistent&quot; (remaining on your device until
                  deleted or expired) or &quot;session&quot; (deleted when you close your
                  browser). They can also be &quot;first-party&quot; (set by the website
                  you&apos;re visiting) or &quot;third-party&quot; (set by a different domain).
                </p>
              </div>
            </section>

            {/* Section 3 */}
            <section className="space-y-4">
              <h2 className="text-2xl font-light text-gray-900 dark:text-white">
                3. Types of Cookies We Use
              </h2>
              <div className="space-y-3 text-sm leading-relaxed">
                <p>ChainVanguard uses the following categories of cookies:</p>

                <div className="space-y-4 mt-4">
                  <div>
                    <p className="font-semibold">
                      3.1 Strictly Necessary Cookies
                    </p>
                    <p className="mt-2">
                      These cookies are essential for the platform to function
                      properly. They enable core functionality such as security,
                      network management, and accessibility. Without these
                      cookies, services you have requested cannot be provided.
                    </p>
                    <ul className="list-disc list-inside space-y-2 ml-4 mt-2">
                      <li>Authentication and login session management</li>
                      <li>Security tokens and CSRF protection</li>
                      <li>Load balancing and network routing</li>
                      <li>User preference settings (theme, language)</li>
                      <li>Shopping cart functionality</li>
                    </ul>
                    <p className="mt-2 text-xs bg-gray-100 dark:bg-gray-900 p-3 border-l-2 border-gray-400 dark:border-gray-600">
                      <strong>Legal Basis:</strong> These cookies are necessary
                      for the performance of our contract with you and cannot be
                      disabled.
                    </p>
                  </div>

                  <div>
                    <p className="font-semibold">
                      3.2 Performance and Analytics Cookies
                    </p>
                    <p className="mt-2">
                      These cookies collect information about how visitors use
                      our platform, such as which pages are visited most often
                      and whether users receive error messages. This helps us
                      improve platform performance and user experience.
                    </p>
                    <ul className="list-disc list-inside space-y-2 ml-4 mt-2">
                      <li>Page view tracking and navigation patterns</li>
                      <li>Performance monitoring and error detection</li>
                      <li>Load time measurements</li>
                      <li>Feature usage statistics</li>
                      <li>Platform optimization data</li>
                    </ul>
                    <p className="mt-2 text-xs bg-gray-100 dark:bg-gray-900 p-3 border-l-2 border-gray-400 dark:border-gray-600">
                      <strong>Legal Basis:</strong> These cookies are used with
                      your consent and can be disabled through cookie
                      preferences.
                    </p>
                  </div>

                  <div>
                    <p className="font-semibold">3.3 Functional Cookies</p>
                    <p className="mt-2">
                      These cookies allow the platform to remember choices you
                      make and provide enhanced, personalized features. They
                      help improve your experience by remembering your
                      preferences.
                    </p>
                    <ul className="list-disc list-inside space-y-2 ml-4 mt-2">
                      <li>Remembering your login details</li>
                      <li>
                        Saving your display preferences (dark mode, font size)
                      </li>
                      <li>Language and region settings</li>
                      <li>Previously viewed products or orders</li>
                      <li>Customized dashboard layouts</li>
                    </ul>
                    <p className="mt-2 text-xs bg-gray-100 dark:bg-gray-900 p-3 border-l-2 border-gray-400 dark:border-gray-600">
                      <strong>Legal Basis:</strong> These cookies enhance your
                      experience and are used with your consent.
                    </p>
                  </div>

                  <div>
                    <p className="font-semibold">
                      3.4 Blockchain-Related Cookies
                    </p>
                    <p className="mt-2">
                      These cookies are specific to our blockchain
                      infrastructure and help manage your wallet connection and
                      transaction signing.
                    </p>
                    <ul className="list-disc list-inside space-y-2 ml-4 mt-2">
                      <li>Wallet connection state</li>
                      <li>Transaction signing session data</li>
                      <li>Blockchain network preferences</li>
                      <li>Smart contract interaction history</li>
                    </ul>
                    <p className="mt-2 text-xs bg-gray-100 dark:bg-gray-900 p-3 border-l-2 border-gray-400 dark:border-gray-600">
                      <strong>Note:</strong> Your wallet recovery phrase is
                      NEVER stored in cookies or on our servers.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Section 4 */}
            <section className="space-y-4">
              <h2 className="text-2xl font-light text-gray-900 dark:text-white">
                4. Other Tracking Technologies
              </h2>
              <div className="space-y-3 text-sm leading-relaxed">
                <p>
                  In addition to cookies, we may use other tracking
                  technologies:
                </p>

                <div className="space-y-3 mt-3">
                  <p>
                    <strong>4.1 Local Storage:</strong> We use browser local
                    storage to save larger amounts of data on your device, such
                    as cached blockchain data, transaction history, and user
                    preferences. This improves platform performance and reduces
                    server load.
                  </p>
                  <p>
                    <strong>4.2 Session Storage:</strong> Temporary storage that
                    exists only for the duration of your browsing session. Used
                    for form data, navigation state, and temporary transaction
                    information.
                  </p>
                  <p>
                    <strong>4.3 Web Beacons:</strong> Small transparent image
                    files embedded in emails or web pages that help us track
                    email open rates and user engagement with our
                    communications.
                  </p>
                  <p>
                    <strong>4.4 Fingerprinting:</strong> We may collect
                    technical information about your device and browser
                    configuration for security purposes and fraud prevention.
                    This is not used for tracking across websites.
                  </p>
                </div>
              </div>
            </section>

            {/* Section 5 */}
            <section className="space-y-4">
              <h2 className="text-2xl font-light text-gray-900 dark:text-white">
                5. Third-Party Cookies
              </h2>
              <div className="space-y-3 text-sm leading-relaxed">
                <p>
                  We may allow certain trusted third-party services to place
                  cookies on your device for the following purposes:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>
                    <strong>Analytics Services:</strong> To help us understand
                    platform usage and improve our services
                  </li>
                  <li>
                    <strong>Email Service Providers:</strong> To track delivery
                    and engagement with transactional emails
                  </li>
                  <li>
                    <strong>Payment Processors:</strong> To facilitate secure
                    payment processing
                  </li>
                  <li>
                    <strong>Cloud Infrastructure:</strong> For platform hosting
                    and content delivery
                  </li>
                </ul>
                <p className="mt-3">
                  These third parties have their own privacy policies and cookie
                  policies. We recommend reviewing their policies to understand
                  how they use cookies.
                </p>
                <p className="text-xs bg-gray-100 dark:bg-gray-900 p-3 border-l-2 border-gray-400 dark:border-gray-600">
                  <strong>Note:</strong> We do not allow third-party advertising
                  cookies or tracking cookies for marketing purposes on our
                  platform.
                </p>
              </div>
            </section>

            {/* Section 6 */}
            <section className="space-y-4">
              <h2 className="text-2xl font-light text-gray-900 dark:text-white">
                6. Cookie Duration
              </h2>
              <div className="space-y-3 text-sm leading-relaxed">
                <p>Cookies on ChainVanguard have varying lifespans:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>
                    <strong>Session Cookies:</strong> Deleted when you close
                    your browser
                  </li>
                  <li>
                    <strong>Short-term Cookies:</strong> Last from a few hours
                    to a few days
                  </li>
                  <li>
                    <strong>Long-term Cookies:</strong> Can last up to 1 year,
                    used for remembering preferences
                  </li>
                  <li>
                    <strong>Authentication Cookies:</strong> Typically last 30
                    days or until you log out
                  </li>
                </ul>
                <p className="mt-3">
                  You can view the specific duration of each cookie through your
                  browser&apos;s developer tools or settings.
                </p>
              </div>
            </section>

            {/* Section 7 */}
            <section className="space-y-4">
              <h2 className="text-2xl font-light text-gray-900 dark:text-white">
                7. Managing Your Cookie Preferences
              </h2>
              <div className="space-y-3 text-sm leading-relaxed">
                <p>You have several options for managing cookies:</p>

                <div className="space-y-3 mt-3">
                  <p>
                    <strong>7.1 Platform Cookie Settings:</strong> You can
                    manage your cookie preferences through your account
                    settings. Navigate to Settings → Privacy → Cookie
                    Preferences to customize which types of cookies you allow.
                  </p>
                  <p>
                    <strong>7.2 Browser Settings:</strong> Most web browsers
                    allow you to control cookies through their settings. You
                    can:
                  </p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>View and delete existing cookies</li>
                    <li>Block all cookies</li>
                    <li>Block third-party cookies only</li>
                    <li>Clear cookies when you close your browser</li>
                    <li>Receive notifications before cookies are set</li>
                  </ul>
                  <p className="mt-3">
                    <strong>7.3 Browser-Specific Instructions:</strong>
                  </p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>
                      Google Chrome: Settings → Privacy and security → Cookies
                      and other site data
                    </li>
                    <li>
                      Firefox: Settings → Privacy & Security → Cookies and Site
                      Data
                    </li>
                    <li>Safari: Preferences → Privacy → Manage Website Data</li>
                    <li>
                      Microsoft Edge: Settings → Privacy, search, and services →
                      Cookies and site data
                    </li>
                  </ul>
                  <p className="mt-3 text-xs bg-gray-100 dark:bg-gray-900 p-3 border-l-2 border-gray-400 dark:border-gray-600">
                    <strong>Important:</strong> Blocking or deleting cookies may
                    impact your ability to use certain features of
                    ChainVanguard, particularly authentication and transaction
                    processing.
                  </p>
                </div>
              </div>
            </section>

            {/* Section 8 */}
            <section className="space-y-4">
              <h2 className="text-2xl font-light text-gray-900 dark:text-white">
                8. Impact of Disabling Cookies
              </h2>
              <div className="space-y-3 text-sm leading-relaxed">
                <p>
                  If you choose to disable cookies, certain features and
                  functionalities may be affected:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>
                    You may be unable to log in or stay logged in to your
                    account
                  </li>
                  <li>Your preferences and settings will not be saved</li>
                  <li>Shopping cart functionality may not work properly</li>
                  <li>
                    Wallet connection and transaction signing may be impaired
                  </li>
                  <li>Platform performance may be slower</li>
                  <li>Some security features may not function correctly</li>
                </ul>
                <p className="mt-3">
                  We recommend allowing at least strictly necessary cookies to
                  ensure optimal platform functionality.
                </p>
              </div>
            </section>

            {/* Section 9 */}
            <section className="space-y-4">
              <h2 className="text-2xl font-light text-gray-900 dark:text-white">
                9. Do Not Track (DNT) Signals
              </h2>
              <div className="space-y-3 text-sm leading-relaxed">
                <p>
                  Some browsers have a &quot;Do Not Track&quot; (DNT) feature that signals
                  to websites that you do not want your online activities
                  tracked. Currently, there is no universal standard for how DNT
                  signals should be interpreted.
                </p>
                <p>
                  ChainVanguard respects user privacy but does not currently
                  respond to DNT signals. However, you can manage your cookie
                  preferences through the methods described in Section 7 of this
                  policy.
                </p>
              </div>
            </section>

            {/* Section 10 */}
            <section className="space-y-4">
              <h2 className="text-2xl font-light text-gray-900 dark:text-white">
                10. Cookies and Personal Data
              </h2>
              <div className="space-y-3 text-sm leading-relaxed">
                <p>
                  Some cookies may collect or store personal data. The
                  collection and use of such data is governed by our Privacy
                  Policy. Key points include:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>
                    Authentication cookies contain encrypted session identifiers
                  </li>
                  <li>
                    Functional cookies may store user preferences and settings
                  </li>
                  <li>Analytics cookies collect anonymized usage data</li>
                  <li>We do not sell cookie data to third parties</li>
                  <li>
                    Cookie data is protected by the same security measures as
                    other personal data
                  </li>
                </ul>
              </div>
            </section>

            {/* Section 11 */}
            <section className="space-y-4">
              <h2 className="text-2xl font-light text-gray-900 dark:text-white">
                11. Mobile Applications
              </h2>
              <div className="space-y-3 text-sm leading-relaxed">
                <p>
                  If you access ChainVanguard through our mobile application, we
                  may use technologies similar to cookies, including:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Device identifiers and mobile analytics SDKs</li>
                  <li>Local app storage for preferences and cached data</li>
                  <li>Push notification tokens</li>
                  <li>Mobile-specific authentication tokens</li>
                </ul>
                <p className="mt-3">
                  You can manage these through your device settings and app
                  permissions.
                </p>
              </div>
            </section>

            {/* Section 12 */}
            <section className="space-y-4">
              <h2 className="text-2xl font-light text-gray-900 dark:text-white">
                12. Updates to This Cookie Policy
              </h2>
              <div className="space-y-3 text-sm leading-relaxed">
                <p>
                  We may update this Cookie Policy from time to time to reflect
                  changes in our practices, technology, legal requirements, or
                  other factors. When we make significant changes, we will:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>
                    Update the &quot;Last updated&quot; date at the top of this policy
                  </li>
                  <li>Notify you via email or platform notification</li>
                  <li>
                    Request your consent for new cookie categories if required
                    by law
                  </li>
                </ul>
                <p className="mt-3">
                  We encourage you to review this Cookie Policy periodically to
                  stay informed about our use of cookies.
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
                  If you have any questions or concerns about our use of cookies
                  or this Cookie Policy, please contact us at:
                </p>
                <div className="pl-4">
                  <p>Support: chainvainguard@gmail.com</p>
                </div>
                <p className="mt-3">
                  For questions about your personal data and privacy rights,
                  please refer to our Privacy Policy or contact our privacy team
                  at the email address above.
                </p>
              </div>
            </section>

            {/* Section 14 */}
            <section className="space-y-4">
              <h2 className="text-2xl font-light text-gray-900 dark:text-white">
                14. Blockchain-Specific Considerations
              </h2>
              <div className="space-y-3 text-sm leading-relaxed">
                <p className="text-xs bg-gray-100 dark:bg-gray-900 p-4 border-l-2 border-gray-400 dark:border-gray-600">
                  <strong>Important Notice:</strong> While cookies are temporary
                  and can be deleted, blockchain transaction data recorded on
                  the Hyperledger Fabric network is permanent and immutable.
                  Cookies may facilitate blockchain transactions, but the
                  transaction data itself is stored separately on the
                  distributed ledger. Your wallet recovery phrase is NEVER
                  stored in cookies or any browser storage mechanism.
                </p>
                <p className="mt-3">
                  We use cookies to enhance your experience with our blockchain
                  platform while maintaining the security and integrity of the
                  underlying distributed ledger technology.
                </p>
              </div>
            </section>
          </div>

          {/* Footer Navigation */}
          <div className="mt-16 pt-8 border-t border-gray-200 dark:border-gray-800">
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
              <div className="flex gap-4">
                <Link
                  href="/privacy"
                  className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                  Privacy Policy →
                </Link>
                <Link
                  href="/terms"
                  className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                  Terms & Conditions →
                </Link>
              </div>
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
