'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { COLORS } from '@/lib/constants'

export default function LoginPage() {
  const [emailOrUsername, setEmailOrUsername] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const { signIn } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    const { error } = await signIn(emailOrUsername, password)

    if (error) {
      setError(error.message)
      setIsLoading(false)
    } else {
      router.push('/dashboard')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: COLORS.background }}>
      <div className="w-full max-w-md">
        <div className="bg-white/90 rounded-xl p-8 shadow-lg border border-navy-500/20">
          {/* Logo/Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-navy-500 mb-2 font-montserrat">
              🍳 EGGCELENT
            </h1>
            <p className="text-navy-500/70 font-sans">Owner Dashboard Login</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="emailOrUsername" className="block text-sm font-medium text-navy-500 mb-2">
                Username or Email
              </label>
              <input
                id="emailOrUsername"
                type="text"
                value={emailOrUsername}
                onChange={(e) => setEmailOrUsername(e.target.value)}
                required
                className="w-full px-4 py-3 border border-navy-500/20 rounded-lg focus:ring-2 focus:ring-navy-500/50 focus:border-navy-500 transition-colors bg-white/80"
                placeholder="admin or admin@gmail.com"
                disabled={isLoading}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-navy-500 mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 border border-navy-500/20 rounded-lg focus:ring-2 focus:ring-navy-500/50 focus:border-navy-500 transition-colors bg-white/80"
                placeholder="••••••••"
                disabled={isLoading}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-navy-500 text-cream hover:bg-navy-600 disabled:bg-navy-300 disabled:cursor-not-allowed px-6 py-3 rounded-lg font-bold text-lg transition-all duration-200 font-montserrat uppercase tracking-wide"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-cream mr-2"></div>
                  Signing In...
                </div>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="text-center mt-6 pt-6 border-t border-navy-500/10">
            <p className="text-sm text-navy-500/60">
              Need help? Contact your administrator
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}