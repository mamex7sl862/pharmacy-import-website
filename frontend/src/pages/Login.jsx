import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation } from '@tanstack/react-query'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import api from '../lib/api'
import useAuthStore from '../store/authStore'

const schema = z.object({
  email:    z.string().email('Valid email required'),
  password: z.string().min(1, 'Password is required'),
})

export default function Login() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const redirect = searchParams.get('redirect') || null
  const { setAuth } = useAuthStore()
  const { register, handleSubmit, formState: { errors } } = useForm({ resolver: zodResolver(schema) })

  const mutation = useMutation({
    mutationFn: (data) => api.post('/auth/login', data).then(r => r.data),
    onSuccess: (data) => {
      setAuth(data.user, data.accessToken)
      // Slight delay to ensure Zustand and Router are in sync before navigating
      // especially important for Admin routes which have heavy child components
      setTimeout(() => {
        navigate(redirect || (data.user.role === 'admin' ? '/admin' : '/portal'), { replace: true })
      }, 10)
    },
  })

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-9 h-9 signature-gradient rounded-xl flex items-center justify-center">
              <span className="material-symbols-outlined text-white text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>medication</span>
            </div>
            <span className="font-bold text-xl text-gray-900">PharmaLink Pro</span>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Welcome back</h1>
          <p className="text-sm text-gray-500">Sign in to your account to continue</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
          <form onSubmit={handleSubmit(d => mutation.mutate(d))} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Email Address</label>
              <input {...register('email')} type="email" placeholder="you@company.com" className="input-field" />
              {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-gray-700">Password</label>
                <Link to="/forgot-password" className="text-xs text-primary hover:underline">Forgot password?</Link>
              </div>
              <input {...register('password')} type="password" placeholder="••••••••" className="input-field" />
              {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>}
            </div>

            {mutation.isError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                Invalid email or password. Please try again.
              </div>
            )}

            <button type="submit" disabled={mutation.isPending} className="w-full btn-primary justify-center py-2.5 text-sm disabled:opacity-60">
              {mutation.isPending ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Don't have an account?{' '}
            <Link to="/register" className="text-primary font-semibold hover:underline">Create one</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
