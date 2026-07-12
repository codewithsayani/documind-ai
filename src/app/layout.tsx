import type { Metadata } from "next";
import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";
import "./globals.css";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";
import { TooltipProvider } from "@/components/ui/tooltip";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

export const metadata: Metadata = {
  title: {
    default: "DocuMind AI — AI-Powered Documentation Generator",
    template: "%s | DocuMind AI",
  },
  description:
    "Upload your codebase and get instant, comprehensive AI-generated documentation. Supports ZIP files, individual files, and GitHub repositories.",
  keywords: [
    "documentation generator",
    "AI documentation",
    "code documentation",
    "GitHub documentation",
    "technical writing",
    "developer tools",
  ],
  authors: [{ name: "DocuMind AI" }],
  creator: "DocuMind AI",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
  openGraph: {
    type: "website",
    locale: "en_US",
    title: "DocuMind AI — AI-Powered Documentation Generator",
    description: "Generate beautiful, comprehensive documentation for any codebase using AI.",
    siteName: "DocuMind AI",
  },
  twitter: {
    card: "summary_large_image",
    title: "DocuMind AI",
    description: "AI-powered documentation generator for your codebase.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning className={cn("font-sans", geist.variable)}>
      <body className="min-h-screen antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange={false}
        >
          <TooltipProvider>
            {children}
          </TooltipProvider>
          <Toaster
            position="bottom-right"
            toastOptions={{
              style: {
                background: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                color: "hsl(var(--foreground))",
              },
            }}
            richColors
          />
        </ThemeProvider>
      </body>
    </html>
  );
}
