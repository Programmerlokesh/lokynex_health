import { MuiThemeProvider } from "@/components/providers/mui-theme-provider";
import { QueryProvider } from "@/components/providers/query-provider";
import type { Metadata } from "next";
import { Public_Sans } from "next/font/google";
import "./globals.css";

// Public Sans — a clean, highly-legible sans-serif originally built for U.S.
// government digital services (including healthcare.gov-style products),
// which is why it reads as a "medical/clinical" typeface: neutral, precise,
// no decorative flourishes, and tested for readability at small sizes —
// exactly what a lab report or a dense data table needs.
const publicSans = Public_Sans({
  subsets: ["latin"],
  variable: "--font-app",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Lokynex Health",
  description: "Lab Billing & Reporting System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={publicSans.variable}>
      <body>
        <QueryProvider>
          <MuiThemeProvider>{children}</MuiThemeProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
