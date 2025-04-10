import { useToast } from "@/hooks/use-toast";
import { useNotificationContext } from "@/providers/NotificationContext";
import { NOTIFICATION_CONFIG } from "@/config/notifications";

/**
 * 通知表示を抽象化するカスタムフック。
 * 設定に応じてshadcn/uiのToastまたは既存のNotificationPopupを使用します。
 */
export const useNotificationHandler = () => {
  const { toast } = useToast();
  const { showNotification: showLegacyNotification } = useNotificationContext();

  /**
   * 通知を表示します。
   * @param message 表示するメッセージ
   * @param type 通知の種類 ('success' | 'error' | 'default' | 'info' | 'warning') shadcn/uiのvariantに対応
   */
  const notify = (
    message: string,
    type: "success" | "error" | "default" | "info" | "warning" = "default"
  ) => {
    if (NOTIFICATION_CONFIG.useShadcn) {
      // shadcn/uiのToastを使用
      toast({
        title: message,
        variant: type === "error" ? "destructive" : "default", // 'error'以外は'default'にマッピング
      });
    } else {
      // 既存のNotificationPopupを使用
      // durationやonDismissは既存のshowNotificationに合わせて調整が必要な場合があります
      showLegacyNotification({ message });
    }
  };

  return { notify };
};
