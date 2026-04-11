import { useState, useRef, useEffect } from 'react'

export default function LiveChat() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState([
    { id: 1, sender: 'agent', text: 'Hello! I am Emily from PharmaLink support. How can I help you with your procurement today?' }
  ])
  const [inputValue, setInputValue] = useState('')
  const msgsEndRef = useRef(null)

  const handleSend = (e) => {
    e.preventDefault()
    if (!inputValue.trim()) return
    
    // Add user message
    const newMsg = { id: Date.now(), sender: 'user', text: inputValue }
    setMessages(prev => [...prev, newMsg])
    setInputValue('')
    
    // Auto-reply
    setTimeout(() => {
      setMessages(prev => [...prev, { 
        id: Date.now() + 1, 
        sender: 'agent', 
        text: 'Thank you for reaching out! One of our procurement specialists will connect with you momentarily.' 
      }])
    }, 1500)
  }

  // Scroll to bottom when messages update
  useEffect(() => {
    if (isOpen && msgsEndRef.current) {
      msgsEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, isOpen])

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {/* Chat Window */}
      <div 
        className={`w-80 sm:w-96 bg-white shadow-2xl rounded-2xl overflow-hidden flex flex-col border border-outline-variant/20 transition-all duration-300 origin-bottom-right mb-4 ${
          isOpen ? 'scale-100 opacity-100 pointer-events-auto h-[500px]' : 'scale-75 opacity-0 pointer-events-none h-0'
        }`}
      >
        {/* Header */}
        <div className="bg-primary text-white p-4 flex items-center justify-between shadow-sm z-10">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center font-bold text-lg">E</div>
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 border-2 border-primary rounded-full"></div>
            </div>
            <div>
              <h4 className="font-headline font-bold leading-tight">PharmaLink Support</h4>
              <p className="text-[10px] text-blue-100 font-medium">Emily is active now</p>
            </div>
          </div>
          <button 
            onClick={() => setIsOpen(false)}
            className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center transition-colors text-white/80 hover:text-white"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-surface-container-lowest font-body">
          <p className="text-[10px] text-center text-on-surface-variant font-medium uppercase tracking-widest my-4">Today</p>
          {messages.map(m => (
            <div key={m.id} className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
                m.sender === 'user' 
                  ? 'bg-primary text-white rounded-tr-sm' 
                  : 'bg-surface-container-low text-on-surface border border-outline-variant/10 rounded-tl-sm'
              }`}>
                {m.text}
              </div>
            </div>
          ))}
          <div ref={msgsEndRef} />
        </div>

        {/* Input area */}
        <form onSubmit={handleSend} className="p-3 border-t border-outline-variant/10 bg-white shadow-[0_-4px_10px_rgba(0,0,0,0.02)]">
          <div className="relative flex items-center">
            <input 
              type="text" 
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              placeholder="Send a message..." 
              className="w-full bg-surface-container-high rounded-full py-3.5 pl-5 pr-14 outline-none focus:ring-1 focus:ring-primary focus:bg-surface-container-lowest text-sm transition-all text-on-surface"
            />
            <button 
              type="submit"
              disabled={!inputValue.trim()}
              className="absolute right-1.5 w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center disabled:opacity-50 disabled:bg-surface-container-highest disabled:text-on-surface-variant transition-colors"
            >
              <span className="material-symbols-outlined text-[20px] ml-1">send</span>
            </button>
          </div>
        </form>
      </div>

      {/* Toggle Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-16 h-16 bg-primary text-white rounded-full shadow-[0_10px_25px_rgba(0,63,135,0.4)] flex items-center justify-center hover:scale-105 active:scale-95 transition-all outline-none"
      >
        <span className="material-symbols-outlined text-3xl">
          {isOpen ? 'expand_more' : 'chat_bubble'}
        </span>
      </button>
    </div>
  )
}
