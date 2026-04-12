import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation } from '@tanstack/react-query'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import api from '../lib/api'
import useAuthStore from '../store/authStore'

const schema = z.object({
  fullName: z.string().min(2, 'Full name required'),
  companyName: z.string().min(2, 'Company name required'),
  businessType: z.string().min(1, 'Business type required'),
  email: z.string().email('Valid email required'),
  phone: z.string().min(5, 'Phone required'),
  country: z.string().min(2, 'Country required'),
  city: z.string().min(2, 'City required'),
  password: z.string().min(8, 'Minimum 8 characters'),
})

export default function Register() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const redirect = searchParams.get('redirect') || null
  const { setAuth } = useAuthStore()
  const { register, handleSubmit, formState: { errors } } = useForm({ resolver: zodResolver(schema) })

  const mutation = useMutation({
    mutationFn: (data) => api.post('/auth/register', data).then((r) => r.data),
    onSuccess: (data) => {
      setAuth(data.user, data.accessToken)
      navigate(redirect || '/portal')
    },
  })

  const fields = [
    { name: 'fullName', label: 'Full Name', type: 'text', placeholder: 'Dr. Jane Smith' },
    { name: 'companyName', label: 'Company Name', type: 'text', placeholder: 'Metro General Health' },
    { name: 'email', label: 'Email', type: 'email', placeholder: 'you@company.com' },
    { name: 'phone', label: 'Phone', type: 'tel', placeholder: '+1 555 000 0000' },
    { name: 'country', label: 'Country', type: 'text', placeholder: 'United States' },
    { name: 'city', label: 'City', type: 'text', placeholder: 'New York' },
    { name: 'password', label: 'Password', type: 'password', placeholder: '••••••••' },
  ]

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center px-4 py-12">
      <div className="card p-10 w-full max-w-2xl shadow-sm">
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-on-surface font-headline mb-2">Create Account</h1>
          <p className="text-on-surface-variant text-sm">Join PharmaLink to track your RFQ history.</p>
        </div>

        <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {fields.map((field) => (
              <div key={field.name} className="space-y-2">
                <label className="block text-xs font-bold text-outline uppercase tracking-widest ml-1">{field.label}</label>
                <input {...register(field.name)} type={field.type} placeholder={field.placeholder} className="input-field" />
                {errors[field.name] && <p className="text-xs text-error ml-1">{errors[field.name].message}</p>}
              </div>
            ))}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-outline uppercase tracking-widest ml-1">Business Type</label>
              <div className="relative">
                <select {...register('businessType')} className="input-field appearance-none">
                  <option value="">Select...</option>
                  <option value="pharmacy">Retail Pharmacy</option>
                  <option value="hospital">Hospital</option>
                  <option value="clinic">Clinic</option>
                  <option value="distributor">Wholesale Distributor</option>
                  <option value="other">Other</option>
                </select>
                <span className="material-symbols-outlined absolute right-4 top-3 text-on-surface-variant pointer-events-none">expand_more</span>
              </div>
              {errors.businessType && <p className="text-xs text-error ml-1">{errors.businessType.message}</p>}
            </div>
          </div>

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
