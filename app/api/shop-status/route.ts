import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// GET /api/shop-status - Get current shop status
export async function GET(request: NextRequest) {
  try {
    if (!supabase) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 })
    }

    const { data: shopStatus, error } = await supabase
      .from('shop_status')
      .select('*')
      .eq('id', 1)
      .single()

    if (error) {
      console.error('Error fetching shop status:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ 
      isOpen: shopStatus.status === 'open',
      status: shopStatus.status,
      lastUpdated: shopStatus.last_updated 
    })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/shop-status - Toggle shop status (admin only)
export async function POST(request: NextRequest) {
  try {
    if (!supabase) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 })
    }

    const body = await request.json()
    const { status } = body

    // Validate status
    if (!['open', 'closed'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status. Must be "open" or "closed"' }, { status: 400 })
    }

    const { data: shopStatus, error } = await supabase
      .from('shop_status')
      .update({ 
        status: status,
        last_updated: new Date().toISOString() 
      })
      .eq('id', 1)
      .select()
      .single()

    if (error) {
      console.error('Error updating shop status:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ 
      isOpen: shopStatus.status === 'open',
      status: shopStatus.status,
      lastUpdated: shopStatus.last_updated 
    })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/shop-status - Update shop status (admin only)
export async function PUT(request: NextRequest) {
  return POST(request) // Same logic as POST for simplicity
}