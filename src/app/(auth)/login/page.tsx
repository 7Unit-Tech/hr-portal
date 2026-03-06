'use client'

import { Suspense, useState } from 'react'
import { useSearchParams } from 'next/navigation'

import { createClient } from '@/lib/supabase/client'

function LoginForm() {
  const searchParams = useSearchParams()
  const errorParam = searchParams.get('error')

  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(
    errorParam === 'auth_callback_failed'
      ? { type: 'error', text: 'Sign-in failed. Please try again.' }
      : null
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return

    setIsLoading(true)
    setMessage(null)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: `${typeof window !== 'undefined' ? window.location.origin : ''}/auth/callback`,
      },
    })

    setIsLoading(false)

    if (error) {
      const isRateLimit =
        /rate limit|too many requests|email.*limit/i.test(error.message)
      setMessage({
        type: 'error',
        text: isRateLimit
          ? 'Too many sign-in emails sent. Please wait an hour and try again, or use a different email.'
          : error.message,
      })
      return
    }

    setMessage({
      type: 'success',
      text: 'Check your email for a sign-in link.',
    })
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-muted/30 px-4">
      <div className="w-full max-w-sm rounded-xl border border-border bg-card p-6 shadow-sm">
        <div className="mb-6 text-center">
          <p className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
            7Unit Softwares India
          </p>
          <h1 className="mt-2 text-xl font-semibold tracking-tight">HR Portal</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Sign in with a magic link sent to your email
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="sr-only">
              Email
            </label>
            <input
              id="email"
              type="email"
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              disabled={isLoading}
              className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoading ? 'Sending link…' : 'Send magic link'}
          </button>
        </form>

        {message && (
          <div
            role="alert"
            className={`mt-4 rounded-lg border px-3 py-2.5 text-sm ${
              message.type === 'success'
                ? 'border-green-500/30 bg-green-500/10 text-green-700 dark:text-green-400'
                : 'border-destructive/30 bg-destructive/10 text-destructive'
            }`}
          >
            {message.text}
          </div>
        )}
      </div>
    </main>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <main className="flex min-h-screen flex-col items-center justify-center bg-muted/30 px-4">
        <div className="w-full max-w-sm rounded-xl border border-border bg-card p-6 shadow-sm">
          <div className="h-40 animate-pulse rounded-lg bg-muted/50" />
        </div>
      </main>
    }>
      <LoginForm />
    </Suspense>
  )
}
