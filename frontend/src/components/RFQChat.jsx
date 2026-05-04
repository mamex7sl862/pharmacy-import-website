import { useState, useRef, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../lib/api'

function FilePreview({ fileUrl, fileName, mimeType }) {
  if (!fileUrl) return null
  const isImage = mimeType?.startsWith('image/')
  return (
    <a href={fileUrl} target="_blank" rel="noopener noreferrer"
      className="mt-1 flex items-center gap-2 p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors max-w-[200px]">
      {isImage ? (
        <img src={fileUrl} alt={fileName} className="w-12 h-12 object-cover rounded" />
      ) : (
        <span className="material-symbols-outlined text-2xl">picture_as_pdf</span>
      )}
      <span className="text-xs truncate">{fileName}</span>
    </a>
  )
}

export default function RFQChat({ rfqId, isAdmin, isReadOnly }) {
  const qc = useQueryClient()
  const [text, setText]         = useState('')
  const [file, setFile]         = useState(null)
  const [sending, setSending]   = useState(false)
  const bottomRef               = useRef()
  const fileInputRef            = useRef()

  const endpoint = isAdmin
    ? `/admin/rfqs/${rfqId}/chat`
    : `/customer/rfqs/${rfqId}/chat`

  const { data, isLoading } = useQuery({
    queryKey: ['rfq-chat', rfqId, isAdmin ? 'admin' : 'customer'],
    queryFn: () => api.get(endpoint).then(r => r.data),
    refetchInterval: 5000,
  })

  const messages = data?.messages || []
  const chatStatus = data?.chat?.status

  // Auto-scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  async function handleSend(e) {
    e.preventDefault()
    if ((!text.trim() && !file) || sending) return
    setSending(true)
    try {
      const msgEndpoint = isAdmin
        ? `/admin/rfqs/${rfqId}/chat/messages`
        : `/customer/rfqs/${rfqId}/chat/messages`

      if (isAdmin) {
        await api.post(msgEndpoint, { message: text.trim() })
      } else {
        const form = new FormData()
        if (text.trim()) form.append('message', text.trim())
        if (file) form.append('file', file)
        await api.post(msgEndpoint, form, { headers: { 'Content-Type': 'multipart/form-data' } })
      }
      setText('')
      setFile(null)
      qc.invalidateQueries({ queryKey: ['rfq-chat', rfqId] })
    } catch (err) {
      console.error('Send message failed:', err.message)
    } finally {
      setSending(false)
    }
  }

  const locked = isReadOnly || chatStatus === 'CLOSED'

  return (
    <div className="flex flex-col bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100 bg-gray-50">
        <span className="material-symbols-outlined text-primary text-lg">chat</span>
        <p className="text-sm font-semibold text-gray-800">Order Chat</p>
        {locked && (
          <span className="ml-auto text-xs text-gray-400 flex items-center gap-1">
            <span className="material-symbols-outlined text-sm">lock</span> Read-only
          </span>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[200px] max-h-[400px]">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <span className="material-symbols-outlined animate-spin text-gray-400">progress_activity</span>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 py-8">
            <span className="material-symbols-outlined text-3xl mb-2">chat_bubble_outline</span>
            <p className="text-sm">No messages yet. Start the conversation.</p>
          </div>
        ) : (
          messages.map(msg => {
            const isOwn = isAdmin ? msg.isFromAdmin : !msg.isFromAdmin
            return (
              <div key={msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
                  isOwn
                    ? 'bg-primary text-white rounded-br-sm'
                    : 'bg-gray-100 text-gray-800 rounded-bl-sm'
                }`}>
                  {!isOwn && (
                    <p className="text-[10px] font-bold mb-1 opacity-60 uppercase tracking-wide">
                      {msg.isFromAdmin ? 'Admin' : msg.senderName}
                    </p>
                  )}
                  {msg.message && <p className="text-sm leading-relaxed">{msg.message}</p>}
                  <FilePreview fileUrl={msg.fileUrl} fileName={msg.fileName} mimeType={msg.mimeType} />
                  <p className={`text-[10px] mt-1 ${isOwn ? 'text-white/60' : 'text-gray-400'} text-right`}>
                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            )
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      {locked ? (
        <div className="px-4 py-3 border-t border-gray-100 bg-gray-50 text-center">
          <p className="text-xs text-gray-400">Chat is closed — order delivered</p>
        </div>
      ) : (
        <form onSubmit={handleSend} className="border-t border-gray-100 p-3">
          {/* File preview (customer only) */}
          {!isAdmin && file && (
            <div className="flex items-center gap-2 mb-2 p-2 bg-blue-50 rounded-lg">
              <span className="material-symbols-outlined text-blue-600 text-sm">attach_file</span>
              <span className="text-xs text-blue-700 truncate flex-1">{file.name}</span>
              <button type="button" onClick={() => setFile(null)} className="text-blue-400 hover:text-blue-600">
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>
          )}
          <div className="flex items-end gap-2">
            {/* File attach (customer only) */}
            {!isAdmin && (
              <>
                <input ref={fileInputRef} type="file" className="hidden"
                  onChange={e => e.target.files[0] && setFile(e.target.files[0])} />
                <button type="button" onClick={() => fileInputRef.current?.click()}
                  className="p-2 text-gray-400 hover:text-primary transition-colors flex-shrink-0">
                  <span className="material-symbols-outlined text-xl">attach_file</span>
                </button>
              </>
            )}
            <textarea
              value={text}
              onChange={e => setText(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(e) } }}
              placeholder="Type a message..."
              rows={1}
              className="flex-1 resize-none border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
            <button type="submit" disabled={(!text.trim() && !file) || sending}
              className="p-2 bg-primary text-white rounded-xl hover:bg-primary/90 disabled:opacity-40 transition-all flex-shrink-0">
              {sending
                ? <span className="material-symbols-outlined text-xl animate-spin">progress_activity</span>
                : <span className="material-symbols-outlined text-xl">send</span>
              }
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
