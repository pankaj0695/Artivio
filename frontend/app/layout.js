import "./globals.css";
import { Inter } from "next/font/google";
import { Providers } from "@/components/providers";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import Script from "next/script";
import { Toaster } from "@/components/ui/sonner";
import AnalyticsTracker from "@/components/analytics/analytics-tracker";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Artivio - AI-Powered Artisan Marketplace",
  description:
    "Connecting artisans with customers through AI-powered marketplace",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          <AnalyticsTracker />
          <Navbar />
          <main className="min-h-screen">{children}</main>
          <Footer />
          <Toaster />
        </Providers>

        {/* Razorpay Checkout Script */}
        <Script
          src="https://checkout.razorpay.com/v1/checkout.js"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
