import { useState, useRef, useEffect, useCallback } from 'react'
import { useLocation } from 'react-router-dom'
import useAuthStore from '../store/authStore'
import api from '../lib/api'

const POLL_INTERVAL = 3000 // ms — how often to check for new messages

export default function LiveChat() {
  const location = useLocation()
  const { user } = useAuthStore()

  const [isOpen, setIsOpen]       = useState(false)
  const [inputValue, setInputValue] = useState('')
  const [chatId, setChatId]       = useState(null)   // DB session id
  const [messages, setMessages]   = useState([])
  const [loading, setLoading]     = useState(false)
  const [sending, setSending]     = useState(false)

  const msgsEndRef  = useRef(null)
  const pollRef     = useRef(null)
  const chatIdRef   = useRef(null) // keep latest chatId accessible inside interval

  // Sync ref so the poll closure always has the latest chatId
  useEffect(() => { chatIdRef.current = chatId }, [chatId])

  // Scroll to bottom whenever messages change
  useEffect(() => {
    if (isOpen && msgsEndRef.current) {
      msgsEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, isOpen])

  // ── Fetch messages from DB ──────────────────────────────────────────────────
  const fetchMessages = useCallback(async (id) => {
    if (!id) return
    try {
      const { data } = await api.get(`/chat/${id}/messages`)
      setMessages(data)
    } catch (_) {}
  }, [])

  // ── Start / resume a chat session ───────────────────────────────────────────
  const initSession = useCallback(async () => {
    if (chatId) return // already have a session
    setLoading(true)
    try {
      const guestName = user?.fullName || 'Guest'
      const { data } = await api.post('/chat/session', {
        guestName,
        customerId: user?.id || null,
      })
      setChatId(data.id)
      await fetchMessages(data.id)
    } catch (_) {
      // If backend is down, show a local fallback message
      setMessages([{
        id: 'fallback',
        is_from_admin: true,
        sender_name: 'PharmaLink Support',
        message: 'Hello! How can we help you today?',
        created_at: new Date().toISOString(),
      }])
    } finally {
      setLoading(false)
    }
  }, [chatId, user, fetchMessages])

  // ── Open chat: init session + start polling ─────────────────────────────────
  useEffect(() => {
    if (!isOpen) {
      clearInterval(pollRef.current)
      return
    }
    initSession()
    pollRef.current = setInterval(() => {
      fetchMessages(chatIdRef.current)
    }, POLL_INTERVAL)
    return () => clearInterval(pollRef.current)
  }, [isOpen, initSession, fetchMessages])

  // ── Hide on admin pages — AFTER all hooks ───────────────────────────────────
  if (location.pathname.startsWith('/admin')) return null

  // ── Send a message ──────────────────────────────────────────────────────────
  const handleSend = async (e) => {
    e.preventDefault()
    if (!inputValue.trim() || !chatId || sending) return
    const text = inputValue.trim()
    setInputValue('')
    setSending(true)

    // Optimistic update
    const optimistic = {
      id: `opt-${Date.now()}`,
      is_from_admin: false,
      sender_name: user?.fullName || 'You',
      message: text,
      created_at: new Date().toISOString(),
    }
    setMessages(prev => [...prev, optimistic])

    try {
      await api.post(`/chat/${chatId}/messages`, {
        message: text,
        senderName: user?.fullName || 'Guest',
        senderId: user?.id || null,
        isAdmin: false,
      })
      // Refresh to get the real DB record
      await fetchMessages(chatId)
    } catch (_) {
      // Keep optimistic message visible even if request failed
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">

      {/* ── Chat Window ─────────────────────────────────────────────────────── */}
      <div className={`w-80 sm:w-96 bg-white shadow-2xl rounded-2xl overflow-hidden flex flex-col border border-outline-variant/20 transition-all duration-300 origin-bottom-right mb-4 ${
        isOpen ? 'scale-100 opacity-100 pointer-events-auto h-[500px]' : 'scale-75 opacity-0 pointer-events-none h-0'
      }`}>

        {/* Header */}
        <div className="bg-primary text-white p-4 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center font-bold text-lg">E</div>
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 border-2 border-primary rounded-full" />
            </div>
            <div>
              <h4 className="font-headline font-bold leading-tight">PharmaLink Support</h4>
              <p className="text-[10px] text-blue-100 font-medium">
                {user ? `Signed in as ${user.fullName}` : 'Emily is active now'}
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center transition-colors text-white/80 hover:text-white"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-surface-container-lowest">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <span className="material-symbols-outlined animate-spin text-primary text-3xl">progress_activity</span>
            </div>
          ) : (
            <>
              <p className="text-[10px] text-center text-on-surface-variant font-medium uppercase tracking-widest py-2">Today</p>
              {messages.map((m) => (
                <div key={m.id} className={`flex ${m.is_from_admin ? 'justify-start' : 'justify-end'}`}>
                  <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
                    m.is_from_admin
                      ? 'bg-surface-container-low text-on-surface border border-outline-variant/10 rounded-tl-sm'
                      : 'bg-primary text-white rounded-tr-sm'
                  }`}>
                    {!m.is_from_admin ? null : (
                      <p className="text-[10px] font-bold text-primary mb-1">{m.sender_name}</p>
                    )}
                    {m.message}
                  </div>
                </div>
              ))}
              <div ref={msgsEndRef} />
            </>
          )}
        </div>

        {/* Input */}
        <form onSubmit={handleSend} className="p-3 border-t border-outline-variant/10 bg-white">
          <div className="relative flex items-center">
            <input
              type="text"
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              placeholder={chatId ? 'Send a message...' : 'Connecting...'}
              disabled={!chatId || sending}
              className="w-full bg-surface-container-high rounded-full py-3.5 pl-5 pr-14 outline-none focus:ring-1 focus:ring-primary focus:bg-surface-container-lowest text-sm transition-all text-on-surface disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={!inputValue.trim() || !chatId || sending}
              className="absolute right-1.5 w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center disabled:opacity-40 transition-colors"
            >
              <span className="material-symbols-outlined text-[20px] ml-0.5">
                {sending ? 'progress_activity' : 'send'}
              </span>
            </button>
          </div>
        </form>
      </div>

      {/* ── Toggle Button ────────────────────────────────────────────────────── */}
      <button
        onClick={() => setIsOpen(o => !o)}
        className="w-16 h-16 bg-primary text-white rounded-full shadow-[0_10px_25px_rgba(0,63,135,0.4)] flex items-center justify-center hover:scale-105 active:scale-95 transition-all outline-none"
      >
        <span className="material-symbols-outlined text-3xl">
          {isOpen ? 'expand_more' : 'chat_bubble'}
        </span>
      </button>
    </div>
  )
}
