import { createContext, useContext, useState, useCallback } from 'react';

type NotificationProps = {
  message: string;
  duration?: number;
  onDismiss?: () => void;
};

type NotificationContextType = {
  isVisible: boolean;
  setIsVisible?: boolean;
  notificationProps: NotificationProps | null;
  showNotification: (props: NotificationProps) => void;
};

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotificationContext = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotificationContext must be used within a NotificationProvider');
  }
  return context;
};

type Props = {
  children?: React.ReactNode;
};

export const NotificationProvider: React.FC<Props> = ({ children }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [notificationProps, setNotificationProps] = useState<NotificationProps | null>(null);

  const showNotification = useCallback(({ message, duration = 1000, onDismiss }: NotificationProps) => {
    setNotificationProps({ message, duration });
    setIsVisible(true);

    setTimeout(() => {
      setIsVisible(false);
      setNotificationProps(null);
      if (onDismiss) {
        onDismiss();
      }
    }, duration);
  }, []);

  return (
    <NotificationContext.Provider value={{ isVisible, notificationProps, showNotification }}>
      {children}
    </NotificationContext.Provider>
  );
};
