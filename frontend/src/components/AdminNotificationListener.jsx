import { useEffect, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import toast, { Toaster } from 'react-hot-toast'
import { useNavigate, useLocation } from 'react-router-dom'
import api from '../lib/api'
import useAuthStore from '../store/authStore'

export default function AdminNotificationListener() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()
  const lastStateRef = useRef({}) // { chatId: lastMsgId, lastRfqCount: number }

  // Poll for chat sessions to detect new unread messages
  const { data: sessions = [] } = useQuery({
    queryKey: ['admin-chat-notifications'],
    queryFn: () => api.get('/chat/admin/sessions').then(r => r.data),
    refetchInterval: 5000, // Poll every 5 seconds
    enabled: !!user && user.role === 'admin'
  })

  // Poll for new RFQs
  const { data: rfqStats } = useQuery({
    queryKey: ['admin-rfq-notifications'],
    queryFn: () => api.get('/admin/rfqs?status=NEW&limit=1').then(r => ({ 
      count: r.data.totalCount || 0,
      latest: r.data.items?.[0] || null 
    })),
    refetchInterval: 10000,
    enabled: !!user && user.role === 'admin'
  })

  // Poll for payment submissions
  const { data: paymentStats } = useQuery({
    queryKey: ['admin-payment-notifications'],
    queryFn: () => api.get('/admin/rfqs?status=PAYMENT_SUBMITTED&limit=1').then(r => ({
      count: r.data.totalCount || 0,
      latest: r.data.items?.[0] || null
    })),
    refetchInterval: 10000,
    enabled: !!user && user.role === 'admin'
  })

  // Handle chat notifications
  useEffect(() => {
    if (!sessions.length) return

    sessions.forEach(s => {
      const prevLastMsgAt = lastStateRef.current[`chat_${s.id}`]
      const currentLastMsgAt = new Date(s.last_msg_at).getTime()

      // If we have a new message and it's unread
      if (prevLastMsgAt && currentLastMsgAt > prevLastMsgAt && s.unreadCount > 0) {
        // Don't show toast if we are already on the chat page
        const isCurrentlyViewing = location.pathname === '/admin/chat'
        
        if (!isCurrentlyViewing) {
          toast.custom((t) => (
            <div
              className={`${
                t.visible ? 'animate-enter' : 'animate-leave'
              } max-w-md w-full bg-white shadow-2xl rounded-2xl pointer-events-auto flex ring-1 ring-black ring-opacity-5 p-4 cursor-pointer hover:bg-gray-50 transition-colors`}
              onClick={() => {
                toast.dismiss(t.id)
                navigate('/admin/chat')
              }}
            >
              <div className="flex-1 w-0">
                <div className="flex items-start">
                  <div className="flex-shrink-0 pt-0.5">
                    <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold">
                      {(s.customerFull || s.guest_name || 'G').charAt(0).toUpperCase()}
                    </div>
                  </div>
                  <div className="ml-3 flex-1">
                    <p className="text-sm font-bold text-gray-900">
                      💬 New message from {s.customerFull || s.guest_name}
                    </p>
                    <p className="mt-1 text-sm text-gray-500 line-clamp-1 italic">
                      "{s.lastMessage}"
                    </p>
                  </div>
                </div>
              </div>
              <div className="ml-4 flex-shrink-0 flex">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    toast.dismiss(t.id)
                  }}
                  className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-gray-400 hover:text-gray-500 focus:outline-none"
                >
                  <span className="material-symbols-outlined text-sm">close</span>
                </button>
              </div>
            </div>
          ), {
            duration: 6000,
            position: 'top-right',
          })
        }
      }
      
      // Update ref state
      lastStateRef.current[`chat_${s.id}`] = currentLastMsgAt
    })
  }, [sessions, location.pathname, navigate])

  // Handle RFQ notifications
  useEffect(() => {
    if (!rfqStats) return

    const prevRfqCount = lastStateRef.current.rfqCount || 0
    const currentRfqCount = rfqStats.count

    // If we have new RFQs
    if (prevRfqCount > 0 && currentRfqCount > prevRfqCount) {
      const newRfqsCount = currentRfqCount - prevRfqCount
      const isCurrentlyViewing = location.pathname.startsWith('/admin/rfqs')
      
      if (!isCurrentlyViewing) {
        toast.custom((t) => (
          <div
            className={`${
              t.visible ? 'animate-enter' : 'animate-leave'
            } max-w-md w-full bg-white shadow-2xl rounded-2xl pointer-events-auto flex ring-1 ring-black ring-opacity-5 p-4 cursor-pointer hover:bg-gray-50 transition-colors`}
            onClick={() => {
              toast.dismiss(t.id)
              navigate('/admin/rfqs')
            }}
          >
            <div className="flex-1 w-0">
              <div className="flex items-start">
                <div className="flex-shrink-0 pt-0.5">
                  <div className="h-10 w-10 rounded-full bg-green-600 flex items-center justify-center text-white text-xs font-bold">
                    <span className="material-symbols-outlined text-sm">request_quote</span>
                  </div>
                </div>
                <div className="ml-3 flex-1">
                  <p className="text-sm font-bold text-gray-900">
                    📋 {newRfqsCount === 1 ? 'New RFQ received' : `${newRfqsCount} new RFQs received`}
                  </p>
                  {rfqStats.latest && (
                    <p className="mt-1 text-sm text-gray-500">
                      From {rfqStats.latest.customerName || 'Customer'} • {rfqStats.latest.itemCount} items
                    </p>
                  )}
                </div>
              </div>
            </div>
            <div className="ml-4 flex-shrink-0 flex">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  toast.dismiss(t.id)
                }}
                className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-gray-400 hover:text-gray-500 focus:outline-none"
              >
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>
          </div>
        ), {
          duration: 8000,
          position: 'top-right',
        })
      }
    }
    
    // Update ref state
    lastStateRef.current.rfqCount = currentRfqCount
  }, [rfqStats, location.pathname, navigate])

  // Handle payment submission notifications
  useEffect(() => {
    if (!paymentStats) return
    const prevCount = lastStateRef.current.paymentCount || 0
    const currentCount = paymentStats.count
    if (prevCount > 0 && currentCount > prevCount) {
      const isViewing = location.pathname.startsWith('/admin/rfqs')
      if (!isViewing) {
        toast.custom((t) => (
          <div
            className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-md w-full bg-white shadow-2xl rounded-2xl pointer-events-auto flex ring-1 ring-black ring-opacity-5 p-4 cursor-pointer hover:bg-gray-50 transition-colors`}
            onClick={() => {
              toast.dismiss(t.id)
              if (paymentStats.latest?.id) navigate(`/admin/rfqs/${paymentStats.latest.id}`)
              else navigate('/admin/rfqs')
            }}
          >
            <div className="flex-1 w-0">
              <div className="flex items-start">
                <div className="flex-shrink-0 pt-0.5">
                  <div className="h-10 w-10 rounded-full bg-amber-500 flex items-center justify-center text-white text-xs font-bold">
                    <span className="material-symbols-outlined text-sm">payments</span>
                  </div>
                </div>
                <div className="ml-3 flex-1">
                  <p className="text-sm font-bold text-gray-900">💳 Payment proof submitted — waiting approval</p>
                  {paymentStats.latest && (
                    <p className="mt-1 text-sm text-gray-500">
                      From {paymentStats.latest.customerName || 'Customer'} — {paymentStats.latest.rfqNumber}
                    </p>
                  )}
                </div>
              </div>
            </div>
            <div className="ml-4 flex-shrink-0 flex">
              <button onClick={(e) => { e.stopPropagation(); toast.dismiss(t.id) }}
                className="p-4 flex items-center justify-center text-sm font-medium text-gray-400 hover:text-gray-500">
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>
          </div>
        ), { duration: 8000, position: 'top-right' })
      }
    }
    lastStateRef.current.paymentCount = currentCount
  }, [paymentStats, location.pathname, navigate])

  return <Toaster />
}
