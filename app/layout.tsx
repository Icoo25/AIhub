import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Innovation Hub",
  description: "Вътрешна платформа за AI инструменти, новини и експерименти",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="bg"><body>{children}</body></html>;
}
