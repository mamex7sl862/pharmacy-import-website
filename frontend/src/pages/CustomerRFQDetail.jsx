import { useParams, Link } from "react-router-dom"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useState, useRef } from "react"
import api from "../lib/api"
import OrderProgressStepper from "../components/OrderProgressStepper"
import PaymentProofUpload from "../components/PaymentProofUpload"
import RFQChat from "../components/RFQChat"

const POST_ACCEPTANCE = ["AWAITING_PAYMENT","PAYMENT_SUBMITTED","PAYMENT_CONFIRMED","SHIPPED","DELIVERED"]

const STATUS_BADGE = {
  NEW:"bg-blue-50 text-blue-700",UNDER_REVIEW:"bg-yellow-50 text-yellow-700",
  QUOTATION_SENT:"bg-green-50 text-green-700",CLOSED:"bg-emerald-50 text-emerald-700",
  DECLINED:"bg-red-50 text-red-700",AWAITING_PAYMENT:"bg-amber-50 text-amber-700",
  PAYMENT_SUBMITTED:"bg-blue-50 text-blue-700",PAYMENT_CONFIRMED:"bg-teal-50 text-teal-700",
  SHIPPED:"bg-indigo-50 text-indigo-700",DELIVERED:"bg-emerald-50 text-emerald-700",
}
const STATUS_LABEL = {
  NEW:"Pending Review",UNDER_REVIEW:"Under Review",QUOTATION_SENT:"Quotation Sent",
  CLOSED:"Deal Closed",DECLINED:"Declined",AWAITING_PAYMENT:"Awaiting Payment",
  PAYMENT_SUBMITTED:"Payment Under Review",PAYMENT_CONFIRMED:"Payment Approved",
  SHIPPED:"Shipped",DELIVERED:"Delivered",
}

