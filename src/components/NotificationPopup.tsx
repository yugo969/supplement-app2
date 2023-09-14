import React from 'react'
import { useNotification } from '@/lib/useNotification';

const NotificationPopup = () => {
  const { isVisible, notificationProps } = useNotification();
  if(!isVisible || !notificationProps) return null;

  return (
    <div className="fixed top-0 bottom-0 left-0 right-0 overflow-hidden overscroll-none flex justify-center items-center w-screen h-screen bg-black/60">
      <div className="flex w-fit h-fit rounded-lg py-10 px-16 bg-white/90 text-black ">
        {notificationProps.message}
      </div>
    </div>
  );
}

export default NotificationPopup



