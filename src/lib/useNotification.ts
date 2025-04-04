import { useNotificationContext } from "@/providers/NotificationContext";

export type NotificationProps = {
  message: string;
  onClose: () => void;
};

export const useNotification = () => {
  const context = useNotificationContext();
  return context;
};
