'use client'

import { useState, useEffect } from 'react'
import { Factory, Lock, Mail, User, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { createUser } from '@/features/system/user-access/users.service'
import type { CreateUserRequest } from '@/lib/types/api.types'

function generateStrongPassword(length = 16): string {
  const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const lower = 'abcdefghijklmnopqrstuvwxyz'
  const numbers = '0123456789'
  const special = '!@#$%^&*()_+~`|}{[]:;?><,./-='
  const allChars = upper + lower + numbers + special

  let password = ''
  // Ensure at least one character from each character set
  password += upper[Math.floor(Math.random() * upper.length)]
  password += lower[Math.floor(Math.random() * lower.length)]
  password += numbers[Math.floor(Math.random() * numbers.length)]
  password += special[Math.floor(Math.random() * special.length)]

  // Fill the rest of the password
  for (let i = password.length; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)]
  }

  // Shuffle the string
  return password.split('').sort(() => 0.5 - Math.random()).join('')
}

export function RegisterView() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    email: '',
    full_name: '',
    password: ''
  })

  // Auto-generate password on mount
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      password: generateStrongPassword()
    }))
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      // NOTE: According to the API schema, POST /users is currently protected by BearerAuth.
      // This call will likely fail with 401 if the user is not authenticated.
      // We send 'Viewer' as a safe default role.
      const payload: CreateUserRequest = {
        email: formData.email,
        full_name: formData.full_name,
        password: formData.password,
        role: 'Viewer'
      }

      await createUser(payload)
      
      toast.success('Account Created', { 
        description: 'Your account has been created successfully. You can now log in.' 
      })
      router.push('/login')
    } catch (err: unknown) {
      let message = 'Registration failed. Please try again.'

      if (err && typeof err === 'object' && 'response' in err) {
        const axiosErr = err as { response?: { status?: number; data?: { message?: string } } }
        if (axiosErr.response?.status === 409) {
          message = 'Email already exists.'
        } else if (axiosErr.response?.status === 401) {
          message = 'API requires authentication to create users. Public registration is not supported by the backend.'
        } else if (axiosErr.response?.data?.message) {
          message = axiosErr.response.data.message
        }
      }

      setError(message)
      toast.error('Registration Failed', { description: message })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen w-full bg-mrp-app flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-mrp-primary/5 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-mrp-primary/5 rounded-full blur-[120px]" />

      {/* Registration Card */}
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
                Account Provisioning
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
              {/* Full Name Field */}
              <div>
                <label
                  htmlFor="register-name"
                  className="block text-[11px] font-bold text-mrp-text-muted uppercase tracking-wider mb-2"
                >
                  Full Name
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-mrp-text-muted">
                    <User size={16} />
                  </div>
                  <input
                    id="register-name"
                    type="text"
                    required
                    value={formData.full_name}
                    onChange={(e) => {
                      setError(null)
                      setFormData({ ...formData, full_name: e.target.value })
                    }}
                    className="w-full bg-mrp-app border border-mrp-border text-white pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-mrp-primary rounded-sm transition-colors placeholder:text-mrp-text-muted/50"
                    placeholder="John Doe"
                  />
                </div>
              </div>

              {/* Email Field */}
              <div>
                <label
                  htmlFor="register-email"
                  className="block text-[11px] font-bold text-mrp-text-muted uppercase tracking-wider mb-2"
                >
                  Email
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-mrp-text-muted">
                    <Mail size={16} />
                  </div>
                  <input
                    id="register-email"
                    type="email"
                    required
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

              {/* Auto-generated Password Field */}
              <div>
                <div className="mb-2">
                  <label
                    htmlFor="register-password"
                    className="block text-[11px] font-bold text-mrp-text-muted uppercase tracking-wider"
                  >
                    System Generated Password
                  </label>
                </div>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-mrp-text-muted">
                    <Lock size={16} />
                  </div>
                  <input
                    id="register-password"
                    type="text"
                    readOnly
                    value={formData.password}
                    className="w-full bg-mrp-app/50 border border-mrp-border text-mrp-text-muted pl-10 pr-10 py-2.5 text-sm rounded-sm cursor-not-allowed select-all"
                  />
                </div>
                <p className="text-[10px] text-mrp-text-muted mt-2">
                  This strong password has been automatically generated for you. Please save it securely.
                </p>
              </div>

              {/* Submit Button */}
              <button
                id="register-submit"
                type="submit"
                disabled={isLoading}
                className="w-full bg-mrp-primary hover:bg-mrp-primary-hover disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 rounded-sm text-[12px] font-bold uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 mt-4 shadow-lg shadow-mrp-primary/10"
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                ) : (
                  'REGISTER'
                )}
              </button>

              {/* Back to Login Link */}
              <div className="text-center mt-4">
                <a
                  href="/login"
                  className="text-[11px] font-bold text-mrp-text-muted hover:text-white uppercase tracking-widest transition-colors inline-block"
                >
                  Return to Login
                </a>
              </div>
            </form>
          </div>
        </div>

        <p className="text-center text-[10px] text-mrp-text-muted mt-6 uppercase tracking-widest font-mono">
          System Core v2.4.0 // Zeus-Node-01
        </p>
      </div>
    </div>
  )
}
