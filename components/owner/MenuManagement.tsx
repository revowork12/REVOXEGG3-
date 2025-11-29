'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

interface MenuItem {
  id: number
  name: string
  price: number
  stock_quantity: number
  created_at: string
}

interface EditModalData {
  id: number
  name: string
  price: number
  stock_quantity: number
}

export default function MenuManagement() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [editModal, setEditModal] = useState<EditModalData | null>(null)
  const [addModal, setAddModal] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  
  // Form state for new item
  const [newItem, setNewItem] = useState({
    name: '',
    price: 0,
    stock_quantity: 50
  })

  useEffect(() => {
    loadMenuItems()
  }, [])

  const loadMenuItems = async () => {
    if (!supabase) {
      setIsLoading(false)
      return
    }

    try {
      const { data, error } = await supabase
        .from('menu_items')
        .select('*')
        .order('created_at', { ascending: true })

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

  const updateMenuItem = async (id: number, updates: Partial<MenuItem>) => {
    if (!supabase) {
      alert('❌ Database connection not available')
      return
    }

    setIsUpdating(true)
    try {
      console.log('🔄 Updating menu item:', { id, updates })
      
      const { data, error } = await supabase
        .from('menu_items')
        .update(updates)
        .eq('id', id)
        .select()

      console.log('📊 Update result:', { data, error })

      if (error) {
        console.error('❌ Supabase error updating menu item:', error)
        alert(`Failed to update menu item: ${error.message || 'Unknown error'}`)
      } else {
        console.log('✅ Menu item updated successfully:', data)
        await loadMenuItems()
        setEditModal(null)
        alert('✅ Menu item updated successfully!')
      }
    } catch (error) {
      console.error('❌ Exception updating menu item:', error)
      alert(`Failed to update menu item: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsUpdating(false)
    }
  }

  const deleteMenuItem = async (id: number, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) return
    if (!supabase) return

    try {
      const { error } = await supabase
        .from('menu_items')
        .delete()
        .eq('id', id)

      if (error) {
        console.error('Error deleting menu item:', error)
        alert('Failed to delete menu item')
      } else {
        await loadMenuItems()
      }
    } catch (error) {
      console.error('Error deleting menu item:', error)
      alert('Failed to delete menu item')
    }
  }

  const addMenuItem = async () => {
    if (!supabase) return
    if (!newItem.name.trim() || newItem.price <= 0) {
      alert('Please fill in all required fields')
      return
    }

    setIsUpdating(true)
    try {
      const { error } = await supabase
        .from('menu_items')
        .insert([newItem])

      if (error) {
        console.error('Error adding menu item:', error)
        alert('Failed to add menu item')
      } else {
        await loadMenuItems()
        setAddModal(false)
        setNewItem({
          name: '',
          price: 0,
          stock_quantity: 50
        })
      }
    } catch (error) {
      console.error('Error adding menu item:', error)
      alert('Failed to add menu item')
    } finally {
      setIsUpdating(false)
    }
  }

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!editModal) return

    updateMenuItem(editModal.id, {
      name: editModal.name,
      price: editModal.price,
      stock_quantity: editModal.stock_quantity
    })
  }

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    addMenuItem()
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading menu items...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end mb-8">
        <button
          onClick={() => setAddModal(true)}
          className="bg-green-50 hover:bg-green-100 text-green-700 px-6 py-3 rounded-lg font-medium transition-all duration-200 border border-green-200 shadow-sm"
        >
          + Add New Item
        </button>
      </div>

      {/* Menu Items Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {menuItems.map((item) => (
          <div key={item.id} className="bg-white/80 backdrop-blur-sm rounded-lg shadow-sm border border-gray-200 hover:shadow-md hover:bg-white/90 transition-all duration-200">
            {/* Item Details */}
            <div className="p-6">
              <div className="mb-4">
                <h3 className="font-semibold text-xl text-gray-900 mb-1">{item.name}</h3>
                <span className="text-xs text-gray-500">ID: {item.id}</span>
              </div>
              
              <div className="flex justify-between items-center mb-6">
                <span className="text-2xl font-bold text-gray-900">₹{item.price.toFixed(0)}</span>
                <div className="bg-gray-50 px-3 py-1 rounded-full">
                  <span className="text-sm font-medium text-gray-700">Stock: {item.stock_quantity}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3">
                <button
                  onClick={() => setEditModal({
                    id: item.id,
                    name: item.name,
                    price: item.price,
                    stock_quantity: item.stock_quantity
                  })}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 border border-gray-200"
                >
                  Edit
                </button>
                <button
                  onClick={() => deleteMenuItem(item.id, item.name)}
                  className="flex-1 bg-red-50 hover:bg-red-100 text-red-600 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 border border-red-200"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Edit Modal */}
      {editModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-4">Edit Menu Item</h3>
            
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  value={editModal.name}
                  onChange={(e) => setEditModal({...editModal, name: e.target.value})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Price (₹)</label>
                <input
                  type="number"
                  min="0"
                  value={editModal.price}
                  onChange={(e) => setEditModal({...editModal, price: parseFloat(e.target.value) || 0})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                  required
                  placeholder="Enter price in rupees"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Stock Quantity</label>
                <input
                  type="number"
                  min="0"
                  value={editModal.stock_quantity}
                  onChange={(e) => setEditModal({...editModal, stock_quantity: parseInt(e.target.value) || 0})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                  required
                  placeholder="Available quantity"
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setEditModal(null)}
                  className="flex-1 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                >
                  {isUpdating ? 'Saving...' : 'Update'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Modal */}
      {addModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-4">Add New Menu Item</h3>
            
            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  value={newItem.name}
                  onChange={(e) => setNewItem({...newItem, name: e.target.value})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Price (₹)</label>
                <input
                  type="number"
                  min="0"
                  value={newItem.price}
                  onChange={(e) => setNewItem({...newItem, price: parseFloat(e.target.value) || 0})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                  required
                  placeholder="Enter price in rupees"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Stock Quantity</label>
                <input
                  type="number"
                  min="0"
                  value={newItem.stock_quantity}
                  onChange={(e) => setNewItem({...newItem, stock_quantity: parseInt(e.target.value) || 0})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                  required
                  placeholder="Available quantity"
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setAddModal(false)}
                  className="flex-1 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="flex-1 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                >
                  {isUpdating ? 'Adding...' : 'Add Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}