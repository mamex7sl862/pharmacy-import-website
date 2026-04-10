import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import api from '../lib/api'

const STATUS_BADGE = {
  NEW:            'bg-blue-50 text-blue-700',
  UNDER_REVIEW:   'bg-yellow-50 text-yellow-700',
  QUOTATION_SENT: 'bg-green-50 text-green-700',
  CLOSED:         'bg-slate-100 text-slate-500',
}

const STATUS_LABEL = {
  NEW:            'Pending Review',
  UNDER_REVIEW:   'Under Review',
  QUOTATION_SENT: 'Quotation Sent',
  CLOSED:         'Closed',
}

export default function CustomerRFQDetail() {
  const { id } = useParams()

  const { data: rfq, isLoading } = useQuery({
    queryKey: ['customer-rfq', id],
    queryFn: () => api.get(`/customer/rfqs/${id}`).then((r) => r.data),
  })

  const downloadPDF = async () => {
    try {
      const response = await api.get(`/customer/rfqs/${id}/pdf`, { responseType: 'blob' })
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }))
      const a = document.createElement('a')
      a.href = url
      a.download = `${rfq?.rfq_number || id}.pdf`
      a.click()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      console.error('PDF download failed:', err)
    }
  }

  if (isLoading) return (
    <div className="min-h-screen bg-surface flex items-center justify-center">
      <span className="material-symbols-outlined animate-spin text-4xl text-primary">progress_activity</span>
    </div>
  )
  if (!rfq) return null

  return (
    <div className="min-h-screen bg-surface py-12 px-4">
      <div className="max-w-3xl mx-auto">

        {/* Back + header */}
        <div className="flex items-center gap-4 mb-8">
          <Link to="/portal" className="p-2 hover:bg-surface-container rounded-full transition-colors text-primary">
            <span className="material-symbols-outlined">arrow_back</span>
          </Link>
          <div>
            <p className="text-xs text-outline font-mono">{rfq.rfq_number}</p>
            <h1 className="font-headline font-extrabold text-2xl text-on-surface">RFQ Details</h1>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <span className={`px-3 py-1.5 rounded-full text-xs font-bold ${STATUS_BADGE[rfq.status]}`}>
              {STATUS_LABEL[rfq.status]}
            </span>
            <button
              onClick={downloadPDF}
              className="flex items-center gap-2 px-4 py-2 border border-outline-variant rounded-lg text-sm font-semibold text-on-surface hover:bg-surface-container transition-colors"
            >
              <span className="material-symbols-outlined text-base">picture_as_pdf</span>
              Download PDF
            </button>
          </div>
        </div>

        <div className="space-y-6">
          {/* Summary */}
          <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <p className="text-[10px] font-bold text-outline uppercase tracking-widest mb-1">Submitted</p>
              <p className="text-sm font-semibold text-on-surface">{new Date(rfq.submitted_at).toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-outline uppercase tracking-widest mb-1">Products</p>
              <p className="text-sm font-semibold text-on-surface">{rfq.items?.length} items</p>
            </div>
            {rfq.requested_delivery_date && (
              <div>
                <p className="text-[10px] font-bold text-outline uppercase tracking-widest mb-1">Delivery By</p>
                <p className="text-sm font-semibold text-on-surface">{rfq.requested_delivery_date}</p>
              </div>
            )}
            {rfq.shipping_method && (
              <div>
                <p className="text-[10px] font-bold text-outline uppercase tracking-widest mb-1">Shipping</p>
                <p className="text-sm font-semibold text-on-surface capitalize">{rfq.shipping_method}</p>
              </div>
            )}
          </div>

          {/* Products */}
          <div className="bg-surface-container-lowest rounded-2xl shadow-sm overflow-hidden">
            <div className="p-5 border-b border-surface-container flex items-center gap-3">
              <span className="material-symbols-outlined text-primary">medical_services</span>
              <h2 className="font-headline font-bold text-on-surface">Requested Products</h2>
            </div>
            <div className="divide-y divide-surface-container">
              {rfq.items?.map((item) => (
                <div key={item.id} className="p-5 flex items-center justify-between">
                  <div>
                    <p className="font-bold text-sm text-on-surface">{item.product_name}</p>
                    <p className="text-xs text-outline">{item.brand} · {item.unit}</p>
                    {item.notes && <p className="text-xs text-on-surface-variant italic mt-1">"{item.notes}"</p>}
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-headline font-extrabold text-primary">{item.quantity}</p>
                    <p className="text-[10px] text-outline uppercase">{item.unit}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Message */}
          {rfq.message && (
            <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm">
              <h2 className="font-headline font-bold text-on-surface mb-3 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">chat_bubble</span>
                Special Instructions
              </h2>
              <p className="text-sm text-on-surface-variant leading-relaxed">{rfq.message}</p>
            </div>
          )}

          {/* Attachments */}
          {rfq.attachments?.length > 0 && (
            <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm">
              <h2 className="font-headline font-bold text-on-surface mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">attach_file</span>
                Uploaded Documents
              </h2>
              <div className="space-y-3">
                {rfq.attachments.map((file) => (
                  <a key={file.id} href={file.file_url} target="_blank" rel="noreferrer"
                    className="flex items-center gap-3 p-3 bg-surface-container-low rounded-xl hover:bg-surface-container transition-colors group">
                    <span className="material-symbols-outlined text-primary">description</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-on-surface truncate">{file.file_name}</p>
                      <p className="text-xs text-outline">{(file.file_size / 1024).toFixed(0)} KB</p>
                    </div>
                    <span className="material-symbols-outlined text-outline group-hover:text-primary">download</span>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Status info */}
          {rfq.status === 'QUOTATION_SENT' && (
            <div className="bg-green-50 border border-green-200 rounded-2xl p-6">
              <div className="flex items-start gap-4">
                <span className="material-symbols-outlined text-green-600 text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>mark_email_read</span>
                <div>
                  <h3 className="font-headline font-bold text-green-800 mb-1">Quotation Ready</h3>
                  <p className="text-sm text-green-700">A formal quotation has been sent to your email. Download the PDF above to review pricing and terms.</p>
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-4">
            <Link to="/portal" className="btn-secondary flex items-center gap-2">
              <span className="material-symbols-outlined">arrow_back</span>
              Back to Dashboard
            </Link>
            <Link to="/rfq" className="btn-primary flex items-center gap-2">
              <span className="material-symbols-outlined">add</span>
              New RFQ
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
