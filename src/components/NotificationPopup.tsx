import {
  DialogOverlay,
  DialogContent,
  DialogClose,
  Dialog,
} from "@/components/ui/dialog";
import { useNotification } from "@/lib/useNotification";
import { NotificationProps } from "@/lib/useNotification";
import { NOTIFICATION_CONFIG } from "@/config/notifications";

const NotificationPopup = () => {
  const { isVisible, notificationProps } = useNotification();

  if (NOTIFICATION_CONFIG.useShadcn) return null;
  if (!isVisible || !notificationProps) return null;

  const props = notificationProps as NotificationProps;

  return (
    <Dialog open={isVisible} onOpenChange={props.onClose}>
      <DialogOverlay className="bg-black/60 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
      <DialogContent className="w-fit max-w-md p-8 rounded-xl bg-white/90 backdrop-blur-sm border-2 border-gray-200 shadow-xl">
        <div className="text-gray-900 text-center text-lg">
          {notificationProps.message}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default NotificationPopup;
