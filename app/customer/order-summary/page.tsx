'use client'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import { useMemo, Suspense, useState } from 'react'
import { COLORS, type Quantities } from '@/lib/constants'
import { supabase } from '@/lib/supabase'
import { useEffect } from 'react'

interface MenuItem {
  id: number
  name: string
  price: number
  stock_quantity: number
  emoji?: string
}

function OrderSummaryContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [isPlacingOrder, setIsPlacingOrder] = useState(false)
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [isLoadingMenu, setIsLoadingMenu] = useState(true)

  // Load menu items from database
  useEffect(() => {
    loadMenuItems()
  }, [])

  const loadMenuItems = async () => {
    if (!supabase) {
      console.error('Supabase not configured')
      setIsLoadingMenu(false)
      return
    }
    
    try {
      const { data, error } = await supabase
        .from('menu_items')
        .select('*')
        .order('id')

      if (error) {
        console.error('Error loading menu items:', error)
      } else {
        const itemsWithEmojis = (data || []).map((item) => ({
          ...item,
          emoji: getEmojiForItem(item.name)
        }))
        setMenuItems(itemsWithEmojis)
      }
    } catch (error) {
      console.error('Error loading menu items:', error)
    } finally {
      setIsLoadingMenu(false)
    }
  }

  const getEmojiForItem = (name: string): string => {
    const lowerName = name.toLowerCase()
    if (lowerName.includes('tea')) return '🍵'
    if (lowerName.includes('coffee') || lowerName.includes('kappi')) return '☕'
    if (lowerName.includes('bun') || lowerName.includes('bread')) return '🍞'
    if (lowerName.includes('egg')) return '🥚'
    if (lowerName.includes('toast')) return '🍞'
    if (lowerName.includes('burrito')) return '🌯'
    if (lowerName.includes('avocado')) return '🥑'
    if (lowerName.includes('pancake')) return '🥞'
    if (lowerName.includes('tiramisu') || lowerName.includes('cake')) return '🍰'
    if (lowerName.includes('pistachio')) return '🥜'
    return '🍽️'
  }

  // Parse quantities from URL parameters with validation
  const quantities = useMemo(() => {
    const qty: Quantities = {}
    menuItems.forEach(item => {
      const paramValue = searchParams.get(`qty_${item.id}`)
      const parsedValue = paramValue ? parseInt(paramValue, 10) : 0
      // Validate parsed value to prevent NaN
      qty[item.id] = isNaN(parsedValue) ? 0 : Math.max(0, parsedValue)
    })
    return qty
  }, [searchParams, menuItems])

  // Get selected items (only items with quantity > 0)
  const selectedItems = useMemo(() => {
    return menuItems.filter(item => quantities[item.id] > 0)
  }, [menuItems, quantities])

  // Calculate grand total
  const grandTotal = useMemo(() => {
    return selectedItems.reduce((total, item) => total + (item.price * quantities[item.id]), 0)
  }, [selectedItems, quantities])

  // Place order in Supabase database
  const handlePlaceOrder = async () => {
    console.log('🚀 Starting order placement...')
    console.log('Supabase client:', !!supabase)
    console.log('Selected items:', selectedItems)
    console.log('Grand total:', grandTotal)
    
    if (!supabase || selectedItems.length === 0) {
      console.error('Missing supabase client or no items selected')
      return
    }

    setIsPlacingOrder(true)
    try {
      console.log('📊 Getting existing orders...')
      // Get the next order number by querying the highest existing order number
      const { data: existingOrders, error: orderNumberError } = await supabase
        .from('orders')
        .select('order_number')
        .order('order_number', { ascending: false })
        .limit(1)

      console.log('Existing orders query result:', { existingOrders, orderNumberError })

      if (orderNumberError) {
        console.error('Error getting existing orders:', orderNumberError)
        throw orderNumberError
      }

      // Calculate next order number (start from 1 if no orders exist)
      const nextOrderNumber = existingOrders && existingOrders.length > 0 
        ? existingOrders[0].order_number + 1 
        : 1
      
      console.log('📈 Calculated next order number:', nextOrderNumber)
      
      // Generate verification number (4-digit random number) - this will be used for display only
      const verificationNumber = Math.floor(1000 + Math.random() * 9000)
      console.log('🔢 Generated verification number for display:', verificationNumber)
      
      // Try to create order with calculated order number first
      let finalOrderNumber = nextOrderNumber
      let orderPayload = {
        order_number: finalOrderNumber,
        verification_number: verificationNumber, // Add verification number to database
        status: 'pending',
        total_amount: grandTotal
      }
      
      // If there's a conflict, try incrementing the order number
      let attempts = 0
      let orderCreated = false
      while (!orderCreated && attempts < 5) {
        console.log(`📦 Attempt ${attempts + 1}: Trying order number ${finalOrderNumber}`)
        
        const { data: testOrder } = await supabase
          .from('orders')
          .select('order_number')
          .eq('order_number', finalOrderNumber)
          .single()
        
        if (!testOrder) {
          // Order number is available
          orderPayload = {
            order_number: finalOrderNumber,
            verification_number: verificationNumber, // Include verification number
            status: 'pending',
            total_amount: grandTotal
          }
          orderCreated = true
        } else {
          // Order number exists, try next number
          finalOrderNumber = finalOrderNumber + 1
          attempts++
        }
      }
      
      if (!orderCreated) {
        throw new Error('Unable to find available order number after multiple attempts')
      }

      console.log('💾 Order payload to insert:', orderPayload)

      // Create order in database using simplified schema
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert([orderPayload])
        .select()
        .single()

      console.log('📝 Order insertion result:', { orderData, orderError })

      if (orderError) {
        console.error('Error creating order:', orderError)
        throw orderError
      }

      console.log('✅ Order created successfully:', orderData)

      // Now insert order items into the order_items table
      console.log('📦 Inserting order items...')
      
      // First, let's check what menu items exist in the database
      const { data: existingMenuItems, error: menuError } = await supabase
        .from('menu_items')
        .select('name')
      
      console.log('📋 Existing menu items in database:', existingMenuItems?.map(item => item.name))
      console.log('🛒 Selected items from client:', selectedItems.map(item => item.name))
      
      if (menuError) {
        console.error('Error fetching menu items:', menuError)
        throw new Error('Failed to validate menu items')
      }
      
      // Create a map of existing menu item names for validation
      const existingNames = existingMenuItems?.map(item => item.name.toLowerCase()) || []
      
      // Validate and map order items
      const orderItemsToInsert = selectedItems.map(item => {
        const itemNameLower = item.name.toLowerCase()
        
        // Check if the item exists in database (case-insensitive)
        if (!existingNames.includes(itemNameLower)) {
          console.error(`Menu item "${item.name}" not found in database!`)
          console.error('Available items:', existingMenuItems?.map(i => i.name))
          throw new Error(`Menu item "${item.name}" does not exist in the database`)
        }
        
        // Find the exact name from database (correct case)
        const correctName = existingMenuItems?.find(dbItem => 
          dbItem.name.toLowerCase() === itemNameLower
        )?.name || item.name
        
        return {
          order_id: orderData.id,
          menu_item_name: correctName, // Use exact name from database
          quantity: quantities[item.id],
          price: item.price
        }
      })

      console.log('📦 Order items to insert:', orderItemsToInsert)

      const { data: orderItemsData, error: orderItemsError } = await supabase
        .from('order_items')
        .insert(orderItemsToInsert)

      console.log('📝 Order items insertion result:', { orderItemsData, orderItemsError })

      if (orderItemsError) {
        console.error('Error creating order items:', orderItemsError)
        throw orderItemsError
      }

      console.log('✅ Order items created successfully')

      // Save order data for the order-number page - use actual verification number from database
      const orderDataWithVerification = {
        ...orderData,
        verification_number: orderData.verification_number || verificationNumber
      }
      localStorage.setItem('lastOrderData', JSON.stringify(orderDataWithVerification))
      console.log('💾 Saved order data to localStorage with verification number:', orderData.verification_number)

      // Redirect to order-number page with actual verification number from database
      console.log('🔄 Redirecting to order-number page...')
      router.push(`/customer/order-number?orderNumber=${orderData.order_number}&verificationNumber=${orderData.verification_number || verificationNumber}`)

    } catch (error) {
      console.error('Error placing order:', error)
      console.error('Error type:', typeof error)
      console.error('Error keys:', Object.keys(error || {}))
      console.error('Error stringified:', JSON.stringify(error, null, 2))
      
      // More detailed error handling
      if ((error as any)?.message) {
        console.error('Error message:', (error as any).message)
        alert(`Failed to place order: ${(error as any).message}`)
      } else if ((error as any)?.details) {
        console.error('Error details:', (error as any).details)
        alert(`Database error: ${(error as any).details}`)
      } else if ((error as any)?.code) {
        console.error('Error code:', (error as any).code)
        alert(`Database error code: ${(error as any).code}`)
      } else {
        console.error('Unknown error format')
        alert('Failed to place order. Please check your internet connection and try again.')
      }
    } finally {
      setIsPlacingOrder(false)
    }
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: COLORS.background }}>
      <div className="container mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="text-center mb-12">
          <h1 
            className="font-bold text-navy-500 mb-8 font-sans uppercase tracking-wider" 
            style={{ fontSize: '3rem' }}
          >
            ORDER SUMMARY
          </h1>
        </div>

        {/* Order Summary Content */}
        <div className="max-w-2xl mx-auto">
          {isLoadingMenu ? (
            <div className="bg-white/90 rounded-xl p-8 shadow-lg border border-navy-500/20 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-navy-500 mx-auto mb-4"></div>
              <p className="text-navy-500">Loading your order...</p>
            </div>
          ) : selectedItems.length > 0 ? (
            <div className="bg-white/90 rounded-xl p-8 shadow-lg border border-navy-500/20">
              {/* Items List */}
              <div className="space-y-4 mb-8">
                {selectedItems.map(item => (
                  <div 
                    key={item.id} 
                    className="flex justify-between items-center py-4 border-b border-navy-500/10 last:border-b-0"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl" role="img" aria-label={item.name}>{item.emoji}</span>
                      <span className="text-lg font-medium text-navy-500 font-sans">
                        {item.name}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-6 text-navy-500">
                      <span className="text-lg font-medium" aria-label={`Quantity: ${quantities[item.id]}`}>
                        x{quantities[item.id]}
                      </span>
                      <span className="text-lg font-bold min-w-[80px] text-right" aria-label={`Total price: ${item.price * quantities[item.id]} rupees`}>
                        ₹{item.price * quantities[item.id]}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Grand Total */}
              <div className="border-t border-navy-500/30 pt-6 mb-8">
                <div className="flex justify-between items-center">
                  <span className="text-xl font-bold text-navy-500 font-sans">
                    Grand Total:
                  </span>
                  <span className="text-2xl font-bold text-navy-500" aria-label={`Grand total: ${grandTotal} rupees`}>
                    ₹{grandTotal}
                  </span>
                </div>
              </div>

              {/* Place Order Button */}
              <div className="text-center">
                <button
                  onClick={handlePlaceOrder}
                  disabled={isPlacingOrder}
                  className={`inline-block px-12 py-4 rounded-lg font-bold text-xl transition-all duration-200 font-sans focus:outline-none focus:ring-2 focus:ring-navy-500/50 ${
                    isPlacingOrder 
                      ? 'bg-gray-400 text-gray-200 cursor-not-allowed' 
                      : 'bg-navy-500 text-cream hover:bg-navy-600 hover:scale-105 hover:shadow-xl active:scale-95'
                  }`}
                  aria-label="Place your order"
                >
                  {isPlacingOrder ? (
                    <>
                      <span className="inline-block animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></span>
                      Placing Order...
                    </>
                  ) : (
                    'Place Order'
                  )}
                </button>
              </div>
            </div>
          ) : (
            /* Empty Cart State */
            <div className="bg-white/90 rounded-xl p-8 shadow-lg border border-navy-500/20 text-center">
              <div className="mb-6">
                <span className="text-6xl" role="img" aria-label="Empty plate">🍽️</span>
              </div>
              <h2 className="text-2xl font-bold text-navy-500 mb-4 font-sans">
                Your cart is empty
              </h2>
              <p className="text-lg text-navy-500/70 mb-8 font-sans">
                Go back to the menu to add some delicious items!
              </p>
              <Link
                href="/customer/menu"
                className="inline-block bg-navy-500 text-cream hover:bg-navy-600 px-8 py-3 rounded-lg font-semibold hover:scale-105 hover:shadow-lg transition-all duration-200 font-sans focus:outline-none focus:ring-2 focus:ring-navy-500/50"
                role="button"
                aria-label="Go back to menu"
              >
                ← Back to Menu
              </Link>
            </div>
          )}
        </div>

        {/* Back to Menu Link */}
        {selectedItems.length > 0 && (
          <div className="text-center mt-8">
            <Link
              href="/customer/menu"
              className="inline-block text-navy-500 font-semibold hover:underline transition-all duration-200 font-sans focus:outline-none focus:ring-2 focus:ring-navy-500/50 rounded px-2 py-1"
              aria-label="Go back to menu to modify order"
            >
              ← Back to Menu
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

export default function OrderSummary() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: COLORS.background }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-navy-500 mx-auto mb-4" aria-label="Loading"></div>
          <p className="text-navy-500 font-sans">Loading your order...</p>
        </div>
      </div>
    }>
      <OrderSummaryContent />
    </Suspense>
  )
}