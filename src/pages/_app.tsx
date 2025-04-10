import NotificationPopup from "@/components/NotificationPopup";
import { NotificationProvider } from "@/providers/NotificationContext";
import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { Toaster } from "@/components/ui/toaster"; // Toasterをインポート

export default function App({ Component, pageProps }: AppProps) {
  return (
    <div>
      <NotificationProvider>
        <Component {...pageProps} />
        <NotificationPopup /> {/* 既存の通知ポップアップ */}
      </NotificationProvider>
      <Toaster /> {/* shadcn/uiのToasterを追加 */}
    </div>
  );
}
