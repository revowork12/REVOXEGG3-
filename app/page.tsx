'use client'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function HomePage() {
  const router = useRouter()
  
  useEffect(() => {
    // Redirect to customer home page with EGGCELENT branding
    router.replace('/customer/home')
  }, [router])
  
  // Show loading while redirecting
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#fcf9da' }}>
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading...</p>
      </div>
    </div>
  )
}