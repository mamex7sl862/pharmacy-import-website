import { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../lib/api'
import AdminLayout from '../components/AdminLayout'
import useAuthStore from '../store/authStore'

export default function AdminChat() {
  const { t } = useTranslation()
  const { user } = useAuthStore()
  const queryClient = useQueryClient()
  const [selectedChat, setSelectedChat] = useState(null)
  const [inputValue, setInputValue] = useState('')
  const [sidebarSearch, setSidebarSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL') // ALL, OPEN, CLOSED
  const [threadSearch, setThreadSearch] = useState('')
  const [isThreadSearchOpen, setIsThreadSearchOpen] = useState(false)
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  
  const markAsReadMutation = useMutation({
    mutationFn: (id) => api.post(`/chat/admin/${id}/read`),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-chat-sessions'])
      queryClient.invalidateQueries(['admin-chat-sessions-badge'])
    }
  })

  const msgsEndRef = useRef(null)
  const fileInputRef = useRef(null)

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  // 1. Fetch all chat sessions
  const { data: sessions = [], isLoading: loadingSessions } = useQuery({
    queryKey: ['admin-chat-sessions'],
    queryFn: () => api.get('/chat/admin/sessions').then(r => r.data),
    refetchInterval: 3000,
    onSuccess: (data) => {
       // If currently selected chat has new messages, mark as read
       const active = data.find(s => s.id === selectedChat?.id)
       if (active && active.unreadCount > 0) {
         markAsReadMutation.mutate(active.id)
       }
    }
  })

  // Ensure we have the freshest version of the selected chat from the sessions list
  const activeChat = sessions.find(s => s.id === selectedChat?.id) || selectedChat;

  // 2. Fetch messages for selected chat
  const { data: messages = [], isLoading: loadingMessages } = useQuery({
    queryKey: ['admin-chat-messages', selectedChat?.id],
    queryFn: () => api.get(`/chat/${selectedChat.id}/messages`).then(r => r.data),
    enabled: !!selectedChat,
    refetchInterval: 3000, // Poll for new messages more frequently when active
  })

  // 3. Send message mutation
  const sendMutation = useMutation({
    mutationFn: (text) => api.post(`/chat/${selectedChat.id}/messages`, {
      message: text,
      senderName: user?.fullName || 'Admin',
      senderId: user?.id,
      isAdmin: true
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-chat-messages', selectedChat?.id])
      setInputValue('')
    }
  })

  // 4. Update status mutation
  const statusMutation = useMutation({
    mutationFn: ({ chatId, status }) => api.patch(`/chat/admin/${chatId}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-chat-sessions'])
      setIsMoreMenuOpen(false)
    }
  })

  // 5. File upload mutation
  const uploadMutation = useMutation({
    mutationFn: (formData) => api.post(`/chat/${selectedChat.id}/files`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-chat-messages', selectedChat?.id])
      setIsUploading(false)
    },
    onError: () => setIsUploading(false)
  })

  useEffect(() => {
    if (msgsEndRef.current) {
      msgsEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  const handleSelectChat = (chat) => {
    setSelectedChat(chat)
    if (chat.unreadCount > 0) {
      markAsReadMutation.mutate(chat.id)
    }
  }

  const handleSend = async (e) => {
    e.preventDefault()
    if (!inputValue.trim() || !selectedChat) return
    sendMutation.mutate(inputValue)
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (!file || !selectedChat) return

    const formData = new FormData()
    formData.append('file', file)
    formData.append('senderName', user?.fullName || 'Admin')
    formData.append('senderId', user?.id)
    formData.append('isAdmin', 'true')

    setIsUploading(true)
    uploadMutation.mutate(formData)
    e.target.value = null // reset
  }

  // Filter sessions
  const filteredSessions = sessions.filter(s => {
    const name = (s.customerFull || s.guest_name || '').toLowerCase()
    const matchesSearch = name.includes(sidebarSearch.toLowerCase())
    const matchesStatus = statusFilter === 'ALL' || s.status === statusFilter
    return matchesSearch && matchesStatus
  })

  // Filter messages in thread if search is open
  const displayMessages = isThreadSearchOpen && threadSearch 
    ? messages.filter(m => m.message.toLowerCase().includes(threadSearch.toLowerCase()))
    : messages

  return (
    <AdminLayout title={t('admin.chat.title')} subtitle="Manage your real-time customer support inquiries professionally.">
      <div className="flex h-[calc(100vh-220px)] min-h-[500px] border border-gray-200 bg-white rounded-2xl shadow-sm overflow-hidden font-body relative">
        
        {/* Left Pane: Sessions List */}
        <div className={`
          absolute inset-0 z-20 md:relative md:inset-auto md:z-auto
          w-full md:w-[320px] lg:w-[380px] bg-white flex flex-col border-r border-gray-100 transition-transform duration-300 ease-in-out
          ${selectedChat && typeof window !== 'undefined' && window.innerWidth < 768 ? '-translate-x-full' : 'translate-x-0'}
        `}>
          <div className="h-16 px-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
            <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest flex items-center gap-2">
              Conversations
              <span className="bg-primary/10 text-primary px-2.5 py-0.5 rounded-full text-[10px] font-black">{filteredSessions.length}</span>
            </h3>
            <div className="flex items-center gap-1">
              <select 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="text-[11px] bg-transparent border-none focus:ring-0 text-gray-500 font-black uppercase tracking-tight cursor-pointer"
              >
                <option value="ALL">All Threads</option>
                <option value="OPEN">Open Only</option>
                <option value="CLOSED">Closed </option>
              </select>
            </div>
          </div>

          <div className="px-5 py-3 bg-white">
            <div className="relative group">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm transition-colors group-focus-within:text-primary">search</span>
              <input 
                type="text"
                placeholder="Search by name..."
                value={sidebarSearch}
                onChange={(e) => setSidebarSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-xs font-bold focus:ring-4 focus:ring-primary/5 focus:bg-white focus:border-primary/20 transition-all outline-none"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
            {loadingSessions ? (
              <div className="p-8 text-center flex flex-col items-center gap-4 py-20">
                <span className="animate-spin material-symbols-outlined text-primary/40 text-4xl">progress_activity</span>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Syncing Inbox</span>
              </div>
            ) : filteredSessions.length === 0 ? (
              <div className="p-8 text-center flex flex-col items-center gap-4 py-20 grayscale opacity-40">
                <span className="material-symbols-outlined text-gray-300 text-6xl">inbox</span>
                <div className="text-[11px] font-black uppercase tracking-widest text-gray-500">No conversations found</div>
              </div>
            ) : (
              filteredSessions.map(s => {
                const isActive = selectedChat?.id === s.id;
                return (
                  <button
                  key={s.id}
                  onClick={() => handleSelectChat(s)}
                  className={`w-full p-4 flex flex-col items-start transition-all relative group border-l-4 ${isActive ? 'bg-primary/5 border-primary' : 'hover:bg-gray-50 border-transparent'}`}
                >
                  {s.unreadCount > 0 && (
                    <div className="absolute top-5 right-5 w-5 h-5 bg-primary text-white rounded-full flex items-center justify-center shadow-lg shadow-primary/20 animate-bounce z-20">
                      <span className="text-[9px] font-black leading-none">{s.unreadCount}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-3 mb-1.5 w-full pr-8">
                    <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform overflow-hidden relative">
                       {s.customer_id ? (
                         <div className="bg-primary/10 text-primary w-full h-full flex items-center justify-center font-black">
                            {(s.customerFull || 'U').charAt(0)}
                         </div>
                       ) : (
                         <span className="material-symbols-outlined text-gray-400">person</span>
                       )}
                       {s.status === 'OPEN' && (
                         <span className="absolute bottom-1 right-1 w-2.5 h-2.5 rounded-full bg-green-500 border-2 border-white shadow-sm"></span>
                       )}
                    </div>
                    <div className="flex flex-col flex-grow overflow-hidden text-left">
                       <span className={`font-black text-sm tracking-tight truncate ${isActive ? 'text-primary' : 'text-gray-900'}`}>
                        {s.customerFull || s.guest_name || t('admin.chat.guest')}
                      </span>
                      <span className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">
                        {new Date(s.last_msg_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                  <div className="w-full text-left pl-[3.25rem]">
                    <p className={`text-[13px] font-semibold tracking-tight line-clamp-1 leading-relaxed ${isActive ? 'text-primary/70' : 'text-gray-500'}`}>
                      {s.lastMessage || 'Open thread...'}
                    </p>
                  </div>
                </button>
              )
            })
            )}
          </div>
        </div>

        {/* Right Pane: Chat History */}
        <div className={`
          flex-1 flex flex-col bg-white transition-opacity duration-300
          ${!selectedChat && typeof window !== 'undefined' && window.innerWidth < 768 ? 'opacity-0 pointer-events-none' : 'opacity-100'}
        `}>
          {selectedChat ? (
            <>
              {/* Thread Header */}
              <div className="h-16 px-4 md:px-6 border-b border-gray-100 flex items-center justify-between bg-white/80 backdrop-blur-md z-10 sticky top-0">
                <div className="flex items-center gap-3 min-w-0">
                  <button 
                    onClick={() => setSelectedChat(null)}
                    className="md:hidden w-10 h-10 rounded-xl hover:bg-gray-100 flex items-center justify-center text-gray-500 active:scale-90 transition-transform"
                  >
                    <span className="material-symbols-outlined font-black">chevron_left</span>
                  </button>
                  <div className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center font-black text-sm shadow-lg shadow-primary/20 flex-shrink-0">
                    {(activeChat.customerFull || activeChat.guest_name || 'G').charAt(0).toUpperCase()}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-black text-sm text-gray-900 tracking-tight truncate">
                        {activeChat.customerFull || activeChat.guest_name}
                      </h4>
                      {activeChat.status === 'CLOSED' && (
                        <span className="text-[8px] bg-red-50 text-red-500 px-1.5 py-0.5 rounded-md font-black uppercase tracking-widest border border-red-100">Closed</span>
                      )}
                    </div>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest flex items-center gap-1.5">
                      <span className={`w-1.5 h-1.5 rounded-full ${activeChat.status === 'OPEN' ? 'bg-green-500' : 'bg-gray-300'}`} />
                      {activeChat.customer_id ? 'Client' : 'Visitor'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <button 
                    onClick={() => setIsThreadSearchOpen(!isThreadSearchOpen)}
                    className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all active:scale-95 ${isThreadSearchOpen ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'hover:bg-gray-50 text-gray-400 hover:text-gray-900'}`}
                  >
                    <span className="material-symbols-outlined text-[20px] font-bold">search</span>
                  </button>
                  <div className="relative">
                    <button 
                      onClick={() => setIsMoreMenuOpen(!isMoreMenuOpen)}
                      className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all active:scale-95 ${isMoreMenuOpen ? 'bg-gray-100 text-gray-900' : 'hover:bg-gray-50 text-gray-400 hover:text-gray-900'}`}
                    >
                      <span className="material-symbols-outlined text-[20px] font-bold">more_vert</span>
                    </button>
                    {isMoreMenuOpen && (
                      <div className="absolute right-0 mt-3 w-56 bg-white border border-gray-100 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] z-30 overflow-hidden animate-in fade-in zoom-in-95 duration-200 origin-top-right p-1.5">
                        <button 
                          onClick={() => statusMutation.mutate({ chatId: selectedChat.id, status: selectedChat.status === 'OPEN' ? 'CLOSED' : 'OPEN' })}
                          className="w-full px-4 py-3 text-left text-xs hover:bg-gray-50 rounded-xl flex items-center gap-3 text-gray-700 font-black uppercase tracking-widest"
                        >
                          <span className={`material-symbols-outlined text-[18px] ${selectedChat.status === 'OPEN' ? 'text-red-400' : 'text-green-400'}`}>
                            {selectedChat.status === 'OPEN' ? 'cancel' : 'check_circle'}
                          </span>
                          {selectedChat.status === 'OPEN' ? 'End Chat' : 'Resume Chat'}
                        </button>
                        <button 
                          onClick={() => { queryClient.invalidateQueries(['admin-chat-messages', selectedChat.id]); setIsMoreMenuOpen(false); }}
                          className="w-full px-4 py-3 text-left text-xs hover:bg-gray-50 rounded-xl flex items-center gap-3 text-gray-700 mt-1 font-black uppercase tracking-widest"
                        >
                          <span className="material-symbols-outlined text-[18px] text-primary">sync</span>
                          Refresh Thread
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Thread Search Box */}
              {isThreadSearchOpen && (
                <div className="px-4 py-3 bg-primary/5 border-b border-primary/10 animate-in slide-in-from-top duration-300">
                  <div className="relative">
                    <input 
                      type="text" 
                      autoFocus
                      placeholder="Search messages..."
                      value={threadSearch}
                      onChange={(e) => setThreadSearch(e.target.value)}
                      className="w-full pl-10 pr-10 py-2.5 bg-white border border-primary/20 rounded-xl text-xs font-bold outline-none focus:ring-4 focus:ring-primary/10 transition-all font-body"
                    />
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-primary/40 text-sm">filter_list</span>
                    <button 
                      onClick={() => { setIsThreadSearchOpen(false); setThreadSearch('') }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400"
                    >
                      <span className="material-symbols-outlined text-sm font-bold">close</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Messages Body */}
              <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6 space-y-5 bg-[#F9FAFB]/50 scroll-smooth">
                {loadingMessages ? (
                  <div className="h-full flex flex-col items-center justify-center gap-3 opacity-30">
                    <span className="animate-spin material-symbols-outlined text-primary text-4xl">progress_activity</span>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Deciphering History</p>
                  </div>
                ) : (
                  displayMessages.map((m, idx) => {
                    const isSequence = idx > 0 && displayMessages[idx - 1].is_from_admin === m.is_from_admin;
                    return (
                    <div key={m.id || idx} className={`flex ${m.is_from_admin ? 'justify-end' : 'justify-start'} ${isSequence ? '!mt-1' : ''}`}>
                      <div className="flex flex-col max-w-[85%] md:max-w-[70%] lg:max-w-[65%]">
                         {!isSequence && !m.is_from_admin && (
                           <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1.5 ml-2">{m.sender_name || activeChat.guest_name}</span>
                         )}
                         <div className={`px-5 py-3 text-[14px] font-semibold leading-relaxed shadow-sm transition-all hover:shadow-md ${
                           m.is_from_admin 
                             ? 'bg-primary text-white rounded-2xl rounded-tr-sm' 
                             : 'bg-white text-gray-800 border border-gray-100 rounded-2xl rounded-tl-sm'
                         }`}>
                           {m.file_url ? (
                             <div className="flex flex-col gap-3 min-w-[200px]">
                                <div className="flex items-center gap-3 p-1">
                                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${m.is_from_admin ? 'bg-white/20' : 'bg-primary/10 text-primary'}`}>
                                    <span className="material-symbols-outlined text-2xl">
                                      {m.mime_type?.startsWith('image/') ? 'image' : 'description'}
                                    </span>
                                  </div>
                                  <div className="flex flex-col overflow-hidden">
                                     <span className="text-[13px] font-black truncate max-w-[150px] leading-tight">{m.file_name}</span>
                                     <span className="text-[9px] opacity-70 uppercase tracking-widest font-black mt-0.5">Attachment</span>
                                  </div>
                                </div>
                                {m.mime_type?.startsWith('image/') && (
                                   <div className="mt-1 rounded-xl overflow-hidden border border-black/5 bg-gray-50 group relative">
                                      <img src={m.file_url} alt={m.file_name} className="max-h-[300px] w-full object-contain mx-auto transition-transform group-hover:scale-105" />
                                      <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                         <a href={m.file_url} target="_blank" rel="noreferrer" className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-gray-900 shadow-xl">
                                            <span className="material-symbols-outlined">zoom_in</span>
                                         </a>
                                      </div>
                                   </div>
                                )}
                                <a 
                                  href={m.file_url} 
                                  target="_blank" 
                                  download={m.file_name}
                                  rel="noopener noreferrer"
                                  className={`py-3 px-4 rounded-xl flex items-center justify-center gap-2 text-[11px] font-black uppercase tracking-widest transition-all ${
                                    m.is_from_admin ? 'bg-white text-primary hover:bg-gray-50' : 'bg-primary text-white hover:opacity-90'
                                  }`}
                                >
                                  <span className="material-symbols-outlined text-[18px]">download_for_offline</span>
                                  Download File
                                </a>
                             </div>
                           ) : m.message}
                         </div>
                         {!isSequence && (
                           <span className={`text-[9px] text-gray-400 mt-1.5 px-1 font-black uppercase tracking-tighter ${m.is_from_admin ? 'text-right' : 'text-left'}`}>
                             {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                           </span>
                         )}
                      </div>
                    </div>
                  )}))
                }
                {isUploading && (
                  <div className="flex justify-end animate-in slide-in-from-right-4">
                    <div className="bg-primary/5 px-5 py-3 rounded-2xl rounded-tr-sm border border-primary/10 flex items-center gap-3 text-[11px] text-primary font-black uppercase tracking-widest shadow-sm">
                      <span className="animate-spin material-symbols-outlined text-sm">progress_activity</span>
                      Transmitting Assets...
                    </div>
                  </div>
                )}
                <div ref={msgsEndRef} className="h-4" />
              </div>

              {/* Input Area */}
              <div className="p-4 md:p-6 bg-white border-t border-gray-100 relative">
                <form onSubmit={handleSend} className="flex gap-3 items-end max-w-full">
                  <div className="flex-1 bg-gray-50 border-2 border-transparent focus-within:border-primary/20 focus-within:ring-8 focus-within:ring-primary/5 focus-within:bg-white rounded-[1.5rem] transition-all flex items-center overflow-hidden">
                    <button type="button" className="pl-4 pr-2 py-3 text-gray-400 hover:text-primary flex items-center justify-center transition-colors">
                      <span className="material-symbols-outlined text-[22px] font-bold">sentiment_satisfied</span>
                    </button>
                    <input
                      type="text"
                      value={inputValue}
                      onChange={e => setInputValue(e.target.value)}
                      placeholder={selectedChat.status === 'CLOSED' ? "Thread Archived" : "Compose response..."}
                      disabled={selectedChat.status === 'CLOSED'}
                      className="flex-1 bg-transparent py-4 text-sm font-bold outline-none text-gray-900 placeholder-gray-400 disabled:cursor-not-allowed px-2"
                    />
                    <button 
                      type="button" 
                      onClick={() => fileInputRef.current?.click()}
                      disabled={selectedChat.status === 'CLOSED' || isUploading}
                      className="px-4 py-3 text-gray-400 hover:text-primary flex items-center justify-center transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <span className="material-symbols-outlined text-[22px] font-bold">add_circle</span>
                    </button>
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      onChange={handleFileChange}
                      className="hidden" 
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={!inputValue.trim() || sendMutation.isPending}
                    className="w-14 h-14 bg-primary hover:bg-primary/90 text-white rounded-[1.25rem] flex items-center justify-center disabled:opacity-30 transition-all shadow-xl shadow-primary/20 active:scale-90 shrink-0"
                  >
                    {sendMutation.isPending ? (
                      <span className="material-symbols-outlined text-[20px] animate-spin font-bold">progress_activity</span>
                    ) : (
                      <span className="material-symbols-outlined text-[24px] font-bold">arrow_upward</span>
                    )}
                  </button>
                </form>
                <div className="hidden md:flex justify-between items-center mt-3 px-2">
                  <div className="text-[9px] text-gray-400 font-black uppercase tracking-[0.2em] opacity-60">Press Enter to Dispatch</div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center bg-[#F9FAFB]/50 p-8 text-center">
              <div className="w-24 h-24 bg-primary/5 rounded-[2.5rem] flex items-center justify-center mb-6 shadow-sm border border-primary/5">
                <span className="material-symbols-outlined text-primary/40 text-[48px] animate-pulse">forum</span>
              </div>
              <h3 className="font-black text-xl text-gray-900 mb-2 tracking-tight uppercase tracking-[0.05em]">Command Center</h3>
              <p className="text-[13px] font-semibold text-gray-400 max-w-xs leading-relaxed">
                Select an active conversation thread from the communications panel to engage with customers.
              </p>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  )
}

