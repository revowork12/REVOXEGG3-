'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

interface MenuItem {
  id: number
  name: string
  price: number
  stock_quantity: number
}

interface MenuDisplayProps {
  isShopOpen: boolean
}

export default function MenuDisplay({ isShopOpen }: MenuDisplayProps) {
  console.log('🏪 MenuDisplay component loaded!')
  
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [cart, setCart] = useState<{[key: string]: number}>({})
  const [shopStatus, setShopStatus] = useState<'open' | 'closed' | 'loading'>('loading')

  useEffect(() => {
    loadMenuItems()
    loadShopStatus()
    
    // Set up real-time shop status subscription
    const channel = supabase
      ?.channel('shop_status_changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'shop_status',
          filter: 'id=eq.1'
        },
        (payload) => {
          console.log('🔄 Real-time shop status update:', payload.new)
          const newStatus = payload.new.status === 'open' ? 'open' : 'closed'
          console.log('🔄 Setting real-time status to:', newStatus)
          setShopStatus(newStatus)
        }
      )
      .subscribe()

    // Cleanup subscription
    return () => {
      channel?.unsubscribe()
    }
  }, [])

  const loadShopStatus = async () => {
    if (!supabase) {
      console.log('❌ No Supabase client - setting shop as closed')
      setShopStatus('closed')
      return
    }

    try {
      console.log('🔍 Checking shop status from database...')
      const { data, error } = await supabase
        .from('shop_status')
        .select('*')
        .eq('id', 1)
        .single()

      console.log('📊 Shop status query result:', { data, error })

      if (error) {
        console.error('❌ Error loading shop status:', error)
        setShopStatus('closed')
      } else if (data) {
        const status = data.status === 'open' ? 'open' : 'closed'
        console.log('✅ Shop status set to:', status)
        setShopStatus(status)
      } else {
        console.log('⚠️ No shop status data found - defaulting to closed')
        setShopStatus('closed')
      }
    } catch (error) {
      console.error('❌ Exception loading shop status:', error)
      setShopStatus('closed')
    }
  }

  const loadMenuItems = async () => {
    if (!supabase) {
      setIsLoading(false)
      return
    }

    try {
      const { data, error } = await supabase
        .from('menu_items')
        .select('*')
        .order('id', { ascending: true })

      if (error) {
        console.error('Error loading menu items:', error)
      } else {
        setMenuItems(data || [])
      }
    } catch (error) {
      console.error('Error loading menu items:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const addToCart = (itemName: string) => {
    if (shopStatus !== 'open') {
      alert('Sorry, the shop is currently closed. Please check back later.')
      return
    }
    
    setCart(prev => ({
      ...prev,
      [itemName]: (prev[itemName] || 0) + 1
    }))
  }

  const removeFromCart = (itemName: string) => {
    if (shopStatus !== 'open') return
    
    setCart(prev => {
      const newCart = { ...prev }
      if (newCart[itemName] > 1) {
        newCart[itemName]--
      } else {
        delete newCart[itemName]
      }
      return newCart
    })
  }

  const placeOrder = async () => {
    if (!isShopOpen || Object.keys(cart).length === 0) return

    if (!supabase) {
      alert('❌ Database connection not available')
      return
    }

    try {
      // Create order
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert([{ status: 'pending' }])
        .select()
        .single()

      if (orderError) throw orderError

      // Add order items
      const orderItems = Object.entries(cart).map(([itemName, quantity]) => {
        const item = menuItems.find(m => m.name === itemName)
        return {
          order_id: orderData.id,
          menu_item_name: itemName,
          quantity: quantity,
          price: item?.price || 0
        }
      })

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems)

      if (itemsError) throw itemsError

      // Clear cart and show success
      setCart({})
      alert(`Order placed successfully! Verification Number: ${orderData.verification_number}`)

    } catch (error) {
      console.error('Error placing order:', error)
      alert('Failed to place order. Please try again.')
    }
  }

  if (isLoading || shopStatus === 'loading') {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading menu...</p>
        </div>
      </div>
    )
  }

  // Show shop closed message
  if (shopStatus === 'closed') {
    console.log('🔒 Rendering shop closed message')
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center max-w-md mx-auto px-6">
          <div className="bg-white rounded-3xl shadow-lg p-8 border-2 border-red-200">
            <div className="text-6xl mb-4">🔒</div>
            <h1 className="text-3xl font-bold text-red-600 mb-4 font-serif">
              Shop Closed
            </h1>
            <p className="text-lg text-gray-700 mb-6 font-sans">
              We're currently closed. Please check back later when we reopen!
            </p>
            <div className="text-sm text-gray-500 font-sans">
              Thank you for your patience ❤️
            </div>
            <div className="mt-4 text-xs text-gray-400">
              Debug: Shop Status = {shopStatus}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Menu</h2>
      
      {/* Menu Items Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-8">
        {menuItems.map((item) => (
          <div 
            key={item.id} 
            className={`bg-white rounded-lg shadow-sm border-2 p-4 transition-all duration-200 ${
              isShopOpen 
                ? 'border-gray-200 hover:border-yellow-400 hover:shadow-md' 
                : 'border-gray-100 opacity-60'
            }`}
          >
            <div className="flex justify-between items-start mb-3">
              <h3 className={`font-semibold text-lg ${isShopOpen ? 'text-gray-900' : 'text-gray-500'}`}>
                {item.name}
              </h3>
              <span className={`font-bold text-xl ${isShopOpen ? 'text-green-600' : 'text-gray-400'}`}>
                ₹{item.price.toFixed(0)}
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className={`text-sm ${isShopOpen ? 'text-gray-600' : 'text-gray-400'}`}>
                Stock: {item.stock_quantity}
              </span>
              
              {isShopOpen ? (
                <div className="flex items-center space-x-2">
                  {cart[item.name] ? (
                    <>
                      <button
                        onClick={() => removeFromCart(item.name)}
                        className="bg-red-500 hover:bg-red-600 text-white w-8 h-8 rounded-full text-sm font-bold"
                      >
                        -
                      </button>
                      <span className="font-semibold text-lg min-w-[24px] text-center">
                        {cart[item.name]}
                      </span>
                      <button
                        onClick={() => addToCart(item.name)}
                        className="bg-green-500 hover:bg-green-600 text-white w-8 h-8 rounded-full text-sm font-bold"
                      >
                        +
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => addToCart(item.name)}
                      className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg font-medium"
                    >
                      Add
                    </button>
                  )}
                </div>
              ) : (
                <div className="text-red-500 text-sm font-medium">
                  Unavailable
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Cart Summary */}
      {isShopOpen && Object.keys(cart).length > 0 && (
        <div className="bg-white rounded-lg shadow-md border-2 border-yellow-400 p-6">
          <h3 className="font-bold text-lg mb-4">Your Order</h3>
          <div className="space-y-2 mb-4">
            {Object.entries(cart).map(([itemName, quantity]) => {
              const item = menuItems.find(m => m.name === itemName)
              return (
                <div key={itemName} className="flex justify-between">
                  <span>{quantity}x {itemName}</span>
                  <span>₹{((item?.price || 0) * quantity).toFixed(0)}</span>
                </div>
              )
            })}
          </div>
          <div className="border-t pt-4 flex justify-between items-center">
            <span className="font-bold text-lg">
              Total: ₹{Object.entries(cart).reduce((total, [itemName, quantity]) => {
                const item = menuItems.find(m => m.name === itemName)
                return total + ((item?.price || 0) * quantity)
              }, 0).toFixed(0)}
            </span>
            <button
              onClick={placeOrder}
              className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-semibold"
            >
              Place Order
            </button>
          </div>
        </div>
      )}
    </div>
  )
}