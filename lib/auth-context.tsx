'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from './supabase'
import type { User, Session } from '@supabase/supabase-js'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signIn: (emailOrUsername: string, password: string) => Promise<{ error?: any }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!supabase) {
      setLoading(false)
      return
    }

    // Get initial session
    const getInitialSession = async () => {
      if (!supabase) return
      const { data: { session } } = await supabase.auth.getSession()
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    }

    getInitialSession()

    // Listen for auth changes
    if (!supabase) return

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (emailOrUsername: string, password: string) => {
    if (!supabase) return { error: { message: 'Supabase not configured' } }
    
    console.log('🔐 Attempting login with:', emailOrUsername)
    
    // Check if input is email or username
    const isEmail = emailOrUsername.includes('@')
    
    if (isEmail) {
      // Direct email login
      console.log('📧 Using email login for:', emailOrUsername)
      const { error } = await supabase.auth.signInWithPassword({
        email: emailOrUsername,
        password,
      })
      console.log('📧 Email login result:', error ? 'FAILED' : 'SUCCESS')
      return { error }
    } else {
      // Username login - simplified approach
      console.log('👤 Using username login for:', emailOrUsername)
      
      // For username 'admin', try the known email
      if (emailOrUsername === 'admin') {
        const { error } = await supabase.auth.signInWithPassword({
          email: 'admin@gmail.com',
          password,
        })
        console.log('👤 Admin login result:', error ? 'FAILED' : 'SUCCESS')
        return { error }
      }
      
      // For other usernames, try to construct email
      const constructedEmail = `${emailOrUsername}@revoxegg.com`
      console.log('🔧 Trying constructed email:', constructedEmail)
      const { error } = await supabase.auth.signInWithPassword({
        email: constructedEmail,
        password,
      })
      console.log('🔧 Constructed email result:', error ? 'FAILED' : 'SUCCESS')
      return { error }
    }
  }

  const signOut = async () => {
    if (!supabase) return
    await supabase.auth.signOut()
  }

  const value = {
    user,
    session,
    loading,
    signIn,
    signOut,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}