export default function CustomerRFQDetail() {
  const { id } = useParams()
  const queryClient = useQueryClient()
  const [showAcceptModal, setShowAcceptModal] = useState(false)
  const [showDeclineModal, setShowDeclineModal] = useState(false)
  const paymentRef = useRef(null)

  const { data: rfq, isLoading } = useQuery({
    queryKey: ["customer-rfq", id],
    queryFn: () => api.get(`/customer/rfqs/${id}`).then(r => r.data),
  })

  const acceptMutation = useMutation({
    mutationFn: () => api.post(`/customer/rfqs/${id}/accept`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customer-rfq", id] })
      queryClient.invalidateQueries({ queryKey: ["customer-rfqs"] })
      setShowAcceptModal(false)
      // Scroll to payment section after a short delay for the DOM to update
      setTimeout(() => {
        paymentRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
      }, 300)
    },
  })

  const declineMutation = useMutation({
    mutationFn: () => api.post(`/customer/rfqs/${id}/decline`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customer-rfq", id] })
      queryClient.invalidateQueries({ queryKey: ["customer-rfqs"] })
      setShowDeclineModal(false)
    },
  })

  const confirmDeliveryMutation = useMutation({
    mutationFn: () => api.post(`/customer/rfqs/${id}/confirm-delivery`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customer-rfq", id] })
      queryClient.invalidateQueries({ queryKey: ["customer-rfqs"] })
    },
  })

  const downloadPDF = async (filename) => {
    try {
      const response = await api.get(`/customer/rfqs/${id}/pdf`, { responseType: "blob" })
      const url = window.URL.createObjectURL(new Blob([response.data], { type: "application/pdf" }))
      const a = document.createElement("a"); a.href = url; a.download = filename; a.click()
      window.URL.revokeObjectURL(url)
    } catch (err) { console.error("PDF download failed:", err) }
  }

  if (isLoading) return (
    <div className="min-h-screen bg-surface flex items-center justify-center">
      <span className="material-symbols-outlined animate-spin text-4xl text-primary">progress_activity</span>
    </div>
  )
  if (!rfq) return null

  const isPostAcceptance = POST_ACCEPTANCE.includes(rfq.status)

  return (
    <div className="min-h-screen bg-surface py-12 px-4">
      <div className="max-w-3xl mx-auto">

        {/* ── Action-required banner ── */}
        {rfq.status === "AWAITING_PAYMENT" && (
          <div className="mb-6 flex items-center gap-3 px-5 py-3.5 bg-amber-500 text-white rounded-2xl shadow-lg shadow-amber-200">
            <span className="material-symbols-outlined text-2xl flex-shrink-0" style={{fontVariationSettings:"'FILL' 1"}}>notifications_active</span>
            <div className="flex-1">
              <p className="font-bold text-sm">Action Required — Upload Payment Proof</p>
              <p className="text-xs text-amber-100">Your quotation is accepted. Complete your payment to proceed.</p>
            </div>
            <button
              onClick={() => paymentRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}
              className="flex-shrink-0 px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-xs font-bold transition-colors">
              Go to Payment ↓
            </button>
          </div>
        )}

        {/* ── Page header ── */}
        <div className="flex items-center gap-4 mb-8">
          <Link to="/portal" className="p-2 hover:bg-surface-container rounded-full transition-colors text-primary">
            <span className="material-symbols-outlined">arrow_back</span>
          </Link>
          <div>
            <p className="text-xs text-outline font-mono">{rfq.rfq_number}</p>
            <h1 className="font-headline font-extrabold text-2xl text-on-surface">RFQ Details</h1>
          </div>
          <div className="ml-auto flex items-center gap-3 flex-wrap justify-end">
            <span className={`px-3 py-1.5 rounded-full text-xs font-bold ${STATUS_BADGE[rfq.status] || "bg-gray-100 text-gray-700"}`}>
              {STATUS_LABEL[rfq.status] || rfq.status}
            </span>
            {!isPostAcceptance && (
              <button onClick={() => downloadPDF(`${rfq.rfq_number}.pdf`)}
                className="flex items-center gap-2 px-4 py-2 border border-outline-variant rounded-lg text-sm font-semibold text-on-surface hover:bg-surface-container transition-colors">
                <span className="material-symbols-outlined text-base">description</span>RFQ Copy
              </button>
            )}
            {rfq.status === "QUOTATION_SENT" && (
              <>
                <button onClick={() => downloadPDF(`${rfq.rfq_number}-quotation.pdf`)}
                  className="flex items-center gap-2 px-4 py-2 signature-gradient text-white rounded-lg text-sm font-semibold hover:opacity-90 shadow-md">
                  <span className="material-symbols-outlined text-base">picture_as_pdf</span>Download Quotation
                </button>
                <button onClick={() => setShowDeclineModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-bold hover:bg-red-700 shadow-md">
                  <span className="material-symbols-outlined text-base">cancel</span>Decline
                </button>
                <button onClick={() => setShowAcceptModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-bold hover:bg-emerald-700 shadow-md">
                  <span className="material-symbols-outlined text-base">check_circle</span>Accept
                </button>
              </>
            )}
          </div>
        </div>

        <div className="space-y-6">
          {isPostAcceptance && (
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h2 className="text-sm font-bold text-gray-700 mb-4">Order Progress</h2>
              <OrderProgressStepper status={rfq.status} />
            </div>
          )}

          <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm grid grid-cols-2 md:grid-cols-4 gap-6">
            <div><p className="text-[10px] font-bold text-outline uppercase tracking-widest mb-1">Submitted</p>
              <p className="text-sm font-semibold text-on-surface">{new Date(rfq.submitted_at).toLocaleDateString()}</p></div>
            <div><p className="text-[10px] font-bold text-outline uppercase tracking-widest mb-1">Products</p>
              <p className="text-sm font-semibold text-on-surface">{rfq.items?.length} items</p></div>
            {rfq.requested_delivery_date && <div>
              <p className="text-[10px] font-bold text-outline uppercase tracking-widest mb-1">Delivery By</p>
              <p className="text-sm font-semibold text-on-surface">{rfq.requested_delivery_date}</p></div>}
            {rfq.shipping_method && <div>
              <p className="text-[10px] font-bold text-outline uppercase tracking-widest mb-1">Delivery</p>
              <p className="text-sm font-semibold text-on-surface capitalize">{rfq.shipping_method}</p></div>}
          </div>

          <div className="bg-surface-container-lowest rounded-2xl shadow-sm overflow-hidden">
            <div className="p-5 border-b border-surface-container flex items-center gap-3">
              <span className="material-symbols-outlined text-primary">medical_services</span>
              <h2 className="font-headline font-bold text-on-surface">Requested Products</h2>
            </div>
            <div className="divide-y divide-surface-container">
              {rfq.items?.map(item => (
                <div key={item.id} className="p-5 flex items-center justify-between">
                  <div>
                    <p className="font-bold text-sm text-on-surface">{item.product_name}</p>
                    <p className="text-xs text-outline">{item.brand}  {item.unit}</p>
                    {item.notes && <p className="text-xs text-on-surface-variant italic mt-1">"{item.notes}"</p>}
                  </div>
                  <div className="text-right">
                    {item.unit_price ? (
                      <div>
                        <p className="text-sm font-bold text-on-surface">{item.currency || "USD"} {parseFloat(item.unit_price).toFixed(2)} / unit</p>
                        <p className="text-xs text-primary font-semibold">Total: {item.currency || "USD"} {(parseFloat(item.unit_price) * item.quantity).toFixed(2)}</p>
                        <p className="text-[10px] text-outline uppercase">Qty: {item.quantity} {item.unit}</p>
                      </div>
                    ) : (
                      <div>
                        <p className="text-xl font-headline font-extrabold text-primary">{item.quantity}</p>
                        <p className="text-[10px] text-outline uppercase">{item.unit}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            {rfq.items?.some(i => i.unit_price) && (
              <div className="p-5 border-t border-surface-container bg-surface-container-low flex items-center justify-between">
                <span className="font-headline font-bold text-on-surface">Grand Total</span>
                <span className="font-headline font-extrabold text-xl text-primary">
                  {rfq.items[0]?.currency || "USD"}{" "}
                  {rfq.items.reduce((sum, i) => sum + (parseFloat(i.unit_price || 0) * i.quantity), 0).toFixed(2)}
                </span>
              </div>
            )}
          </div>

          {rfq.message && (
            <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm">
              <h2 className="font-headline font-bold text-on-surface mb-3 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">chat_bubble</span>Special Instructions
              </h2>
              <p className="text-sm text-on-surface-variant leading-relaxed">{rfq.message}</p>
            </div>
          )}

          {rfq.attachments?.length > 0 && (
            <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm">
              <h2 className="font-headline font-bold text-on-surface mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">attach_file</span>Uploaded Documents
              </h2>
              <div className="space-y-3">
                {rfq.attachments.map(file => (
                  <a key={file.id}
                    href={(file.file_url||file.fileUrl)?.startsWith("http") ? (file.file_url||file.fileUrl).replace("/image/upload/","/image/upload/fl_attachment/") : (file.file_url||file.fileUrl)}
                    target="_blank" rel="noreferrer"
                    className="flex items-center gap-3 p-3 bg-surface-container-low rounded-xl hover:bg-surface-container transition-colors group">
                    <span className="material-symbols-outlined text-primary">description</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-on-surface truncate">{file.file_name}</p>
                      <p className="text-xs text-outline">{(file.file_size/1024).toFixed(0)} KB</p>
                    </div>
                    <span className="material-symbols-outlined text-outline group-hover:text-primary">download</span>
                  </a>
                ))}
              </div>
            </div>
          )}

          {rfq.status === "QUOTATION_SENT" && (
            <div className="bg-green-50 border border-green-200 rounded-2xl p-6">
              <div className="flex items-start gap-4">
                <span className="material-symbols-outlined text-green-600 text-2xl" style={{fontVariationSettings:"'FILL' 1"}}>mark_email_read</span>
                <div className="flex-1">
                  <h3 className="font-headline font-bold text-green-800 mb-1">Quotation Ready — Review &amp; Respond</h3>
                  <p className="text-sm text-green-700 mb-4">Download the PDF to review pricing and terms, then Accept or Decline.</p>
                  <div className="flex flex-wrap gap-3">
                    <button onClick={() => downloadPDF(`${rfq.rfq_number}-quotation.pdf`)}
                      className="flex items-center gap-2 px-4 py-2.5 border border-green-400 text-green-800 bg-white rounded-lg text-sm font-semibold hover:bg-green-100">
                      <span className="material-symbols-outlined text-base">picture_as_pdf</span>Download Quotation PDF
                    </button>
                    <button onClick={() => setShowDeclineModal(true)}
                      className="flex items-center gap-2 px-5 py-2.5 bg-red-600 text-white rounded-lg text-sm font-bold hover:bg-red-700 shadow-md">
                      <span className="material-symbols-outlined text-base">cancel</span>Decline Quotation
                    </button>
                    <button onClick={() => setShowAcceptModal(true)}
                      className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 text-white rounded-lg text-sm font-bold hover:bg-emerald-700 shadow-md">
                      <span className="material-symbols-outlined text-base">check_circle</span>Accept Quotation
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ══ PAYMENT SECTION — anchored, scrolled to after accept ══ */}
          {(rfq.status === "AWAITING_PAYMENT" || rfq.status === "PAYMENT_SUBMITTED") && (
            <div ref={paymentRef} className="rounded-2xl overflow-hidden shadow-md border border-amber-200 scroll-mt-6">

              {/* Header bar */}
              <div className={`px-6 py-4 flex items-center gap-3 ${rfq.status === "PAYMENT_SUBMITTED" ? "bg-blue-600" : "bg-amber-500"}`}>
                <span className="material-symbols-outlined text-white text-2xl" style={{fontVariationSettings:"'FILL' 1"}}>
                  {rfq.status === "PAYMENT_SUBMITTED" ? "hourglass_top" : "payments"}
                </span>
                <div className="flex-1">
                  <h3 className="font-headline font-bold text-white text-lg leading-tight">
                    {rfq.status === "PAYMENT_SUBMITTED" ? "Payment Under Review" : "Complete Your Payment"}
                  </h3>
                  <p className="text-white/80 text-xs mt-0.5">
                    {rfq.status === "PAYMENT_SUBMITTED"
                      ? "Our team is verifying your proof. We'll notify you once approved."
                      : "Transfer the amount below and upload your receipt to confirm your order."}
                  </p>
                </div>
                {rfq.status === "PAYMENT_SUBMITTED" && (
                  <span className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-white/20 rounded-full text-white text-xs font-bold">
                    <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>
                    Reviewing
                  </span>
                )}
              </div>

              <div className="bg-white">
                {/* Amount due */}
                {rfq.items?.some(i => i.unit_price) && (
                  <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
                    <span className="text-sm text-gray-500 font-medium">Amount Due</span>
                    <span className="font-headline font-extrabold text-2xl text-amber-600">
                      {rfq.items[0]?.currency || "USD"}{" "}
                      {rfq.items.reduce((s, i) => s + (parseFloat(i.unit_price || 0) * i.quantity), 0).toFixed(2)}
                    </span>
                  </div>
                )}

                <div className="grid md:grid-cols-2 gap-0 md:divide-x divide-gray-100">
                  {/* Left — payment instructions */}
                  <div className="px-6 py-5">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">How to Pay</p>
                    <ol className="space-y-4">
                      {[
                        { icon: "account_balance", label: "Bank Transfer",   desc: "Transfer the exact amount to our bank account. Ask us via chat below for bank details." },
                        { icon: "receipt_long",    label: "Save Your Receipt", desc: "Keep your transfer receipt or take a screenshot of the confirmation." },
                        { icon: "cloud_upload",    label: "Upload Proof",     desc: "Upload the receipt using the form on the right. Accepted: JPEG, PNG, PDF." },
                        { icon: "verified",        label: "Confirmation",     desc: "Our team reviews within 1 business day and confirms your order." },
                      ].map((step, i) => (
                        <li key={i} className="flex items-start gap-3">
                          <div className="w-7 h-7 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <span className="material-symbols-outlined text-amber-600 text-sm">{step.icon}</span>
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-800">{step.label}</p>
                            <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{step.desc}</p>
                          </div>
                        </li>
                      ))}
                    </ol>
                  </div>

                  {/* Right — upload form */}
                  <div className="px-6 py-5">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">
                      {rfq.status === "PAYMENT_SUBMITTED" ? "Replace Proof (Optional)" : "Upload Payment Proof"}
                    </p>
                    <PaymentProofUpload
                      rfqId={id}
                      rejectionNote={rfq.payment_rejection_note}
                      existingProof={null}
                      onUploaded={() => queryClient.invalidateQueries({ queryKey: ["customer-rfq", id] })}
                    />
                  </div>
                </div>

                {/* Integrated chat — ask about bank details without leaving the page */}
                <div className="border-t border-gray-100">
                  <div className="px-6 py-3 bg-gray-50 flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-base">chat</span>
                    <p className="text-xs font-semibold text-gray-600">Questions about payment? Chat with our team below</p>
                  </div>
                  <div className="px-4 pb-4">
                    <RFQChat rfqId={id} isAdmin={false} isReadOnly={false} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {rfq.status === "PAYMENT_CONFIRMED" && (
            <div className="bg-teal-50 border border-teal-200 rounded-2xl p-6 flex items-start gap-4">
              <span className="material-symbols-outlined text-teal-600 text-3xl" style={{fontVariationSettings:"'FILL' 1"}}>verified</span>
              <div>
                <h3 className="font-headline font-bold text-teal-800 text-lg mb-1">Payment Confirmed!</h3>
                <p className="text-sm text-teal-700">Your payment has been verified. Your order is being prepared for shipment.</p>
              </div>
            </div>
          )}

          {rfq.status === "SHIPPED" && (
            <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-6">
              <div className="flex items-start gap-4 mb-4">
                <span className="material-symbols-outlined text-indigo-600 text-3xl" style={{fontVariationSettings:"'FILL' 1"}}>local_shipping</span>
                <div className="flex-1">
                  <h3 className="font-headline font-bold text-indigo-800 text-lg mb-1">Your Order Has Been Shipped!</h3>
                  {rfq.tracking_info ? (
                    <div className="mt-2 p-3 bg-white rounded-xl border border-indigo-200">
                      <p className="text-xs font-bold text-indigo-600 uppercase tracking-wide mb-1">Tracking Information</p>
                      <p className="text-sm text-indigo-800 font-medium">{rfq.tracking_info}</p>
                    </div>
                  ) : (
                    <p className="text-sm text-indigo-700">Your order is on its way. Tracking information will be provided if available.</p>
                  )}
                </div>
              </div>
              <button onClick={() => confirmDeliveryMutation.mutate()} disabled={confirmDeliveryMutation.isPending}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 shadow-md disabled:opacity-50">
                {confirmDeliveryMutation.isPending
                  ? <><span className="material-symbols-outlined animate-spin text-base">progress_activity</span>Processing...</>
                  : <><span className="material-symbols-outlined text-base" style={{fontVariationSettings:"'FILL' 1"}}>check_circle</span>Confirm Delivery Received</>}
              </button>
            </div>
          )}

          {rfq.status === "DELIVERED" && (
            <div className="bg-emerald-50 border border-emerald-300 rounded-2xl p-6 flex items-start gap-4">
              <span className="material-symbols-outlined text-emerald-600 text-3xl" style={{fontVariationSettings:"'FILL' 1"}}>task_alt</span>
              <div>
                <h3 className="font-headline font-bold text-emerald-800 text-lg mb-1">Order Delivered  Thank You!</h3>
                <p className="text-sm text-emerald-700">Your order has been successfully delivered and the transaction is complete.</p>
              </div>
            </div>
          )}

          {rfq.status === "DECLINED" && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
              <div className="flex items-start gap-4">
                <span className="material-symbols-outlined text-red-500 text-3xl" style={{fontVariationSettings:"'FILL' 1"}}>cancel</span>
                <div>
                  <h3 className="font-headline font-bold text-red-800 text-lg mb-1">Quotation Declined</h3>
                  <p className="text-sm text-red-700 mb-3">You have declined the quotation for <strong>{rfq.rfq_number}</strong>.</p>
                  {rfq.decline_reason && (
                    <div className="mb-4 p-3 bg-white/50 rounded-xl border border-red-200 text-sm text-red-800 italic">
                      Reason: "{rfq.decline_reason}"
                    </div>
                  )}
                  <Link to="/portal/rfq" className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-bold hover:bg-primary/90">
                    <span className="material-symbols-outlined text-base">add</span>Submit New RFQ
                  </Link>
                </div>
              </div>
            </div>
          )}

          {!isPostAcceptance && rfq.status !== "QUOTATION_SENT" && rfq.status !== "DECLINED" && (
            <div className="bg-surface-container-low rounded-2xl p-5 border border-outline-variant/20">
              <div className="flex items-start gap-3">
                <span className="material-symbols-outlined text-outline text-xl">info</span>
                <div>
                  <h3 className="font-headline font-bold text-sm text-on-surface mb-1">Quotation Pending</h3>
                  <p className="text-xs text-on-surface-variant">Your formal quotation will be available here once our team sends it.</p>
                  {rfq.verification_feedback && (
                    <div className="mt-2 p-3 bg-white rounded-xl border border-outline-variant/20 text-xs text-on-surface-variant italic">
                      Note: "{rfq.verification_feedback}"
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {isPostAcceptance && rfq.status !== "AWAITING_PAYMENT" && rfq.status !== "PAYMENT_SUBMITTED" && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-3">
                <span className="material-symbols-outlined text-primary">chat</span>
                <div>
                  <h2 className="font-headline font-bold text-on-surface">Order Chat</h2>
                  <p className="text-xs text-gray-500 mt-0.5">Communicate with our team about your order</p>
                </div>
              </div>
              <div className="p-4">
                <RFQChat rfqId={id} isAdmin={false} isReadOnly={rfq.status === "DELIVERED"} />
              </div>
            </div>
          )}

          <div className="flex gap-4">
            <Link to="/portal" className="btn-secondary flex items-center gap-2">
              <span className="material-symbols-outlined">arrow_back</span>Back to Dashboard
            </Link>
            {!isPostAcceptance && (
              <Link to="/portal/rfq" className="btn-primary flex items-center gap-2">
                <span className="material-symbols-outlined">add</span>New RFQ
              </Link>
            )}
          </div>
        </div>
      </div>

      {showDeclineModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8">
            <div className="flex items-center gap-4 mb-5">
              <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-outlined text-red-600 text-3xl" style={{fontVariationSettings:"'FILL' 1"}}>cancel</span>
              </div>
              <div>
                <h2 className="font-headline font-extrabold text-xl text-on-surface">Decline Quotation?</h2>
                <p className="text-sm text-outline font-mono">{rfq.rfq_number}</p>
              </div>
            </div>
            <p className="text-sm text-on-surface-variant mb-5">Are you sure? You can always submit a new RFQ.</p>
            {declineMutation.isError && <p className="text-sm text-red-600 mb-4 bg-red-50 px-4 py-2 rounded-lg">Something went wrong. Please try again.</p>}
            <div className="flex gap-3">
              <button onClick={() => setShowDeclineModal(false)} disabled={declineMutation.isPending}
                className="flex-1 px-4 py-3 border border-outline-variant rounded-xl text-sm font-semibold text-on-surface hover:bg-surface-container disabled:opacity-50">Cancel</button>
              <button onClick={() => declineMutation.mutate()} disabled={declineMutation.isPending}
                className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl text-sm font-bold hover:bg-red-700 shadow-md disabled:opacity-50 flex items-center justify-center gap-2">
                {declineMutation.isPending ? <><span className="material-symbols-outlined animate-spin text-base">progress_activity</span>Processing...</> : "Confirm Decline"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showAcceptModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-outlined text-emerald-600 text-3xl" style={{fontVariationSettings:"'FILL' 1"}}>handshake</span>
              </div>
              <div>
                <h2 className="font-headline font-extrabold text-xl text-on-surface">Accept Quotation?</h2>
                <p className="text-sm text-outline">{rfq.rfq_number}</p>
              </div>
            </div>
            <p className="text-sm text-on-surface-variant mb-4">By accepting, you agree to the pricing and terms. You will be taken to the payment section to upload your proof.</p>
            {rfq.items?.some(i => i.unit_price) && (
              <div className="bg-surface-container-low rounded-xl p-4 mb-6">
                <p className="text-xs font-bold text-outline uppercase tracking-widest mb-3">Order Summary</p>
                <div className="space-y-2">
                  {rfq.items.filter(i => i.unit_price).map(item => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span className="text-on-surface-variant">{item.product_name} x {item.quantity}</span>
                      <span className="font-semibold text-on-surface">{item.currency||"USD"} {(parseFloat(item.unit_price)*item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                  <div className="border-t border-outline-variant/30 pt-2 flex justify-between font-bold">
                    <span className="text-on-surface">Total</span>
                    <span className="text-primary text-base">{rfq.items[0]?.currency||"USD"} {rfq.items.reduce((s,i)=>s+(parseFloat(i.unit_price||0)*i.quantity),0).toFixed(2)}</span>
                  </div>
                </div>
              </div>
            )}
            {acceptMutation.isError && <p className="text-sm text-red-600 mb-4 bg-red-50 px-4 py-2 rounded-lg">Something went wrong. Please try again.</p>}
            <div className="flex gap-3">
              <button onClick={() => setShowAcceptModal(false)} disabled={acceptMutation.isPending}
                className="flex-1 px-4 py-3 border border-outline-variant rounded-xl text-sm font-semibold text-on-surface hover:bg-surface-container disabled:opacity-50">Cancel</button>
              <button onClick={() => acceptMutation.mutate()} disabled={acceptMutation.isPending}
                className="flex-1 px-4 py-3 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 shadow-md disabled:opacity-50 flex items-center justify-center gap-2">
                {acceptMutation.isPending
                  ? <><span className="material-symbols-outlined animate-spin text-base">progress_activity</span>Processing...</>
                  : <><span className="material-symbols-outlined text-base" style={{fontVariationSettings:"'FILL' 1"}}>check_circle</span>Accept &amp; Proceed to Payment</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
