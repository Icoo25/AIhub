import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "AI Компас",
    template: "%s | AI Компас",
  },
  applicationName: "AI Компас",
  description: "Вътрешна платформа за знания, инструменти и експерименти",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="bg"><body>{children}</body></html>;
}
