import { Inter } from "next/font/google";
import { Toaster } from "@/components/ui/toaster";
import { PWAHead } from "@/components/PWAHead";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Voice Notes",
  description: "Voice recording and transcription app",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <PWAHead />
      </head>
      <body className={inter.className}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
