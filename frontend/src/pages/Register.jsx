import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation } from '@tanstack/react-query'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import api from '../lib/api'
import useAuthStore from '../store/authStore'

const schema = z.object({
  fullName: z.string().min(2, 'Full name required'),
  email: z.string().email('Valid email required'),
  password: z.string().min(8, 'Minimum 8 characters'),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})

export default function Register() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const redirect = searchParams.get('redirect') || null
  const { setAuth } = useAuthStore()
  const { register, handleSubmit, formState: { errors } } = useForm({ resolver: zodResolver(schema) })

  const mutation = useMutation({
    mutationFn: (data) => api.post('/auth/register', { fullName: data.fullName, email: data.email, password: data.password }).then((r) => r.data),
    onSuccess: (data) => {
      setAuth(data.user, data.accessToken)
      navigate(redirect || '/portal')
    },
  })

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center px-4 py-12">
      <div className="card p-10 w-full max-w-md shadow-sm">
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-on-surface font-headline mb-2">Create Account</h1>
          <p className="text-on-surface-variant text-sm">Join PharmaLink to track your RFQ history.</p>
        </div>

        <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-6">
          {[
            { name: 'fullName', label: 'Full Name', type: 'text', placeholder: 'Dr. Jane Smith' },
            { name: 'email', label: 'Email', type: 'email', placeholder: 'you@company.com' },
            { name: 'password', label: 'Password', type: 'password', placeholder: '••••••••' },
            { name: 'confirmPassword', label: 'Confirm Password', type: 'password', placeholder: '••••••••' },
          ].map((field) => (
            <div key={field.name} className="space-y-2">
              <label className="block text-xs font-bold text-outline uppercase tracking-widest ml-1">{field.label}</label>
              <input {...register(field.name)} type={field.type} placeholder={field.placeholder} className="input-field" />
              {errors[field.name] && <p className="text-xs text-error ml-1">{errors[field.name].message}</p>}
            </div>
          ))}

          {mutation.isError && (
            <p className="text-sm text-error text-center">Registration failed. Email may already be in use.</p>
          )}

          <button type="submit" disabled={mutation.isPending} className="btn-primary w-full justify-center">
            {mutation.isPending ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p className="text-center text-sm text-on-surface-variant mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-primary font-bold hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  )
}
