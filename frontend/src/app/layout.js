import "./globals.css";
import Providers from "@/components/Providers";
import { BRANDING } from "@/config/branding";

export const metadata = {
  title: {
    default: `${BRANDING.businessName} — ${BRANDING.tagline}`,
    template: `%s | ${BRANDING.businessName}`,
  },
  icons: {
    icon: "/images/logo-brand.png",
  },
  description:
    "Premium fashion design studio in Lagos, Nigeria. Custom sewing, designer-sourced fabric, and ready-to-wear collections. Crafted with care, made to last.",
  keywords: [
    "fashion studio",
    "Lagos fashion",
    "custom sewing",
    "Nigerian fashion designer",
    "ready to wear",
    "bespoke fashion",
    "ankara styles",
  ],
  openGraph: {
    title: BRANDING.businessName,
    description: BRANDING.tagline,
    type: "website",
    locale: "en_NG",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-sans antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
