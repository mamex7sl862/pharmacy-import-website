const STEPS = [
  { key: 'AWAITING_PAYMENT',   label: 'Payment Pending',   icon: 'payments' },
  { key: 'PAYMENT_SUBMITTED',  label: 'Proof Submitted',   icon: 'upload_file' },
  { key: 'PAYMENT_CONFIRMED',  label: 'Payment Confirmed', icon: 'verified' },
  { key: 'SHIPPED',            label: 'Shipped',           icon: 'local_shipping' },
  { key: 'DELIVERED',          label: 'Delivered',         icon: 'check_circle' },
]

export default function OrderProgressStepper({ status }) {
  const currentIndex = STEPS.findIndex(s => s.key === status)
  if (currentIndex === -1) return null

  return (
    <div className="w-full py-4">
      <div className="flex items-center justify-between relative">
        {/* Connector line */}
        <div className="absolute top-5 left-0 right-0 h-0.5 bg-gray-200 z-0" />
        <div
          className="absolute top-5 left-0 h-0.5 bg-primary z-0 transition-all duration-500"
          style={{ width: `${(currentIndex / (STEPS.length - 1)) * 100}%` }}
        />

        {STEPS.map((step, i) => {
          const isCompleted = i < currentIndex
          const isActive    = i === currentIndex
          const isPending   = i > currentIndex

          return (
            <div key={step.key} className="flex flex-col items-center z-10 flex-1">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                isCompleted ? 'bg-primary border-primary text-white' :
                isActive    ? 'bg-primary border-primary text-white shadow-lg shadow-primary/30 scale-110' :
                              'bg-white border-gray-300 text-gray-400'
              }`}>
                {isCompleted ? (
                  <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>check</span>
                ) : (
                  <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}>{step.icon}</span>
                )}
              </div>
              <p className={`mt-2 text-xs font-semibold text-center leading-tight max-w-[70px] ${
                isActive ? 'text-primary' : isCompleted ? 'text-gray-700' : 'text-gray-400'
              }`}>
                {step.label}
              </p>
            </div>
          )
        })}
      </div>
    </div>
  )
}
