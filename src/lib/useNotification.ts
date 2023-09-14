import { useNotificationContext } from "@/providers/NotificationContext";

export const useNotification = () => {
  const context = useNotificationContext();
  return context;
};
