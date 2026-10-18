import type { Metadata } from "next";
import { Google_Sans, Google_Sans_Code } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { Toaster } from "@/components/ui/sonner";

// Next has no fallback metrics for Google Sans, so skip that adjustment
// (it only printed "Failed to find font override values" on every compile)
const googleSans = Google_Sans({
  variable: "--font-google-sans",
  subsets: ["latin"],
  adjustFontFallback: false,
});

const googleSansCode = Google_Sans_Code({
  variable: "--font-google-sans-code",
  subsets: ["latin"],
  adjustFontFallback: false,
});

export const metadata: Metadata = {
  title: "Telemetry Studio",
  description: "Describe an app and watch AI build it: code, live preview and GitHub export in your browser.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (

      <html lang="en" suppressHydrationWarning>
        <body
          className={`${googleSans.variable} ${googleSansCode.variable} antialiased`}
        >
          <Providers>
            <Toaster/>
            {children}
          </Providers>
        </body>
      </html>

  );
}
