import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/layout/sidebar";
import { TopBar } from "@/components/layout/topbar";
import { ToastProvider, ToastViewport } from "@/components/ui/toast";
import { Toaster } from "@/components/ui/toaster";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "BeanRush Coffee - Campaign Co-Pilot",
  description: "AI-native CRM for shopper engagement campaigns",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ToastProvider>
          <Sidebar />
          <TopBar />
          <main className="ml-64 mt-16 min-h-screen bg-muted/30 p-8">
            {children}
          </main>
          <Toaster />
          <ToastViewport />
        </ToastProvider>
      </body>
    </html>
  );
}