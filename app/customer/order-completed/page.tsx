'use client'
import Link from 'next/link'
import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { COLORS } from '@/lib/constants'

function OrderCompletedContent() {
  const searchParams = useSearchParams()
  const [showContent, setShowContent] = useState(false)
  const [orderNumber, setOrderNumber] = useState<number | null>(null)
  const [verificationNumber, setVerificationNumber] = useState<number | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return

    // Basic parameter validation
    console.log('Order completed page loaded with params:', Object.fromEntries(searchParams))

    const orderNumberParam = searchParams.get('orderNumber')
    const verificationNumberParam = searchParams.get('verificationNumber')

    if (!orderNumberParam || !verificationNumberParam) {
      // Redirect to menu if no order data
      window.location.href = '/customer/menu'
      return
    }

    // Simple number parsing instead of security manager
    const parsedOrderNumber = parseInt(orderNumberParam)
    const parsedVerificationNumber = parseInt(verificationNumberParam)

    console.log('Parsing numbers:', { orderNumberParam, verificationNumberParam, parsedOrderNumber, parsedVerificationNumber })

    if (isNaN(parsedOrderNumber) || isNaN(parsedVerificationNumber)) {
      console.warn('Invalid number format in parameters')
      window.location.href = '/customer/menu'
      return
    }

    // Set order info immediately - no slow database verification for fast loading
    setOrderNumber(parsedOrderNumber)
    setVerificationNumber(parsedVerificationNumber)
    
    // Show content immediately - no delay
    setShowContent(true)
  }, [searchParams])

  const handleOrderAgain = () => {
    // Simple fast navigation - no slow localStorage cleanup
    window.location.href = '/customer/menu'
  }

  if (!orderNumber || !verificationNumber) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: COLORS.background }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-navy-500 mx-auto mb-4" aria-label="Loading"></div>
          <p className="text-navy-500 font-sans">Verifying order completion...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: COLORS.background }}>
      <div className="max-w-2xl mx-auto px-4 py-8 text-center">
        {/* Success Content with Animation */}
        <div 
          className={`transition-all duration-1000 ${
            showContent 
              ? 'opacity-100 translate-y-0 scale-100' 
              : 'opacity-0 translate-y-8 scale-95'
          }`}
        >
          {/* Success Icon */}
          <div className="mb-8">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-green-500 rounded-full mb-6 animate-pulse" role="img" aria-label="Order completed">
              <span className="text-4xl text-white" aria-hidden="true">✓</span>
            </div>
          </div>

          {/* Title */}
          <h1 
            className="font-bold text-navy-500 mb-6 font-sans uppercase tracking-wider" 
            style={{ fontSize: '3rem' }}
          >
            ORDER COMPLETED
          </h1>

          {/* Success Message Card */}
          <div className="bg-white/90 rounded-xl p-8 shadow-lg border border-navy-500/20 mb-8">
            {/* Main Message */}
            <h2 className="text-2xl font-bold text-navy-500 mb-6 font-sans">
              <span role="img" aria-label="celebration">🎉</span> Your order is completed
            </h2>

            {/* Sub-message */}
            <p className="text-lg text-navy-500/80 font-sans leading-relaxed">
              A heartfelt thank-you from <strong>Team Hoschailine</strong>
            </p>

            {/* Order Reference */}
            <div className="mt-6 pt-6 border-t border-navy-500/20">
              <p className="text-sm text-navy-500/60 font-sans">
                Order #{orderNumber} • Verification {verificationNumber}
              </p>
            </div>
          </div>

          {/* Order Again Button */}
          <div className="text-center">
            <button
              onClick={handleOrderAgain}
              className="inline-block bg-navy-500 text-cream hover:bg-navy-600 active:bg-navy-700 px-8 py-4 rounded-xl font-bold text-xl hover:scale-105 active:scale-95 hover:shadow-lg transition-all duration-200 font-sans focus:outline-none focus:ring-2 focus:ring-navy-500/50 uppercase tracking-wide"
              role="button"
              aria-label="Start a new order"
            >
              Order Again
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function OrderCompleted() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: COLORS.background }}>
        <div className="text-center">
          <div className="animate-pulse text-4xl mb-4">🎉</div>
          <p className="text-navy-500 font-sans">Almost there...</p>
        </div>
      </div>
    }>
      <div className="order-completed-page">
        <OrderCompletedContent />
      </div>
    </Suspense>
  )
}
