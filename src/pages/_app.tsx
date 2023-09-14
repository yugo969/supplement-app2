import NotificationPopup from '@/components/NotificationPopup'
import { NotificationProvider } from '@/providers/NotificationContext'
import '@/styles/globals.css'
import type { AppProps } from 'next/app'

export default function App({ Component, pageProps }: AppProps) {
  return (
    <div>
      <NotificationProvider>
        <Component {...pageProps} />
        <NotificationPopup />
      </NotificationProvider>
    </div>)
}
