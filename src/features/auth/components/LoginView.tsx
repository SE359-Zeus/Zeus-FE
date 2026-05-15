'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Factory, Eye, EyeOff, Lock, User, ArrowRight } from 'lucide-react'
import { toast } from 'sonner'

export function LoginView() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    // Simulate login logic
    setTimeout(() => {
      setIsLoading(false)
      toast.success('Login Successful', { description: 'Redirecting to dashboard...' })
      router.push('/mrp/dashboard')
    }, 1200)
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

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Username Field */}
              <div>
                <label className="block text-[11px] font-bold text-mrp-text-muted uppercase tracking-wider mb-2">
                  Operator Identity
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-mrp-text-muted">
                    <User size={16} />
                  </div>
                  <input
                    type="text"
                    required
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="w-full bg-mrp-app border border-mrp-border text-white pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-mrp-primary rounded-sm transition-colors placeholder:text-mrp-text-muted/50"
                    placeholder="Enter username or email"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-[11px] font-bold text-mrp-text-muted uppercase tracking-wider">
                    Access Key
                  </label>
                  <button type="button" className="text-[10px] text-mrp-primary hover:underline font-bold uppercase tracking-tight">
                    Reset Key
                  </button>
                </div>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-mrp-text-muted">
                    <Lock size={16} />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full bg-mrp-app border border-mrp-border text-white pl-10 pr-10 py-2.5 text-sm focus:outline-none focus:border-mrp-primary rounded-sm transition-colors placeholder:text-mrp-text-muted/50"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-mrp-text-muted hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Login Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-mrp-primary hover:bg-mrp-primary-hover disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 rounded-sm text-[12px] font-bold uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 mt-4 shadow-lg shadow-mrp-primary/10"
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    Initialize Session
                    <ArrowRight size={14} className="mt-[1px]" />
                  </>
                )}
              </button>
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
