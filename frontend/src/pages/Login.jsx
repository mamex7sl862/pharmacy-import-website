import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation } from '@tanstack/react-query'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import api from '../lib/api'
import useAuthStore from '../store/authStore'

const schema = z.object({
  email: z.string().email('Valid email required'),
  password: z.string().min(1, 'Password is required'),
})

export default function Login() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const redirect = searchParams.get('redirect') || null
  const { setAuth } = useAuthStore()
  const { register, handleSubmit, formState: { errors } } = useForm({ resolver: zodResolver(schema) })

  const mutation = useMutation({
    mutationFn: (data) => api.post('/auth/login', data).then((r) => r.data),
    onSuccess: (data) => {
      setAuth(data.user, data.accessToken)
      // If came from RFQ page, go back there; otherwise go to portal/admin
      if (redirect) {
        navigate(redirect)
      } else {
        navigate(data.user.role === 'admin' ? '/admin' : '/portal')
      }
    },
  })

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center px-4">
      <div className="card p-10 w-full max-w-md shadow-sm">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-extrabold text-on-surface font-headline mb-2">Welcome Back</h1>
          <p className="text-on-surface-variant text-sm">Sign in to your PharmaLink account</p>
        </div>

        <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-6">
          <div className="space-y-2">
            <label className="block text-xs font-bold text-outline uppercase tracking-widest ml-1">Email</label>
            <input {...register('email')} type="email" placeholder="you@company.com" className="input-field" />
            {errors.email && <p className="text-xs text-error ml-1">{errors.email.message}</p>}
          </div>
          <div className="space-y-2">
            <label className="block text-xs font-bold text-outline uppercase tracking-widest ml-1">Password</label>
            <input {...register('password')} type="password" placeholder="••••••••" className="input-field" />
            {errors.password && <p className="text-xs text-error ml-1">{errors.password.message}</p>}
          </div>

          {mutation.isError && (
            <p className="text-sm text-error text-center">Invalid email or password.</p>
          )}

          <button type="submit" disabled={mutation.isPending} className="btn-primary w-full justify-center">
            {mutation.isPending ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p className="text-center text-sm text-on-surface-variant mt-6">
          Don't have an account?{' '}
          <Link to="/register" className="text-primary font-bold hover:underline">Register</Link>
        </p>
      </div>
    </div>
  )
}
