import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Brain Tumor Detection System",
  description: "Advanced AI-powered brain tumor detection with comprehensive reporting and patient management",
  keywords: "brain tumor, AI detection, medical imaging, healthcare, diagnosis",
  authors: [{ name: "Brain Tumor Detection Team" }],
  viewport: "width=device-width, initial-scale=1",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased" suppressHydrationWarning={true}>
        {children}
      </body>
    </html>
  );
}
