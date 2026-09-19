import { MotionProvider } from "@/components/providers/motion-provider";
import { MuiThemeProvider } from "@/components/providers/mui-theme-provider";
import { QueryProvider } from "@/components/providers/query-provider";
import type { Metadata, Viewport } from "next";
import { Public_Sans } from "next/font/google";
import "./globals.css";

const publicSans = Public_Sans({
  subsets: ["latin"],
  variable: "--font-app",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Lokynex Health",
  description: "Lab Billing & Reporting System",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#062B5C" },
    { media: "(prefers-color-scheme: dark)", color: "#0B1220" },
  ],
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
          <MuiThemeProvider>
            <MotionProvider>{children}</MotionProvider>
          </MuiThemeProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
