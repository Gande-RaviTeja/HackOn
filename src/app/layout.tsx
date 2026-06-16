import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/AuthContext";

export const metadata: Metadata = {
  title: "LearnSphere AI — AI-Powered Learning Platform",
  description: "Upload your study materials and interact with AI to get instant answers, summaries, quizzes, and personalized learning recommendations.",
  keywords: ["AI learning", "study assistant", "quiz generator", "PDF chat", "education AI"],
  authors: [{ name: "LearnSphere AI" }],
  openGraph: {
    title: "LearnSphere AI",
    description: "Transform your study materials into an interactive AI-powered learning experience.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
