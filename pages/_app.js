import { useEffect } from 'react'
import { useRouter } from 'next/router'
import { isNative } from '../lib/capacitor'
import '../styles/globals.css'
import UserIndicator from '../components/UserIndicator'
import MaintenanceBanner from '../components/MaintenanceBanner'
import Footer from '../components/Footer'

export default function App({ Component, pageProps }) {
  const router = useRouter()

  useEffect(() => {
    if (!isNative || typeof window === 'undefined') return

    // Dynamically import Capacitor App only when needed (native platforms)
    let App = null
    try {
      App = require('@capacitor/app').App
    } catch (e) {
      // Capacitor not available, skip
      return
    }

    // Handle universal links / deep links
    const handleAppUrl = async () => {
      try {
        const { url } = await App.getLaunchUrl()
        if (url) {
          // Parse URL and navigate
          // Example: https://yourdomain.com/groups/123
          const urlObj = new URL(url)
          const path = urlObj.pathname
          
          // Extract group ID from /groups/:id pattern
          const groupMatch = path.match(/\/groups\/([^/]+)/)
          if (groupMatch) {
            router.push(`/groups/${groupMatch[1]}`)
          } else {
            router.push(path || '/')
          }
        }
      } catch (error) {
        // Ignore errors (e.g., no launch URL)
      }
    }

    handleAppUrl()

    // Listen for app URL events (when app is opened via deep link while running)
    App.addListener('appUrlOpen', (event) => {
      try {
        const urlObj = new URL(event.url)
        const path = urlObj.pathname
        const groupMatch = path.match(/\/groups\/([^/]+)/)
        if (groupMatch) {
          router.push(`/groups/${groupMatch[1]}`)
        } else {
          router.push(path || '/')
        }
      } catch (error) {
        console.error('Error handling app URL:', error)
      }
    }).then(listener => {
      return () => {
        listener.remove().catch(() => {})
      }
    }).catch(() => {})
  }, [router])

  return (
    <div className="flex flex-col min-h-screen">
      <MaintenanceBanner />
      <div style={{ paddingTop: '0' }} className="flex-1">
        <UserIndicator />
        <Component {...pageProps} />
      </div>
      <Footer />
    </div>
  )
}

