import { Toaster } from "react-hot-toast";
import "./globals.css";

export const metadata = {
  title: "نظام إدارة الكافيه",
  description: "نظام إدارة الكافيه الحديث المتكامل",
};

import { SettingsProvider } from "../contexts/SettingsContext";

export default function RootLayout({ children }) {
  return (
    <html lang="ar" dir="rtl">
      <body>
        <SettingsProvider>
          {children}
          <Toaster position="top-left" />
        </SettingsProvider>
      </body>
    </html>
  );
}
