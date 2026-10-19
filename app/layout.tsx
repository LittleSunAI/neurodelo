import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AccessibilityBootstrap } from "@/components/accessibility-bootstrap";

export const metadata: Metadata = {
  title: "NEURODELO — платформа нейроделов",
  description: "Кликабельный макет open-source платформы для проектов, вкладов, обучения и игрового развития профиля.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  colorScheme: "dark light",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <body><AccessibilityBootstrap />{children}</body>
    </html>
  );
}
