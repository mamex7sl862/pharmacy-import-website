import { useState, useRef, useEffect, useCallback } from 'react'
import { useLocation } from 'react-router-dom'
import useAuthStore from '../store/authStore'
import api from '../lib/api'

const POLL_INTERVAL = 3000

export default function LiveChat() {
  const location = useLocation()
  const { user } = useAuthStore()

  const [isOpen, setIsOpen]         = useState(false)
  const [inputValue, setInputValue] = useState('')
  const [chatId, setChatId]         = useState(null)
  const [messages, setMessages]     = useState([])
  const [loading, setLoading]       = useState(false)
  const [sending, setSending]       = useState(false)
  const [isOnline, setIsOnline]     = useState(true)
  const [initError, setInitError]   = useState(false)

  const msgsEndRef  = useRef(null)
  const pollRef     = useRef(null)
  const chatIdRef   = useRef(null)
  const containerRef = useRef(null)  // for click-outside detection

  useEffect(() => { chatIdRef.current = chatId }, [chatId])

  // Scroll to bottom on new messages
  useEffect(() => {
    if (isOpen && msgsEndRef.current) {
      msgsEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, isOpen])

  // Click outside to close
  useEffect(() => {
    if (!isOpen) return
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  const fetchMessages = useCallback(async (id) => {
    if (!id) return
    try {
      const { data } = await api.get(`/chat/${id}/messages`)
      setMessages(data)
    } catch (_) {}
  }, [])

  const initSession = useCallback(async () => {
    if (chatId) return
    setLoading(true)
    setInitError(false)
    try {
      const guestName = user?.fullName || 'Guest'
      const { data } = await api.post('/chat/session', {
        guestName,
        customerId: user?.id || null,
      })
      setChatId(data.id)
      setIsOnline(true)
      await fetchMessages(data.id)
    } catch (_) {
      setInitError(true)
      setIsOnline(false)
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

  if (location.pathname.startsWith('/admin')) return null

  const handleSend = async (e) => {
    e.preventDefault()
    if (!inputValue.trim() || !chatId || sending) return
    const text = inputValue.trim()
    setInputValue('')
    setSending(true)

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
      await fetchMessages(chatId)
    } catch (_) {
    } finally {
      setSending(false)
    }
  }

  const formatTime = (dateStr) => {
    return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div
      ref={containerRef}
      className={`fixed z-50 flex flex-col items-end ${
        location.pathname.startsWith('/portal/rfq')
          ? 'bottom-20 sm:bottom-24 right-4 sm:right-6'
          : 'bottom-4 sm:bottom-6 right-4 sm:right-6'
      }`}
    >
      {/* ── Chat Window ──────────────────────────────────────────────────────── */}
      <div
        className={`w-[340px] sm:w-[380px] bg-white shadow-2xl rounded-2xl overflow-hidden flex flex-col border border-gray-200 mb-3 transition-all duration-300 origin-bottom-right ${
          isOpen
            ? 'opacity-100 scale-100 pointer-events-auto translate-y-0'
            : 'opacity-0 scale-95 pointer-events-none translate-y-4'
        }`}
        style={{
          height: isOpen ? 'min(480px, calc(100vh - 80px))' : '0px',
          maxHeight: 'calc(100vh - 80px)',
          transition: 'height 0.3s ease, opacity 0.3s ease, transform 0.3s ease',
        }}
      >
        {/* ── Header ─────────────────────────────────────────────────────────── */}
        <div className="bg-primary px-4 py-3 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="relative flex-shrink-0">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-white font-bold text-base">
                P
              </div>
              <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-primary ${isOnline ? 'bg-green-400' : 'bg-gray-400'}`} />
            </div>
            <div>
              <p className="text-white font-bold text-sm leading-tight">PharmaLink Support</p>
              <p className="text-blue-200 text-[11px] flex items-center gap-1">
                <span className={`w-1.5 h-1.5 rounded-full inline-block ${isOnline ? 'bg-green-300' : 'bg-gray-300'}`} />
                {isOnline ? 'Online — typically replies instantly' : 'Offline'}
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="w-8 h-8 rounded-full hover:bg-white/15 flex items-center justify-center transition-colors text-white/80 hover:text-white"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        {/* ── Messages ───────────────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 bg-gray-50 min-h-0">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <span className="material-symbols-outlined animate-spin text-primary text-3xl">progress_activity</span>
            </div>
          ) : initError ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
              <span className="material-symbols-outlined text-4xl text-gray-300">wifi_off</span>
              <p className="text-sm font-semibold text-gray-700">Unable to connect</p>
              <p className="text-xs text-gray-500">Support service is temporarily unavailable.</p>
              <button
                onClick={() => { setInitError(false); setChatId(null); initSession() }}
                className="mt-1 px-4 py-2 bg-primary text-white text-xs font-bold rounded-lg hover:bg-primary/90 transition-colors"
              >
                Retry
              </button>
            </div>
          ) : (
            <>
              {/* Date separator */}
              <div className="flex items-center gap-2 py-1">
                <div className="flex-1 h-px bg-gray-200" />
                <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">Today</span>
                <div className="flex-1 h-px bg-gray-200" />
              </div>

              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex flex-col ${m.is_from_admin ? 'items-start' : 'items-end'}`}
                >
                  {/* Sender label — only for admin messages */}
                  {m.is_from_admin && (
                    <p className="text-[10px] font-semibold text-primary ml-1 mb-1">{m.sender_name}</p>
                  )}

                  <div className={`max-w-[78%] px-3.5 py-2.5 text-sm leading-relaxed ${
                    m.is_from_admin
                      ? 'bg-white text-gray-800 rounded-2xl rounded-tl-sm border border-gray-200 shadow-sm'
                      : 'bg-primary text-white rounded-2xl rounded-tr-sm shadow-sm'
                  }`}>
                    {m.message}
                  </div>

                  {/* Timestamp */}
                  <p className={`text-[10px] text-gray-400 mt-1 ${m.is_from_admin ? 'ml-1' : 'mr-1'}`}>
                    {formatTime(m.created_at)}
                  </p>
                </div>
              ))}
              <div ref={msgsEndRef} />
            </>
          )}
        </div>

        {/* ── Input ──────────────────────────────────────────────────────────── */}
        <form
          onSubmit={handleSend}
          className="flex-shrink-0 px-3 py-3 border-t border-gray-100 bg-white flex items-center gap-2"
        >
          <input
            type="text"
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            placeholder={initError ? 'Connection failed…' : chatId ? 'Type a message…' : 'Connecting…'}
            disabled={!chatId || sending || initError}
            className="flex-1 bg-gray-100 rounded-full py-2.5 px-4 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all text-gray-800 placeholder:text-gray-400 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!inputValue.trim() || !chatId || sending || initError}
            className="w-9 h-9 bg-primary text-white rounded-full flex items-center justify-center flex-shrink-0 disabled:opacity-40 hover:bg-primary/90 active:scale-95 transition-all"
          >
            <span className="material-symbols-outlined text-[18px]" style={{ marginLeft: '2px' }}>
              {sending ? 'progress_activity' : 'send'}
            </span>
          </button>
        </form>
      </div>

      {/* ── Toggle Button ────────────────────────────────────────────────────── */}
      <button
        onClick={() => setIsOpen(o => !o)}
        className="w-14 h-14 bg-primary text-white rounded-full shadow-[0_8px_24px_rgba(0,63,135,0.4)] flex items-center justify-center hover:scale-105 active:scale-95 transition-all outline-none relative"
      >
        <span className={`material-symbols-outlined text-2xl transition-transform duration-300 ${isOpen ? 'rotate-180' : 'rotate-0'}`}>
          {isOpen ? 'keyboard_arrow_down' : 'chat_bubble'}
        </span>
        {/* Unread dot — shows when closed and there are messages */}
        {!isOpen && messages.some(m => m.is_from_admin) && (
          <span className="absolute top-0 right-0 w-3.5 h-3.5 bg-red-500 rounded-full border-2 border-white" />
        )}
      </button>
    </div>
  )
}
