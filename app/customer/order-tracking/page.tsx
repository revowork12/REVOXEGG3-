'use client'
import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { COLORS } from '@/lib/constants'
import { TrackingSystem, type OrderStatus, type TrackingData } from '@/lib/trackingSystem'
import { SecurityManager } from '@/lib/security'
import { createClient } from '@supabase/supabase-js'
// Import demo utilities for testing (development only)
import '@/lib/trackingDemo'

function OrderTrackingContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [trackingData, setTrackingData] = useState<TrackingData | null>(null)
  const [currentStatus, setCurrentStatus] = useState<OrderStatus>('waiting')
  const [currentOrderBeingPrepared, setCurrentOrderBeingPrepared] = useState<number | null>(null)
  const [showContent, setShowContent] = useState(false)
  const [statusKey, setStatusKey] = useState(0) // For triggering animations

  useEffect(() => {
    if (typeof window === 'undefined') return

    const orderNumberParam = searchParams.get('orderNumber')
    const verificationNumberParam = searchParams.get('verificationNumber')

    console.log('Order tracking params:', { orderNumberParam, verificationNumberParam })

    if (!orderNumberParam || !verificationNumberParam) {
      console.warn('Missing order parameters')
      return
    }

    // Simple validation and parsing
    const orderNumber = parseInt(orderNumberParam)
    const verificationNumber = parseInt(verificationNumberParam)

    console.log('Parsed numbers:', { orderNumber, verificationNumber })

    if (isNaN(orderNumber) || isNaN(verificationNumber)) {
      console.warn('Invalid number format in parameters')
      return
    }

    // Connect to Supabase to get real order data
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    
    // Fetch actual order from database
    const fetchOrderStatus = async () => {
      try {
        console.log('🔍 Fetching order from database:', orderNumber)
        
        const { data: orderData, error } = await supabase
          .from('orders')
          .select('*')
          .eq('order_number', orderNumber)
          .single()
        
        console.log('📊 Database order result:', { orderData, error })
        
        if (error) {
          console.error('❌ Error fetching order:', error)
          // Set fallback tracking data so page still shows
          const fallbackTracking = {
            orderNumber: orderNumber,
            verificationNumber: verificationNumber,
            status: 'waiting' as OrderStatus,
            timestamp: new Date().toISOString(),
            lastUpdated: new Date().toISOString()
          }
          setTrackingData(fallbackTracking)
          setCurrentStatus('waiting')
          return
        }
        
        if (orderData) {
          const tracking = {
            orderNumber: orderData.order_number,
            verificationNumber: verificationNumber,
            status: orderData.status as OrderStatus,
            timestamp: orderData.created_at,
            lastUpdated: orderData.updated_at || orderData.created_at
          }
          
          console.log('✅ Setting tracking data:', tracking)
          setTrackingData(tracking)
          setCurrentStatus(orderData.status as OrderStatus)
          
          // Check if order is already collected/completed on initial load
          if (orderData.status === 'collected' || orderData.status === 'completed') {
            console.log('🎉 Order already collected/completed! Redirecting to thank you page...')
            setTimeout(() => {
              router.push(`/customer/order-completed?orderNumber=${orderNumber}&verificationNumber=${verificationNumber}`)
            }, 3000) // 3 second delay
          }
          
          // Set up real-time subscription for status updates
          const subscription = supabase
            .channel(`order_${orderNumber}`)
            .on(
              'postgres_changes',
              {
                event: 'UPDATE',
                schema: 'public',
                table: 'orders',
                filter: `order_number=eq.${orderNumber}`
              },
              (payload) => {
                console.log('🔄 Real-time order update:', payload.new)
                const updatedStatus = payload.new.status as OrderStatus
                setCurrentStatus(updatedStatus)
                setStatusKey(prev => prev + 1) // Trigger animation
                
                // Update tracking data
                setTrackingData(prev => prev ? {
                  ...prev,
                  status: updatedStatus,
                  lastUpdated: payload.new.updated_at || new Date().toISOString()
                } : null)
                
                // Auto-redirect to thank you page when order is completed
                if (updatedStatus === 'completed') {
                  console.log('🎉 Order collected/completed! Redirecting to thank you page...')
                  setTimeout(() => {
                    router.push(`/customer/order-completed?orderNumber=${orderNumber}&verificationNumber=${verificationNumber}`)
                  }, 3000) // 3 second delay
                }
              }
            )
            .subscribe()
          
          console.log('🔔 Subscribed to real-time updates for order', orderNumber)
          
          // Cleanup subscription on component unmount
          return () => {
            console.log('🧹 Cleaning up subscription')
            subscription.unsubscribe()
          }
        }
      } catch (error) {
        console.error('❌ Failed to fetch order status:', error)
        // Set fallback tracking data so page still shows
        const fallbackTracking = {
          orderNumber: orderNumber,
          verificationNumber: verificationNumber,
          status: 'waiting' as OrderStatus,
          timestamp: new Date().toISOString(),
          lastUpdated: new Date().toISOString()
        }
        setTrackingData(fallbackTracking)
        setCurrentStatus('waiting')
      }
    }
    
    // Initial fetch and show content
    fetchOrderStatus()
    
    // Always show content after a short delay
    setTimeout(() => setShowContent(true), 500)
    
    // Return cleanup function
    return () => {
      // Cleanup will be handled by subscription
    }

    // Get tracking system instance and initial current order being prepared
    const trackingSystem = TrackingSystem.getInstance()
    const currentOrder = trackingSystem.getCurrentOrderBeingPrepared()
    setCurrentOrderBeingPrepared(currentOrder)

    // Subscribe to status updates
    const unsubscribeStatus = trackingSystem.subscribeToOrder(orderNumber, (newStatus) => {
      setCurrentStatus(newStatus)
      setStatusKey(prev => prev + 1) // Trigger animation
      
      // Redirect to completed page only when owner marks as completed
      if (newStatus === 'completed') {
        setTimeout(() => {
          window.location.href = `/customer/order-completed?orderNumber=${orderNumber}&verificationNumber=${verificationNumber}`
        }, 1000) // Brief delay to show status change
      }
    })

    // Subscribe to current order being prepared updates
    const unsubscribeCurrentOrder = trackingSystem.subscribeToCurrentOrder((currentOrderNumber) => {
      setCurrentOrderBeingPrepared(currentOrderNumber)
    })

    // Trigger fade-in animation
    const timer = setTimeout(() => {
      setShowContent(true)
    }, 300)

    return () => {
      // Enhanced cleanup to prevent memory leaks
      try {
        unsubscribeStatus()
        unsubscribeCurrentOrder()
      } catch (error) {
        console.warn('Error during subscription cleanup:', error)
      }
      clearTimeout(timer)
    }
  }, [searchParams])

  const getStatusMessage = (status: OrderStatus): string => {
    switch (status) {
      case 'waiting':
        return 'waiting...'
      case 'preparing':
        return `preparing order #${trackingData?.orderNumber || ''}`
      case 'ready':
        return 'ready — please collect your order'
      case 'completed':
        return 'order completed — redirecting...'
      default:
        return 'waiting...'
    }
  }

  const getStatusColor = (status: OrderStatus): string => {
    switch (status) {
      case 'waiting':
        return 'text-navy-500/70'
      case 'preparing':
        return 'text-orange-600'
      case 'ready':
        return 'text-green-600'
      case 'completed':
        return 'text-green-700'
      default:
        return 'text-navy-500/70'
    }
  }

  if (!trackingData) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: COLORS.background }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-navy-500 mx-auto mb-4" aria-label="Loading"></div>
          <p className="text-navy-500 font-sans">Loading order tracking...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: COLORS.background }}>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Header Section */}
          <div className="text-center mb-12">
            <h1 
              className="font-bold text-navy-500 mb-8 font-sans uppercase tracking-wider" 
              style={{ fontSize: '3rem' }}
            >
              ORDER TRACKING
            </h1>
          </div>

          {/* Order Information Card with Fade-in Animation */}
          <div 
            className={`bg-white/90 rounded-xl p-8 shadow-lg border border-navy-500/20 mb-12 transition-all duration-1000 ${
              showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}
          >
            {/* Order Numbers */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {/* Order Number */}
              <div className="bg-navy-50 rounded-lg p-6 border-2 border-navy-500/20 text-center">
                <div className="text-sm font-semibold text-navy-500/70 uppercase tracking-wider mb-2 font-sans">
                  Order Number
                </div>
                <div className="text-3xl font-bold text-navy-500 font-sans" aria-label={`Order number ${trackingData.orderNumber}`}>
                  #{trackingData.orderNumber}
                </div>
              </div>

              {/* Verification Number */}
              <div className="bg-navy-50 rounded-lg p-6 border-2 border-navy-500/20 text-center">
                <div className="text-sm font-semibold text-navy-500/70 uppercase tracking-wider mb-2 font-sans">
                  Verification Number
                </div>
                <div className="text-3xl font-bold text-navy-500 font-sans" aria-label={`Verification number ${trackingData.verificationNumber}`}>
                  {trackingData.verificationNumber}
                </div>
              </div>
            </div>

            {/* Status Section with Smooth Transitions */}
            <div className="text-center">
              {/* Current Status */}
              <div>
                <div className="text-sm font-semibold text-navy-500/70 uppercase tracking-wider mb-4 font-sans">
                  Current Status
                </div>
                <div 
                  key={statusKey}
                  className={`text-2xl md:text-3xl font-bold font-sans transition-all duration-500 ${getStatusColor(currentStatus)} animate-fade-in`}
                  aria-label={`Order status: ${getStatusMessage(currentStatus)}`}
                >
                  {getStatusMessage(currentStatus)}
                </div>
              </div>
            </div>

            {/* Status Indicator Dots */}
            <div className="flex justify-center items-center mt-8 space-x-4">
              <div className={`w-4 h-4 rounded-full transition-all duration-300 ${
                currentStatus === 'waiting' ? 'bg-navy-500 scale-125' : 
                ['preparing', 'ready', 'completed'].includes(currentStatus) ? 'bg-navy-500' : 'bg-navy-200'
              }`} aria-label="Waiting status - Order received"></div>
              <div className={`w-8 h-1 transition-all duration-300 ${
                ['preparing', 'ready', 'completed'].includes(currentStatus) ? 'bg-orange-500' : 'bg-navy-200'
              }`}></div>
              <div className={`w-4 h-4 rounded-full transition-all duration-300 ${
                currentStatus === 'preparing' ? 'bg-orange-500 scale-125' : 
                ['ready', 'completed'].includes(currentStatus) ? 'bg-orange-500' : 'bg-navy-200'
              }`} aria-label="Preparing status - Order being prepared"></div>
              <div className={`w-8 h-1 transition-all duration-300 ${
                ['ready', 'completed'].includes(currentStatus) ? 'bg-green-500' : 'bg-navy-200'
              }`}></div>
              <div className={`w-4 h-4 rounded-full transition-all duration-300 ${
                currentStatus === 'ready' ? 'bg-green-500 scale-125' : 
                currentStatus === 'completed' ? 'bg-green-500' : 'bg-navy-200'
              }`} aria-label="Ready status - Order ready for pickup"></div>
              <div className={`w-8 h-1 transition-all duration-300 ${
                currentStatus === 'completed' ? 'bg-green-700' : 'bg-navy-200'
              }`}></div>
              <div className={`w-4 h-4 rounded-full transition-all duration-300 ${
                currentStatus === 'completed' ? 'bg-green-700 scale-125' : 'bg-navy-200'
              }`} aria-label="Completed status - Order completed"></div>
            </div>
          </div>

          {/* Back to Order Number Link */}
          <div className="text-center">
            <Link
              href={`/customer/order-number?orderNumber=${trackingData.orderNumber}&verificationNumber=${trackingData.verificationNumber}`}
              className="inline-block text-navy-500 font-semibold hover:underline transition-all duration-200 font-sans focus:outline-none focus:ring-2 focus:ring-navy-500/50 rounded px-2 py-1"
              aria-label="Go back to order confirmation"
            >
              ← Back to Order Confirmation
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function OrderTracking() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: COLORS.background }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-navy-500 mx-auto mb-4" aria-label="Loading"></div>
          <p className="text-navy-500 font-sans">Loading order tracking...</p>
        </div>
      </div>
    }>
      <div className="order-tracking-page">
        <OrderTrackingContent />
      </div>
    </Suspense>
  )
}

// Add custom CSS for fade-in animation
const styles = `
  .animate-fade-in {
    animation: fadeIn 0.5s ease-in-out;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`

if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style')
  styleSheet.textContent = styles
  document.head.appendChild(styleSheet)
}