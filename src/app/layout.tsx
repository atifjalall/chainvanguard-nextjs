import type { Metadata } from "next";
import { Montserrat, Lato } from "next/font/google";
import "./globals.css";
import { WalletProvider } from "@/components/providers/wallet-provider";
import { AuthProvider } from "@/components/providers/auth-provider";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { NotificationProvider } from "@/components/providers/notification-provider";
import { CartProvider } from "@/components/providers/cart-provider";
import { Toaster } from "@/components/ui/sonner";
import Footer from "@/components/common/customer-footer";
import { CookieSync } from "@/components/auth/cookie-sync";
import { RouteGuard } from "@/components/auth/route-guard";

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-montserrat",
});

const lato = Lato({
  subsets: ["latin"],
  weight: ["300", "400", "700"],
  variable: "--font-lato",
});

export const metadata: Metadata = {
  title: {
    template: "%s - ChainVanguard",
    default: "ChainVanguard - Blockchain Supply Chain Management",
  },
  description:
    "Decentralized supply chain management platform powered by blockchain technology",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${montserrat.variable} ${lato.variable}`}
    >
      <body>
        <ThemeProvider>
          <WalletProvider>
            <AuthProvider>
              <CookieSync />
              <RouteGuard />
              <NotificationProvider>
                <CartProvider>
                  <div className="min-h-screen bg-background flex flex-col">
                    {children}
                    <Footer />
                  </div>
                  <Toaster />
                </CartProvider>
              </NotificationProvider>
            </AuthProvider>
          </WalletProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
