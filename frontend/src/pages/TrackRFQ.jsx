import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { useQuery } from '@tanstack/react-query'
import api from '../lib/api'

const STATUS_STEPS = [
  { key: 'NEW',            label: 'Received',        icon: 'inbox',           desc: 'Your RFQ has been received by our team.' },
  { key: 'UNDER_REVIEW',   label: 'Under Review',    icon: 'manage_search',   desc: 'Our procurement specialists are reviewing your request.' },
  { key: 'QUOTATION_SENT', label: 'Quotation Sent',  icon: 'mark_email_read', desc: 'A formal quotation has been sent to your email.' },
  { key: 'CLOSED',         label: 'Closed',          icon: 'task_alt',        desc: 'This RFQ has been closed.' },
  { key: 'DECLINED',       label: 'Declined',        icon: 'cancel',          desc: 'This RFQ has been declined.' },
]

const STATUS_ORDER = { NEW: 0, UNDER_REVIEW: 1, QUOTATION_SENT: 2, CLOSED: 3, DECLINED: 3 }

export default function TrackRFQ() {
  const [input, setInput] = useState('')
  const [rfqNumber, setRfqNumber] = useState('')

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['track-rfq', rfqNumber],
    queryFn: () => api.get(`/rfq/${rfqNumber}`).then((r) => r.data),
    enabled: !!rfqNumber,
    retry: false,
  })

  const handleSearch = (e) => {
    e.preventDefault()
    const cleaned = input.trim().toUpperCase()
    if (cleaned) setRfqNumber(cleaned)
  }

  const currentStep = data ? STATUS_ORDER[data.status] : -1

  return (
    <div className="min-h-screen bg-surface py-16 px-4">
      <Helmet>
        <title>Track Your RFQ — PharmaLink Pro</title>
        <meta name="description" content="Track the status of your request for quotation. Enter your RFQ reference number to check progress." />
        <link rel="canonical" href="https://pharmalinkwholesale.com/track" />
      </Helmet>
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="text-center mb-12">
          <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <span className="material-symbols-outlined text-primary text-3xl">track_changes</span>
          </div>
          <h1 className="font-headline font-extrabold text-4xl text-on-surface mb-3">Track Your RFQ</h1>
          <p className="text-on-surface-variant text-lg">
            Enter your RFQ reference number to check the current status of your quotation request.
          </p>
        </div>

        {/* Search form */}
        <form onSubmit={handleSearch} className="mb-10">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline">search</span>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="e.g. RFQ-2026-0001"
                className="w-full pl-12 pr-4 py-4 bg-surface-container-high border-none rounded-xl text-on-surface font-mono font-bold text-lg focus:ring-2 focus:ring-primary/20 focus:bg-surface-container-lowest transition-all outline-none placeholder:font-body placeholder:font-normal placeholder:text-on-surface-variant/60"
              />
            </div>
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="btn-primary px-8 py-4 sm:py-0 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isLoading
                ? <span className="material-symbols-outlined animate-spin text-xl">progress_activity</span>
                : <span className="material-symbols-outlined text-xl">arrow_forward</span>
              }
              <span className="font-bold uppercase tracking-widest text-xs">Track</span>
            </button>
          </div>
        </form>

        {/* Error */}
        {isError && rfqNumber && (
          <div className="bg-error-container text-on-error-container p-5 rounded-2xl mb-8 flex items-start gap-3">
            <span className="material-symbols-outlined text-xl flex-shrink-0">error</span>
            <div>
              <p className="font-bold">RFQ not found</p>
              <p className="text-sm mt-1">
                No RFQ found with number <span className="font-mono font-bold">{rfqNumber}</span>.
                Please check the number and try again.
              </p>
            </div>
          </div>
        )}

        {/* Result */}
        {data && (
          <div className="space-y-6 animate-fade-in">

            {/* RFQ info card */}
            <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-xs font-bold text-outline uppercase tracking-widest mb-1">RFQ Reference</p>
                  <p className="font-mono font-extrabold text-2xl text-primary">{data.rfqNumber}</p>
                </div>
                <span className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                  data.status === 'NEW'            ? 'bg-blue-50 text-blue-700' :
                  data.status === 'UNDER_REVIEW'   ? 'bg-yellow-50 text-yellow-700' :
                  data.status === 'QUOTATION_SENT' ? 'bg-green-50 text-green-700' :
                  data.status === 'DECLINED'       ? 'bg-red-50 text-red-700' :
                  'bg-slate-100 text-slate-500'
                }`}>
                  {data.status?.replace('_', ' ')}
                </span>
              </div>
              <p className="text-sm text-on-surface-variant mb-4">
                Submitted: {new Date(data.submittedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>

              {/* Admin Feedback / Rejection Reason */}
              {data.verificationFeedback && (
                <div className={`p-5 rounded-2xl border flex items-start gap-4 animate-in slide-in-from-top-2 duration-300 ${
                  data.status === 'DECLINED' ? 'bg-red-50 border-red-200 text-red-900' : 'bg-primary/5 border-primary/20 text-primary-900'
                }`}>
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    data.status === 'DECLINED' ? 'bg-red-100 text-red-600' : 'bg-primary/10 text-primary'
                  }`}>
                    <span className="material-symbols-outlined text-2xl">{data.status === 'DECLINED' ? 'report_problem' : 'info'}</span>
                  </div>
                  <div>
                    <h4 className="font-headline font-extrabold text-sm uppercase tracking-wide mb-1">Update from our Verification Team</h4>
                    <p className="text-sm font-medium italic leading-relaxed opacity-90">"{data.verificationFeedback}"</p>
                  </div>
                </div>
              )}
            </div>

            {/* Progress timeline */}
            <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm">
              <h2 className="font-headline font-bold text-lg text-on-surface mb-6">Status Timeline</h2>
              <div className="space-y-0">
                {STATUS_STEPS.filter((s) => s.key !== 'CLOSED' || data.status === 'CLOSED').map((step, i) => {
                  const stepIndex = STATUS_ORDER[step.key]
                  const isDone    = stepIndex < currentStep
                  const isCurrent = stepIndex === currentStep
                  const isPending = stepIndex > currentStep

                  return (
                    <div key={step.key} className="flex gap-4">
                      {/* Line + dot */}
                      <div className="flex flex-col items-center">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
                          isDone    ? 'bg-green-500 text-white' :
                          isCurrent ? 'bg-primary text-white shadow-lg shadow-primary/30' :
                          'bg-surface-container text-outline'
                        }`}>
                          <span className="material-symbols-outlined text-lg" style={isDone ? { fontVariationSettings: "'FILL' 1" } : {}}>
                            {isDone ? 'check' : step.icon}
                          </span>
                        </div>
                        {i < STATUS_STEPS.filter((s) => s.key !== 'CLOSED' || data.status === 'CLOSED').length - 1 && (
                          <div className={`w-0.5 flex-1 my-1 ${isDone ? 'bg-green-300' : 'bg-surface-container-high'}`} style={{ minHeight: '2rem' }} />
                        )}
                      </div>

                      {/* Content */}
                      <div className={`pb-6 flex-1 ${isPending ? 'opacity-40' : ''}`}>
                        <p className={`font-headline font-bold text-base ${isCurrent ? 'text-primary' : isDone ? 'text-green-700' : 'text-on-surface-variant'}`}>
                          {step.label}
                          {isCurrent && <span className="ml-2 text-[10px] font-bold bg-primary text-white px-2 py-0.5 rounded-full uppercase tracking-wider">Current</span>}
                        </p>
                        <p className="text-sm text-on-surface-variant mt-0.5">{step.desc}</p>

                        {/* Special message for quotation sent */}
                        {isCurrent && step.key === 'QUOTATION_SENT' && (
                          <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-xl text-sm text-green-700 flex items-start gap-2">
                            <span className="material-symbols-outlined text-base flex-shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>mail</span>
                            <p>Check your email inbox for the formal quotation with pricing and delivery terms.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Estimated response */}
            {(data.status === 'NEW' || data.status === 'UNDER_REVIEW') && (
              <div className="bg-primary/5 border border-primary/10 rounded-2xl p-5 flex items-start gap-4">
                <span className="material-symbols-outlined text-primary text-2xl flex-shrink-0">schedule</span>
                <div>
                  <p className="font-headline font-bold text-on-surface">Estimated Response Time</p>
                  <p className="text-sm text-on-surface-variant mt-1">
                    Our team typically responds within <strong className="text-on-surface">4–24 hours</strong> during business days (Mon–Fri, 9am–6pm GMT).
                  </p>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => { setRfqNumber(''); setInput('') }}
                className="btn-secondary flex items-center gap-2 justify-center"
              >
                <span className="material-symbols-outlined">search</span>
                Track Another RFQ
              </button>
              <Link to="/rfq" className="btn-primary flex items-center gap-2 justify-center">
                <span className="material-symbols-outlined">add</span>
                Submit New RFQ
              </Link>
            </div>
          </div>
        )}

        {/* Help text when no search yet */}
        {!rfqNumber && !isError && (
          <div className="text-center text-on-surface-variant">
            <p className="text-sm">
              Your RFQ number was sent to your email after submission.
              It looks like <span className="font-mono font-bold text-on-surface">RFQ-2026-0001</span>
            </p>
            <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { icon: 'inbox',           title: 'Step 1',  desc: 'RFQ received by our team' },
                { icon: 'manage_search',   title: 'Step 2',  desc: 'Under review by specialists' },
                { icon: 'mark_email_read', title: 'Step 3',  desc: 'Quotation sent to your email' },
              ].map((s) => (
                <div key={s.title} className="bg-surface-container-lowest p-5 rounded-xl text-center">
                  <span className="material-symbols-outlined text-primary text-2xl mb-2 block">{s.icon}</span>
                  <p className="font-bold text-sm text-on-surface">{s.title}</p>
                  <p className="text-xs text-on-surface-variant mt-1">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
