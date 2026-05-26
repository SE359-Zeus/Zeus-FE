'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Factory, Eye, EyeOff, Lock, Mail, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { useAuthStore } from '@/lib/stores/auth.store'

export function LoginView() {
  const { handleLogin } = useAuth()
  const router = useRouter()
  const isReady = useAuthStore((s) => s.isReady)
  const isAuthenticated = useAuthStore((s) => !!s.accessToken)
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })

  // If the user already has a valid session (bootstrapping succeeded),
  // redirect them away from the login page automatically.
  useEffect(() => {
    if (isReady && isAuthenticated) {
      router.replace('/mrp/dashboard')
    }
  }, [isReady, isAuthenticated, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      // Calls POST /auth/login → stores tokens in memory → navigates to dashboard
      await handleLogin({
        email: formData.email,
        password: formData.password,
      })
    } catch (err: unknown) {
      let message = 'Authentication failed. Please check your credentials.'

      if (err && typeof err === 'object' && 'response' in err) {
        const axiosErr = err as { response?: { status?: number; data?: { message?: string } } }
        if (axiosErr.response?.status === 401) {
          message = 'Invalid credentials or account is inactive.'
        } else if (axiosErr.response?.status === 400) {
          message = 'Invalid request. Please check your input.'
        } else if (axiosErr.response?.data?.message) {
          message = axiosErr.response.data.message
        }
      }

      setError(message)
      toast.error('Login Failed', { description: message })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen w-full bg-mrp-app flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-mrp-primary/5 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-mrp-primary/5 rounded-full blur-[120px]" />

      {/* Login Card */}
      <div className="w-full max-w-[420px] z-10">
        <div className="bg-mrp-panel border border-mrp-border rounded-sm shadow-2xl overflow-hidden">
          {/* Top Branding Bar */}
          <div className="h-1.5 bg-mrp-primary w-full" />

          <div className="p-8">
            {/* Logo & Header */}
            <div className="flex flex-col items-center mb-8">
              <div className="w-12 h-12 bg-mrp-primary/10 rounded-full flex items-center justify-center mb-4 border border-mrp-primary/20">
                <Factory size={24} className="text-mrp-primary" fill="currentColor" />
              </div>
              <h1 className="text-xl font-bold text-white tracking-widest uppercase font-mono">
                Zeus Orchestrator
              </h1>
              <p className="text-[11px] text-mrp-text-muted mt-1 font-medium uppercase tracking-wider">
                Enterprise Resource Gateway
              </p>
            </div>

            {/* Error Banner */}
            {error && (
              <div className="flex items-start gap-2.5 bg-red-500/10 border border-red-500/30 rounded-sm px-3 py-2.5 mb-5">
                <AlertCircle size={14} className="text-red-400 shrink-0 mt-[1px]" />
                <p className="text-[11px] text-red-400 leading-relaxed">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email Field */}
              <div>
                <label
                  htmlFor="login-email"
                  className="block text-[11px] font-bold text-mrp-text-muted uppercase tracking-wider mb-2"
                >
                  Email
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-mrp-text-muted">
                    <Mail size={16} />
                  </div>
                  <input
                    id="login-email"
                    type="email"
                    required
                    autoComplete="email"
                    value={formData.email}
                    onChange={(e) => {
                      setError(null)
                      setFormData({ ...formData, email: e.target.value })
                    }}
                    className="w-full bg-mrp-app border border-mrp-border text-white pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-mrp-primary rounded-sm transition-colors placeholder:text-mrp-text-muted/50"
                    placeholder="operator@zeus.sys"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div>
                <div className="mb-2">
                  <label
                    htmlFor="login-password"
                    className="block text-[11px] font-bold text-mrp-text-muted uppercase tracking-wider"
                  >
                    Password
                  </label>
                </div>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-mrp-text-muted">
                    <Lock size={16} />
                  </div>
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoComplete="current-password"
                    value={formData.password}
                    onChange={(e) => {
                      setError(null)
                      setFormData({ ...formData, password: e.target.value })
                    }}
                    className="w-full bg-mrp-app border border-mrp-border text-white pl-10 pr-10 py-2.5 text-sm focus:outline-none focus:border-mrp-primary rounded-sm transition-colors placeholder:text-mrp-text-muted/50"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-mrp-text-muted hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Login Button */}
              <button
                id="login-submit"
                type="submit"
                disabled={isLoading}
                className="w-full bg-mrp-primary hover:bg-mrp-primary-hover disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 rounded-sm text-[12px] font-bold uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 mt-4 shadow-lg shadow-mrp-primary/10"
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                ) : (
                  'LOGIN'
                )}
              </button>

              {/* Create Account Link */}
              <div className="text-center mt-4">
                <a
                  href="/register"
                  className="text-[11px] font-bold text-mrp-primary hover:text-mrp-primary-hover uppercase tracking-widest transition-colors inline-block"
                >
                  Create Account
                </a>
              </div>
            </form>

            {/* Security Notice */}
            <div className="mt-8 pt-6 border-t border-mrp-border flex items-start gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-mrp-warning animate-pulse mt-1 shrink-0" />
              <p className="text-[10px] text-mrp-text-muted leading-relaxed italic">
                Authorized access only. All sessions are logged and monitored via the Audit Protocol for security compliance.
              </p>
            </div>
          </div>
        </div>

        <p className="text-center text-[10px] text-mrp-text-muted mt-6 uppercase tracking-widest font-mono">
          System Core v2.4.0 // Zeus-Node-01
        </p>
      </div>
    </div>
  )
}
