import { useState, useEffect, useRef } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

const API = 'http://localhost:8000'

export default function Chat() {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef(null)

  // Scroll to bottom when messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function handleSend() {
    if (!input.trim() || loading) return

    const userMessage = input.trim()
    setInput('')
    setMessages(prev => [...prev, { role: 'user', text: userMessage }])
    setLoading(true)

    try {
      const res = await fetch(`${API}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          history: messages.map(m => ({
            role: m.role === 'bot' ? 'assistant' : 'user',
            content: m.text
          }))
        }),
      })
      const data = await res.json()
      setMessages(prev => [...prev, { role: 'bot', text: data.response, citations: data.citations }])
    } catch {
      setMessages(prev => [...prev, { role: 'bot', text: 'حدث خطأ أثناء الاتصال بالخادم.', citations: [] }])
    } finally {
      setLoading(false)
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  function isArabic(text) {
  const arabicChars = (text.match(/[\u0600-\u06FF]/g) || []).length
  const latinChars = (text.match(/[a-zA-Z]/g) || []).length
  return arabicChars > latinChars
}

  const suggestions = [
    'كم بلغت إيرادات أرامكو في آخر سنة؟',
    'ماذا قالت إدارة Meta عن خطط الذكاء الاصطناعي؟',
    'كيف تغير هامش الربح الصافي لأرامكو عبر السنوات؟',
  ]

  return (
    <div style={{
      maxWidth: '800px',
      margin: '0 auto',
      padding: '2rem',
      direction: 'rtl',
      fontFamily: 'var(--font)',
      display: 'flex',
      flexDirection: 'column',
      height: 'calc(100vh - 56px)',
    }}>

      {/* Header */}
      <div style={{ marginBottom: '1.5rem', flexShrink: 0 }}>
        <h1 style={{ fontSize: '22px', fontWeight: '700', color: 'var(--text-1)' }}>
          المساعد المالي
        </h1>
      </div>

      {/* Message list */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        paddingBottom: '1rem',
      }}>

        {/* Empty state */}
        {messages.length === 0 && (
          <div style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '16px',
          }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
            <p style={{ fontSize: '15px', color: 'var(--text-2)', marginBottom: '8px' }}>
              اسأل عن أي شركة موجودة في النظام
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}>
              {suggestions.map((suggestion, i) => (
                <button
                  key={i}
                  onClick={() => setInput(suggestion)}
                  style={{
                    fontFamily: 'var(--font)',
                    fontSize: '13px',
                    background: 'var(--surface)',
                    color: 'var(--text-2)',
                    border: '1px solid var(--border-2)',
                    borderRadius: 'var(--radius)',
                    padding: '8px 16px',
                    cursor: 'pointer',
                    direction: 'rtl',
                  }}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Messages */}
        {messages.map((msg, i) => (
          <div key={i} style={{
            display: 'flex',
            justifyContent: msg.role === 'user' ? 'flex-start' : 'flex-end',
          }}>
            <div style={{
              maxWidth: '75%',
              background: msg.role === 'user' ? '#a973ffcd' : 'var(--surface)',
              color: 'var(--text-1)',
              border: msg.role === 'bot' ? '1px solid var(--border)' : 'none',
              borderRadius: msg.role === 'user'
                ? 'var(--radius-lg) var(--radius-lg) var(--radius-lg) 4px'
                : 'var(--radius-lg) var(--radius-lg) 4px var(--radius-lg)',
              padding: '12px 16px',
              fontSize: '14px',
              lineHeight: 1.7,
              wordBreak: 'break-word',
              direction: msg.role === 'bot' ? (isArabic(msg.text) ? 'rtl' : 'ltr') : 'rtl',
              textAlign: msg.role === 'bot' ? (isArabic(msg.text) ? 'right' : 'left') : 'right',
            }}>
              {msg.role === 'bot' ? (
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    table: ({node, ...props}) => (
                      <table style={{ borderCollapse: 'collapse', width: '100%', margin: '8px 0' }} {...props} />
                    ),
                    th: ({node, ...props}) => (
                      <th style={{ padding: '6px 12px', borderBottom: '1px solid var(--border-2)', color: 'var(--text-2)', fontWeight: '500', textAlign: 'right' }} {...props} />
                    ),
                    td: ({node, ...props}) => (
                      <td style={{ padding: '6px 12px', borderBottom: '1px solid var(--border)', color: 'var(--text-1)', textAlign: 'right' }} {...props} />
                    ),
                  }}
                >
                  {msg.text}
                </ReactMarkdown>
              ) : (
                <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{msg.text}</p>
              )}
              {msg.citations && msg.citations.length > 0 && (
                <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid var(--border)' }}>
                  {msg.citations.map((cite, j) => (
                    <p key={j} style={{ fontSize: '11px', color: 'var(--text-3)', margin: '2px 0' }}>
                      {cite}
                    </p>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Loading indicator */}
        {loading && (
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <div style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg) var(--radius-lg) 4px var(--radius-lg)',
              padding: '12px 16px',
              fontSize: '14px',
              color: 'var(--text-3)',
            }}>
              جارٍ التفكير...
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input area */}
      <div style={{
        display: 'flex',
        gap: '10px',
        alignItems: 'flex-end',
        paddingTop: '1rem',
        borderTop: '1px solid var(--border)',
        flexShrink: 0,
      }}>
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="اكتب سؤالك هنا..."
          rows={1}
          style={{
            flex: 1,
            fontFamily: 'var(--font)',
            fontSize: '14px',
            background: 'var(--surface)',
            color: 'var(--text-1)',
            border: '1px solid var(--border-2)',
            borderRadius: 'var(--radius)',
            padding: '10px 14px',
            outline: 'none',
            direction: 'rtl',
            resize: 'none',
            lineHeight: 1.5,
          }}
        />
        <button
          onClick={handleSend}
          disabled={loading || !input.trim()}
          style={{
            fontFamily: 'var(--font)',
            fontSize: '14px',
            fontWeight: '500',
            background: loading || !input.trim() ? 'var(--surface-2)' : 'var(--accent)',
            color: loading || !input.trim() ? 'var(--text-3)' : 'white',
            border: 'none',
            borderRadius: 'var(--radius)',
            padding: '10px 20px',
            cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
            transition: 'background 0.2s',
            flexShrink: 0,
          }}
        >
          إرسال
        </button>
      </div>

    </div>
  )
}